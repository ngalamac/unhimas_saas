# UNHIMAS School Management System - Backend API

A comprehensive backend API for the University Higher Institute of Management and Science (UNHIMAS) school management system built with Node.js, Express, TypeScript, and PostgreSQL.

## 🚀 Features

### Core Modules
- **Authentication & Authorization** - JWT-based auth with role-based permissions
- **Student Management** - Complete student lifecycle management
- **Academic Management** - Programs, departments, courses, and grades
- **Financial Management** - Fee structures, payments, and accounting
- **Attendance System** - QR code and manual attendance tracking
- **Communication** - Announcements and bulk messaging (SMS/Email)
- **Analytics & Reporting** - Comprehensive data analytics
- **Branch Management** - Multi-branch support
- **ID Card Management** - Digital ID card generation
- **Admission System** - Application processing and management

### Technical Features
- **Type Safety** - Full TypeScript implementation
- **Database** - PostgreSQL with Prisma ORM
- **Security** - Helmet, rate limiting, input validation
- **File Upload** - Cloudinary integration
- **Email/SMS** - Nodemailer and Twilio integration
- **Logging** - Winston logger with file rotation
- **Error Handling** - Comprehensive error management
- **API Documentation** - RESTful API design
- **Batch Processing** - Academic year/batch management

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone and setup**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/unhimas_db"
   JWT_SECRET="your-super-secret-jwt-key"
   FRONTEND_URL="http://localhost:5173"
   # ... other configurations
   ```

3. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed database with initial data
   npm run db:seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── routes/         # API route definitions
│   ├── middleware/     # Custom middleware
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript type definitions
│   └── server.ts       # Application entry point
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── seed.ts         # Database seeding
├── logs/               # Application logs
└── dist/               # Compiled JavaScript
```

## 🔐 Authentication & Authorization

### User Roles
- **SuperAdmin** - Full system access
- **Admin** - Administrative functions
- **Lecturer** - Academic management
- **Accountant** - Financial operations
- **Dean of Studies** - Academic oversight
- **Head of Department** - Department management

### API Authentication
```bash
# Login
POST /api/auth/login
{
  "username": "admin",
  "password": "password"
}

# Use token in subsequent requests
Authorization: Bearer <jwt_token>
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile

### Students
- `GET /api/students` - Get all students (paginated)
- `POST /api/students` - Create new student
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/students/:id/grades` - Get student grades
- `GET /api/students/:id/payments` - Get student payments

### Academic Management
- `GET /api/programs` - Get all programs
- `POST /api/programs` - Create new program
- `GET /api/departments` - Get all departments
- `GET /api/courses` - Get all courses
- `POST /api/grades` - Record grades

### Financial Management
- `GET /api/fees` - Get fee structures
- `POST /api/payments` - Process payment
- `GET /api/accounting` - Get accounting records

### System
- `GET /api/analytics` - Get system analytics
- `GET /api/system/settings` - Get system settings

## 🗄️ Database Schema

The system uses PostgreSQL with the following main entities:

- **Users** - System users and authentication
- **Students** - Student records and information
- **Employees** - Staff and faculty members
- **Programs** - Academic programs (HND, Bachelor, Masters)
- **Departments** - Academic departments
- **Courses** - Course catalog
- **Grades** - Student academic records
- **Payments** - Financial transactions
- **Attendance** - Student attendance records

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `PORT` | Server port (default: 5000) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `FRONTEND_URL` | Frontend application URL | Yes |
| `CLOUDINARY_*` | File upload configuration | No |
| `SMTP_*` | Email service configuration | No |
| `TWILIO_*` | SMS service configuration | No |

### Database Configuration

The system uses Prisma ORM for database management:

```bash
# View database in browser
npm run db:studio

# Create migration
npm run db:migrate

# Reset database
npx prisma migrate reset
```

## 📊 Features Overview

### Student Management
- Complete student registration and profile management
- Academic progress tracking
- Fee payment status monitoring
- Attendance tracking with QR code support

### Academic System
- Multi-level program support (HND, Bachelor, Masters)
- Department and course management
- Grade recording with GPA calculation
- Semester and batch management

### Financial System
- Flexible fee structure configuration
- Multiple payment method support
- Financial reporting and analytics
- Office accounting management

### Communication
- Bulk SMS and email messaging
- Targeted announcements
- Role-based communication

### Analytics
- Student enrollment trends
- Financial performance metrics
- Academic performance analysis
- Department-wise statistics

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up SSL certificates
4. Configure reverse proxy (nginx)
5. Set up monitoring and logging

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📝 API Documentation

The API follows RESTful conventions with consistent response formats:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "pagination": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Error details"
}
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-based Authorization** - Granular permission system
- **Input Validation** - Joi schema validation
- **Rate Limiting** - API request throttling
- **CORS Protection** - Cross-origin request security
- **Helmet Security** - HTTP header security
- **SQL Injection Prevention** - Prisma ORM protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added analytics and reporting
- **v1.2.0** - Enhanced security and performance

---

**UNHIMAS School Management System Backend** - Built with ❤️ for educational excellence.