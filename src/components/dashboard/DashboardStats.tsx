import React from 'react';
import { Users, BookOpen, DollarSign, BarChart3 } from 'lucide-react';

const DashboardStats: React.FC = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-500" />
                    <div className="ml-4">
                        <p className="text-lg font-semibold text-gray-800">Total Students</p>
                        <p className="text-2xl font-bold text-gray-900">1,234</p>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                    <BookOpen className="w-8 h-8 text-green-500" />
                    <div className="ml-4">
                        <p className="text-lg font-semibold text-gray-800">Total Courses</p>
                        <p className="text-2xl font-bold text-gray-900">56</p>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                    <DollarSign className="w-8 h-8 text-yellow-500" />
                    <div className="ml-4">
                        <p className="text-lg font-semibold text-gray-800">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">XAF 12,345,678</p>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                    <BarChart3 className="w-8 h-8 text-red-500" />
                    <div className="ml-4">
                        <p className="text-lg font-semibold text-gray-800">Total Expenses</p>
                        <p className="text-2xl font-bold text-gray-900">XAF 1,234,567</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardStats;
