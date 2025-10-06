import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import bcrypt from 'bcryptjs';

// Import your routers
import authRouter from './routes/auth';
import accountingRouter from './routes/accounting';
import paymentPlansRouter from './routes/paymentPlans';
import usersRouter from './routes/users';
import branchesRouter from './routes/branches';
import programsRouter from './routes/programs';
import departmentsRouter from './routes/departments';
import coursesRouter from './routes/courses';
import specialtiesRouter from './routes/specialties';
import tuitionRouter from './routes/tuition';
import tuitionManagementRouter from './routes/tuitionManagement';
import studentsRouter from './routes/students';
import uploadsRouter from './routes/uploads';
import communicationRouter from './routes/communication';
import staffRouter from './routes/staff';
import payrollRouter from './routes/payroll';
import gradesRouter from './routes/grades';
import teachingSessionsRouter from './routes/teachingSessions';
import backupRouter from './routes/backup';
import ohadaRoutes from './routes/ohada';
import roleTemplatesRouter from './routes/roleTemplates';
import admissionsRouter from './routes/admissions';
import adminRouter from './routes/admin';
import { eventsHandler } from './lib/events';
import User from './models/User';

const app = express();

// ---------------------
// CORS configuration
// ---------------------
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
function parseOrigins(value?: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const envOrigins = [
  ...parseOrigins(process.env.FRONTEND_ORIGIN),
  ...parseOrigins(process.env.APP_BASE_URL),
  ...parseOrigins(process.env.FRONTEND_ORIGINS), // optional multi-origin var
];

const allowedOrigins = [
  ...(envOrigins.length > 0 ? envOrigins : ["https://unhimas-frontend.onrender.com"]),
  "http://localhost:5173",
  "http://localhost:3000",
];

console.log("🔧 FRONTEND_ORIGIN env:", process.env.FRONTEND_ORIGIN || '(empty)');
console.log("🔧 FRONTEND_ORIGINS env:", process.env.FRONTEND_ORIGINS || '(empty)');
console.log("🔧 APP_BASE_URL env:", process.env.APP_BASE_URL || '(empty)');
console.log("🔧 Allowed Origins:", allowedOrigins);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    console.log("🔎 Incoming request origin:", origin);
    // allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`❌ CORS blocked from origin: ${origin}`);
    return callback(new Error('CORS not allowed from origin: ' + origin));
  },
  credentials: true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With','X-Bootstrap-Token'],
  exposedHeaders: ['Content-Disposition'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ---------------------
// Rate limiting
// ---------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/', authLimiter);

// ---------------------
// Body parsing
// ---------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ---------------------
// MongoDB connection
// ---------------------
const MONGO_URI = process.env.MONGO_URI;

mongoose.connection.on('connected', () => console.log('✅ MongoDB connected.'));
mongoose.connection.on('error', (err) => console.error('❌ MongoDB connection error:', err));
mongoose.connection.on('disconnected', () => console.warn('⚠️ MongoDB disconnected.'));

// Try to connect to MongoDB in the background with retries.
function connectWithRetry() {
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI not set. Skipping MongoDB connection.');
    return;
  }

  let attempt = 1;
  const attemptConnect = async () => {
    try {
      console.log(`Connecting to MongoDB (attempt ${attempt})...`);
      await mongoose.connect(MONGO_URI as string, { serverSelectionTimeoutMS: 10000 });
      console.log('✅ MongoDB connected.');
      // Seed once connected
      seedSuperAdmin().catch((e) => console.error('Seed super admin failed:', e));
    } catch (err: any) {
      const message = err?.message || err;
      console.error(`❌ MongoDB connection failed (attempt ${attempt}):`, message);
      const delayMs = Math.min(30000, 2000 * attempt);
      attempt += 1;
      setTimeout(attemptConnect, delayMs);
    }
  };

  attemptConnect();
}

// ---------------------
// Seed default Super Admin
// ---------------------
async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('✅ Super admin credentials not found, skipping seed.');
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

// ---------------------
// Routes
// ---------------------
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});
// Lightweight probe handler to help distinguish CORS from pure network issues
app.head('/api/health', (_req, res) => res.status(204).end());

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/branches', branchesRouter);
app.use('/api/programs', programsRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/specialties', specialtiesRouter);
app.use('/api/students', studentsRouter);
app.use('/api/tuition', tuitionRouter);
app.use('/api/tuition-management', tuitionManagementRouter);
app.use('/api/staff', staffRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api/accounting', accountingRouter);
app.use('/api/payment-plans', paymentPlansRouter);
app.use('/api/grades', gradesRouter);
app.use('/api/teaching-sessions', teachingSessionsRouter);
app.use('/api/backup', backupRouter);
app.use('/api/ohada', ohadaRoutes);
app.use('/api/uploads', uploadsRouter);
app.use('/api/communication', communicationRouter);
app.use('/api/admin', adminRouter);
app.use('/api/role-templates', roleTemplatesRouter);
app.use('/api/admissions', admissionsRouter);

// Server-Sent Events
app.get('/api/events', eventsHandler);

// Serve uploaded files
const uploadsPath = path.join(__dirname, '../public');
app.use('/uploads', express.static(path.join(uploadsPath, 'uploads')));

// ---------------------
// Global error handler
// ---------------------
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

// ---------------------
// Start server (before DB connect to avoid cold-start health check failures)
// ---------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

connectWithRetry();
