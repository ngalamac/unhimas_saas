import React, { useState } from 'react';
import { Home, Building2, QrCode, Shield, DollarSign, CreditCard, GraduationCap, Calculator, UserPlus, FileText, Users, MessageSquare, Car as IdCard, Settings, ChevronRight, ChevronDown, MapPin, Eye, Plus, BookOpen, Calendar, Mail, BarChart3, UserCheck, School } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  hasSubmenu?: boolean;
  submenuItems?: { id: string; label: string; icon: React.ReactNode }[];
  requiredPermissions?: string[];
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { currentPage, setCurrentPage, setBreadcrumb } = useNavigation();
  const { user, hasPermission } = useAuth();

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleNavigation = (pageId: string, breadcrumbPath: string[]) => {
    setCurrentPage(pageId);
    setBreadcrumb(breadcrumbPath);
  };

  const sidebarItems: SidebarItem[] = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: <Home className="w-4 h-4" /> 
    },
    { 
      id: 'all-branches', 
      label: 'All Branches', 
      icon: <Building2 className="w-4 h-4" />, 
      hasSubmenu: true,
      requiredPermissions: ['branches', 'all'],
      submenuItems: [
        { id: 'view-branches', label: 'View Branches', icon: <Eye className="w-3 h-3" /> },
        { id: 'create-branch', label: 'Create Branch', icon: <Plus className="w-3 h-3" /> },
        { id: 'branch-data', label: 'Branch Data Management', icon: <BarChart3 className="w-3 h-3" /> }
      ]
    },
    { 
      id: 'qr-attendance', 
      label: 'QR Attendance', 
      icon: <QrCode className="w-4 h-4" />,
      requiredPermissions: ['attendance', 'all']
    },
    { 
      id: 'two-factor-auth', 
      label: 'Two Factor Authentication', 
      icon: <Shield className="w-4 h-4" />,
      requiredPermissions: ['all']
    },
    { 
      id: 'fees-management', 
      label: 'Powerful Fees Management', 
      icon: <DollarSign className="w-4 h-4" />,
      hasSubmenu: true,
      requiredPermissions: ['fees', 'all'],
      submenuItems: [
        { id: 'fee-structure', label: 'Fee Structure', icon: <Calculator className="w-3 h-3" /> },
        { id: 'discounts', label: 'Discounts & Fines', icon: <DollarSign className="w-3 h-3" /> },
        { id: 'fee-reminders', label: 'Fee Reminders', icon: <Mail className="w-3 h-3" /> },
        { id: 'payment-history', label: 'Payment History', icon: <FileText className="w-3 h-3" /> }
      ]
    },
    { 
      id: 'register-payments', 
      label: 'Register Payments', 
      icon: <CreditCard className="w-4 h-4" />,
      hasSubmenu: true,
      requiredPermissions: ['payments', 'all'],
      submenuItems: [
        { id: 'online-payments', label: 'Online Payments', icon: <CreditCard className="w-3 h-3" /> },
        { id: 'offline-payments', label: 'Offline Payments', icon: <Calculator className="w-3 h-3" /> },
        { id: 'payment-tracking', label: 'Payment Tracking', icon: <BarChart3 className="w-3 h-3" /> }
      ]
    },
    { 
      id: 'grading-system', 
      label: 'Multi-Type Grading System', 
      icon: <GraduationCap className="w-4 h-4" />,
      hasSubmenu: true,
      requiredPermissions: ['grades', 'all'],
      submenuItems: [
        { id: 'exam-types', label: 'Exam Types (Mark/GPA)', icon: <FileText className="w-3 h-3" /> },
        { id: 'mark-distribution', label: 'Mark Distribution', icon: <BarChart3 className="w-3 h-3" /> },
        { id: 'ca-exam-setup', label: 'CA & Exam Setup', icon: <Settings className="w-3 h-3" /> }
      ]
    },
    {
      id: 'accounting',
      label: 'Accounting',
      icon: <Calculator className="w-4 h-4" />,
      requiredPermissions: ['accounting', 'all']
    },
    { 
      id: 'admissions', 
      label: 'Admissions', 
      icon: <UserPlus className="w-4 h-4" />,
      hasSubmenu: true,
      requiredPermissions: ['students', 'all'],
      submenuItems: [
        { id: 'admission-applications', label: 'Admission Applications', icon: <FileText className="w-3 h-3" /> },
        { id: 'admission-payments', label: 'Admission Payments', icon: <CreditCard className="w-3 h-3" /> },
        { id: 'admission-status', label: 'Admission Status', icon: <UserCheck className="w-3 h-3" /> }
      ]
    },
    { 
      id: 'students', 
      label: 'Student Management', 
      icon: <Users className="w-4 h-4" />,
      hasSubmenu: true,
      requiredPermissions: ['students', 'department_students', 'all'],
      submenuItems: [
        { id: 'all-students', label: 'All Students', icon: <Users className="w-3 h-3" /> },
        { id: 'student-registration', label: 'Student Registration', icon: <UserPlus className="w-3 h-3" /> },
        { id: 'student-details', label: 'Student Details', icon: <Eye className="w-3 h-3" /> },
        { id: 'tuition-status', label: 'Tuition Status', icon: <DollarSign className="w-3 h-3" /> }
      ]
    },
    { 
      id: 'programs-departments', 
      label: 'Programs & Departments', 
      icon: <School className="w-4 h-4" />,
      hasSubmenu: true,
      requiredPermissions: ['programs', 'department_courses', 'all'],
      submenuItems: [
        { id: 'programs', label: 'Programs (HND/Bachelor/Masters)', icon: <GraduationCap className="w-3 h-3" /> },
        { id: 'departments', label: 'Departments', icon: <Building2 className="w-3 h-3" /> },
        { id: 'courses', label: 'Courses', icon: <BookOpen className="w-3 h-3" /> },
        { id: 'hod-management', label: 'HOD Management', icon: <UserCheck className="w-3 h-3" /> },
        { id: 'lecturers', label: 'Lecturers', icon: <Users className="w-3 h-3" /> }
      ]
    },
    { 
      id: 'progress-report', 
      label: 'Progress Report Card', 
      icon: <FileText className="w-4 h-4" />,
      hasSubmenu: true,
      requiredPermissions: ['grades', 'academic_reports', 'all'],
      submenuItems: [
        { id: 'semester-results', label: 'Semester Results', icon: <FileText className="w-3 h-3" /> },
        { id: 'transcript', label: 'Transcript Generation', icon: <GraduationCap className="w-3 h-3" /> },
        { id: 'gpa-calculation', label: 'GPA Calculation', icon: <Calculator className="w-3 h-3" /> }
      ]
    },
    { 
      id: 'role-management', 
      label: 'Role Management', 
      icon: <Shield className="w-4 h-4" />,
      requiredPermissions: ['all']
    },
    { 
      id: 'schedule-communication', 
      label: 'Schedule Email/SMS', 
      icon: <MessageSquare className="w-4 h-4" />,
      hasSubmenu: true,
      requiredPermissions: ['announcements', 'all'],
      submenuItems: [
        { id: 'bulk-messaging', label: 'Bulk Messaging', icon: <MessageSquare className="w-3 h-3" /> },
        { id: 'user-groups', label: 'User Groups', icon: <Users className="w-3 h-3" /> },
        { id: 'scheduled-messages', label: 'Scheduled Messages', icon: <Calendar className="w-3 h-3" /> },
        { id: 'announcements', label: 'Announcements', icon: <Mail className="w-3 h-3" /> }
      ]
    },
    { 
      id: 'id-card-management', 
      label: 'School ID Card Management', 
      icon: <IdCard className="w-4 h-4" />,
      hasSubmenu: true,
      requiredPermissions: ['all'],
      submenuItems: [
        { id: 'student-id', label: 'Student ID Cards', icon: <IdCard className="w-3 h-3" /> },
        { id: 'employee-id', label: 'Employee ID Cards', icon: <IdCard className="w-3 h-3" /> },
        { id: 'admit-cards', label: 'Admit Cards', icon: <FileText className="w-3 h-3" /> },
        { id: 'certificates', label: 'Certificates', icon: <GraduationCap className="w-3 h-3" /> },
        { id: 'card-templates', label: 'Card Templates', icon: <Settings className="w-3 h-3" /> }
      ]
    },
    { 
      id: 'data-analysis', 
      label: 'Data Analysis & Reports', 
      icon: <BarChart3 className="w-4 h-4" />,
      hasSubmenu: true,
      requiredPermissions: ['reports', 'financial_reports', 'academic_reports', 'all'],
      submenuItems: [
        { id: 'student-analytics', label: 'Student Analytics', icon: <BarChart3 className="w-3 h-3" /> },
        { id: 'financial-reports', label: 'Financial Reports', icon: <DollarSign className="w-3 h-3" /> },
        { id: 'academic-reports', label: 'Academic Reports', icon: <GraduationCap className="w-3 h-3" /> },
        { id: 'attendance-reports', label: 'Attendance Reports', icon: <Calendar className="w-3 h-3" /> }
      ]
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: <Settings className="w-4 h-4" />,
      requiredPermissions: ['all']
    }
  ];

  // Filter sidebar items based on user's permissions object
  const getUserFeaturePermissions = () => {
    if (!user) return [];
    // For SuperAdmin, show all
    if (user.permissions && (user.permissions.includes?.('all') || user.role === 'SuperAdmin')) return Object.keys(sidebarItems);
    // For other users, get features from permissions object
    if (user.permissions && typeof user.permissions === 'object') {
      return Object.keys(user.permissions);
    }
    return [];
  };

  const userFeatures = getUserFeaturePermissions();

  const filteredSidebarItems = sidebarItems.filter(item => {
    if (!item.requiredPermissions) return true;
    // If user is SuperAdmin, show all
    if (user && (user.permissions.includes?.('all') || user.role === 'SuperAdmin')) return true;
    // Otherwise, show if any requiredPermission matches a user feature
    return item.requiredPermissions.some(permission => userFeatures.includes(permission));
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white shadow-lg z-50 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:z-auto w-64`}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-800">UNHIMAS</span>
              <div className="text-xs text-gray-500">{user?.role}</div>
            </div>
          </div>
        </div>

        {/* Main Section */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Main</h3>
          
          <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
            {filteredSidebarItems.map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (item.hasSubmenu) {
                      toggleExpanded(item.id);
                    } else {
                      handleNavigation(item.id, [item.label]);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                    currentPage === item.id 
                      ? 'bg-orange-100 text-orange-600 font-medium' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.hasSubmenu && (
                    expandedItems.includes(item.id) 
                      ? <ChevronDown className="w-4 h-4" />
                      : <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                
                {/* Submenu */}
                {item.hasSubmenu && expandedItems.includes(item.id) && item.submenuItems && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.submenuItems.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => handleNavigation(subItem.id, [item.label, subItem.label])}
                        className={`w-full flex items-center space-x-2 px-3 py-1.5 text-xs rounded transition-colors ${
                          currentPage === subItem.id
                            ? 'bg-orange-100 text-orange-600 font-medium'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                      >
                        {subItem.icon}
                        <span>{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};