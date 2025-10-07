import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  ShoppingCart,
  Heart,
  DollarSign,
  Home,
  GraduationCap,
  Plane,
  Car,
  Briefcase,
  Laptop,
  Building2,
  UtensilsCrossed,
  Dumbbell,
  Scale,
  HandHeart,
  Film,
  LucideIcon
} from 'lucide-react';
import { ExampleScenario } from '../../types';

// Mapa de iconos para renderizar dinámicamente
const iconMap: Record<string, LucideIcon> = {
  ShoppingCart,
  Heart,
  DollarSign,
  Home,
  GraduationCap,
  Plane,
  Car,
  Briefcase,
  Laptop,
  Building2,
  UtensilsCrossed,
  Dumbbell,
  Scale,
  HandHeart,
  Film
};

interface ExampleScenariosProps {
  scenarios: ExampleScenario[];
  onScenarioSelect: (scenario: ExampleScenario) => void;
}

export const ExampleScenarios: React.FC<ExampleScenariosProps> = ({
  scenarios,
  onScenarioSelect
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedScenarios = isExpanded ? scenarios : scenarios.slice(0, 6);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h4 className="font-semibold text-gray-800 text-sm sm:text-base">
            Plantillas por Industria
          </h4>
          <Badge variant="secondary" className="text-xs">
            {scenarios.length} disponibles
          </Badge>
        </div>
      </div>
      
      <p className="text-xs sm:text-sm text-gray-600">
        Selecciona una plantilla para configurar tu agente IA rápidamente con objetivos y restricciones predefinidas
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayedScenarios.map((scenario, index) => {
          const IconComponent = iconMap[scenario.icon];
          
          return (
            <Card 
              key={index} 
              className="group cursor-pointer hover:shadow-lg hover:border-purple-300 transition-all duration-300 hover:scale-105" 
              onClick={() => onScenarioSelect(scenario)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 group-hover:scale-110 transition-transform duration-300`}>
                    {IconComponent && <IconComponent className={`h-5 w-5 ${scenario.iconColor}`} />}
                  </div>
                  <h5 className="font-semibold text-sm flex-1 group-hover:text-purple-600 transition-colors pt-1">
                    {scenario.title}
                  </h5>
                </div>
                <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                  {scenario.goals}
                </p>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-purple-600 font-medium group-hover:underline">
                    Aplicar plantilla →
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {scenarios.length > 6 && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Ver todas las plantillas ({scenarios.length - 6} más)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
