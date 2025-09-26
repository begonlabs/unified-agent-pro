export interface AIConfig {
  id?: string;
  goals: string;
  restrictions: string;
  common_questions: string;
  response_time: number;
  knowledge_base: string;
  faq: string;
  is_active: boolean;
}

export interface ExampleScenario {
  title: string;
  goals: string;
  restrictions: string;
}

export interface AIConfigFormData {
  goals: string;
  restrictions: string;
  common_questions: string;
  response_time: number;
  knowledge_base: string;
  faq: string;
  is_active: boolean;
}

export interface AIConfigStatus {
  goals: boolean;
  restrictions: boolean;
  knowledge_base: boolean;
}

export type AITabValue = 'goals' | 'restrictions' | 'knowledge' | 'faq' | 'settings';

export interface AIConfigError {
  field: keyof AIConfigFormData;
  message: string;
}
