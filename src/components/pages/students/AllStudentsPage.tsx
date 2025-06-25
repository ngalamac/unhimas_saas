import React, { useState } from 'react';
import { Search, Filter, Eye, Edit, Trash2, Download, Plus, Users, UserPlus, Mail, Phone, CreditCard } from 'lucide-react';
import { mockStudents } from '../../../data/mockData';
import { Student } from '../../../types/school';

export const AllStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProgram = !filterProgram || student.program.type === filterProgram;
    const matchesStatus = !filterStatus || student.tuitionStatus === filterStatus;
    
    return matchesSearch && matchesProgram && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Partial': return 'bg-yellow-100 text-yellow-800';
      case 'Unpaid': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudentToDelete(studentId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (studentToDelete) {
      setStudents(prev => prev.filter(s => s.id !== studentToDelete));
      setShowDeleteModal(false);
      setStudentToDelete(null);
    }
  };

  const handleEditStudent = (student: Student) => {
    setStudentToEdit(student);
    setShowEditModal(true);
  };

  const handleBulkDelete = () => {
    setStudents(prev => prev.filter(s => !selectedStudents.includes(s.id)));
    setSelectedStudents([]);
  };

  const handleSendEmail = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    alert(`Sending email to ${student?.firstName} ${student?.lastName} at ${student?.email}`);
  };

  const handleSendSMS = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    alert(`Sending SMS to ${student?.firstName} ${student?.lastName} at ${student?.phoneNumber}`);
  };

  const handleViewPayments = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    alert(`Viewing payment history for ${student?.firstName} ${student?.lastName}`);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Students</h1>
          <p className="text-gray-600">Manage and view all registered students</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add New Student</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-xl font-bold text-gray-900">{students.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Fees Paid</p>
              <p className="text-xl font-bold text-gray-900">{students.filter(s => s.tuitionStatus === 'Paid').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Partial Payment</p>
              <p className="text-xl font-bold text-gray-900">{students.filter(s => s.tuitionStatus === 'Partial').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unpaid</p>
              <p className="text-xl font-bold text-gray-900">{students.filter(s => s.tuitionStatus === 'Unpaid').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Bulk Actions */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Programs</option>
            <option value="HND">HND</option>
            <option value="Bachelor">Bachelor</option>
            <option value="Masters">Masters</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
          </select>
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>More Filters</span>
          </button>
          <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <span>Bulk Import</span>
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedStudents.length > 0 && (
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-700">{selectedStudents.length} students selected</span>
            <button 
              onClick={handleBulkDelete}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Delete Selected
            </button>
            <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
              Send Email
            </button>
            <button className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700">
              Export Selected
            </button>
          </div>
        )}
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tuition Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleSelectStudent(student.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {student.firstName[0]}{student.lastName[0]}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                        <div className="text-xs text-gray-400">{student.studentId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.program.type}</div>
                    <div className="text-sm text-gray-500">{student.department.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Level {student.level}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.session}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.tuitionStatus)}`}>
                      {student.tuitionStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => alert(`Viewing details for ${student.firstName} ${student.lastName}`)}
                        className="text-blue-600 hover:text-blue-900" 
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditStudent(student)}
                        className="text-green-600 hover:text-green-900" 
                        title="Edit Student"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleSendEmail(student.id)}
                        className="text-purple-600 hover:text-purple-900" 
                        title="Send Email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleSendSMS(student.id)}
                        className="text-orange-600 hover:text-orange-900" 
                        title="Send SMS"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleViewPayments(student.id)}
                        className="text-indigo-600 hover:text-indigo-900" 
                        title="View Payments"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteStudent(student.id)}
                        className="text-red-600 hover:text-red-900" 
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing {filteredStudents.length} of {students.length} students
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">Previous</button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">1</button>
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">2</button>
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">Next</button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this student? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && studentToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Student</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    defaultValue={studentToEdit.firstName}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    defaultValue={studentToEdit.lastName}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue={studentToEdit.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    defaultValue={studentToEdit.phoneNumber}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                  <select
                    defaultValue={studentToEdit.level}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Level 1</option>
                    <option value={2}>Level 2</option>
                    <option value={3}>Level 3</option>
                    <option value={4}>Level 4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tuition Status</label>
                  <select
                    defaultValue={studentToEdit.tuitionStatus}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Student updated successfully!');
                  setShowEditModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};