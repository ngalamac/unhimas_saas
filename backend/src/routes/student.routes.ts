import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { studentRegistrationSchema, paginationSchema } from '../utils/validation';

const router = Router();
const studentController = new StudentController();

// Apply authentication to all routes
router.use(authenticate);

// Student CRUD operations
router.get('/', 
  authorize(['students', 'department_students']), 
  validateQuery(paginationSchema),
  studentController.getAllStudents
);

router.get('/:id', 
  authorize(['students', 'department_students']), 
  studentController.getStudentById
);

router.post('/', 
  authorize(['students']), 
  validate(studentRegistrationSchema),
  studentController.createStudent
);

router.put('/:id', 
  authorize(['students']), 
  studentController.updateStudent
);

router.delete('/:id', 
  authorize(['students']), 
  studentController.deleteStudent
);

// Student-specific operations
router.get('/:id/grades', 
  authorize(['students', 'grades']), 
  studentController.getStudentGrades
);

router.get('/:id/attendance', 
  authorize(['students', 'attendance']), 
  studentController.getStudentAttendance
);

router.get('/:id/payments', 
  authorize(['students', 'payments']), 
  studentController.getStudentPayments
);

router.get('/:id/fee-status', 
  authorize(['students', 'fees']), 
  studentController.getStudentFeeStatus
);

// Bulk operations
router.post('/bulk-import', 
  authorize(['students']), 
  studentController.bulkImportStudents
);

router.post('/bulk-update', 
  authorize(['students']), 
  studentController.bulkUpdateStudents
);

// Search and filter
router.get('/search/:query', 
  authorize(['students', 'department_students']), 
  studentController.searchStudents
);

router.get('/filter/by-program/:programId', 
  authorize(['students', 'department_students']), 
  studentController.getStudentsByProgram
);

router.get('/filter/by-department/:departmentId', 
  authorize(['students', 'department_students']), 
  studentController.getStudentsByDepartment
);

router.get('/filter/by-batch/:batch', 
  authorize(['students', 'department_students']), 
  studentController.getStudentsByBatch
);

export default router;