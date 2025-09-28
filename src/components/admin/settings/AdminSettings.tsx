import React from 'react';
import { AdminSettingsProps } from './types';
import { useAdminSettings } from './hooks/useAdminSettings';
import {
  NotificationSettings,
  EmailSettings,
  SecuritySettings,
  MaintenanceSettings,
  SettingsSaveButton
} from './components/index';

const AdminSettings: React.FC<AdminSettingsProps> = () => {
  const {
    settings,
    updateNotificationSettings,
    updateEmailSettings,
    updateSecuritySettings,
    updateMaintenanceSettings,
    saveSettings,
    loading
  } = useAdminSettings();

  return (
    <div className="space-y-6">
      <NotificationSettings 
        settings={settings.notifications}
        onSettingsChange={updateNotificationSettings}
      />
      
      <EmailSettings 
        settings={settings.email}
        onSettingsChange={updateEmailSettings}
      />
      
      <SecuritySettings 
        settings={settings.security}
        onSettingsChange={updateSecuritySettings}
      />
      
      <MaintenanceSettings 
        settings={settings.maintenance}
        onSettingsChange={updateMaintenanceSettings}
      />
      
      <SettingsSaveButton 
        onSave={saveSettings}
        loading={loading}
      />
    </div>
  );
};

export default AdminSettings;
