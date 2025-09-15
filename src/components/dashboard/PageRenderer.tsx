import React from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { BreadcrumbNavigation } from './BreadcrumbNavigation';
import { NavigationShortcuts } from './NavigationShortcuts';

// Import all page components
import StudentsPage from '../pages/students/StudentsPage';
import { StudentRegistrationPage } from '../pages/students/StudentRegistrationPage';
import { CreateBranchPage } from '../pages/branches/CreateBranchPage';
import BranchesPage from '../pages/branches/BranchesPage';
import { QRAttendancePage } from '../pages/attendance/QRAttendancePage';
import { FeeStructurePage } from '../pages/fees/FeeStructurePage';
import { PaymentHistoryPage } from '../pages/payments/PaymentHistoryPage';
import { ProgramsPage } from '../pages/academic/ProgramsPage';
import { DepartmentsPage } from '../pages/academic/DepartmentsPage';
import { CoursesPage } from '../pages/academic/CoursesPage';
import { GradingSystemPage } from '../pages/academic/GradingSystemPage';
import { BulkMessagingPage } from '../pages/communication/BulkMessagingPage';
import { AnnouncementsPage } from '../pages/communication/AnnouncementsPage';
import AnalyticsPage from '../pages/analytics/AnalyticsPage';
import { AdmissionApplicationsPage } from '../pages/admissions/AdmissionApplicationsPage';
import { IDCardManagementPage } from '../pages/cards/IDCardManagementPage';
import RoleManagementPage from '../roles/RoleManagementPage';
import UserManagementPage from '../pages/roles/UserManagementPage';
import { TwoFactorAuthPage } from '../pages/security/TwoFactorAuthPage';
import AccountingOverview from '../pages/accounting/AccountingOverview';
import AccountingNavigation from '../accounting/AccountingNavigation';
import TransactionsPage from '../pages/accounting/TransactionsPage';
import CategoriesPage from '../pages/accounting/CategoriesPage';
import ReportsPage from '../pages/accounting/ReportsPage';
import PaymentPlansPage from '../pages/accounting/PaymentPlansPage';
import BudgetAnalysisPage from '../pages/accounting/BudgetAnalysisPage';
import FinancialInsightsPage from '../pages/accounting/FinancialInsightsPage';
import AccountingCoordination from '../accounting/AccountingCoordination';
import EnhancedRoleManagement from '../roles/EnhancedRoleManagement';
import RoleAccessBridge from '../roles/RoleAccessBridge';
import FinancialCoordinator from '../accounting/FinancialCoordinator';
import IntegratedAccountingHub from '../accounting/IntegratedAccountingHub';
import AccountingMasterControl from '../accounting/AccountingMasterControl';
import StaffDirectory from '../pages/hr/StaffDirectory';
import PayrollDashboard from '../pages/payroll/PayrollDashboard';
import TeachingSessionsPage from '../pages/payroll/TeachingSessionsPage';
import PayrollDetailsPage from '../pages/payroll/PayrollDetailsPage';
import SettingsPage from './SettingsPage';
import BackupManagementPage from '../pages/system/BackupManagementPage';
import OHADAAccountingPage from '../pages/accounting/OHADAAccountingPage';
import OHADAReportsPage from '../pages/accounting/OHADAReportsPage';
import IntegratedTuitionManagement from '../pages/tuition/IntegratedTuitionManagement';

export const PageRenderer: React.FC = () => {
  const { currentPage } = useNavigation();

  const renderPage = () => {
    switch (currentPage) {
      // Students
      case 'all-students':
        return <StudentsPage />;
      case 'student-registration':
        return <StudentRegistrationPage />;
      case 'tuition-management':
      case 'tuition-status':
        return <IntegratedTuitionManagement />;
      
      // Branches
      case 'view-branches':
        return <BranchesPage />;
      case 'create-branch':
        return <CreateBranchPage />;
      
      // Attendance
      case 'qr-attendance':
        return <QRAttendancePage />;
      
      // Security
      case 'two-factor-auth':
        return <TwoFactorAuthPage />;
      
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
      
      // Accounting
      case 'accounting':
        return <AccountingNavigation />;
      case 'accounting-overview':
        return <AccountingOverview />;
      case 'accounting-coordination':
        return <AccountingCoordination />;
      case 'transactions':
        return <TransactionsPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'payment-plans':
        return <PaymentPlansPage />;
      case 'reports':
        return <ReportsPage />;
      case 'budget-analysis':
        return <BudgetAnalysisPage />;
      case 'financial-insights':
        return <FinancialInsightsPage />;
      case 'ohada-accounting':
        return <OHADAAccountingPage />;
      case 'ohada-reports':
        return <OHADAReportsPage />;

      // HR
      case 'staff-management':
        return <StaffDirectory />;
      case 'payroll':
        return <PayrollDashboard />;
      case 'teaching-sessions':
        return <TeachingSessionsPage />;
      case 'payroll-details':
        return <PayrollDetailsPage />;
      
      // Communication
      case 'bulk-messaging':
        return <BulkMessagingPage />;
      case 'announcements':
        return <AnnouncementsPage />;
      
      // Analytics
      case 'student-analytics':
        return <AnalyticsPage />;
      case 'financial-reports':
        return <AnalyticsPage />;
      case 'attendance-reports':
        return <AnalyticsPage />;
      
      // Admissions
      case 'admission-applications':
        return <AdmissionApplicationsPage />;
      
      // ID Cards
      case 'student-id':
        return <IDCardManagementPage />;
      
      // Roles & Permissions
      case 'role-management':
        return <RoleAccessBridge />;
      case 'enhanced-roles':
        return <EnhancedRoleManagement />;
      case 'permission-matrix':
        return <RoleManagementPage />;
      case 'financial-coordinator':
        return <FinancialCoordinator />;
      case 'integrated-accounting-hub':
        return <IntegratedAccountingHub />;
      case 'accounting-master-control':
        return <AccountingMasterControl />;
      case 'user-management':
        return <UserManagementPage />;
       case 'settings':
         return <SettingsPage />;
      
      // System Management
      case 'backup-management':
        return <BackupManagementPage />;
      
      default:
        return null;
    }
  };

  return (
    <>
      <NavigationShortcuts />
      <BreadcrumbNavigation />
      {renderPage()}
    </>
  );
};