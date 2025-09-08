import React, { useState, useEffect } from 'react';
import { Shield, Users, Building2, ArrowRight, ExternalLink, Settings, Eye } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';

interface AccessLink {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  targetPage: string;
  breadcrumb: string[];
  requiredRole?: string[];
}

const RoleAccessBridge: React.FC = () => {
  const { setCurrentPage, setBreadcrumb } = useNavigation();
  const { user } = useAuth();
  const { currentBranch } = useBranch();

  const accessLinks: AccessLink[] = [
    {
      id: 'enhanced-roles',
      title: 'Enhanced Role Management',
      description: 'Comprehensive role and permission management with templates and matrix view',
      icon: <Shield className="w-6 h-6" />,
      color: 'bg-purple-100 text-purple-600',
      targetPage: 'enhanced-roles',
      breadcrumb: ['Roles & Access', 'Enhanced Management']
    },
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Create, edit, and manage user accounts across all branches',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-blue-100 text-blue-600',
      targetPage: 'user-management',
      breadcrumb: ['Roles & Access', 'User Management']
    },
    {
      id: 'branch-access',
      title: 'Branch Access Control',
      description: 'Manage branch-specific access and permissions',
      icon: <Building2 className="w-6 h-6" />,
      color: 'bg-green-100 text-green-600',
      targetPage: 'view-branches',
      breadcrumb: ['Branches', 'Access Control'],
      requiredRole: ['SuperAdmin', 'Admin']
    },
    {
      id: 'accounting-coordination',
      title: 'Accounting Coordination',
      description: 'Centralized financial management and cross-module coordination',
      icon: <Settings className="w-6 h-6" />,
      color: 'bg-orange-100 text-orange-600',
      targetPage: 'accounting-coordination',
      breadcrumb: ['Accounting', 'Coordination Center']
    },
    {
      id: 'system-settings',
      title: 'System Settings',
      description: 'Global system configuration and security settings',
      icon: <Settings className="w-6 h-6" />,
      color: 'bg-indigo-100 text-indigo-600',
      targetPage: 'settings',
      breadcrumb: ['Settings'],
      requiredRole: ['SuperAdmin']
    }
  ];

  const handleNavigation = (link: AccessLink) => {
    setCurrentPage(link.targetPage);
    setBreadcrumb(link.breadcrumb);
  };

  const canAccess = (link: AccessLink) => {
    if (!link.requiredRole) return true;
    return link.requiredRole.includes(user?.role || '');
  };

  const filteredLinks = accessLinks.filter(canAccess);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Role & Access Control</h2>
        <p className="text-gray-600 mt-2">Manage user roles, permissions, and system access</p>
        {currentBranch && (
          <p className="text-sm text-blue-600 mt-1">Current Branch: {(currentBranch as any).name}</p>
        )}
      </div>

      {/* Access Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => handleNavigation(link)}
            className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 text-left group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${link.color} group-hover:scale-110 transition-transform`}>
                  {link.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {link.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{link.description}</p>
                  <div className="mt-3 flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Access Module</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </button>
        ))}
      </div>

      {/* Current User Info */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold">Current User: {user?.firstName} {user?.lastName}</h4>
            <p className="text-gray-300 text-sm">Role: {user?.role}</p>
            <p className="text-gray-300 text-sm">
              Access Level: {user?.role === 'SuperAdmin' ? 'Full System Access' : 'Limited Access'}
            </p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Security Notice</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Role and permission changes require users to log out and log back in to take effect. 
              Always verify permissions after making changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleAccessBridge;