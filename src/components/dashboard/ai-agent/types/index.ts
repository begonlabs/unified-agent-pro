export interface AIConfig {
  id?: string;
  goals: string;
  restrictions: string;
  common_questions: string;
  response_time: number;
  knowledge_base: string;
  faq: string;
  is_active: boolean;
  // Nuevas funcionalidades
  advisor_enabled: boolean;
  advisor_message: string;
  always_active: boolean;
  operating_hours: OperatingHours;
  training_progress: TrainingProgress;
}

export interface OperatingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

export interface TrainingProgress {
  goals: boolean;
  restrictions: boolean;
  knowledge_base: boolean;
  faq: boolean;
  advisor: boolean;
  schedule: boolean;
}

export interface ExampleScenario {
  title: string;
  goals: string;
  restrictions: string;
  icon: string; // Nombre del icono de Lucide React
  iconColor: string; // Color del icono
}

export interface AIConfigFormData {
  goals: string;
  restrictions: string;
  common_questions: string;
  response_time: number;
  knowledge_base: string;
  faq: string;
  is_active: boolean;
  // Nuevas funcionalidades
  advisor_enabled: boolean;
  advisor_message: string;
  always_active: boolean;
  operating_hours: OperatingHours;
}

export interface AIConfigStatus {
  goals: boolean;
  restrictions: boolean;
  knowledge_base: boolean;
  advisor: boolean;
  schedule: boolean;
}

export type AITabValue = 'goals' | 'restrictions' | 'knowledge' | 'faq' | 'settings' | 'advisor' | 'schedule';

export interface AIConfigError {
  field: keyof AIConfigFormData;
  message: string;
}
