import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import transactionsRouter from './routes/transactions';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import branchesRouter from './routes/branches';

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://unhimas4:n673927826@cluster0.xeab0d2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection established successfully.');
});
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB connection lost.');
});
mongoose.connect(MONGO_URI)
  .catch((err) => console.error('MongoDB initial connection error:', err));

// API routes
app.use('/api/transactions', transactionsRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/branches', branchesRouter);

// Seed default Super Admin if not present
import User from './models/User';
import bcrypt from 'bcryptjs';

async function seedSuperAdmin() {
  const email = 'superadminunhimas@gmail.com';
  const password = 'ca@5G2024';
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Backend server running on port ${PORT}`);
  await seedSuperAdmin();
});
