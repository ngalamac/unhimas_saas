import React from 'react';
import { 
  Menu, 
  Search, 
  Grid3X3, 
  Maximize, 
  Globe, 
  Calendar, 
  MessageSquare, 
  Bell,
  User,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuToggle: () => void;
  onCalendarOpen?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, onCalendarOpen }) => {
  // State for message dropdown
  const [showMessageDropdown, setShowMessageDropdown] = React.useState(false);
  const [users, setUsers] = React.useState<any[]>([]);
  const [selectedUser, setSelectedUser] = React.useState('');
  const [messageText, setMessageText] = React.useState('');
  const [messageStatus, setMessageStatus] = React.useState('');

  // State for notifications
  const [notificationCount, setNotificationCount] = React.useState(3); // Example static, replace with API
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);

  // State for theme switcher
  const [darkMode, setDarkMode] = React.useState(false);

  // Fetch users for messaging
  React.useEffect(() => {
    if (showMessageDropdown && users.length === 0) {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => setUsers(Array.isArray(data) ? data : []));
    }
  }, [showMessageDropdown, users.length]);

  // Theme switcher logic
  React.useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSendMessage = async () => {
    if (!selectedUser || !messageText) return;
    // Replace with real API endpoint
    setMessageStatus('Sending...');
    setTimeout(() => {
      setMessageStatus('Message sent!');
      setMessageText('');
    }, 1000);
  };

  const handleThemeSwitch = () => {
    setDarkMode((prev) => !prev);
  };
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const handleLogout = () => {
    setShowLogoutModal(true);
  };
  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
    navigate('/login');
  };
  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Navigation handlers for icons
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
  <header className={`shadow-sm border-b border-gray-200 px-4 py-3 ${darkMode ? 'bg-darkbg text-white' : 'bg-white'}`}> 
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:flex items-center space-x-2">
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <Menu className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <Maximize className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <Grid3X3 className="w-5 h-5" />
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
        </div>
        {/* Right side */}
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-lg hover:bg-gray-100" onClick={() => handleNavigate('/global')} title="Global">
            <Globe className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100" onClick={onCalendarOpen} title="Calendar">
            <Calendar className="w-5 h-5" />
          </button>
          {/* Message Dropdown */}
          <div className="relative">
            <button className="p-2 rounded-lg hover:bg-gray-100" onClick={() => setShowMessageDropdown(v => !v)} title="Messages">
              <MessageSquare className="w-5 h-5" />
            </button>
            {showMessageDropdown && (
              <div className={`absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 ${darkMode ? 'bg-darkbg text-white' : ''}`}>
                <div className="p-4">
                  <div className="mb-2 font-semibold">Send Message</div>
                  <select className="w-full mb-2 p-2 border rounded" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                    <option value="">Select user...</option>
                    {users.map(u => (
                      <option key={u._id || u.id} value={u._id || u.id}>{u.firstName || u.name || u.username || u.email}</option>
                    ))}
                  </select>
                  <textarea className="w-full p-2 border rounded mb-2" rows={3} placeholder="Type your message..." value={messageText} onChange={e => setMessageText(e.target.value)} />
                  <button className="w-full bg-blue-600 text-white py-2 rounded" onClick={handleSendMessage}>Send</button>
                  {messageStatus && <div className="mt-2 text-xs text-green-600">{messageStatus}</div>}
                </div>
              </div>
            )}
          </div>
          {/* Notification Dropdown & Counter */}
          <div className="relative">
            <button className="p-2 rounded-lg hover:bg-gray-100 relative" onClick={() => setShowNotifications(v => !v)} title="Notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{notificationCount}</span>
            </button>
            {showNotifications && (
              <div className={`absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 ${darkMode ? 'bg-darkbg text-white' : ''}`}>
                <div className="p-4">
                  <div className="mb-2 font-semibold">Notifications</div>
                  {notifications.length === 0 ? (
                    <div className="text-xs text-gray-500">No notifications</div>
                  ) : (
                    notifications.map((n, i) => (
                      <div key={i} className="mb-2 text-sm">{n.text}</div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Theme Switcher Icon */}
          <button className="p-2 rounded-full bg-gray-200 dark:bg-darkbg text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors" onClick={handleThemeSwitch} title="Toggle dark mode" aria-label="Toggle dark mode">
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {/* User dropdown */}
          <div className="flex items-center space-x-2 ml-4">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600 dark:text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-200">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-100 text-red-600"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full text-gray-900 relative flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4 text-center text-[#a02c2c]">Confirm Logout</h2>
            <p className="mb-6 text-sm text-center">Are you sure you want to logout?</p>
            <div className="flex space-x-4">
              <button onClick={confirmLogout} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow">Logout</button>
              <button onClick={cancelLogout} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-semibold shadow">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};