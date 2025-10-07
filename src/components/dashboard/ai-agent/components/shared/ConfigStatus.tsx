import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Target, Shield, Brain, Users, Clock, Lightbulb, CheckCircle2 } from 'lucide-react';
import { AIConfigStatus } from '../../types';

interface ConfigStatusProps {
  status: AIConfigStatus;
  completionPercentage: number;
}

export const ConfigStatus: React.FC<ConfigStatusProps> = ({
  status,
  completionPercentage
}) => {
  const [animatedItems, setAnimatedItems] = useState<Record<string, boolean>>({});

  // Detectar cambios y animar
  useEffect(() => {
    const newAnimated: Record<string, boolean> = {};
    Object.entries(status).forEach(([key, value]) => {
      if (value && !animatedItems[key]) {
        newAnimated[key] = true;
        // Remover animación después de 2 segundos
        setTimeout(() => {
          setAnimatedItems(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
          });
        }, 2000);
      }
    });
    
    if (Object.keys(newAnimated).length > 0) {
      setAnimatedItems(prev => ({ ...prev, ...newAnimated }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  
  const statusItems = [
    {
      key: 'goals',
      label: 'Objetivos configurados:',
      completed: status.goals,
      icon: Target,
      iconColor: 'text-blue-600'
    },
    {
      key: 'restrictions',
      label: 'Restricciones definidas:',
      completed: status.restrictions,
      icon: Shield,
      iconColor: 'text-red-600'
    },
    {
      key: 'knowledge_base',
      label: 'Base de conocimiento:',
      completed: status.knowledge_base,
      icon: Brain,
      iconColor: 'text-purple-600'
    },
    {
      key: 'advisor',
      label: 'Asesor humano:',
      completed: status.advisor,
      icon: Users,
      iconColor: 'text-green-600'
    },
    {
      key: 'schedule',
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
        {statusItems.map((item) => {
          const IconComponent = item.icon;
          const isAnimating = animatedItems[item.key];
          
          return (
            <div 
              key={item.key} 
              className={`flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 transition-all duration-300 ${
                isAnimating ? 'bg-green-50 scale-105 rounded p-2' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                {item.completed && isAnimating ? (
                  <CheckCircle2 className={`h-4 w-4 ${item.iconColor} animate-bounce`} />
                ) : (
                  <IconComponent className={`h-4 w-4 ${item.iconColor}`} />
                )}
                <span className={isAnimating ? 'font-semibold' : ''}>
                  {item.label}
                </span>
              </div>
              <Badge 
                variant={item.completed ? "default" : "secondary"} 
                className={`text-xs w-fit transition-all duration-300 ${
                  isAnimating ? 'bg-green-600 scale-110' : ''
                }`}
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
