import React from 'react';
import { TrendingUp, CalendarIcon } from 'lucide-react';
import { TimeRange, DateRange } from '../types';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface StatsHeaderProps {
  userEmail: string;
  timeRange: TimeRange;
  timeRangeOptions: TimeRange[];
  onTimeRangeChange: (range: TimeRange) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({
  userEmail,
  timeRange,
  timeRangeOptions,
  onTimeRangeChange,
  dateRange,
  onDateRangeChange
}) => {
  const formatRange = (range: DateRange | undefined) => {
    if (!range?.from) return 'Seleccionar fechas';
    const formatter = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (!range.to) return formatter.format(range.from);
    return `${formatter.format(range.from)} - ${formatter.format(range.to)}`;
  };

  const isCustom = timeRange === 'custom';

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-r from-[#3a0caa] to-[#710db2] shrink-0">
          <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text mt-12 lg:mt-0 truncate">
          Estadísticas de {userEmail}
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {timeRangeOptions.map((range) => {
           let label = String(range);
           if (range === 'all') label = 'Historico';
           else if (range === 'custom') label = 'Personalizado';

           return (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-gradient-to-r from-[#3a0caa] to-[#710db2] text-white'
                  : 'bg-white text-gray-600 border hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
           );
        })}
        
        {isCustom && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal bg-white ml-2",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatRange(dateRange)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={{ from: dateRange?.from, to: dateRange?.to }}
                onSelect={(range: any) => onDateRangeChange(range)}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
};
