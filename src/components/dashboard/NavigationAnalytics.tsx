import React, { useState, useEffect } from 'react';
import { BarChart3, Eye, Clock, TrendingUp } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';

interface PageVisit {
  page: string;
  timestamp: string;
  duration?: number;
}

interface NavigationAnalytics {
  mostVisitedPages: Array<{ page: string; visits: number; label: string }>;
  averageSessionTime: number;
  totalPageViews: number;
  userBehavior: {
    preferredStartPage: string;
    commonPaths: Array<{ path: string[]; frequency: number }>;
  };
}

export const NavigationAnalytics: React.FC = () => {
  const { currentPage } = useNavigation();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<NavigationAnalytics | null>(null);
  const [pageVisits, setPageVisits] = useState<PageVisit[]>([]);

  useEffect(() => {
    // Load stored analytics
    const stored = localStorage.getItem('navigationAnalytics');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setPageVisits(data.visits || []);
        calculateAnalytics(data.visits || []);
      } catch (e) {
        console.error('Failed to parse navigation analytics');
      }
    }
  }, []);

  useEffect(() => {
    // Track page visit
    if (currentPage) {
      const visit: PageVisit = {
        page: currentPage,
        timestamp: new Date().toISOString()
      };

      setPageVisits(prev => {
        const updated = [visit, ...prev].slice(0, 1000); // Keep last 1000 visits
        localStorage.setItem('navigationAnalytics', JSON.stringify({ visits: updated }));
        calculateAnalytics(updated);
        return updated;
      });
    }
  }, [currentPage]);

  const calculateAnalytics = (visits: PageVisit[]) => {
    if (visits.length === 0) return;

    // Count page visits
    const pageCounts: Record<string, number> = {};
    visits.forEach(visit => {
      pageCounts[visit.page] = (pageCounts[visit.page] || 0) + 1;
    });

    // Get page labels
    const pageLabels: Record<string, string> = {
      'dashboard': 'Dashboard',
      'all-students': 'All Students',
      'student-registration': 'Register Student',
      'tuition-management': 'Tuition Management',
      'accounting-overview': 'Accounting Dashboard',
      'transactions': 'Transactions',
      'staff-management': 'Staff Directory',
      'enhanced-roles': 'Role Management',
      'view-branches': 'Branches',
      'reports': 'Financial Reports'
    };

    const mostVisited = Object.entries(pageCounts)
      .map(([page, visits]) => ({ 
        page, 
        visits, 
        label: pageLabels[page] || page 
      }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5);

    // Calculate session metrics
    const totalViews = visits.length;
    const sessionStart = visits[visits.length - 1]?.timestamp;
    const sessionEnd = visits[0]?.timestamp;
    const sessionDuration = sessionStart && sessionEnd 
      ? (new Date(sessionEnd).getTime() - new Date(sessionStart).getTime()) / 1000 / 60
      : 0;

    setAnalytics({
      mostVisitedPages: mostVisited,
      averageSessionTime: sessionDuration,
      totalPageViews: totalViews,
      userBehavior: {
        preferredStartPage: mostVisited[0]?.page || 'dashboard',
        commonPaths: [] // Could be calculated from visit sequences
      }
    });
  };

  return analytics;
};

// Hook to use navigation analytics
export const useNavigationAnalytics = () => {
  return NavigationAnalytics();
};