import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Calendar, 
  Users, 
  Send, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Eye,
  Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { useUI } from '../../context/UIContext';
import { formatXAF } from '../../utils/currency';
import { 
  sendTuitionReminders, 
  getTuitionReminders,
  getStudentsTuitionRecords 
} from '../../api/tuitionManagement';
import { TuitionReminder, StudentTuitionRecord } from '../../types/tuition';

interface ReminderSettings {
  dueSoonDays: number; // Days before due date to send "due soon" reminder
  overdueGraceDays: number; // Days after due date before sending overdue reminder
  finalNoticeDays: number; // Days after overdue before final notice
  emailEnabled: boolean;
  smsEnabled: boolean;
  autoSendEnabled: boolean;
}

const TuitionReminderSystem: React.FC = () => {
  const { user } = useAuth();
  const { currentBranch } = useBranch();
  const { showToast } = useUI();
  
  const [overdueStudents, setOverdueStudents] = useState<StudentTuitionRecord[]>([]);
  const [dueSoonStudents, setDueSoonStudents] = useState<StudentTuitionRecord[]>([]);
  const [recentReminders, setRecentReminders] = useState<TuitionReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [reminderType, setReminderType] = useState<'due_soon' | 'overdue' | 'final_notice'>('overdue');
  
  const [settings, setSettings] = useState<ReminderSettings>({
    dueSoonDays: 7,
    overdueGraceDays: 3,
    finalNoticeDays: 14,
    emailEnabled: true,
    smsEnabled: false,
    autoSendEnabled: true
  });

  useEffect(() => {
    fetchReminderData();
  }, [currentBranch]);

  const fetchReminderData = async () => {
    try {
      setLoading(true);
      
      // Fetch overdue students
      const overdueResponse = await getStudentsTuitionRecords({
        status: 'Overdue',
        branch: currentBranch ? (currentBranch as any)._id : undefined,
        limit: 100
      });
      setOverdueStudents(overdueResponse.data);

      // Fetch students with payments due soon
      const dueSoonResponse = await getStudentsTuitionRecords({
        status: 'Pending',
        branch: currentBranch ? (currentBranch as any)._id : undefined,
        limit: 100
      });
      
      // Filter for due soon (within next 7 days)
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const dueSoon = dueSoonResponse.data.filter(record => {
        return record.installmentStatus.some(inst => {
          if (inst.status !== 'Pending' && inst.status !== 'Partial') return false;
          const dueDate = new Date(inst.dueDate);
          return dueDate >= now && dueDate <= sevenDaysFromNow;
        });
      });
      setDueSoonStudents(dueSoon);

    } catch (error: any) {
      showToast(error.message || 'Failed to load reminder data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendBulkReminders = async () => {
    if (selectedStudents.length === 0) {
      showToast('Please select students to send reminders to', 'warning');
      return;
    }

    try {
      setSending(true);
      let totalSent = 0;
      let totalFailed = 0;

      for (const studentId of selectedStudents) {
        try {
          const response = await sendTuitionReminders({
            studentId,
            reminderType
          });
          totalSent += response.data.sent;
          totalFailed += response.data.failed;
        } catch (error) {
          totalFailed++;
        }
      }

      showToast(`Sent ${totalSent} reminders successfully. ${totalFailed} failed.`, 'success');
      setSelectedStudents([]);
      fetchReminderData();
    } catch (error: any) {
      showToast(error.message || 'Failed to send reminders', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleSendIndividualReminder = async (studentId: string) => {
    try {
      const response = await sendTuitionReminders({
        studentId,
        reminderType: 'overdue'
      });

      showToast(`Reminder sent successfully`, 'success');
      fetchReminderData();
    } catch (error: any) {
      showToast(error.message || 'Failed to send reminder', 'error');
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllOverdue = () => {
    const allOverdueIds = overdueStudents.map(record => record.student._id);
    setSelectedStudents(prev => 
      prev.length === allOverdueIds.length 
        ? [] 
        : allOverdueIds
    );
  };

  const getNextDueInstallment = (record: StudentTuitionRecord) => {
    return record.installmentStatus.find(inst => 
      inst.status === 'Pending' || inst.status === 'Partial' || inst.status === 'Overdue'
    );
  };

  const getDaysOverdue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tuition Reminder System</h2>
          <p className="text-gray-600 mt-1">Automated email reminders for tuition payments</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <button
            onClick={handleSendBulkReminders}
            disabled={selectedStudents.length === 0 || sending}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>{sending ? 'Sending...' : `Send Reminders (${selectedStudents.length})`}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Overdue Payments</p>
              <p className="text-2xl font-bold text-gray-900">{overdueStudents.length}</p>
              <p className="text-xs text-red-600">Requires immediate attention</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Due Soon</p>
              <p className="text-2xl font-bold text-gray-900">{dueSoonStudents.length}</p>
              <p className="text-xs text-yellow-600">Next 7 days</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Reminders Sent</p>
              <p className="text-2xl font-bold text-gray-900">{recentReminders.length}</p>
              <p className="text-xs text-blue-600">This month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Auto Reminders</p>
              <p className="text-2xl font-bold text-gray-900">{settings.autoSendEnabled ? 'ON' : 'OFF'}</p>
              <p className="text-xs text-green-600">System status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Students */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Overdue Payments</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={selectAllOverdue}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {selectedStudents.length === overdueStudents.length ? 'Deselect All' : 'Select All'}
              </button>
              <select
                value={reminderType}
                onChange={(e) => setReminderType(e.target.value as any)}
                className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              >
                <option value="overdue">Overdue Notice</option>
                <option value="final_notice">Final Notice</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedStudents.length === overdueStudents.length && overdueStudents.length > 0}
                    onChange={selectAllOverdue}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overdue Installment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount Due
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Overdue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Reminder
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {overdueStudents.map((record) => {
                const overdueInstallment = record.installmentStatus.find(inst => inst.status === 'Overdue');
                if (!overdueInstallment) return null;

                const daysOverdue = getDaysOverdue(overdueInstallment.dueDate);

                return (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(record.student._id)}
                        onChange={() => toggleStudentSelection(record.student._id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-red-700">
                            {record.student.names.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.student.names}</div>
                          <div className="text-sm text-gray-500">ID: {record.student.studentId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{overdueInstallment.label}</div>
                      <div className="text-sm text-gray-500">
                        Due: {new Date(overdueInstallment.dueDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-red-600">
                        {formatXAF(overdueInstallment.remainingAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        daysOverdue > 30 ? 'bg-red-100 text-red-800' :
                        daysOverdue > 14 ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {daysOverdue} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {overdueInstallment.lastReminderDate 
                        ? new Date(overdueInstallment.lastReminderDate).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSendIndividualReminder(record.student._id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Send Reminder"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {overdueStudents.length === 0 && (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No overdue payments</h3>
            <p className="text-sm text-gray-500">All students are up to date with their payments.</p>
          </div>
        )}
      </div>

      {/* Due Soon Students */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Payments Due Soon (Next 7 Days)</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upcoming Installment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount Due
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Until Due
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dueSoonStudents.map((record) => {
                const nextDue = getNextDueInstallment(record);
                if (!nextDue) return null;

                const dueDate = new Date(nextDue.dueDate);
                const now = new Date();
                const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-yellow-700">
                            {record.student.names.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.student.names}</div>
                          <div className="text-sm text-gray-500">ID: {record.student.studentId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{nextDue.label}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-yellow-600">
                        {formatXAF(nextDue.remainingAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dueDate.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        daysUntilDue <= 3 ? 'bg-red-100 text-red-800' :
                        daysUntilDue <= 7 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {daysUntilDue} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => sendTuitionReminders({ 
                          studentId: record.student._id, 
                          reminderType: 'due_soon' 
                        })}
                        className="text-blue-600 hover:text-blue-900"
                        title="Send Due Soon Reminder"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {dueSoonStudents.length === 0 && (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No payments due soon</h3>
            <p className="text-sm text-gray-500">No payments are due in the next 7 days.</p>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Reminder Settings</h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Soon Alert (Days Before)
                  </label>
                  <input
                    type="number"
                    value={settings.dueSoonDays}
                    onChange={(e) => setSettings(prev => ({ ...prev, dueSoonDays: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overdue Grace Period (Days)
                  </label>
                  <input
                    type="number"
                    value={settings.overdueGraceDays}
                    onChange={(e) => setSettings(prev => ({ ...prev, overdueGraceDays: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="14"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Final Notice (Days After Overdue)
                  </label>
                  <input
                    type="number"
                    value={settings.finalNoticeDays}
                    onChange={(e) => setSettings(prev => ({ ...prev, finalNoticeDays: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="7"
                    max="60"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Email Reminders</label>
                  <input
                    type="checkbox"
                    checked={settings.emailEnabled}
                    onChange={(e) => setSettings(prev => ({ ...prev, emailEnabled: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">SMS Reminders</label>
                  <input
                    type="checkbox"
                    checked={settings.smsEnabled}
                    onChange={(e) => setSettings(prev => ({ ...prev, smsEnabled: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Automatic Sending</label>
                  <input
                    type="checkbox"
                    checked={settings.autoSendEnabled}
                    onChange={(e) => setSettings(prev => ({ ...prev, autoSendEnabled: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  showToast('Reminder settings updated', 'success');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TuitionReminderSystem;