import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle } from 'lucide-react';

interface SectionStatusProps {
  title: string;
  completed: boolean;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

export const SectionStatus: React.FC<SectionStatusProps> = ({
  title,
  completed,
  icon: Icon,
  iconColor
}) => {
  return (
    <div 
      className={`bg-gradient-to-r from-gray-50 to-gray-100 p-3 sm:p-4 rounded-lg border-2 transition-all duration-300 ${
        completed 
          ? 'border-green-500 bg-green-50' 
          : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          <h4 className="font-medium text-gray-800 text-sm sm:text-base">
            {title}
          </h4>
        </div>
        
        <Badge 
          variant={completed ? "default" : "secondary"}
          className="text-xs"
        >
          {completed ? (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Completado</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Circle className="h-3 w-3" />
              <span>Pendiente</span>
            </div>
          )}
        </Badge>
      </div>
      
      {completed && (
        <p className="text-xs text-green-700 mt-2">
          Esta sección está completa y lista para usar
        </p>
      )}
      
      {!completed && (
        <p className="text-xs text-gray-600 mt-2">
          Completa esta sección para mejorar el rendimiento de tu agente IA
        </p>
      )}
    </div>
  );
};

