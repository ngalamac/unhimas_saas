import mongoose from 'mongoose';
import fetch from 'node-fetch';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { exec } from 'child_process';
import User from '../src/models/User';
import Branch from '../src/models/BranchModel';

const API_URL = 'http://localhost:5000/api';

let mongod: MongoMemoryServer;
let serverProcess: any;

const waitForServer = async () => {
    const startTime = Date.now();
    while (Date.now() - startTime < 30000) { // 30 second timeout
        try {
            const res = await fetch(`${API_URL}/health`);
            if (res.status === 200) {
                const data = await res.json();
                if(data.mongodb === 'connected') {
                    console.log('Server is ready.');
                    // Wait a bit more for seeding
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    return;
                }
            }
        } catch (e) {
            // Ignore errors
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Server did not start in time.');
};

const setup = async () => {
    mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();

    // Start the server with the in-memory DB
    serverProcess = exec(`cross-env MONGO_URI=${mongoUri} npm run dev`);

    await waitForServer();

    await mongoose.connect(mongoUri);
};

const teardown = async () => {
    serverProcess.kill();
    await mongoose.disconnect();
    await mongod.stop();
};

const runTests = async () => {
    try {
        await setup();
        console.log('Running tests...');

        // --- Login as seeded SuperAdmin ---
        const login = async (email: string, password?: string) => {
            const res = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
            const data = await res.json();
            return data.token;
        };
        const superAdminToken = await login('superadminunhimas@gmail.com', 'ca@5G2024');
        if (!superAdminToken) throw new Error('Failed to login as SuperAdmin');


        // --- Create Data via API ---
        const createUserAndLogin = async (userData: any, token?: string) => {
            let headers: any = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            let res = await fetch(`${API_URL}/users`, { method: 'POST', headers, body: JSON.stringify(userData) });
            const newUser = await res.json();
            if(res.status !== 201) throw new Error(`Failed to create user: ${JSON.stringify(newUser)}`);

            const loginData = await login(userData.email, userData.password);
            return { user: newUser, token: loginData };
        };

        const superAdmin = await User.findOne({ email: 'superadminunhimas@gmail.com' });
        if (!superAdmin) throw new Error('Seeded SuperAdmin not found');

        let res = await fetch(`${API_URL}/branches`, { method: 'POST', headers: { Authorization: `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Branch 1', address: '123 Main St', phoneNumber: '111', email: 'b1@test.com', establishedDate: new Date(), manager: superAdmin._id }) });
        const branch1 = await res.json();

        const { user: admin1, token: admin1Token } = await createUserAndLogin({ name: 'Admin 1', email: 'admin1@test.com', password: 'password', type: 'Admin', branch: branch1._id, employeeId: 'A1', phoneNumber: '111', department: 'Admin' }, superAdminToken);

        const { user: lecturer1, token: lecturer1Token } = await createUserAndLogin({ name: 'Lecturer 1', email: 'lecturer1@test.com', password: 'password', type: 'Lecturer', branch: branch1._id, employeeId: 'L1', phoneNumber: '123', department: 'CS' }, admin1Token);

        // --- Run Tests ---
        console.log('\n--- Testing: Lecturers have limited access ---');
        res = await fetch(`${API_URL}/users`, { headers: { Authorization: `Bearer ${lecturer1Token}` } });
        console.log('Lecturer GET /users:', res.status);

        console.log('\n--- Testing: Admins can only see their branch users ---');
        res = await fetch(`${API_URL}/users`, { headers: { Authorization: `Bearer ${admin1Token}` } });
        let users = await res.json();
        console.log('Admin1 GET /users:', res.status, users.data.map((u: any) => u.name));

        console.log('\n--- Testing: SuperAdmin can see all users ---');
        res = await fetch(`${API_URL}/users`, { headers: { Authorization: `Bearer ${superAdminToken}` } });
        users = await res.json();
        console.log('SuperAdmin GET /users:', res.status, users.data.map((u: any) => u.name));

        console.log('\n--- Testing: Lower roles cannot manage higher roles ---');
        res = await fetch(`${API_URL}/users/${admin1._id}`, { method: 'PUT', headers: { Authorization: `Bearer ${lecturer1Token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'new name' }) });
        console.log('Lecturer trying to update Admin:', res.status);

        console.log('\n--- Testing: Creating user without required fields fails ---');
        res = await fetch(`${API_URL}/users`, { method: 'POST', headers: { Authorization: `Bearer ${admin1Token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'test', email: 'test@test.com', password: 'password', type: 'Lecturer' }) });
        console.log('Admin creating user with missing fields:', res.status);

        console.log('\n--- Testing: Audit trail ---');
        const audits = await mongoose.connection.db.collection('audits').find().toArray();
        console.log('Audit logs found:', audits.length);
        console.log(audits.map(a => ({ action: a.action, entity: a.entity, user: a.user })));


    } catch (error) {
        console.error('Tests failed:', error);
    } finally {
        await teardown();
    }
};

runTests();
