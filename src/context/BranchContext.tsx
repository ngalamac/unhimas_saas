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
      // Restrict branch switching to SuperAdmin only
      const isSuper = (user as any)?.type === 'SuperAdmin' || (user as any)?.role === 'SuperAdmin' || (user as any)?.isSuperAdmin === true;
      const rawBranches = data;
      const filtered = isSuper
        ? rawBranches
        : rawBranches.filter((b: any) => String((b._id || b.id || '')) === String(((user as any)?.branch || '')));
      setManagedBranches(filtered);
      // try to restore last selected branch (SuperAdmin only). For others, force their assigned branch
      let find: any = null;
      if (isSuper) {
        const saved = localStorage.getItem('managedCurrentBranchId');
        find = filtered.find((b: any) => (b._id || b.id) === saved) || filtered[0] || null;
      } else {
        find = filtered[0] || null;
      }
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
