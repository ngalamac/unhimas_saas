import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRouter from './routes/auth';
import accountingRouter from './routes/accounting';
import paymentPlansRouter from './routes/paymentPlans';
import usersRouter from './routes/users';
import branchesRouter from './routes/branches';
import programsRouter from './routes/programs';
import departmentsRouter from './routes/departments';
import coursesRouter from './routes/courses';
import tuitionRouter from './routes/tuition';
import studentsRouter from './routes/students';
import uploadsRouter from './routes/uploads';
import communicationRouter from './routes/communication';
import staffRouter from './routes/staff';
import payrollRouter from './routes/payroll';
import gradesRouter from './routes/grades';
import { eventsHandler } from './lib/events';
import path from 'path';

const app = express();
app.use(cors());
// allow larger JSON payloads (some clients may include base64 previews) up to 10MB
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined in the environment variables.');
    process.exit(1);
}
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection established successfully.');
});
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB connection lost.');
});

async function startServer() {
  try {
    console.log('Connecting to MongoDB...');
    // increase server selection timeout to allow slower networks
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 30000 });
    console.log('MongoDB connected. Starting server...');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, async () => {
      console.log(`Backend server running on port ${PORT}`);
      await seedSuperAdmin();
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB. Server not started.', err);
    // Exit with non-zero code so it's obvious to the caller
    process.exit(1);
  }
}

// start the server after establishing DB connection
startServer();

// API routes
// transactions router removed
// accounts router removed

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/branches', branchesRouter);
app.use('/api/programs', programsRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/students', studentsRouter);
app.use('/api/tuition', tuitionRouter);
app.use('/api/staff', staffRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api/accounting', accountingRouter);
app.use('/api/payment-plans', paymentPlansRouter);
app.use('/api/grades', gradesRouter);
// server-sent events for realtime updates
app.get('/api/events', eventsHandler);
// serve uploaded files
const uploadsPath = path.join(__dirname, '../public');
app.use('/uploads', express.static(path.join(uploadsPath, 'uploads')));
app.use('/api/uploads', uploadsRouter);
app.use('/api/communication', communicationRouter);

// Global error handler to return JSON for unexpected errors (avoid HTML error pages)
app.use((err: any, _req: any, res: any, _next: any) => {
    console.error('Unhandled error:', err);

    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((el: any) => el.message);
        return res.status(400).json({ error: { message: 'Validation error', details: errors } });
    }

    if (err && err.code === 'ENOENT') {
        return res.status(500).json({ error: { message: `File system error: ${err.message}` } });
    }

    return res.status(500).json({ error: { message: err?.message || 'Internal server error' } });
});

// Seed default Super Admin if not present
import User from './models/User';
import bcrypt from 'bcryptjs';

async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('Skipping Super Admin seeding because SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD are not set.');
    return;
  }

  const existing = await User.findOne({ email });
  if (!existing) {
    const hashed = await bcrypt.hash(password, 10);
    await User.create({
      name: 'Super Admin',
      email,
      password: hashed,
      type: 'SuperAdmin',
      permissions: {},
    });
    console.log('✅ Default Super Admin seeded.');
  }
}

// (server is started inside startServer())
