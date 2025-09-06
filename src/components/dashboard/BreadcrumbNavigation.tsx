import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';

export const BreadcrumbNavigation: React.FC = () => {
  const { currentPage, breadcrumb, setCurrentPage, setBreadcrumb } = useNavigation();

  const handleBreadcrumbClick = (index: number) => {
    if (index === 0) {
      setCurrentPage('dashboard');
      setBreadcrumb(['Dashboard']);
    } else {
      // Navigate to parent page if possible
      const newBreadcrumb = breadcrumb.slice(0, index + 1);
      setBreadcrumb(newBreadcrumb);
    }
  };

  if (currentPage === 'dashboard') {
    return null; // Don't show breadcrumb on dashboard
  }

  return (
    <nav className="flex items-center space-x-2 mb-6 px-6 py-3 bg-white border-b border-gray-200">
      <button
        onClick={() => handleBreadcrumbClick(0)}
        className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Home className="w-4 h-4" />
        <span className="text-sm">Home</span>
      </button>
      
      {breadcrumb.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => handleBreadcrumbClick(index)}
            className={`text-sm transition-colors ${
              index === breadcrumb.length - 1 
                ? "text-gray-900 font-semibold cursor-default" 
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {item}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};