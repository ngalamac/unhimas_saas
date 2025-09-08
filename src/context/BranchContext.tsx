import React, { createContext, useContext, useState, useEffect } from 'react';
import { getBranches } from '../api/branches'; // Assuming an API function to get branches
import { Branch } from '../types/school';

interface BranchContextType {
    branches: Branch[];
    currentBranch: Branch | null;
    setCurrentBranch: (branch: Branch | null) => void;
    loading: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const BranchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadBranches = async () => {
            try {
                const fetchedBranches = await getBranches();
                setBranches(fetchedBranches.data);
                if (fetchedBranches.data.length > 0) {
                    setCurrentBranch(fetchedBranches.data[0]);
                }
            } catch (err) {
                console.error("Failed to fetch branches", err);
            } finally {
                setLoading(false);
            }
        };
        loadBranches();
    }, []);

    return (
        <BranchContext.Provider value={{ branches, currentBranch, setCurrentBranch, loading }}>
            {children}
        </BranchContext.Provider>
    );
};

export const useBranch = () => {
    const context = useContext(BranchContext);
    if (context === undefined) {
        throw new Error('useBranch must be used within a BranchProvider');
    }
    return context;
};
