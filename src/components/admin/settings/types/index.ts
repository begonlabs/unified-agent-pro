// Admin Settings Types

// Notification settings interface
export interface NotificationSettings {
  email_enabled: boolean;
  new_client_alert: boolean;
  support_message_alert: boolean;
  daily_report: boolean;
}

// Email configuration interface
export interface EmailSettings {
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_password: string;
  from_email: string;
}

// Security settings interface
export interface SecuritySettings {
  max_login_attempts: number;
  session_timeout: number;
  require_2fa: boolean;
}

// Maintenance settings interface
export interface MaintenanceSettings {
  maintenance_mode: boolean;
  maintenance_message: string;
}

// Complete admin settings interface
export interface AdminSettingsData {
  notifications: NotificationSettings;
  email: EmailSettings;
  security: SecuritySettings;
  maintenance: MaintenanceSettings;
}

// Component props interfaces
export interface AdminSettingsProps {
  className?: string;
}

export interface NotificationSettingsProps {
  settings: NotificationSettings;
  onSettingsChange: (settings: NotificationSettings) => void;
}

export interface EmailSettingsProps {
  settings: EmailSettings;
  onSettingsChange: (settings: EmailSettings) => void;
}

export interface SecuritySettingsProps {
  settings: SecuritySettings;
  onSettingsChange: (settings: SecuritySettings) => void;
}

export interface MaintenanceSettingsProps {
  settings: MaintenanceSettings;
  onSettingsChange: (settings: MaintenanceSettings) => void;
}

export interface SettingsSaveButtonProps {
  onSave: () => void;
  loading?: boolean;
}

// Hook return types
export interface UseAdminSettingsReturn {
  settings: AdminSettingsData;
  setSettings: (settings: AdminSettingsData) => void;
  updateNotificationSettings: (notifications: NotificationSettings) => void;
  updateEmailSettings: (email: EmailSettings) => void;
  updateSecuritySettings: (security: SecuritySettings) => void;
  updateMaintenanceSettings: (maintenance: MaintenanceSettings) => void;
  saveSettings: () => Promise<void>;
  loading: boolean;
}

// Service response types
export interface SaveSettingsResponse {
  success: boolean;
  message: string;
}

export interface LoadSettingsResponse {
  settings: AdminSettingsData;
}
