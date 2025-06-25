import React, { useState } from 'react';
import { GraduationCap, Plus, Edit, Trash2, Eye, Users, BookOpen } from 'lucide-react';
import { mockPrograms } from '../../../data/mockData';
import { Program } from '../../../types/school';

export const ProgramsPage: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>(mockPrograms);

  const getProgramTypeColor = (type: string) => {
    switch (type) {
      case 'HND': return 'bg-blue-100 text-blue-800';
      case 'Bachelor': return 'bg-green-100 text-green-800';
      case 'Masters': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Programs</h1>
          <p className="text-gray-600">Manage HND, Bachelor, and Masters programs</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add New Program</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Programs</p>
              <p className="text-xl font-bold text-gray-900">{programs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">HND Programs</p>
              <p className="text-xl font-bold text-gray-900">
                {programs.filter(p => p.type === 'HND').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Bachelor Programs</p>
              <p className="text-xl font-bold text-gray-900">
                {programs.filter(p => p.type === 'Bachelor').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Masters Programs</p>
              <p className="text-xl font-bold text-gray-900">
                {programs.filter(p => p.type === 'Masters').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((program) => (
          <div key={program.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getProgramTypeColor(program.type)}`}>
                      {program.type}
                    </span>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                {program.name}
              </h3>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium text-gray-900">{program.duration} years</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Semesters/Year:</span>
                  <span className="font-medium text-gray-900">{program.semestersPerYear}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Courses:</span>
                  <span className="font-medium text-gray-900">{program.courses.length}</span>
                </div>
              </div>

              {program.hod && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Head of Department</p>
                      <p className="text-sm font-medium text-gray-900">
                        {program.hod.firstName} {program.hod.lastName}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button className="text-blue-600 hover:text-blue-900">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="text-green-600 hover:text-green-900">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-900 font-medium flex items-center space-x-1">
                  <BookOpen className="w-3 h-3" />
                  <span>View Courses</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};