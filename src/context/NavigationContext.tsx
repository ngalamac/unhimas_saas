import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  breadcrumb: string[];
  setBreadcrumb: (breadcrumb: string[]) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [currentPage, setCurrentPageState] = useState(() => {
    return localStorage.getItem('currentPage') || 'dashboard';
  });
  const [breadcrumb, setBreadcrumbState] = useState(() => {
    const stored = localStorage.getItem('breadcrumb');
    return stored ? JSON.parse(stored) : ['Dashboard'];
  });

  const setCurrentPage = (page: string) => {
    setCurrentPageState(page);
    localStorage.setItem('currentPage', page);
  };

  const setBreadcrumb = (breadcrumbArr: string[]) => {
    setBreadcrumbState(breadcrumbArr);
    localStorage.setItem('breadcrumb', JSON.stringify(breadcrumbArr));
  };

  return (
    <NavigationContext.Provider value={{ currentPage, setCurrentPage, breadcrumb, setBreadcrumb }}>
      {children}
    </NavigationContext.Provider>
  );
};