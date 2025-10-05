import React from 'react';

const RegistrarDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Registrar Dashboard</h1>
        <span className="text-sm text-gray-600">Admissions & Student Records</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-600">Pending Admissions</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">—</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-600">Today Registrations</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">—</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-600">Profile Updates</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">—</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <a href="#" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Register Student</a>
          <a href="#" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Approve Admission</a>
          <a href="#" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Manage Departments</a>
        </div>
      </div>
    </div>
  );
};

export default RegistrarDashboard;
