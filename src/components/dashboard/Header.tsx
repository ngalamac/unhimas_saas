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
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
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

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side */}
  <div className="flex items-center space-x-4">
          {/* Brand/logo visible across all dashboards (leftmost) */}
          <div className="flex items-center space-x-3 mr-4 pl-1">
            <img src="./src/assets/unhimas-logo.png" alt="UNHIMAS" className="w-10 h-10 object-contain" />
            <div className="hidden sm:block">
              <div className="text-base font-semibold text-gray-900">UNHIMAS</div>
              <div className="text-xs text-gray-500">School Management</div>
            </div>
          </div>

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
          <button className="p-2 rounded-lg hover:bg-gray-100">
            <Globe className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100">
            <Calendar className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100">
            <MessageSquare className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>
          
          {/* User dropdown */}
          <div className="flex items-center space-x-2 ml-4">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
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