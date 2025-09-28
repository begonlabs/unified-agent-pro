import React from 'react';
import { TrendingUp } from 'lucide-react';
import { TimeRange } from '../types';

interface StatsHeaderProps {
  userEmail: string;
  timeRange: TimeRange;
  timeRangeOptions: TimeRange[];
  onTimeRangeChange: (range: TimeRange) => void;
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({
  userEmail,
  timeRange,
  timeRangeOptions,
  onTimeRangeChange
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-r from-[#3a0caa] to-[#710db2]">
        <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text mt-12 lg:mt-0">
        Estadísticas de {userEmail}
      </h1>
    </div>
    <div className="flex gap-2">
      {timeRangeOptions.map((range) => (
        <button
          key={range}
          onClick={() => onTimeRangeChange(range)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            timeRange === range
              ? 'bg-gradient-to-r from-[#3a0caa] to-[#710db2] text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          {range}
        </button>
      ))}
    </div>
  </div>
);
