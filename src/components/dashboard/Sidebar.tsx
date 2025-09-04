import React, { useState, useEffect } from 'react';
import { Home, Building2, QrCode, Shield, DollarSign, CreditCard, GraduationCap, UserPlus, FileText, Users, MessageSquare, Car as IdCard, Settings, ChevronRight, ChevronDown, Eye, Plus, BookOpen, Calendar, BarChart3, UserCheck, School } from 'lucide-react';
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
  const { user } = useAuth();

  // Centralized permission mapping for sidebar items
  const sidebarPermissionMap: Record<string, string[]> = {
    'dashboard': [],
    'all-branches': ['branches:read', 'branches:create', 'branches:update', 'branches:delete', 'all'],
    'qr-attendance': ['attendance:read', 'attendance:create', 'attendance:update', 'attendance:delete', 'all'],
    'two-factor-auth': ['all'],
    'fees-management': ['accounting:read', 'accounting:create', 'accounting:update', 'accounting:delete', 'all'],
    'accounting': ['accounting:read', 'accounting:create', 'accounting:update', 'accounting:delete', 'all'],
    'accounting-coordination': ['accounting:read', 'accounting:create', 'accounting:update', 'accounting:delete', 'all'],
    'financial-coordinator': ['accounting:read', 'accounting:create', 'accounting:update', 'accounting:delete', 'all'],
    'integrated-accounting-hub': ['accounting:read', 'accounting:create', 'accounting:update', 'accounting:delete', 'all'],
    'accounting-master-control': ['accounting:read', 'accounting:create', 'accounting:update', 'accounting:delete', 'all'],
    'register-payments': ['accounting:read', 'accounting:create', 'accounting:update', 'accounting:delete', 'all'],
    'grading-system': ['grades:read', 'grades:create', 'grades:update', 'grades:delete', 'all'],
    'admissions': ['admissions:read', 'admissions:create', 'admissions:update', 'admissions:delete', 'students:read', 'all'],
    'students': ['students:read', 'students:create', 'students:update', 'students:delete', 'all'],
    'programs-departments': ['programs:read', 'programs:create', 'programs:update', 'programs:delete', 'departments:read', 'departments:create', 'departments:update', 'departments:delete', 'all'],
    'progress-report': ['reports:read', 'reports:export', 'grades:read', 'academic_reports:read', 'all'],
    'role-management': ['roles:read', 'roles:create', 'roles:update', 'roles:delete', 'roles:assign', 'users:read', 'users:create', 'users:update', 'users:delete', 'users:manage', 'all'],
    'enhanced-roles': ['roles:read', 'roles:create', 'roles:update', 'roles:delete', 'roles:assign', 'users:read', 'users:create', 'users:update', 'users:delete', 'users:manage', 'all'],
    'permission-matrix': ['roles:read', 'roles:create', 'roles:update', 'roles:delete', 'roles:assign', 'users:read', 'users:create', 'users:update', 'users:delete', 'users:manage', 'all'],
    'user-management': ['users:read', 'users:create', 'users:update', 'users:delete', 'users:manage', 'all'],
    'schedule-communication': ['communication:read', 'communication:create', 'communication:update', 'communication:delete', 'announcements:read', 'all'],
    'id-card-management': ['idcard:read', 'idcard:create', 'idcard:update', 'idcard:delete', 'all'],
    'data-analysis': ['reports:read', 'financial_reports:read', 'academic_reports:read', 'all'],
    'human-resources': ['staff:read','staff:create','staff:update','staff:delete','all'],
    'staff-management': ['staff:read','staff:create','staff:update','staff:delete','all'],
    'payroll': ['payroll:read','payroll:create','payroll:update','payroll:delete','all'],
    'settings': ['all']
  };

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
    // If settings is clicked, navigate to SettingsPage
    if (pageId === 'settings') {
      window.location.hash = '#/settings';
    }
  };

  // Sidebar items definition (always defined before filtering)
  const sidebarItems: SidebarItem[] = [
    // Primary
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-4 h-4" /> },

    // Academics
    { id: 'programs-departments', label: 'Academics', icon: <School className="w-4 h-4" />, hasSubmenu: true, submenuItems: [ { id: 'programs', label: 'Programs', icon: <GraduationCap className="w-3 h-3" /> }, { id: 'departments', label: 'Departments', icon: <Building2 className="w-3 h-3" /> }, { id: 'courses', label: 'Courses', icon: <BookOpen className="w-3 h-3" /> }, { id: 'grading-system', label: 'Grading System', icon: <FileText className="w-3 h-3" /> }, { id: 'progress-report', label: 'Progress Reports', icon: <FileText className="w-3 h-3" /> } ] },

    // Students & Admissions
  { id: 'students', label: 'Students', icon: <Users className="w-4 h-4" />, hasSubmenu: true, submenuItems: [ { id: 'all-students', label: 'All Students', icon: <Users className="w-3 h-3" /> }, { id: 'student-registration', label: 'Register Student', icon: <UserPlus className="w-3 h-3" /> }, { id: 'tuition-management', label: 'Tuition Management', icon: <DollarSign className="w-3 h-3" /> } ] },
    { id: 'admissions', label: 'Admissions', icon: <UserPlus className="w-4 h-4" />, hasSubmenu: true, submenuItems: [ { id: 'admission-applications', label: 'Applications', icon: <FileText className="w-3 h-3" /> }, { id: 'admission-payments', label: 'Payments', icon: <CreditCard className="w-3 h-3" /> }, { id: 'admission-status', label: 'Admission Status', icon: <UserCheck className="w-3 h-3" /> } ] },

  // Finance
    { id: 'accounting', label: 'Accounting', icon: <DollarSign className="w-4 h-4" />, hasSubmenu: true, submenuItems: [
      { id: 'accounting-coordination', label: 'Coordination Center', icon: <BarChart3 className="w-3 h-3" /> },
      { id: 'financial-coordinator', label: 'Financial Coordinator', icon: <BarChart3 className="w-3 h-3" /> },
      { id: 'integrated-accounting-hub', label: 'Integrated Hub', icon: <BarChart3 className="w-3 h-3" /> },
      { id: 'accounting-master-control', label: 'Master Control', icon: <BarChart3 className="w-3 h-3" /> },
      { id: 'accounting-overview', label: 'Dashboard', icon: <BarChart3 className="w-3 h-3" /> }, 
      { id: 'transactions', label: 'Transactions', icon: <FileText className="w-3 h-3" /> }, 
      { id: 'categories', label: 'Categories', icon: <BookOpen className="w-3 h-3" /> }, 
      { id: 'reports', label: 'Reports', icon: <FileText className="w-3 h-3" /> }, 
      { id: 'payment-plans', label: 'Payment Plans', icon: <CreditCard className="w-3 h-3" /> }, 
      { id: 'tuition-plans', label: 'Tuition Plans', icon: <School className="w-3 h-3" /> },
      { id: 'budget-analysis', label: 'Budget Analysis', icon: <BarChart3 className="w-3 h-3" /> },
      { id: 'financial-insights', label: 'Financial Insights', icon: <Eye className="w-3 h-3" /> }
    ] },

    // Human Resources
    { id: 'human-resources', label: 'Human Resources', icon: <Users className="w-4 h-4" />, hasSubmenu: true, requiredPermissions: ['staff:read','all'], submenuItems: [ { id: 'staff-management', label: 'Staff Directory', icon: <UserCheck className="w-3 h-3" /> }, { id: 'payroll', label: 'Payroll', icon: <DollarSign className="w-3 h-3" /> }, { id: 'id-card-management', label: 'ID Cards', icon: <IdCard className="w-3 h-3" /> } ] },

    // Attendance & Scheduling
    { id: 'qr-attendance', label: 'Attendance', icon: <QrCode className="w-4 h-4" />, hasSubmenu: true, submenuItems: [ { id: 'qr-attendance', label: 'QR Attendance', icon: <QrCode className="w-3 h-3" /> }, { id: 'schedule-communication', label: 'Schedule Messaging', icon: <MessageSquare className="w-3 h-3" /> } ] },

    // Reports & Analytics
    { id: 'data-analysis', label: 'Reports & Analytics', icon: <BarChart3 className="w-4 h-4" />, hasSubmenu: true, submenuItems: [ { id: 'student-analytics', label: 'Student Analytics', icon: <BarChart3 className="w-3 h-3" /> }, { id: 'financial-reports', label: 'Financial Reports', icon: <DollarSign className="w-3 h-3" /> }, { id: 'attendance-reports', label: 'Attendance Reports', icon: <Calendar className="w-3 h-3" /> } ] },

    // Branches & Admin
    { id: 'all-branches', label: 'Branches', icon: <Building2 className="w-4 h-4" />, hasSubmenu: true, submenuItems: [ { id: 'view-branches', label: 'View Branches', icon: <Eye className="w-3 h-3" /> }, { id: 'create-branch', label: 'Create Branch', icon: <Plus className="w-3 h-3" /> } ] },
    { id: 'role-management', label: 'Roles & Access', icon: <Shield className="w-4 h-4" />, hasSubmenu: true, submenuItems: [ 
      { id: 'role-management', label: 'Access Overview', icon: <Eye className="w-3 h-3" /> },
      { id: 'enhanced-roles', label: 'Access Control', icon: <Shield className="w-3 h-3" /> },
      { id: 'permission-matrix', label: 'Permission Matrix', icon: <Shield className="w-3 h-3" /> }, 
      { id: 'user-management', label: 'User Management', icon: <Users className="w-3 h-3" /> } 
    ] },

    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, requiredPermissions: ['all'] }
  ];

  // Get all user permissions as a flat array
  const getUserPermissions = () => {
    if (!user) return [];
  const isSuper = (user as any)?.role === 'SuperAdmin' || (user as any)?.type === 'SuperAdmin' || (user as any)?.isSuperAdmin === true;
  if (user.permissions && (user.permissions.includes?.('all') || isSuper)) return ['all'];
    
    // AuthContext now provides permissions as an array of "feature:action" strings
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions;
    }
    
    return [];
  };

  // Memoize userPermissions to avoid recalculating on every render
  const userPermissions = React.useMemo(() => getUserPermissions(), [user]);

  // Fallback: Always show all sidebar items for SuperAdmin
  const [filteredSidebarItems, setFilteredSidebarItems] = useState<SidebarItem[]>(sidebarItems);

  useEffect(() => {
    let items = sidebarItems;
    // If developer toggle enabled, show all links regardless of permissions
  // SuperAdmin always sees everything
    // SuperAdmin always sees everything
  const isSuperLocal = (user as any)?.role === 'SuperAdmin' || (user as any)?.type === 'SuperAdmin' || (user as any)?.isSuperAdmin === true;
  if (isSuperLocal || userPermissions.includes('all')) {
      items = sidebarItems;
    } else {
      // Filter items based on user permissions
      items = sidebarItems.filter(item => {
        if (!sidebarPermissionMap[item.id] || sidebarPermissionMap[item.id].length === 0) {
          return true;
        }
        const requiredPerms = sidebarPermissionMap[item.id];
        return requiredPerms.some(requiredPerm => {
          return userPermissions.some(userPerm => {
            if (userPerm === 'all') return true;
            const normalizedUserPerm = userPerm.toLowerCase();
            const normalizedRequiredPerm = requiredPerm.toLowerCase();
            if (normalizedUserPerm === normalizedRequiredPerm) return true;
            if (normalizedUserPerm.includes(normalizedRequiredPerm) || normalizedRequiredPerm.includes(normalizedUserPerm)) {
              return true;
            }
            return false;
          });
        });
      });
    }
    setFilteredSidebarItems(items);
    // Only auto-expand students menu on mount or when user changes
    if (isSuperLocal) {
      setExpandedItems(prev => prev.includes('students') ? prev : [...prev, 'students']);
  } else if (['all-students', 'student-registration', 'student-details', 'tuition-management'].includes((window.location.hash || '').replace('#/', ''))) {
      setExpandedItems(prev => prev.includes('students') ? prev : [...prev, 'students']);
    }
  }, [user]);

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
  {/* Header spacer (logo removed - branding handled in Header.tsx) */}
  <div className="p-4 border-b border-gray-200" />
  <div className="px-4 py-2 text-xs text-gray-500 border-b">
  <span>Sidebar</span>
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