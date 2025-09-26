// Tipos
export * from './types';

// Servicios
export { AIConfigService } from './services/aiConfigService';

// Hooks
export { useAIConfig } from './hooks/useAIConfig';
export { useAIConfigValidation } from './hooks/useAIConfigValidation';

// Componentes principales
export { AIAgentHeader } from './components/AIAgentHeader';
export { AIAgentTabs } from './components/AIAgentTabs';

// Componentes de tabs
export { GoalsTab } from './components/tabs/GoalsTab';
export { RestrictionsTab } from './components/tabs/RestrictionsTab';
export { KnowledgeTab } from './components/tabs/KnowledgeTab';
export { FAQTab } from './components/tabs/FAQTab';
export { SettingsTab } from './components/tabs/SettingsTab';

// Componentes compartidos
export { ExampleScenarios } from './components/shared/ExampleScenarios';
export { ConfigStatus } from './components/shared/ConfigStatus';
export { ResponseTimeSlider } from './components/shared/ResponseTimeSlider';
