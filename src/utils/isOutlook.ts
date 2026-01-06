/**
 * Utility functions to detect and interact with Outlook Add-in context
 * 
 * @module utils/isOutlook
 */

// Declare Office global for TypeScript (Office.js is loaded via script tag)
declare const Office: any;

/**
 * Checks if the app is running in Outlook Add-in context
 * 
 * @returns {boolean} True if running in Outlook, false otherwise
 */
export const isOutlook = (): boolean => {
  // Check if Office.js is available and we're in Outlook
  if (typeof Office !== 'undefined' && Office.context) {
    try {
      // Check if we're in Outlook specifically
      return Office.context.host === Office.HostType.Outlook;
    } catch (error) {
      // If we can't determine, assume not Outlook
      return false;
    }
  }
  return false;
};

/**
 * Gets the Office.js context if available
 * 
 * @returns {any | null} The Office context or null if not available
 */
export const getOutlookContext = (): any => {
  if (typeof Office !== 'undefined' && Office.context) {
    return Office.context;
  }
  return null;
};

