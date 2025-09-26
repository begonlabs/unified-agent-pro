import React, { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { 
  useAIConfig, 
  useAIConfigValidation,
  AIAgentHeader,
  AIAgentTabs,
  GoalsTab,
  RestrictionsTab,
  KnowledgeTab,
  FAQTab,
  SettingsTab,
  AITabValue,
  ExampleScenario
} from './index';

const AIAgentView: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AITabValue>('goals');
  
  const {
    config,
    loading,
    saving,
    saveAIConfig,
    updateConfig
  } = useAIConfig();

  const validation = useAIConfigValidation(config);

  const handleTabChange = (tab: AITabValue) => {
    setCurrentTab(tab);
  };

  const handleScenarioSelect = (scenario: ExampleScenario) => {
    updateConfig({
      goals: scenario.goals,
      restrictions: scenario.restrictions
    });
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'goals':
        return (
          <GoalsTab
            goals={config.goals}
            onGoalsChange={(goals) => updateConfig({ goals })}
            onScenarioSelect={handleScenarioSelect}
          />
        );
      
      case 'restrictions':
        return (
          <RestrictionsTab
            restrictions={config.restrictions}
            onRestrictionsChange={(restrictions) => updateConfig({ restrictions })}
          />
        );
      
      case 'knowledge':
        return (
          <KnowledgeTab
            knowledgeBase={config.knowledge_base}
            commonQuestions={config.common_questions}
            onKnowledgeBaseChange={(knowledge_base) => updateConfig({ knowledge_base })}
            onCommonQuestionsChange={(common_questions) => updateConfig({ common_questions })}
          />
        );
      
      case 'faq':
        return (
          <FAQTab
            faq={config.faq}
            onFAQChange={(faq) => updateConfig({ faq })}
          />
        );
      
      case 'settings':
        return (
          <SettingsTab
            responseTime={config.response_time}
            isActive={config.is_active}
            configStatus={validation.status}
            completionPercentage={validation.completionPercentage}
            onResponseTimeChange={(response_time) => updateConfig({ response_time })}
            onActiveToggle={() => updateConfig({ is_active: !config.is_active })}
          />
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50 min-h-screen">
      <AIAgentHeader
        config={config}
        loading={loading}
        saving={saving}
        onSave={saveAIConfig}
      />

      <TooltipProvider>
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <AIAgentTabs
            currentTab={currentTab}
            onTabChange={handleTabChange}
          />

          <TabsContent value={currentTab} className="space-y-4 sm:space-y-6">
            {renderTabContent()}
          </TabsContent>
        </Tabs>
      </TooltipProvider>
    </div>
  );
};

export default AIAgentView;
