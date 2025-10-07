import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ModernStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  gradient?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan' | 'pink' | 'emerald';
  onClick?: () => void;
}

const gradientClasses = {
  blue: 'from-blue-500 via-blue-600 to-cyan-600',
  green: 'from-green-500 via-emerald-600 to-teal-600',
  purple: 'from-purple-500 via-purple-600 to-pink-600',
  orange: 'from-orange-500 via-red-500 to-pink-500',
  red: 'from-red-500 via-rose-600 to-pink-600',
  cyan: 'from-cyan-500 via-blue-600 to-indigo-600',
  pink: 'from-pink-500 via-rose-600 to-red-600',
  emerald: 'from-emerald-500 via-teal-600 to-cyan-600'
};

export const ModernStatsCard: React.FC<ModernStatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  gradient = 'blue',
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br ${gradientClasses[gradient]} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-2xl -ml-12 -mb-12"></div>

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 text-xs font-semibold px-2 py-1 rounded-full ${trend.isPositive ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
              <span>{trend.isPositive ? '↗' : '↘'}</span>
              <span>{trend.value}</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-medium opacity-90">{title}</h3>
          <p className="text-3xl font-bold text-white drop-shadow-lg">{value}</p>
          {subtitle && (
            <p className="text-xs opacity-80 mt-2">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};
