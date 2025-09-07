import React, { useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';

export const NavigationShortcuts: React.FC = () => {
  const { setCurrentPage, setBreadcrumb } = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when no input is focused
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'h':
            event.preventDefault();
            setCurrentPage('dashboard');
            setBreadcrumb(['Dashboard']);
            break;
          case 'n':
            event.preventDefault();
            if (user?.permissions?.includes('students:create') || user?.role === 'SuperAdmin') {
              setCurrentPage('student-registration');
              setBreadcrumb(['Students', 'Register Student']);
            }
            break;
          case 't':
            event.preventDefault();
            if (user?.permissions?.includes('accounting:create') || user?.role === 'SuperAdmin') {
              setCurrentPage('transactions');
              setBreadcrumb(['Accounting', 'Transactions']);
            }
            break;
          case 'u':
            event.preventDefault();
            if (user?.role === 'SuperAdmin' || user?.role === 'Admin') {
              setCurrentPage('user-management');
              setBreadcrumb(['Roles & Access', 'User Management']);
            }
            break;
          case 's':
            event.preventDefault();
            setCurrentPage('all-students');
            setBreadcrumb(['Students', 'All Students']);
            break;
          case 'r':
            event.preventDefault();
            setCurrentPage('reports');
            setBreadcrumb(['Accounting', 'Reports']);
            break;
        }
      }

      // ESC to close modals/dropdowns
      if (event.key === 'Escape') {
        // This could be used to close any open modals or dropdowns
        document.dispatchEvent(new CustomEvent('closeAllDropdowns'));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentPage, setBreadcrumb, user]);

  return null; // This component only handles keyboard shortcuts
};