import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Shield } from 'lucide-react';
import { SectionStatus } from '../shared/SectionStatus';

interface RestrictionsTabProps {
  restrictions: string;
  onRestrictionsChange: (restrictions: string) => void;
}

export const RestrictionsTab: React.FC<RestrictionsTabProps> = ({
  restrictions,
  onRestrictionsChange
}) => {
  const isCompleted = !!restrictions.trim();

  return (
    <div className="space-y-4">
      <SectionStatus
        title="Estado: Restricciones"
        completed={isCompleted}
        icon={Shield}
        iconColor="text-red-600"
      />
      
      <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
          ¿Qué NO quieres que haga tu IA?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
        <div className="space-y-2">
          <Label htmlFor="restrictions" className="text-sm sm:text-base">
            Restricciones y Límites
          </Label>
          <Textarea
            id="restrictions"
            placeholder="Ejemplo: No responder preguntas personales, no dar información de otros competidores, no confirmar precios sin autorización..."
            rows={6}
            value={restrictions}
            onChange={(e) => onRestrictionsChange(e.target.value)}
            className="text-sm sm:text-base"
          />
        </div>

        <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2 text-sm sm:text-base">
            Restricciones Recomendadas:
          </h4>
          <ul className="text-xs sm:text-sm text-yellow-700 space-y-1 list-disc list-inside">
            <li>No compartir información confidencial de la empresa</li>
            <li>No hacer promesas que no se pueden cumplir</li>
            <li>No responder temas políticos o controvertidos</li>
            <li>No intentar diagnosticar problemas médicos o legales</li>
            <li>Derivar consultas complejas a un humano</li>
          </ul>
        </div>
      </CardContent>
      </Card>
    </div>
  );
};
