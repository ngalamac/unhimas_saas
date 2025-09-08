import React from 'react';

export const BackgroundPattern: React.FC = () => {
  return (
    <div className="absolute inset-0 opacity-10 overflow-hidden">
      <div className="absolute top-4 left-4 sm:top-10 sm:left-10 w-16 h-16 sm:w-32 sm:h-32 border-2 border-gray-400 rounded-lg transform rotate-12"></div>
      <div className="absolute top-8 right-8 sm:top-20 sm:right-20 w-12 h-12 sm:w-24 sm:h-24 border-2 border-gray-400 rounded-lg transform -rotate-12"></div>
      <div className="absolute bottom-16 left-8 sm:bottom-20 sm:left-20 w-14 h-14 sm:w-28 sm:h-28 border-2 border-gray-400 rounded-lg transform rotate-45"></div>
      <div className="absolute bottom-4 right-4 sm:bottom-10 sm:right-10 w-10 h-10 sm:w-20 sm:h-20 border-2 border-gray-400 rounded-lg transform -rotate-45"></div>
    </div>
  );
};