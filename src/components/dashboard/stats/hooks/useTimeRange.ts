import { useState } from 'react';
import { TimeRange, DateRange } from '../types';

export const useTimeRange = (initialRange: TimeRange = '7d') => {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialRange);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const timeRangeOptions: TimeRange[] = ['24h', '7d', '30d', '90d', 'all', 'custom'];

  return {
    timeRange,
    setTimeRange,
    dateRange,
    setDateRange,
    timeRangeOptions
  };
};
