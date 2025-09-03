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
  const { user } = useAuth();
  const [managedBranches, setManagedBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);

  const fetchManaged = async () => {
    if (!user) return;
    try {
      const res = await fetchClient.get('/api/branches');
      const data = await res.json();
      if (!Array.isArray(data)) return;
      // filter branches where manager matches this user
      const assigned = data.filter((b: any) => {
        const mgr = b.manager || {};
        return mgr._id === user.id || mgr.id === user.id || mgr === user.id;
      });
      setManagedBranches(assigned);
      // try to restore last selected branch
      const saved = localStorage.getItem('managedCurrentBranchId');
      const find = assigned.find((b: any) => (b._id || b.id) === saved) || assigned[0] || null;
      setCurrentBranch(find);
      if (find) localStorage.setItem('managedCurrentBranchId', (find as any)._id || (find as any).id);
    } catch (err) {
      setManagedBranches([]);
      setCurrentBranch(null);
    }
  };

  useEffect(() => {
    fetchManaged();
    // re-fetch when user changes
  }, [user]);

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
