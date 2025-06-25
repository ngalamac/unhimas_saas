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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
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
    </header>
  );
};