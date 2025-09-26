import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AIConfigStatus } from '../types';

interface ConfigStatusProps {
  status: AIConfigStatus;
  completionPercentage: number;
}

export const ConfigStatus: React.FC<ConfigStatusProps> = ({
  status,
  completionPercentage
}) => {
  const statusItems = [
    {
      label: 'Objetivos configurados:',
      completed: status.goals
    },
    {
      label: 'Restricciones definidas:',
      completed: status.restrictions
    },
    {
      label: 'Base de conocimiento:',
      completed: status.knowledge_base
    }
  ];

  return (
    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-800 text-sm sm:text-base">
          Estado de Entrenamiento:
        </h4>
        <Badge 
          variant={completionPercentage === 100 ? "default" : "secondary"}
          className="text-xs"
        >
          {completionPercentage}% Completo
        </Badge>
      </div>
      
      <div className="space-y-2 text-xs sm:text-sm">
        {statusItems.map((item, index) => (
          <div key={index} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
            <span>{item.label}</span>
            <Badge 
              variant={item.completed ? "default" : "secondary"} 
              className="text-xs w-fit"
            >
              {item.completed ? "Completado" : "Pendiente"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
};
