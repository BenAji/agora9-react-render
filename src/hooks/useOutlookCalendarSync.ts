/**
 * Hook to sync AGORA calendar view with Outlook calendar
 * 
 * Reads Outlook calendar context and syncs AGORA calendar view accordingly
 * 
 * @module hooks/useOutlookCalendarSync
 */

import { useEffect, useState } from 'react';
import { useOfficeContext } from '../outlook/OfficeContext';
import { getSelectedDate, getVisibleDateRange } from '../outlook/OutlookCalendarService';
import { isDevelopment } from '../config/environment';

interface UseOutlookCalendarSyncOptions {
  onDateChange?: (date: Date) => void;
  onDateRangeChange?: (range: { start: Date; end: Date }) => void;
  syncInterval?: number; // milliseconds, default 5000
}

/**
 * Hook to sync AGORA calendar with Outlook calendar context
 * 
 * @param {UseOutlookCalendarSyncOptions} options - Sync options
 * @returns {object} Sync state and controls
 */
export const useOutlookCalendarSync = (options: UseOutlookCalendarSyncOptions = {}) => {
  const { isOutlook, isInitialized } = useOfficeContext();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [visibleRange, setVisibleRange] = useState<{ start: Date; end: Date } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const {
    onDateChange,
    onDateRangeChange,
    syncInterval = 5000, // Default: sync every 5 seconds
  } = options;

  // Sync with Outlook calendar
  const syncWithOutlook = async () => {
    if (!isOutlook || !isInitialized) {
      return;
    }

    setIsSyncing(true);
    try {
      // Get selected date from Outlook
      const outlookDate = await getSelectedDate();
      if (outlookDate && (!selectedDate || outlookDate.getTime() !== selectedDate.getTime())) {
        setSelectedDate(outlookDate);
        onDateChange?.(outlookDate);
      }

      // Get visible date range from Outlook
      const range = await getVisibleDateRange();
      if (range) {
        setVisibleRange(range);
        onDateRangeChange?.(range);
      }
    } catch (error) {
      if (isDevelopment()) {
        console.error('AGORA: Error syncing with Outlook calendar', error);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Initial sync when Outlook is detected
  useEffect(() => {
    if (isOutlook && isInitialized) {
      syncWithOutlook();
    }
  }, [isOutlook, isInitialized]);

  // Periodic sync (only when in Outlook)
  useEffect(() => {
    if (!isOutlook || !isInitialized) {
      return;
    }

    const intervalId = setInterval(() => {
      syncWithOutlook();
    }, syncInterval);

    return () => clearInterval(intervalId);
  }, [isOutlook, isInitialized, syncInterval]);

  return {
    selectedDate,
    visibleRange,
    isSyncing,
    syncWithOutlook,
    isOutlook,
  };
};

