import { useState } from 'react';
import { TimeRange } from '../types';

export const useTimeRange = (initialRange: TimeRange = '7d') => {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialRange);

  const timeRangeOptions: TimeRange[] = ['24h', '7d', '30d', '90d'];

  return {
    timeRange,
    setTimeRange,
    timeRangeOptions
  };
};
