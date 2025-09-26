import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Target } from 'lucide-react';
import { ExampleScenarios } from '../shared/ExampleScenarios';
import { ExampleScenario } from '../../types';

interface GoalsTabProps {
  goals: string;
  onGoalsChange: (goals: string) => void;
  onScenarioSelect: (scenario: ExampleScenario) => void;
}

const exampleScenarios: ExampleScenario[] = [
  {
    title: "Atención al Cliente E-commerce",
    goals: "Ayudar a los clientes con consultas sobre productos, pedidos, devoluciones y soporte técnico básico",
    restrictions: "No proporcionar información sobre otros competidores, no hacer promesas sobre envíos que no puedo cumplir"
  },
  {
    title: "Agencia Inmobiliaria",
    goals: "Calificar leads, programar visitas, proporcionar información básica sobre propiedades disponibles",
    restrictions: "No negociar precios sin autorización, no confirmar fechas sin verificar disponibilidad"
  },
  {
    title: "Restaurante",
    goals: "Tomar reservas, informar sobre el menú, responder horarios y ubicación",
    restrictions: "No confirmar disponibilidad de platos sin verificar con cocina, no tomar pedidos de delivery"
  }
];

export const GoalsTab: React.FC<GoalsTabProps> = ({
  goals,
  onGoalsChange,
  onScenarioSelect
}) => {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Target className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          ¿Qué quieres lograr con tu IA?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
        <div className="space-y-2">
          <Label htmlFor="goals" className="text-sm sm:text-base">
            Objetivos de tu Agente IA
          </Label>
          <Textarea
            id="goals"
            placeholder="Ejemplo: Quiero que mi IA ayude a los clientes con consultas sobre productos, tome pedidos básicos y programe citas..."
            rows={6}
            value={goals}
            onChange={(e) => onGoalsChange(e.target.value)}
            className="text-sm sm:text-base"
          />
        </div>
        
        <ExampleScenarios 
          scenarios={exampleScenarios}
          onScenarioSelect={onScenarioSelect}
        />
      </CardContent>
    </Card>
  );
};
