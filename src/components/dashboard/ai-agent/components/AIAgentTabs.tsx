import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Target, Shield, Brain, MessageSquare, Clock } from 'lucide-react';
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
                className="flex flex-col items-center justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3a0caa]/10 data-[state=active]:to-[#710db2]/10 data-[state=active]:text-[#3a0caa] min-w-[60px] sm:min-w-[80px] p-2 sm:p-3 gap-1"
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
