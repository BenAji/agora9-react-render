/**
 * Outlook Calendar Service
 * 
 * Handles interactions with Outlook calendar API:
 * - Reading Outlook calendar context (selected date, visible range)
 * - Creating events in Outlook calendar
 * - Syncing calendar views
 * 
 * @module outlook/OutlookCalendarService
 */

import { CalendarEvent } from '../types/database';
import { isDevelopment } from '../config/environment';

// Declare Office global for TypeScript (Office.js is loaded via script tag)
declare const Office: any;

/**
 * Gets the currently selected date in Outlook calendar
 * 
 * @returns {Promise<Date | null>} Selected date or null if not available
 */
export const getSelectedDate = async (): Promise<Date | null> => {
  try {
    if (typeof Office === 'undefined' || !Office.context) {
      return null;
    }

    const mailbox = Office.context.mailbox;
    
    // Check if we're in a compose or read form
    if (mailbox.item) {
      // Try to get the start date from the current item
      if (mailbox.item.itemType === Office.MailboxEnums.ItemType.Appointment) {
        const appointment = mailbox.item as any;
        
        return new Promise<Date | null>((resolve, reject) => {
          appointment.start.getAsync((result: any) => {
            if (result.status === Office.AsyncResultStatus.Succeeded) {
              resolve(result.value);
            } else {
              if (isDevelopment()) {
                console.warn('AGORA: Could not get appointment start date', result.error);
              }
              resolve(null);
            }
          });
        });
      }
    }

    // If not in an appointment context, return today's date
    // In future, we could use calendar view API to get selected date
    return new Date();
  } catch (error) {
    if (isDevelopment()) {
      console.error('AGORA: Error getting selected date from Outlook', error);
    }
    return null;
  }
};

/**
 * Gets the visible date range from Outlook calendar view
 * 
 * @returns {Promise<{start: Date, end: Date} | null>} Visible date range or null
 */
export const getVisibleDateRange = async (): Promise<{ start: Date; end: Date } | null> => {
  try {
    if (typeof Office === 'undefined' || !Office.context) {
      return null;
    }

    // Outlook calendar view API is limited
    // For now, return a default range (current week)
    // In future versions, we can use more advanced APIs
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);

    return { start: startOfWeek, end: endOfWeek };
  } catch (error) {
    if (isDevelopment()) {
      console.error('AGORA: Error getting visible date range from Outlook', error);
    }
    return null;
  }
};

/**
 * Creates an Outlook appointment from an AGORA event
 * 
 * @param {CalendarEvent} event - The AGORA calendar event to add to Outlook
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const createOutlookEvent = async (event: CalendarEvent): Promise<boolean> => {
  try {
    if (typeof Office === 'undefined' || !Office.context) {
      if (isDevelopment()) {
        console.warn('AGORA: Office.js not available, cannot create Outlook event');
      }
      return false;
    }

    const mailbox = Office.context.mailbox;
    
    // Check if we have compose permissions
    if (!mailbox.item) {
      if (isDevelopment()) {
        console.warn('AGORA: No mailbox item available for creating appointment');
      }
      return false;
    }

    // Create a new appointment compose form
    // Note: This requires the add-in to be in compose mode or use displayNewAppointmentForm
    return new Promise<boolean>((resolve) => {
      try {
        // Format event details for Outlook
        const subject = event.title;
        const startTime = event.start_date;
        const endTime = event.end_date;
        
        // Build body with event details
        let body = event.description || '';
        
        // Add location information
        if (event.location_type === 'physical' && event.parsed_location?.displayText) {
          body += `\n\nLocation: ${event.parsed_location.displayText}`;
        } else if (event.location_type === 'virtual' && event.parsed_location?.meetingUrl) {
          body += `\n\nVirtual Meeting: ${event.parsed_location.meetingUrl}`;
        } else if (event.location_type === 'hybrid') {
          body += `\n\nHybrid Event`;
          if (event.parsed_location?.displayText) {
            body += `\nPhysical Location: ${event.parsed_location.displayText}`;
          }
          if (event.parsed_location?.meetingUrl) {
            body += `\nVirtual Link: ${event.parsed_location.meetingUrl}`;
          }
        }

        // Add company information
        if (event.companies && event.companies.length > 0) {
          const companyNames = event.companies.map(c => c.company_name).join(', ');
          body += `\n\nCompanies: ${companyNames}`;
        }

        // Add event type
        if (event.event_type) {
          body += `\n\nEvent Type: ${event.event_type}`;
        }

        // Use displayNewAppointmentForm to create appointment
        // This opens Outlook's compose form with pre-filled data
        Office.context.mailbox.displayNewAppointmentForm({
          requiredAttendees: [],
          optionalAttendees: [],
          resources: [],
          start: startTime,
          end: endTime,
          subject: subject,
          body: body,
        });

        if (isDevelopment()) {
          console.log('AGORA: Outlook appointment form opened', { subject, startTime, endTime });
        }

        resolve(true);
      } catch (error) {
        if (isDevelopment()) {
          console.error('AGORA: Error creating Outlook event', error);
        }
        resolve(false);
      }
    });
  } catch (error) {
    if (isDevelopment()) {
      console.error('AGORA: Error in createOutlookEvent', error);
    }
    return false;
  }
};

/**
 * Checks if Outlook calendar API is available
 * 
 * @returns {boolean} True if Outlook calendar features are available
 */
export const isOutlookCalendarAvailable = (): boolean => {
  try {
    return (
      typeof Office !== 'undefined' &&
      Office.context !== null &&
      Office.context.mailbox !== null
    );
  } catch {
    return false;
  }
};

/**
 * Formats an AGORA event for Outlook appointment
 * 
 * @param {CalendarEvent} event - AGORA event
 * @returns {object} Formatted appointment data
 */
export const formatEventForOutlook = (event: CalendarEvent) => {
  // Build location string
  let location = '';
  if (event.location_type === 'physical' && event.parsed_location?.displayText) {
    location = event.parsed_location.displayText;
  } else if (event.location_type === 'virtual' && event.parsed_location?.meetingUrl) {
    location = `Virtual: ${event.parsed_location.meetingUrl}`;
  } else if (event.location_type === 'hybrid') {
    const parts: string[] = [];
    if (event.parsed_location?.displayText) {
      parts.push(event.parsed_location.displayText);
    }
    if (event.parsed_location?.meetingUrl) {
      parts.push(`Virtual: ${event.parsed_location.meetingUrl}`);
    }
    location = parts.join(' | ');
  }

  // Build body content
  let body = event.description || '';
  
  if (event.companies && event.companies.length > 0) {
    const companyInfo = event.companies
      .map(c => `${c.company_name} (${c.ticker_symbol})`)
      .join(', ');
    body += `\n\nCompanies: ${companyInfo}`;
  }

  if (event.event_type) {
    body += `\n\nEvent Type: ${event.event_type}`;
  }

  return {
    subject: event.title,
    start: event.start_date,
    end: event.end_date,
    location: location,
    body: body,
  };
};

