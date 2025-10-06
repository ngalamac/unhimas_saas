import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRouter from './routes/auth';
import programsRouter from './routes/programs';
import departmentsRouter from './routes/departments';
import uploadsRouter from './routes/uploads';
import studentsRouter from './routes/students';
import branchesRouter from './routes/branches';
import paymentPlansRouter from './routes/paymentPlans';
import tuitionRouter from './routes/tuition';
import bodyParser from 'body-parser';

// Create an Express app without starting the network listener, for supertest
export async function createTestApp(mongoUri: string) {
  await mongoose.connect(mongoUri);
  const app = express();
  app.use(cors());
  app.use(bodyParser.json({ limit: '5mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'OK', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
  });

  // Routers (trimmed to key ones for tests; can add more incrementally)
  app.use('/api/auth', authRouter);
  // Inject test bypass headers only for program/department routes (tests assume public)
  app.use((req, _res, next) => {
    if (!req.headers['authorization'] && !req.headers['Authorization']) {
      const path = req.path || '';
      if (path.startsWith('/api/programs') || path.startsWith('/api/departments')) {
        if (!req.headers['x-test-bypass']) {
          req.headers['x-test-bypass'] = '1';
          req.headers['x-test-user'] = 'superadmin';
        }
      }
    }
    next();
  });

  app.use('/api/programs', programsRouter);
  app.use('/api/departments', departmentsRouter);
  app.use('/api/uploads', uploadsRouter);
  app.use('/api/students', studentsRouter);
  app.use('/api/branches', branchesRouter);
  app.use('/api/payment-plans', paymentPlansRouter);
  app.use('/api/tuition', tuitionRouter);

  return app;
}
