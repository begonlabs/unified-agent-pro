import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Target, Shield, Brain, MessageSquare, Clock, Users, Calendar } from 'lucide-react';
import { AITabValue } from '../types';

interface AIAgentTabsProps {
  currentTab: AITabValue;
  onTabChange: (tab: AITabValue) => void;
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
  onTabChange
}) => {
  return (
    <TabsList className="flex w-full bg-white shadow-sm overflow-x-auto justify-start">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Tooltip key={tab.value}>
            <TooltipTrigger asChild>
              <TabsTrigger
                value={tab.value}
                onClick={() => onTabChange(tab.value)}
                className={`flex flex-col items-center justify-center min-w-[60px] sm:min-w-[80px] p-2 sm:p-3 gap-1 transition-all rounded-xl
                  ${currentTab === tab.value
                    ? 'bg-gradient-to-r from-[#3a0caa]/20 to-[#710db2]/20 text-[#3a0caa] font-semibold'
                    : 'hover:bg-gray-100'
                  }`}
              >
                <Icon className="h-4 w-4" />
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
