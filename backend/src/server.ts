import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { prisma } from './utils/db-temp';

// Re-export prisma for backward compatibility
export { prisma };

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import studentRoutes from './routes/student.routes';
import employeeRoutes from './routes/employee.routes';
import programRoutes from './routes/program.routes';
import departmentRoutes from './routes/department.routes';
import courseRoutes from './routes/course.routes';
import gradeRoutes from './routes/grade.routes';
import attendanceRoutes from './routes/attendance.routes';
import feeRoutes from './routes/fee.routes';
import paymentRoutes from './routes/payment.routes';
import branchRoutes from './routes/branch.routes';
import batchRoutes from './routes/batch.routes';
import announcementRoutes from './routes/announcement.routes';
import messageRoutes from './routes/message.routes';
import admissionRoutes from './routes/admission.routes';
import roleRoutes from './routes/role.routes';
import idCardRoutes from './routes/idcard.routes';
import accountingRoutes from './routes/accounting.routes';
import analyticsRoutes from './routes/analytics.routes';
import systemRoutes from './routes/system.routes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(limiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'UNHIMAS API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/idcards', idCardRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/system', systemRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 UNHIMAS API Server running on port ${PORT}`);
  logger.info(`📚 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🌐 CORS enabled for: ${process.env.FRONTEND_URL}`);
});

export default app;