import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import logoWhite from '@/assets/logo_white.png';
import { NotificationSettingsProps } from '../types';

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  onSettingsChange
}) => {
  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="relative">
            <img src={logoWhite} alt="OndAI Logo" className="h-6 w-6" />
          </div>
          <span className="text-transparent bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text">
            Notificaciones
          </span>
        </CardTitle>
        <CardDescription>
          Configura las alertas y notificaciones del sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="email-notifications">Notificaciones por Email</Label>
            <p className="text-sm text-gray-500">Habilitar envío de notificaciones por correo</p>
          </div>
          <Switch 
            id="email-notifications"
            checked={settings.email_enabled}
            onCheckedChange={(checked) => handleSettingChange('email_enabled', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="new-client-alert">Alerta de Nuevo Cliente</Label>
            <p className="text-sm text-gray-500">Notificar cuando se registre un nuevo cliente</p>
          </div>
          <Switch 
            id="new-client-alert"
            checked={settings.new_client_alert}
            onCheckedChange={(checked) => handleSettingChange('new_client_alert', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="support-alert">Alerta de Mensaje de Soporte</Label>
            <p className="text-sm text-gray-500">Notificar nuevos mensajes de soporte</p>
          </div>
          <Switch 
            id="support-alert"
            checked={settings.support_message_alert}
            onCheckedChange={(checked) => handleSettingChange('support_message_alert', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="daily-report">Reporte Diario</Label>
            <p className="text-sm text-gray-500">Enviar reporte diario de actividad</p>
          </div>
          <Switch 
            id="daily-report"
            checked={settings.daily_report}
            onCheckedChange={(checked) => handleSettingChange('daily_report', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
};
