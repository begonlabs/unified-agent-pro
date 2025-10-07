import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare } from 'lucide-react';
import { SectionStatus } from '../shared/SectionStatus';

interface FAQTabProps {
  faq: string;
  onFAQChange: (faq: string) => void;
}

export const FAQTab: React.FC<FAQTabProps> = ({
  faq,
  onFAQChange
}) => {
  const isCompleted = !!faq.trim();

  return (
    <div className="space-y-4">
      <SectionStatus
        title="Estado: FAQs"
        completed={isCompleted}
        icon={MessageSquare}
        iconColor="text-green-600"
      />
      
      <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          Respuestas Predefinidas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
        <div className="space-y-2">
          <Label htmlFor="faq" className="text-sm sm:text-base">
            Respuestas Frecuentes Personalizadas
          </Label>
          <Textarea
            id="faq"
            placeholder="Formato: Pregunta: ¿Cuáles son sus horarios?&#10;Respuesta: Estamos abiertos de lunes a viernes de 9:00 AM a 6:00 PM.&#10;&#10;Pregunta: ¿Hacen envíos?&#10;Respuesta: Sí, hacemos envíos a todo el país. El tiempo de entrega es de 2-3 días hábiles."
            rows={10}
            value={faq}
            onChange={(e) => onFAQChange(e.target.value)}
            className="text-sm sm:text-base"
          />
        </div>

        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2 text-sm sm:text-base">
            Formato Recomendado:
          </h4>
          <pre className="text-xs sm:text-sm text-blue-700 whitespace-pre-wrap overflow-x-auto">
{`Pregunta: ¿Cuáles son sus horarios?
Respuesta: Estamos abiertos de lunes a viernes de 9:00 AM a 6:00 PM.

Pregunta: ¿Hacen envíos?
Respuesta: Sí, hacemos envíos a todo el país.`}
          </pre>
        </div>
      </CardContent>
      </Card>
    </div>
  );
};
