import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SubscriptionContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscriptionContext = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <SubscriptionContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
};
