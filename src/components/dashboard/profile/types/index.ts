import { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  company_name: string;
  email: string;
  phone?: string;
  phone_country_code?: string;
  country?: string;
  plan_type: string;
  subscription_start?: string;
  subscription_end?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileFormData {
  company_name: string;
  email: string;
  phone: string;
  country: string;
}

export interface NotificationSettings {
  new_messages: boolean;
  plan_limits: boolean;
  product_updates: boolean;
  email_notifications: boolean;
}

export interface ProfileViewProps {
  user: User | null;
}

export interface Plan {
  name: string;
  price: string;
  description: string;
  features: string[];
  current: boolean;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

export interface PasswordStrength {
  score: number;
  feedback: string[];
  color: string;
  text: string;
}

export interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface ProfileValidationErrors {
  company_name?: string;
  email?: string;
  phone?: string;
  country?: string;
}

export interface PasswordValidationErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

// Re-export User type from Supabase
export type { User };
