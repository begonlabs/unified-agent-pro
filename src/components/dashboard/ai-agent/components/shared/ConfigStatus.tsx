import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Target, Shield, Brain, Users, Clock, Lightbulb } from 'lucide-react';
import { AIConfigStatus } from '../../types';

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
      completed: status.goals,
      icon: Target,
      iconColor: 'text-blue-600'
    },
    {
      label: 'Restricciones definidas:',
      completed: status.restrictions,
      icon: Shield,
      iconColor: 'text-red-600'
    },
    {
      label: 'Base de conocimiento:',
      completed: status.knowledge_base,
      icon: Brain,
      iconColor: 'text-purple-600'
    },
    {
      label: 'Asesor humano:',
      completed: status.advisor,
      icon: Users,
      iconColor: 'text-green-600'
    },
    {
      label: 'Horarios configurados:',
      completed: status.schedule,
      icon: Clock,
      iconColor: 'text-orange-600'
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
        {statusItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div key={index} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <div className="flex items-center gap-2">
                <IconComponent className={`h-4 w-4 ${item.iconColor}`} />
                <span>{item.label}</span>
              </div>
              <Badge 
                variant={item.completed ? "default" : "secondary"} 
                className="text-xs w-fit"
              >
                {item.completed ? "Completado" : "Pendiente"}
              </Badge>
            </div>
          );
        })}
      </div>
      
      {completionPercentage < 100 && (
        <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-blue-600" />
            <span><strong>Tip:</strong> Completa todos los pasos para obtener el mejor rendimiento de tu agente IA</span>
          </div>
        </div>
      )}
    </div>
  );
};
