import React from 'react';

const ReportsPage: React.FC = () => {
  const download = () => {
    window.open(`/api/accounting/export`,'_blank');
  };
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Reports</h1>
      <div className="space-x-2">
  <button onClick={()=>download()} className="px-3 py-2 bg-blue-600 text-white rounded">Download CSV</button>
      </div>
    </div>
  );
};

export default ReportsPage;
