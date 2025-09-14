import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeView, setActiveView] = useState('Month');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Adjust for Monday start

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, 0 - (startingDayOfWeek - 1 - i));
      days.push({ date: prevMonthDay.getDate(), isCurrentMonth: false });
    }
    
    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: day, isCurrentMonth: true });
    }
    
    // Add empty cells for days after the last day of the month
    const remainingCells = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      days.push({ date: day, isCurrentMonth: false });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const isToday = (day: number, isCurrentMonth: boolean) => {
    return isCurrentMonth && 
           day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button 
            onClick={goToToday}
            className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
          >
            Today
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold">
            📅 {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          {['Month', 'Week', 'Day', 'List'].map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-3 py-1 text-sm rounded ${
                activeView === view
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {daysOfWeek.map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <div
            key={index}
            className={`p-3 h-20 border border-gray-100 ${
              day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
            } ${isToday(day.date, day.isCurrentMonth) ? 'bg-blue-50 border-blue-200' : ''}`}
          >
            <div className={`text-sm ${
              day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
            } ${isToday(day.date, day.isCurrentMonth) ? 'font-bold text-blue-600' : ''}`}>
              {day.date}
            </div>
          </div>
        ))}
      </div>

      {/* Birthday Section (placeholder) */}
      <div className="mt-6 space-y-4">
        {/* TODO: Backend endpoint to fetch birthdays for current day, e.g. /api/students/birthdays?day=YYYY-MM-DD */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="font-medium">Student Birthdays</span>
          </div>
          <span className="text-2xl font-bold text-orange-500">--</span>
        </div>
        <div className="text-xs text-gray-500 border-t pt-2">Pending implementation</div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="font-medium">Employee Birthdays</span>
          </div>
          <span className="text-2xl font-bold text-orange-500">--</span>
        </div>
        <div className="text-xs text-gray-500 border-t pt-2">Pending implementation</div>
      </div>
    </div>
  );
};