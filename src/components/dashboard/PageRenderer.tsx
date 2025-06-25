import React from 'react';
import { useNavigation } from '../../context/NavigationContext';

// Import all page components
import { AllStudentsPage } from '../pages/students/AllStudentsPage';
import { StudentRegistrationPage } from '../pages/students/StudentRegistrationPage';
import { AllBranchesPage } from '../pages/branches/AllBranchesPage';
import { CreateBranchPage } from '../pages/branches/CreateBranchPage';
import { QRAttendancePage } from '../pages/attendance/QRAttendancePage';
import { FeeStructurePage } from '../pages/fees/FeeStructurePage';
import { PaymentHistoryPage } from '../pages/payments/PaymentHistoryPage';
import { ProgramsPage } from '../pages/academic/ProgramsPage';
import { DepartmentsPage } from '../pages/academic/DepartmentsPage';
import { CoursesPage } from '../pages/academic/CoursesPage';
import { GradingSystemPage } from '../pages/academic/GradingSystemPage';
import { BulkMessagingPage } from '../pages/communication/BulkMessagingPage';
import { AnnouncementsPage } from '../pages/communication/AnnouncementsPage';
import { StudentAnalyticsPage } from '../pages/analytics/StudentAnalyticsPage';
import { FinancialReportsPage } from '../pages/analytics/FinancialReportsPage';
import { AdmissionApplicationsPage } from '../pages/admissions/AdmissionApplicationsPage';
import { IDCardManagementPage } from '../pages/cards/IDCardManagementPage';

export const PageRenderer: React.FC = () => {
  const { currentPage } = useNavigation();

  const renderPage = () => {
    switch (currentPage) {
      // Students
      case 'all-students':
        return <AllStudentsPage />;
      case 'student-registration':
        return <StudentRegistrationPage />;
      
      // Branches
      case 'view-branches':
        return <AllBranchesPage />;
      case 'create-branch':
        return <CreateBranchPage />;
      
      // Attendance
      case 'qr-attendance':
        return <QRAttendancePage />;
      
      // Fees
      case 'fee-structure':
        return <FeeStructurePage />;
      case 'payment-history':
        return <PaymentHistoryPage />;
      
      // Academic
      case 'programs':
        return <ProgramsPage />;
      case 'departments':
        return <DepartmentsPage />;
      case 'courses':
        return <CoursesPage />;
      case 'exam-types':
        return <GradingSystemPage />;
      
      // Communication
      case 'bulk-messaging':
        return <BulkMessagingPage />;
      case 'announcements':
        return <AnnouncementsPage />;
      
      // Analytics
      case 'student-analytics':
        return <StudentAnalyticsPage />;
      case 'financial-reports':
        return <FinancialReportsPage />;
      
      // Admissions
      case 'admission-applications':
        return <AdmissionApplicationsPage />;
      
      // ID Cards
      case 'student-id':
        return <IDCardManagementPage />;
      
      default:
        return null;
    }
  };

  return <>{renderPage()}</>;
};