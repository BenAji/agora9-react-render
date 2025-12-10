/**
 * Office.js Context Provider for Outlook Add-in
 * 
 * Wraps the app to provide Office.js context and handle initialization.
 * Detects if running in Outlook environment and provides Office.js API access.
 * 
 * @module outlook/OfficeContext
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { isDevelopment } from '../config/environment';

// Declare Office global for TypeScript (Office.js is loaded via script tag)
declare const Office: any;

interface OfficeContextType {
  isInitialized: boolean;
  isOutlook: boolean;
  officeContext: any;
  error: string | null;
}

const OfficeContext = createContext<OfficeContextType>({
  isInitialized: false,
  isOutlook: false,
  officeContext: null,
  error: null,
});

interface OfficeContextProviderProps {
  children: ReactNode;
}

export const OfficeContextProvider: React.FC<OfficeContextProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOutlook, setIsOutlook] = useState(false);
  const [officeContext, setOfficeContext] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Office.js is available
    if (typeof Office === 'undefined') {
      // Not running in Office context - this is fine for regular web app
      setIsInitialized(true);
      setIsOutlook(false);
      setOfficeContext(null);
      return;
    }

    // Initialize Office.js
    Office.onReady((info: any) => {
      try {
        const isOutlookHost = info.host === Office.HostType.Outlook;
        
        setIsInitialized(true);
        setIsOutlook(isOutlookHost);
        setOfficeContext(Office);
        setError(null);

        // Only log in development mode
        if (isDevelopment()) {
          console.log('AGORA: Office.js initialized', {
            host: info.host,
            platform: info.platform,
            isOutlook: isOutlookHost,
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setIsInitialized(true);
        
        // Always log errors, but format appropriately
        if (isDevelopment()) {
          console.error('AGORA: Office.js initialization error', err);
        } else {
          console.error('AGORA: Office.js initialization failed');
        }
      }
    });
  }, []);

  return (
    <OfficeContext.Provider
      value={{
        isInitialized,
        isOutlook,
        officeContext,
        error,
      }}
    >
      {children}
    </OfficeContext.Provider>
  );
};

export const useOfficeContext = (): OfficeContextType => {
  const context = useContext(OfficeContext);
  if (!context) {
    throw new Error('useOfficeContext must be used within OfficeContextProvider');
  }
  return context;
};
