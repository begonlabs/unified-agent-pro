import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { ResponseTimeSlider } from '../shared/ResponseTimeSlider';
import { ConfigStatus } from '../shared/ConfigStatus';
import { AIConfigStatus } from '../../types';

interface SettingsTabProps {
  responseTime: number;
  isActive: boolean;
  configStatus: AIConfigStatus;
  completionPercentage: number;
  onResponseTimeChange: (time: number) => void;
  onActiveToggle: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  responseTime,
  isActive,
  configStatus,
  completionPercentage,
  onResponseTimeChange,
  onActiveToggle
}) => {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
          Configuración de Comportamiento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
        <div className="space-y-4">
          <ResponseTimeSlider 
            value={responseTime}
            onChange={onResponseTimeChange}
          />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-0">
            <div>
              <h4 className="font-medium text-sm sm:text-base">Estado del Agente</h4>
              <p className="text-xs sm:text-sm text-gray-500">
                Activar o desactivar respuestas automáticas
              </p>
            </div>
            <button
              onClick={onActiveToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <ConfigStatus 
            status={configStatus}
            completionPercentage={completionPercentage}
          />
        </div>
      </CardContent>
    </Card>
  );
};
