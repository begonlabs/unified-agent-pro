import { 
  AdminSettingsData, 
  SaveSettingsResponse, 
  LoadSettingsResponse 
} from '../types';

export class AdminSettingsService {
  private static readonly STORAGE_KEY = 'admin_settings';

  /**
   * Get default admin settings
   */
  static getDefaultSettings(): AdminSettingsData {
    return {
      notifications: {
        email_enabled: true,
        new_client_alert: true,
        support_message_alert: true,
        daily_report: false,
      },
      email: {
        smtp_host: '',
        smtp_port: '587',
        smtp_user: '',
        smtp_password: '',
        from_email: '',
      },
      security: {
        max_login_attempts: 5,
        session_timeout: 24,
        require_2fa: false,
      },
      maintenance: {
        maintenance_mode: false,
        maintenance_message: '',
      }
    };
  }

  /**
   * Load admin settings from localStorage
   */
  static async loadSettings(): Promise<LoadSettingsResponse> {
    try {
      console.log('🔧 Loading admin settings...');
      
      const storedSettings = localStorage.getItem(this.STORAGE_KEY);
      const settings = storedSettings 
        ? JSON.parse(storedSettings) 
        : this.getDefaultSettings();
      
      console.log('✅ Settings loaded successfully');
      return { settings };
      
    } catch (error: unknown) {
      console.error('Error loading settings:', error);
      return { settings: this.getDefaultSettings() };
    }
  }

  /**
   * Save admin settings to localStorage
   */
  static async saveSettings(settings: AdminSettingsData): Promise<SaveSettingsResponse> {
    try {
      console.log('💾 Saving admin settings...');
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));

      console.log('✅ Settings saved successfully');
      return {
        success: true,
        message: 'Configuración guardada exitosamente'
      };
      
    } catch (error: unknown) {
      console.error('Error saving settings:', error);
      return {
        success: false,
        message: 'Error al guardar la configuración'
      };
    }
  }

  /**
   * Validate notification settings
   */
  static validateNotificationSettings(settings: unknown): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!settings || typeof settings !== 'object') {
      errors.push('Settings debe ser un objeto');
      return { isValid: false, errors };
    }

    const s = settings as Record<string, unknown>;

    if (typeof s.email_enabled !== 'boolean') {
      errors.push('Email enabled debe ser un valor booleano');
    }

    if (typeof s.new_client_alert !== 'boolean') {
      errors.push('New client alert debe ser un valor booleano');
    }

    if (typeof s.support_message_alert !== 'boolean') {
      errors.push('Support message alert debe ser un valor booleano');
    }

    if (typeof s.daily_report !== 'boolean') {
      errors.push('Daily report debe ser un valor booleano');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate email settings
   */
  static validateEmailSettings(settings: unknown): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!settings || typeof settings !== 'object') {
      errors.push('Settings debe ser un objeto');
      return { isValid: false, errors };
    }

    const s = settings as Record<string, unknown>;

    if (s.smtp_host && typeof s.smtp_host === 'string' && !s.smtp_host.includes('.')) {
      errors.push('SMTP host debe ser un dominio válido');
    }

    if (s.smtp_port && typeof s.smtp_port === 'string' && (isNaN(Number(s.smtp_port)) || Number(s.smtp_port) < 1 || Number(s.smtp_port) > 65535)) {
      errors.push('SMTP port debe ser un número válido entre 1 y 65535');
    }

    if (s.from_email && typeof s.from_email === 'string' && !s.from_email.includes('@')) {
      errors.push('From email debe ser una dirección de correo válida');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate security settings
   */
  static validateSecuritySettings(settings: unknown): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!settings || typeof settings !== 'object') {
      errors.push('Settings debe ser un objeto');
      return { isValid: false, errors };
    }

    const s = settings as Record<string, unknown>;

    if (typeof s.max_login_attempts !== 'number' || s.max_login_attempts < 1 || s.max_login_attempts > 10) {
      errors.push('Max login attempts debe estar entre 1 y 10');
    }

    if (typeof s.session_timeout !== 'number' || s.session_timeout < 1 || s.session_timeout > 168) { // Max 1 week
      errors.push('Session timeout debe estar entre 1 y 168 horas');
    }

    if (typeof s.require_2fa !== 'boolean') {
      errors.push('Require 2FA debe ser un valor booleano');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate maintenance settings
   */
  static validateMaintenanceSettings(settings: unknown): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!settings || typeof settings !== 'object') {
      errors.push('Settings debe ser un objeto');
      return { isValid: false, errors };
    }

    const s = settings as Record<string, unknown>;

    if (typeof s.maintenance_mode !== 'boolean') {
      errors.push('Maintenance mode debe ser un valor booleano');
    }

    if (s.maintenance_mode && (!s.maintenance_message || typeof s.maintenance_message !== 'string' || !s.maintenance_message.trim())) {
      errors.push('Mensaje de mantenimiento es requerido cuando el modo mantenimiento está activo');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate all settings
   */
  static validateAllSettings(settings: AdminSettingsData): { isValid: boolean; errors: string[] } {
    const allErrors: string[] = [];

    const notificationValidation = this.validateNotificationSettings(settings.notifications);
    const emailValidation = this.validateEmailSettings(settings.email);
    const securityValidation = this.validateSecuritySettings(settings.security);
    const maintenanceValidation = this.validateMaintenanceSettings(settings.maintenance);

    allErrors.push(...notificationValidation.errors);
    allErrors.push(...emailValidation.errors);
    allErrors.push(...securityValidation.errors);
    allErrors.push(...maintenanceValidation.errors);

    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    };
  }

}
