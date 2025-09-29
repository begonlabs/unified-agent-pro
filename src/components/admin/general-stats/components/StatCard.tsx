import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{displayValue}</div>
        <p className="text-xs text-muted-foreground">
          {percentage !== null ? `${percentage}% del total` : description}
        </p>
      </CardContent>
    </Card>
  );
};
