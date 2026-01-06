/**
 * Outlook Layout Wrapper Component
 * 
 * Provides a compact layout optimized for Outlook Task Pane.
 * Hides navigation elements and adjusts styling for narrow Task Pane width.
 * 
 * @module components/OutlookLayout
 */

import React, { ReactNode } from 'react';
import { useOfficeContext } from '../outlook/OfficeContext';

interface OutlookLayoutProps {
  children: ReactNode;
}

/**
 * Wrapper component that provides Outlook-optimized layout
 * Only renders when running in Outlook context
 */
export const OutlookLayout: React.FC<OutlookLayoutProps> = ({ children }) => {
  const { isOutlook, isInitialized } = useOfficeContext();

  // Only apply Outlook-specific styling when in Outlook
  if (!isInitialized || !isOutlook) {
    return <>{children}</>;
  }

  return (
    <div 
      className="outlook-layout"
      style={{
        width: '100%',
        height: '100vh',
        overflow: 'auto',
        backgroundColor: 'var(--primary-bg, #000)',
        padding: '0',
        margin: '0',
      }}
    >
      {children}
    </div>
  );
};

/**
 * Conditional wrapper that hides content when NOT in Outlook
 * Useful for hiding elements that should only show in regular web app
 */
export const HideInOutlook: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isOutlook, isInitialized } = useOfficeContext();
  
  // Hide if we're in Outlook (or if still initializing and might be Outlook)
  if (isInitialized && isOutlook) {
    return null;
  }
  
  return <>{children}</>;
};

/**
 * Conditional wrapper that only shows content when in Outlook
 * Useful for Outlook-specific UI elements
 */
export const ShowInOutlook: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isOutlook, isInitialized } = useOfficeContext();
  
  // Only show if we're definitely in Outlook
  if (isInitialized && isOutlook) {
    return <>{children}</>;
  }
  
  return null;
};

