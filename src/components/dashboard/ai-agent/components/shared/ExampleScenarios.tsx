import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ExampleScenario } from '../types';

interface ExampleScenariosProps {
  scenarios: ExampleScenario[];
  onScenarioSelect: (scenario: ExampleScenario) => void;
}

export const ExampleScenarios: React.FC<ExampleScenariosProps> = ({
  scenarios,
  onScenarioSelect
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <h4 className="col-span-full font-medium text-gray-700 mb-2 text-sm sm:text-base">
        Ejemplos por Industria:
      </h4>
      {scenarios.map((scenario, index) => (
        <Card 
          key={index} 
          className="cursor-pointer hover:bg-gray-50 transition-colors" 
          onClick={() => onScenarioSelect(scenario)}
        >
          <CardContent className="p-3 sm:p-4">
            <h5 className="font-medium text-sm mb-2">{scenario.title}</h5>
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-3">
              {scenario.goals}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
