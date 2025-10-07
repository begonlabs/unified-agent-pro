import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Users } from 'lucide-react';
import { SectionStatus } from '../shared/SectionStatus';

interface AdvisorTabProps {
  advisorEnabled: boolean;
  advisorMessage: string;
  onAdvisorEnabledChange: (enabled: boolean) => void;
  onAdvisorMessageChange: (message: string) => void;
}

export const AdvisorTab: React.FC<AdvisorTabProps> = ({
  advisorEnabled,
  advisorMessage,
  onAdvisorEnabledChange,
  onAdvisorMessageChange
}) => {
  const isCompleted = advisorEnabled && !!advisorMessage.trim();

  return (
    <div className="space-y-4">
      <SectionStatus
        title="Estado: Asesor Humano"
        completed={isCompleted}
        icon={Users}
        iconColor="text-green-600"
      />
      
      <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          Configuración del Asesor Humano
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-0">
          <div>
            <h4 className="font-medium text-sm sm:text-base">Activar Asesor Humano</h4>
            <p className="text-xs sm:text-sm text-gray-500">
              Cuando la IA no pueda responder, derivar a un agente humano
            </p>
          </div>
          <Switch
            checked={advisorEnabled}
            onCheckedChange={onAdvisorEnabledChange}
          />
        </div>

        {advisorEnabled && (
          <div className="space-y-2">
            <Label htmlFor="advisor-message" className="text-sm sm:text-base">
              Mensaje de Derivación al Asesor
            </Label>
            <Textarea
              id="advisor-message"
              placeholder="Por favor, espere un momento mientras conecto con un agente humano para asistirle mejor."
              rows={4}
              value={advisorMessage}
              onChange={(e) => onAdvisorMessageChange(e.target.value)}
              className="text-sm sm:text-base"
            />
            <p className="text-xs sm:text-sm text-gray-500">
              Este mensaje se mostrará cuando la IA necesite derivar la conversación a un humano
            </p>
          </div>
        )}

        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2 text-sm sm:text-base">
            ¿Cuándo se activa el Asesor?
          </h4>
          <ul className="text-xs sm:text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Cuando el cliente solicita hablar con un humano</li>
            <li>Cuando la IA no puede resolver la consulta</li>
            <li>Cuando se detecta frustración en el cliente</li>
            <li>Para consultas complejas que requieren atención personalizada</li>
          </ul>
        </div>
      </CardContent>
      </Card>
    </div>
  );
};
