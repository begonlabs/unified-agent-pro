import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Clock } from 'lucide-react';
import { OperatingHours, DaySchedule } from '../../types';

interface ScheduleTabProps {
  alwaysActive: boolean;
  operatingHours: OperatingHours;
  onAlwaysActiveChange: (alwaysActive: boolean) => void;
  onOperatingHoursChange: (hours: OperatingHours) => void;
}

const DAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
] as const;

const TIME_OPTIONS = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00',
  '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00'
];

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  alwaysActive,
  operatingHours,
  onAlwaysActiveChange,
  onOperatingHoursChange
}) => {
  const updateDaySchedule = (day: keyof OperatingHours, updates: Partial<DaySchedule>) => {
    onOperatingHoursChange({
      ...operatingHours,
      [day]: { ...operatingHours[day], ...updates }
    });
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          Horarios de Funcionamiento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-0">
          <div>
            <h4 className="font-medium text-sm sm:text-base">Siempre Activo</h4>
            <p className="text-xs sm:text-sm text-gray-500">
              El agente responderá las 24 horas del día, todos los días
            </p>
          </div>
          <Switch
            checked={alwaysActive}
            onCheckedChange={onAlwaysActiveChange}
          />
        </div>

        {!alwaysActive && (
          <div className="space-y-4">
            <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2 text-sm sm:text-base">
                Configurar Horarios Específicos
              </h4>
              <p className="text-xs sm:text-sm text-yellow-700">
                Selecciona los días y horarios en los que el agente debe estar activo
              </p>
            </div>

            <div className="space-y-3">
              {DAYS.map(({ key, label }) => {
                const daySchedule = operatingHours[key];
                return (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg">
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <Switch
                        checked={daySchedule.enabled}
                        onCheckedChange={(enabled) => updateDaySchedule(key, { enabled })}
                      />
                      <Label className="text-sm font-medium">{label}</Label>
                    </div>
                    
                    {daySchedule.enabled && (
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex items-center gap-1">
                          <Label htmlFor={`${key}-start`} className="text-xs">Desde:</Label>
                          <select
                            id={`${key}-start`}
                            value={daySchedule.start}
                            onChange={(e) => updateDaySchedule(key, { start: e.target.value })}
                            className="text-xs border rounded px-2 py-1"
                          >
                            {TIME_OPTIONS.map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Label htmlFor={`${key}-end`} className="text-xs">Hasta:</Label>
                          <select
                            id={`${key}-end`}
                            value={daySchedule.end}
                            onChange={(e) => updateDaySchedule(key, { end: e.target.value })}
                            className="text-xs border rounded px-2 py-1"
                          >
                            {TIME_OPTIONS.map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2 text-sm sm:text-base">
            Comportamiento Fuera de Horario
          </h4>
          <p className="text-xs sm:text-sm text-green-700">
            Cuando el agente esté fuera de horario, puede configurar un mensaje automático 
            informando sobre los horarios de atención o derivando a un asesor humano.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
