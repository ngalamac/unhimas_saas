import React, { useEffect, useState } from 'react';

interface Branch {
  _id: string;
  name: string;
}

interface Props {
  userId: string;
}

const BranchWelcomeSwitcher: React.FC<Props> = ({ userId }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranch, setActiveBranch] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Fetch branches for user
    const fetchBranches = async () => {
      try {
        const res = await fetch(`/api/users/${userId}/branches`);
        if (!res.ok) {
          setBranches([]);
          setMessage('Failed to fetch branches');
          return;
        }
        const data = await res.json();
        setBranches(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) setActiveBranch(data[0]._id);
      } catch {
        setBranches([]);
        setMessage('Network error fetching branches');
      }
    };
    fetchBranches();
  }, [userId]);

  const handleSwitchBranch = async (branchId: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/users/${userId}/switch-branch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveBranch(branchId);
        setMessage('Switched to branch successfully!');
      } else {
        setMessage(data.error || 'Failed to switch branch');
      }
    } catch {
      setMessage('Network error');
    }
    setLoading(false);
  };

  const activeBranchObj = branches.find(b => b._id === activeBranch);

  return (
  <div className="mb-6 p-4 bg-blue-50 dark:bg-darkbg/60 rounded-lg">
      <div className="text-lg font-semibold text-blue-900 dark:text-white">
        Welcome{activeBranchObj ? ` to ${activeBranchObj.name}` : ''}!
      </div>
     
      {branches.length > 1 && (
        <div className="mt-2">
          <label className="mr-2 text-blue-700 dark:text-blue-300 font-medium">Switch Branch:</label>
          <select
            value={activeBranch}
            onChange={e => handleSwitchBranch(e.target.value)}
            disabled={loading}
            className="px-2 py-1 rounded border border-blue-300 dark:bg-darkbg dark:text-white dark:border-blue-700"
          >
            {branches.map(branch => (
              <option key={branch._id} value={branch._id}>{branch.name}</option>
            ))}
          </select>
        </div>
      )}
      {message && (
        <div className={`mt-2 p-2 rounded ${message.includes('success') ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default BranchWelcomeSwitcher;
