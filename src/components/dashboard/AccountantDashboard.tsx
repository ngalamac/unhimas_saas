import React from 'react';
import { DollarSign, Clock, CheckCircle } from 'lucide-react';

const AccountantDashboard: React.FC = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Accountant Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center">
                        <DollarSign className="w-8 h-8 text-green-500" />
                        <div className="ml-4">
                            <p className="text-lg font-semibold text-gray-800">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">XAF 12,345,678</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center">
                        <Clock className="w-8 h-8 text-yellow-500" />
                        <div className="ml-4">
                            <p className="text-lg font-semibold text-gray-800">Pending Approvals</p>
                            <p className="text-2xl font-bold text-gray-900">12</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center">
                        <CheckCircle className="w-8 h-8 text-blue-500" />
                        <div className="ml-4">
                            <p className="text-lg font-semibold text-gray-800">Completed Transactions</p>
                            <p className="text-2xl font-bold text-gray-900">123</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountantDashboard;
