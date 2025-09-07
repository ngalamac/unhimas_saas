import React, { useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

interface Shortcut {
  key: string;
  description: string;
  category: string;
}

export const KeyboardShortcutsHelp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts: Shortcut[] = [
    { key: 'Ctrl + H', description: 'Go to Dashboard', category: 'Navigation' },
    { key: 'Ctrl + N', description: 'Add New Student', category: 'Students' },
    { key: 'Ctrl + S', description: 'View All Students', category: 'Students' },
    { key: 'Ctrl + T', description: 'Add Transaction', category: 'Accounting' },
    { key: 'Ctrl + R', description: 'View Reports', category: 'Accounting' },
    { key: 'Ctrl + U', description: 'User Management', category: 'Administration' },
    { key: 'Ctrl + /', description: 'Show this help', category: 'General' },
    { key: 'Esc', description: 'Close modals/dropdowns', category: 'General' },
    { key: 'Ctrl + K', description: 'Quick search', category: 'General' }
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        setIsOpen(true);
      }
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors z-40"
        title="Keyboard Shortcuts (Ctrl + /)"
      >
        <Keyboard className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Keyboard className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Keyboard Shortcuts</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {categories.map((category) => (
            <div key={category} className="mb-6 last:mb-0">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts
                  .filter(s => s.category === category)
                  .map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">{shortcut.description}</span>
                      <kbd className="px-3 py-1 text-xs font-mono bg-white border border-gray-300 rounded shadow-sm">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <p className="text-sm text-gray-600 text-center">
            Press <kbd className="px-2 py-1 text-xs font-mono bg-white border border-gray-300 rounded">Ctrl + /</kbd> anytime to open this help
          </p>
        </div>
      </div>
    </div>
  );
};