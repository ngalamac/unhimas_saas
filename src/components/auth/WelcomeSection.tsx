import React from 'react';
import { Facebook, Twitter, Linkedin, Youtube, GraduationCap } from 'lucide-react';

export const WelcomeSection: React.FC = () => {
  return (
    <div className="lg:flex-1 bg-gradient-to-br from-purple-600 via-purple-500 to-red-500 p-6 sm:p-8 lg:p-12 text-white relative overflow-hidden">
      {/* Geometric pattern overlay */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-4 left-4 sm:top-10 sm:left-10 w-16 h-16 sm:w-32 sm:h-32 border border-white/30 transform rotate-45"></div>
          <div className="absolute top-8 right-4 sm:top-20 sm:right-10 w-12 h-12 sm:w-24 sm:h-24 border border-white/30 transform -rotate-12"></div>
          <div className="absolute bottom-12 left-8 sm:bottom-20 sm:left-20 w-14 h-14 sm:w-28 sm:h-28 border border-white/30 transform rotate-12"></div>
          <div className="absolute bottom-4 right-8 sm:bottom-10 sm:right-20 w-10 h-10 sm:w-20 sm:h-20 border border-white/30 transform -rotate-45"></div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center min-h-[200px] lg:min-h-[400px]">
          {/* Welcome message removed to prevent duplicate */}
        
        {/* Logo */}
        <div className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 bg-white/20 rounded-lg flex items-center justify-center mb-4 sm:mb-6 lg:mb-8 border-2 border-red-400">
          <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
        </div>

        <p className="text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 lg:mb-12 opacity-90 px-2">UNIVERSITY HIGHER INSTITUTE OF MANAGEMENT AND SCIENCE</p>

        {/* Social media icons */}
        <div className="flex space-x-2 sm:space-x-3 lg:space-x-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer">
            <Facebook className="w-5 h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-blue-400 rounded-lg flex items-center justify-center hover:bg-blue-500 transition-colors cursor-pointer">
            <Twitter className="w-5 h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-blue-700 rounded-lg flex items-center justify-center hover:bg-blue-800 transition-colors cursor-pointer">
            <Linkedin className="w-5 h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-red-600 rounded-lg flex items-center justify-center hover:bg-red-700 transition-colors cursor-pointer">
            <Youtube className="w-5 h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};