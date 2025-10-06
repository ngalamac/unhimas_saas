import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Globe,
  Sun,
  Moon,
  Maximize,
  Minimize,
  RefreshCw,
  HelpCircle,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { isFinanceRole } from '../../utils/rolePermissions';
import { useBranch } from '../../context/BranchContext';
import { useTheme } from '../../context/ThemeContext';
import { useUI } from '../../context/UIContext';
import { useNavigate } from 'react-router-dom';
import fetchClient from '../../lib/fetchClient';

interface HeaderProps {
  onMenuToggle: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { setCurrentPage, setBreadcrumb } = useNavigation();
  const { currentBranch, managedBranches, setCurrentBranchById } = useBranch();
  const { showToast } = useUI();
  const navigate = useNavigate();

  // State management
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      // Mock notifications for now - replace with real API call
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'New Student Registration',
          message: 'A new student has been registered in Computer Engineering',
          type: 'info',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          read: false
        },
        {
          id: '2',
          title: 'Payment Received',
          message: 'Payment of 525,000 XAF received from student STU-2024-001',
          type: 'success',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          read: false
        },
        {
          id: '3',
          title: 'System Backup Complete',
          message: 'Daily system backup completed successfully',
          type: 'success',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: true
        }
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Search functionality
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // Search across multiple entities
      const [studentsRes, staffRes] = await Promise.all([
        fetchClient.get(`/api/students?search=${encodeURIComponent(query)}&limit=5`),
        fetchClient.get(`/api/staff?search=${encodeURIComponent(query)}&limit=5`)
      ]);

      const results = [];
      
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        const students = (studentsData.data || []).map((s: any) => ({
          id: s._id,
          type: 'student',
          title: s.names || `${s.firstName} ${s.lastName}`,
          subtitle: `Student ID: ${s.studentId}`,
          action: () => {
            setCurrentPage('all-students');
            setBreadcrumb(['Students', 'All Students']);
            setShowSearch(false);
          }
        }));
        results.push(...students);
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        const staff = (staffData.data || []).map((s: any) => ({
          id: s._id,
          type: 'staff',
          title: s.name,
          subtitle: `Role: ${s.role || 'Staff'}`,
          action: () => {
            setCurrentPage('staff-management');
            setBreadcrumb(['Human Resources', 'Staff Directory']);
            setShowSearch(false);
          }
        }));
        results.push(...staff);
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  // Quick actions based on user role
  const getQuickActions = (): QuickAction[] => {
    const actions: QuickAction[] = [
      {
        id: 'add-student',
        label: 'Add Student',
        icon: <User className="w-4 h-4" />,
        action: () => {
          setCurrentPage('student-registration');
          setBreadcrumb(['Students', 'Register Student']);
          setShowQuickActions(false);
        },
        shortcut: 'Ctrl+N'
      },
      // Finance quick action only for finance roles
      ...(isFinanceRole((user as any)?.role || (user as any)?.type) ? [{
        id: 'add-transaction',
        label: 'Add Transaction',
        icon: <MessageSquare className="w-4 h-4" />,
        action: () => {
          setCurrentPage('transactions');
          setBreadcrumb(['Accounting', 'Transactions']);
          setShowQuickActions(false);
        },
        shortcut: 'Ctrl+T'
      } as QuickAction] : [])
    ];

    // Add role-specific actions
    if (user?.role === 'SuperAdmin' || user?.role === 'Admin') {
      actions.push({
        id: 'user-management',
        label: 'Manage Users',
        icon: <Settings className="w-4 h-4" />,
        action: () => {
          setCurrentPage('user-management');
          setBreadcrumb(['Roles & Access', 'User Management']);
          setShowQuickActions(false);
        },
        shortcut: 'Ctrl+U'
      });
    }

    return actions;
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const quickActions = getQuickActions();

  return (
    <>
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Brand */}
            <div className="flex items-center space-x-3">
              <img 
                src="/unhimas-logo.png" 
                alt="UNHIMAS" 
                className="w-8 h-8 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = '/unhimas-logo.png'; }}
              />
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">UNHIMAS</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">School Management</div>
              </div>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Branch Selector for Multi-branch Users */}
            {managedBranches.length > 1 && (
              <div className="hidden md:block">
                <select
                  value={(currentBranch as any)?._id || (currentBranch as any)?.id || ''}
                  onChange={(e) => setCurrentBranchById(e.target.value)}
                 className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {managedBranches.map(branch => (
                    <option key={(branch as any)._id || (branch as any).id} value={(branch as any)._id || (branch as any).id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Current Branch Display */}
            {currentBranch && managedBranches.length <= 1 && (
              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{(currentBranch as any).name}</span>
              </div>
            )}
          </div>

          {/* Center Section - Search */}
          <div className="flex-1 max-w-md mx-4 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students, staff, transactions..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                onFocus={() => setShowSearch(true)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Search Results Dropdown */}
            {showSearch && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                <div className="p-2">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={result.action}
                      className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100">{result.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{result.subtitle}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* System Status Indicator */}
            <div className="hidden lg:flex items-center space-x-2 px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-600 dark:text-gray-300">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Current Time */}
            <div className="hidden lg:block text-xs text-gray-600 dark:text-gray-300">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>

            {/* Quick Actions */}
            <div className="relative">
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Quick Actions"
              >
                <Calendar className="w-5 h-5 text-gray-600" />
              </button>

              {showQuickActions && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b border-gray-200">
                    <h3 className="font-medium text-gray-900">Quick Actions</h3>
                  </div>
                  <div className="p-2">
                    {quickActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={action.action}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {action.icon}
                          <span className="text-sm font-medium text-gray-900">{action.label}</span>
                        </div>
                        {action.shortcut && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {action.shortcut}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Maximize className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => window.location.reload()}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Refresh Page"
            >
              <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Help */}
            <button
              onClick={() => showToast('Help documentation coming soon', 'info')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Help & Documentation"
            >
              <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">Notifications</h3>
                      <button
                        onClick={() => {
                          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                          showToast('All notifications marked as read', 'success');
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        Mark all read
                      </button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => markNotificationAsRead(notification.id)}
                          className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                            !notification.read ? 'bg-blue-50 dark:bg-blue-900' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notification.type === 'success' ? 'bg-green-500' :
                              notification.type === 'warning' ? 'bg-yellow-500' :
                              notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                            }`}></div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{notification.title}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                {new Date(notification.timestamp).toLocaleString()}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setCurrentPage('notifications');
                        setBreadcrumb(['Notifications']);
                        setShowNotifications(false);
                      }}
                      className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>

              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{user?.firstName} {user?.lastName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">{user?.role}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      onClick={() => {
                        setCurrentPage('settings');
                        setBreadcrumb(['Settings']);
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-200">Account Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentPage('enhanced-roles');
                        setBreadcrumb(['Roles & Access', 'Enhanced Management']);
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-200">My Permissions</span>
                    </button>

                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors text-red-600 dark:text-red-400"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Sign Out</span>
                    </button>
                  </div>

                  <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <div>Last login: {new Date().toLocaleDateString()}</div>
                      <div>Session: Active</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Branch Selector */}
        {managedBranches.length > 1 && (
          <div className="md:hidden mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <select
              value={(currentBranch as any)?._id || (currentBranch as any)?.id || ''}
              onChange={(e) => setCurrentBranchById(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {managedBranches.map(branch => (
                <option key={(branch as any)._id || (branch as any).id} value={(branch as any)._id || (branch as any).id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Click outside handlers */}
      {(showUserMenu || showNotifications || showSearch || showQuickActions) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
            setShowSearch(false);
            setShowQuickActions(false);
          }}
        />
      )}
    </header>
    {/* Logout confirmation modal */}
    {showLogoutConfirm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[95%] max-w-sm">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sign out</h3>
          </div>
          <div className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
            Are you sure you want to logout of your account?
          </div>
          <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => { setShowLogoutConfirm(false); logout(); navigate('/login'); }}
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};