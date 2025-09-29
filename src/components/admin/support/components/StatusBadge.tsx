import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { StatusBadgeProps } from '../types';
import { SupportService } from '../services/supportService';

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const variants = {
    open: { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'Abierto' },
    in_progress: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'En Progreso' },
    waiting_response: { color: 'bg-blue-100 text-blue-800', icon: Clock, text: 'Esperando Respuesta' },
    closed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Cerrado' }
  };
  
  const variant = variants[status] || variants.open;
  const Icon = variant.icon;
  
  return (
    <Badge className={variant.color}>
      <Icon className="w-3 h-3 mr-1" />
      {variant.text}
    </Badge>
  );
};
