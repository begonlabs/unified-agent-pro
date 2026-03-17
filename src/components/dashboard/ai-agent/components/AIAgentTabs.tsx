import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Target, Shield, Brain, MessageSquare, Clock, Users, Calendar, CheckCircle2 } from 'lucide-react';
import { AITabValue, AIConfigStatus } from '../types';

interface AIAgentTabsProps {
  currentTab: AITabValue;
  onTabChange: (tab: AITabValue) => void;
  tabStatus?: AIConfigStatus;
}

const tabs = [
  {
    value: 'goals' as AITabValue,
    icon: Target,
    label: 'Objetivos',
    tooltip: 'Objetivos'
  },
  {
    value: 'restrictions' as AITabValue,
    icon: Shield,
    label: 'Restricciones',
    tooltip: 'Restricciones'
  },
  {
    value: 'knowledge' as AITabValue,
    icon: Brain,
    label: 'Conocimiento',
    tooltip: 'Conocimiento'
  },
  {
    value: 'faq' as AITabValue,
    icon: MessageSquare,
    label: 'FAQs',
    tooltip: 'FAQs'
  },
  {
    value: 'advisor' as AITabValue,
    icon: Users,
    label: 'Asesor',
    tooltip: 'Asesor Humano'
  },
  {
    value: 'schedule' as AITabValue,
    icon: Calendar,
    label: 'Horarios',
    tooltip: 'Horarios'
  },
  {
    value: 'settings' as AITabValue,
    icon: Clock,
    label: 'Configuración',
    tooltip: 'Configuración'
  }
];

export const AIAgentTabs: React.FC<AIAgentTabsProps> = ({
  currentTab,
  onTabChange,
  tabStatus
}) => {
  return (
    <TabsList className="flex h-auto w-full bg-white shadow-sm overflow-x-auto overflow-y-hidden justify-start gap-2 p-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        
        // Determinar si la pestaña está completada basado en tabStatus
        // FAQ y Settings no están en el status directamente de usAIConfigValidation en este momento,
        // pero podemos usar el tabStatus si provee la clave.
        const isCompleted = tabStatus ? tabStatus[tab.value as keyof AIConfigStatus] : false;

        return (
          <Tooltip key={tab.value}>
            <TooltipTrigger asChild>
              <TabsTrigger
                value={tab.value}
                onClick={() => onTabChange(tab.value)}
                className={`relative flex flex-col items-center justify-center min-w-[60px] sm:min-w-[80px] p-2 sm:p-3 gap-1 transition-all !rounded-full
                  ${currentTab === tab.value
                    ? 'bg-gradient-to-r from-[#3a0caa]/20 to-[#710db2]/20 text-[#3a0caa] font-semibold'
                    : 'hover:bg-gray-100'
                  }`}
              >
                <div className="relative">
                  <Icon className="h-4 w-4" />
                  {isCompleted && (
                    <div className="absolute -top-1.5 -right-1.5 bg-white rounded-full">
                      <CheckCircle2 className="h-3 w-3 text-green-500 fill-green-50" />
                    </div>
                  )}
                </div>
                <span className="text-xs hidden sm:block">{tab.label}</span>
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tab.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </TabsList>
  );
};
