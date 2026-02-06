import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StatCardProps } from '../types';
import { GeneralStatsService } from '../services/generalStatsService';

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-muted-foreground',
  showPercentage = false,
  totalValue
}) => {
  const displayValue = typeof value === 'number' ? GeneralStatsService.formatNumber(value) : value;
  const percentage = showPercentage && totalValue ? GeneralStatsService.calculatePercentage(value as number, totalValue) : null;

  return (
    <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 group bg-gradient-to-br from-white to-gray-50/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg bg-white shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          {percentage !== null && (
            <div className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-wider">
              {percentage}%
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-tight">{title}</p>
          <div className="text-3xl font-bold tracking-tighter text-[#1A1A1A]">{displayValue}</div>
          <p className="text-xs text-muted-foreground/80 font-medium">
            {percentage !== null ? `De un total de ${GeneralStatsService.formatNumber(totalValue || 0)}` : description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
