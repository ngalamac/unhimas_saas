import React from 'react';
import { useAuth } from '../../context/AuthContext';
import BranchWelcomeSwitcher from './BranchWelcomeSwitcher';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { AdminDashboard } from './AdminDashboard';
import { LecturerDashboard } from './LecturerDashboard';
import { AccountantDashboard } from './AccountantDashboard';
import { DeanDashboard } from './DeanDashboard';
import { HODDashboard } from './HODDashboard';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const RoleDashboard: React.FC = () => {
  const { user } = useAuth();
  const [sidebarMinimized, setSidebarMinimized] = React.useState(false);
  const [showCalendarModal, setShowCalendarModal] = React.useState(false);

  if (!user) return null;

  // Get user name
  const userName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.username || user.email;

  // Get branch name from manager or branch property
  let branchName = '';
  if ((user as any).branch) {
    const branch = (user as any).branch;
    if (typeof branch === 'object' && branch !== null) {
      branchName = branch.name || '';
    } else if (typeof branch === 'string') {
      branchName = branch;
    }
  }
  if (!branchName && user.department) {
    branchName = user.department;
  }

  // Handler for sidebar minimization
  const handleSidebarMinimize = () => setSidebarMinimized(true);
  const handleSidebarRestore = () => setSidebarMinimized(false);
  // Handler for calendar modal
  const handleCalendarOpen = () => setShowCalendarModal(true);
  const handleCalendarClose = () => setShowCalendarModal(false);

  return (
    <div className={`flex min-h-screen ${document.body.classList.contains('dark') ? 'dark' : ''}`}> 
      <Sidebar isOpen={true} onToggle={() => {}} minimized={sidebarMinimized} onMinimize={handleSidebarMinimize} onRestore={handleSidebarRestore} />
      <main
        className="flex-1 max-w-5xl mx-auto py-8 px-4 box-border min-h-screen overflow-x-auto bg-white dark:bg-darkbg dark:text-white"
      >
        <Header 
          onMenuToggle={() => setSidebarMinimized(v => !v)}
          onCalendarOpen={handleCalendarOpen}
        />
        <div className="mb-6 py-4 rounded-lg bg-blue-50 dark:bg-darkbg/60">
          {/* ...existing code for welcome message, if any... */}
        </div>
        {(() => {
          switch (user.role) {
            case 'SuperAdmin':
              return <SuperAdminDashboard />;
            case 'Admin':
              return <AdminDashboard />;
            case 'Lecturer':
              return <LecturerDashboard />;
            case 'Accountant':
              return <AccountantDashboard />;
            case 'Dean of Studies':
              return <DeanDashboard />;
            case 'Head Of Department':
              return <HODDashboard />;
            default:
              return <SuperAdminDashboard />;
          }
        })()}
        {/* Calendar Modal */}
        {showCalendarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white dark:bg-darkbg rounded-xl shadow-2xl p-6 max-w-md w-full text-gray-900 dark:text-white relative flex flex-col items-center">
              <h2 className="text-xl font-bold mb-4 text-center">Set Up Event Reminder</h2>
              <input type="text" className="w-full mb-2 p-2 border rounded dark:bg-darkbg dark:text-white" placeholder="Event Title" />
              <input type="datetime-local" className="w-full mb-2 p-2 border rounded dark:bg-darkbg dark:text-white" />
              <textarea className="w-full p-2 border rounded mb-2 dark:bg-darkbg dark:text-white" rows={2} placeholder="Description" />
              <div className="flex space-x-4 mt-2">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow">Save</button>
                <button className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 dark:bg-gray-700 dark:text-white rounded-lg font-semibold shadow" onClick={handleCalendarClose}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};