import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Branch } from '../types/school';
import { useAuth } from './AuthContext';
import fetchClient from '../lib/fetchClient';

interface BranchContextType {
  managedBranches: Branch[];
  currentBranch: Branch | null;
  setCurrentBranchById: (id: string) => void;
  refreshBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const useBranch = () => {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranch must be used within BranchProvider');
  return ctx;
};

interface Props { children: ReactNode }

export const BranchProvider: React.FC<Props> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [managedBranches, setManagedBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);

  const fetchManaged = async () => {
    // This check is important, but the useEffect dependency is the main gate
    if (!user || !isAuthenticated) return;
    try {
      const res = await fetchClient.get('/api/branches');
      // If the request was unauthorized, the fetchClient will redirect.
      // We still need to handle the case where the response is not ok for other reasons.
      if (!res.ok) {
          throw new Error('Failed to fetch branches');
      }
      const data = await res.json();
      if (!Array.isArray(data)) return;

      const assigned = data.filter((b: any) => {
        const mgr = b.manager || {};
        return mgr._id === user.id || mgr.id === user.id || mgr === user.id;
      });
      setManagedBranches(assigned);

      const saved = localStorage.getItem('managedCurrentBranchId');
      const find = assigned.find((b: any) => (b._id || b.id) === saved) || assigned[0] || null;
      setCurrentBranch(find);
      if (find) localStorage.setItem('managedCurrentBranchId', (find as any)._id || (find as any).id);
    } catch (err) {
      // Don't clear branches on a simple fetch error, could be temporary network issue
      console.error("Failed to fetch branches:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchManaged();
    } else {
      // If user logs out, clear all branch data
      setManagedBranches([]);
      setCurrentBranch(null);
      try {
        localStorage.removeItem('managedCurrentBranchId');
      } catch (e) {}
    }
    // re-fetch when user authentication status changes
  }, [isAuthenticated, user]); // also depend on user to re-fetch if user changes (e.g. admin impersonation)

  const setCurrentBranchById = (id: string) => {
    const found = managedBranches.find(b => (b as any)._id === id || (b as any).id === id) || null;
    setCurrentBranch(found);
    if (found) localStorage.setItem('managedCurrentBranchId', (found as any)._id || (found as any).id);
  };

  return (
    <BranchContext.Provider value={{ managedBranches, currentBranch, setCurrentBranchById, refreshBranches: fetchManaged }}>
      {children}
    </BranchContext.Provider>
  );
};
