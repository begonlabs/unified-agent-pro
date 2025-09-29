import React from 'react';
import { Badge } from '@/components/ui/badge';
import { PriorityBadgeProps } from '../types';
import { SupportService } from '../services/supportService';

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const colors = {
    low: 'bg-gray-100 text-gray-800',
    normal: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };
  
  const texts = {
    low: 'Baja',
    normal: 'Normal',
    high: 'Alta',
    urgent: 'Urgente'
  };
  
  return (
    <Badge className={colors[priority] || colors.normal}>
      {texts[priority] || priority}
    </Badge>
  );
};
