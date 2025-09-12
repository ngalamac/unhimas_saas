import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Building2, 
  QrCode, 
  Shield, 
  DollarSign, 
  CreditCard, 
  GraduationCap, 
  UserPlus, 
  FileText, 
  Users, 
  MessageSquare, 
  Settings, 
  ChevronRight, 
  ChevronDown, 
  Eye, 
  Plus, 
  BookOpen, 
  Calendar, 
  BarChart3, 
  UserCheck, 
  School,
  Search,
  Star,
  Clock,
  Zap,
  Calculator,
  Database
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  hasSubmenu?: boolean;
  submenuItems?: { id: string; label: string; icon: React.ReactNode; badge?: string; isNew?: boolean }[];
  requiredPermissions?: string[];
  badge?: string;
  isNew?: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>(['students', 'accounting']);
  const [recentPages, setRecentPages] = useState<string[]>([]);
  const [favoritePages, setFavoritePages] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentPage, setCurrentPage, setBreadcrumb } = useNavigation();
  const { user } = useAuth();
  const { currentBranch } = useBranch();

  // Load user preferences
  useEffect(() => {
    const savedExpanded = localStorage.getItem('sidebarExpanded');
    const savedRecent = localStorage.getItem('recentPages');
    const savedFavorites = localStorage.getItem('favoritePages');

    if (savedExpanded) {
      try {
        setExpandedItems(JSON.parse(savedExpanded));
      } catch (e) {
        console.error('Failed to parse saved expanded items');
      }
    }

    if (savedRecent) {
      try {
        setRecentPages(JSON.parse(savedRecent));
      } catch (e) {
        console.error('Failed to parse recent pages');
      }
    }

    if (savedFavorites) {
      try {
        setFavoritePages(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Failed to parse favorite pages');
      }
    }
  }, []);

  // Save expanded state
  useEffect(() => {
    localStorage.setItem('sidebarExpanded', JSON.stringify(expandedItems));
  }, [expandedItems]);

  // Track page visits
  useEffect(() => {
    if (currentPage && currentPage !== 'dashboard') {
      setRecentPages(prev => {
        const updated = [currentPage, ...prev.filter(p => p !== currentPage)].slice(0, 5);
        localStorage.setItem('recentPages', JSON.stringify(updated));
        return updated;
      });
    }
  }, [currentPage]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleFavorite = (pageId: string) => {
    setFavoritePages(prev => {
      const updated = prev.includes(pageId) 
        ? prev.filter(p => p !== pageId)
        : [...prev, pageId];
      localStorage.setItem('favoritePages', JSON.stringify(updated));
      return updated;
    });
  };

  const handleNavigation = (pageId: string, breadcrumbPath: string[]) => {
    setCurrentPage(pageId);
    setBreadcrumb(breadcrumbPath);
  };

  // Enhanced sidebar items with real-time data integration
  const sidebarItems: SidebarItem[] = [
    // Dashboard
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: <Home className="w-4 h-4" /> 
    },

    // Students & Academics
    { 
      id: 'students', 
      label: 'Students', 
      icon: <Users className="w-4 h-4" />, 
      hasSubmenu: true, 
      submenuItems: [ 
        { id: 'all-students', label: 'All Students', icon: <Users className="w-3 h-3" /> }, 
        { id: 'student-registration', label: 'Register Student', icon: <UserPlus className="w-3 h-3" />, isNew: true }, 
        { id: 'tuition-management', label: 'Tuition Management', icon: <DollarSign className="w-3 h-3" /> } 
      ] 
    },

    { 
      id: 'academics', 
      label: 'Academics', 
      icon: <School className="w-4 h-4" />, 
      hasSubmenu: true, 
      submenuItems: [ 
        { id: 'programs', label: 'Programs', icon: <GraduationCap className="w-3 h-3" /> }, 
        { id: 'departments', label: 'Departments', icon: <Building2 className="w-3 h-3" /> }, 
        { id: 'courses', label: 'Courses', icon: <BookOpen className="w-3 h-3" /> }, 
        { id: 'grading-system', label: 'Grading System', icon: <FileText className="w-3 h-3" /> } 
      ] 
    },

    // Finance & Accounting
    { 
      id: 'accounting', 
      label: 'Accounting', 
      icon: <DollarSign className="w-4 h-4" />, 
      hasSubmenu: true, 
      submenuItems: [
        { id: 'accounting-overview', label: 'Dashboard', icon: <BarChart3 className="w-3 h-3" /> },
        { id: 'transactions', label: 'Transactions', icon: <FileText className="w-3 h-3" /> }, 
        { id: 'categories', label: 'Categories', icon: <BookOpen className="w-3 h-3" /> }, 
        { id: 'payment-plans', label: 'Payment Plans', icon: <CreditCard className="w-3 h-3" /> }, 
        { id: 'tuition-plans', label: 'Tuition Plans', icon: <School className="w-3 h-3" /> },
        { id: 'reports', label: 'Reports', icon: <FileText className="w-3 h-3" /> },
        { id: 'ohada-accounting', label: 'OHADA Accounting', icon: <Calculator className="w-3 h-3" /> }
      ] 
    },

    // Human Resources
    { 
      id: 'human-resources', 
      label: 'Human Resources', 
      icon: <Users className="w-4 h-4" />, 
      hasSubmenu: true, 
      requiredPermissions: ['staff:read','all'], 
      submenuItems: [ 
        { id: 'staff-management', label: 'Staff Directory', icon: <UserCheck className="w-3 h-3" /> }, 
        { id: 'payroll', label: 'Payroll Dashboard', icon: <DollarSign className="w-3 h-3" /> },
        { id: 'teaching-sessions', label: 'Teaching Sessions', icon: <Clock className="w-3 h-3" /> },
        { id: 'payroll-details', label: 'Payroll Details', icon: <FileText className="w-3 h-3" /> }
      ] 
    },

    // Operations
    { 
      id: 'operations', 
      label: 'Operations', 
      icon: <Zap className="w-4 h-4" />, 
      hasSubmenu: true, 
      submenuItems: [ 
        { id: 'qr-attendance', label: 'QR Attendance', icon: <QrCode className="w-3 h-3" /> }, 
        { id: 'schedule-communication', label: 'Communications', icon: <MessageSquare className="w-3 h-3" /> },
        { id: 'id-card-management', label: 'ID Cards', icon: <UserCheck className="w-3 h-3" /> }
      ] 
    },

    // Analytics & Reports
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: <BarChart3 className="w-4 h-4" />, 
      hasSubmenu: true, 
      submenuItems: [ 
        { id: 'student-analytics', label: 'Student Analytics', icon: <BarChart3 className="w-3 h-3" /> }, 
        { id: 'financial-reports', label: 'Financial Reports', icon: <DollarSign className="w-3 h-3" /> }, 
        { id: 'attendance-reports', label: 'Attendance Reports', icon: <Calendar className="w-3 h-3" /> } 
      ] 
    },

    // Administration
    { 
      id: 'administration', 
      label: 'Administration', 
      icon: <Shield className="w-4 h-4" />, 
      hasSubmenu: true, 
      submenuItems: [ 
  { id: 'view-branches', label: 'Branches', icon: <Building2 className="w-3 h-3" /> },
  { id: 'enhanced-roles', label: 'Roles & Access', icon: <Shield className="w-3 h-3" /> },
  { id: 'user-management', label: 'User Management', icon: <Users className="w-3 h-3" /> },
  { id: 'backup-management', label: 'Backup & Restore', icon: <Database className="w-3 h-3" />, isNew: true }
      ] 
    },

    // Settings
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: <Settings className="w-4 h-4" />, 
      requiredPermissions: ['all'] 
    }
  ];

  // Filter items based on permissions
  const getUserPermissions = () => {
    if (!user) return [];
    const isSuper = (user as any)?.role === 'SuperAdmin' || (user as any)?.type === 'SuperAdmin' || (user as any)?.isSuperAdmin === true;
    if (user.permissions && (user.permissions.includes?.('all') || isSuper)) return ['all'];
    
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions;
    }
    
    return [];
  };

  const userPermissions = React.useMemo(() => getUserPermissions(), [user]);
  const isSuperAdmin = (user as any)?.role === 'SuperAdmin' || (user as any)?.type === 'SuperAdmin' || (user as any)?.isSuperAdmin === true;

  const filteredSidebarItems = sidebarItems.filter(item => {
    if (isSuperAdmin) return true;
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) return true;
    
    return item.requiredPermissions.some(requiredPerm => {
      return userPermissions.some(userPerm => {
        if (userPerm === 'all') return true;
        const normalizedUserPerm = userPerm.toLowerCase();
        const normalizedRequiredPerm = requiredPerm.toLowerCase();
        return normalizedUserPerm === normalizedRequiredPerm || 
               normalizedUserPerm.includes(normalizedRequiredPerm) || 
               normalizedRequiredPerm.includes(normalizedUserPerm);
      });
    });
  });

  // Filter sidebar items based on search
  const filteredItems = searchQuery 
    ? filteredSidebarItems.filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.submenuItems || []).some(sub => 
          sub.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : filteredSidebarItems;

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
      <div className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 shadow-lg z-50 transition-all duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:z-auto w-72`}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/unhimas-logo.png" 
                alt="UNHIMAS" 
                className="w-8 h-8 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = './src/assets/unhimas-logo.png'; }}
              />
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Navigation</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Quick Access</div>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search navigation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Quick Access Section */}
        {(favoritePages.length > 0 || recentPages.length > 0) && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            {/* Favorites */}
            {favoritePages.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center">
                  <Star className="w-3 h-3 mr-1" />
                  Favorites
                </h3>
                <div className="space-y-1">
                  {favoritePages.slice(0, 3).map((pageId) => {
                    const item = filteredSidebarItems.find(i => i.id === pageId) || 
                                filteredSidebarItems.find(i => i.submenuItems?.some(s => s.id === pageId));
                    const subItem = item?.submenuItems?.find(s => s.id === pageId);
                    const label = subItem?.label || item?.label || pageId;
                    
                    return (
                      <button
                        key={pageId}
                        onClick={() => handleNavigation(pageId, [label])}
                        className={`w-full flex items-center space-x-2 px-2 py-1.5 text-xs rounded transition-colors ${
                          currentPage === pageId
                            ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 font-medium'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Pages */}
            {recentPages.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Recent
                </h3>
                <div className="space-y-1">
                  {recentPages.slice(0, 3).map((pageId) => {
                    const item = filteredSidebarItems.find(i => i.id === pageId) || 
                                filteredSidebarItems.find(i => i.submenuItems?.some(s => s.id === pageId));
                    const subItem = item?.submenuItems?.find(s => s.id === pageId);
                    const label = subItem?.label || item?.label || pageId;
                    
                    return (
                      <button
                        key={pageId}
                        onClick={() => handleNavigation(pageId, [label])}
                        className={`w-full flex items-center space-x-2 px-2 py-1.5 text-xs rounded transition-colors ${
                          currentPage === pageId
                            ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 font-medium'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Main Navigation
            </h3>
            <div className="space-y-1">
              {filteredItems.map((item) => (
                <div key={item.id}>
                  <div className="flex items-center">
                    <button
                      onClick={() => {
                        if (item.hasSubmenu) {
                          toggleExpanded(item.id);
                        } else {
                          handleNavigation(item.id, [item.label]);
                        }
                      }}
                      className={`flex-1 flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                        currentPage === item.id 
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' 
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`${currentPage === item.id ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                          {item.icon}
                        </div>
                        <span className="font-medium">{item.label}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                            {item.badge}
                          </span>
                        )}
                        {item.isNew && (
                          <span className="px-2 py-0.5 text-xs bg-green-500 text-white rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      {item.hasSubmenu && (
                        <div className={`transition-transform duration-200 ${
                          expandedItems.includes(item.id) ? 'rotate-90' : ''
                        }`}>
                          <ChevronRight className={`w-4 h-4 ${
                            currentPage === item.id ? 'text-white' : 'text-gray-400 dark:text-gray-500'
                          }`} />
                        </div>
                      )}
                    </button>

                    {/* Favorite toggle */}
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className="ml-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title={favoritePages.includes(item.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`w-3 h-3 ${
                        favoritePages.includes(item.id) ? 'text-yellow-500 fill-current' : 'text-gray-400'
                      }`} />
                    </button>
                  </div>

                  {/* Submenu */}
                  {item.hasSubmenu && expandedItems.includes(item.id) && item.submenuItems && (
                    <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-100 dark:border-gray-700 pl-4">
                      {item.submenuItems.map((subItem) => (
                        <div key={subItem.id} className="flex items-center">
                          <button
                            onClick={() => handleNavigation(subItem.id, [item.label, subItem.label])}
                            className={`flex-1 flex items-center space-x-2 px-3 py-2 text-xs rounded-lg transition-all duration-200 ${
                              currentPage === subItem.id
                                ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 font-medium shadow-sm'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                          >
                            <div className={`${currentPage === subItem.id ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`}>
                              {subItem.icon}
                            </div>
                            <span>{subItem.label}</span>
                            {subItem.badge && (
                              <span className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                                {subItem.badge}
                              </span>
                            )}
                            {subItem.isNew && (
                              <span className="px-1.5 py-0.5 text-xs bg-green-500 text-white rounded-full">
                                New
                              </span>
                            )}
                          </button>

                          <button
                            onClick={() => toggleFavorite(subItem.id)}
                            className="ml-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title={favoritePages.includes(subItem.id) ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Star className={`w-3 h-3 ${
                              favoritePages.includes(subItem.id) ? 'text-yellow-500 fill-current' : 'text-gray-300'
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {/* Current Branch Info */}
          {currentBranch && (
            <div className="mb-3 p-3 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="text-xs font-medium text-gray-900 dark:text-gray-100">{(currentBranch as any).name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Current Branch</div>
                </div>
              </div>
            </div>
          )}

          {/* User Info */}
          <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.role}</div>
            </div>
          </div>

          {/* Version Info */}
          <div className="mt-3 text-center">
            <div className="text-xs text-gray-400 dark:text-gray-500">
              UNHIMAS v2.0.1
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              © 2025 Codegisoft
            </div>
          </div>
        </div>
      </div>
    </>
  );
};