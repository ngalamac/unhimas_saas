import { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import useSSE from '../../lib/useSSE';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Wire SSE to backend via centralized helper
  useSSE('/api/events', {
    'student.created': (data: any) => {
      addNotification({
        id: `student-${data.id}`,
        title: 'New Student Registered',
        message: `Student ${data.student?.names || 'Unknown'} has been registered`,
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false,
      });
    },
    'student.tuition.paid': (data: any) => {
      addNotification({
        id: `payment-${data.tx._id}`,
        title: 'Payment Received',
        message: `Payment of ${data.tx.amount} XAF received`,
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false,
      });
    },
    'accounting.transaction.created': (data: any) => {
      addNotification({
        id: `transaction-${data.transaction._id}`,
        title: 'New Transaction',
        message: `${data.transaction.type} transaction: ${data.transaction.category}`,
        type: 'info',
        timestamp: new Date().toISOString(),
        read: false,
      });
    },
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      // For now, use mock data. Replace with real API call when available
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'System Backup Complete',
          message: 'Daily system backup completed successfully at 3:00 AM',
          type: 'success',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: true
        },
        {
          id: '2',
          title: 'Low Disk Space Warning',
          message: 'Server disk space is running low (85% used)',
          type: 'warning',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          read: false,
          actionUrl: '/settings',
          actionLabel: 'View Settings'
        }
      ];
      
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
  }
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep only latest 50
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'info': return <Info className="w-5 h-5 text-blue-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return { notifications, markAsRead, markAllAsRead, deleteNotification, getNotificationIcon, getNotificationColor, formatTimestamp };
};