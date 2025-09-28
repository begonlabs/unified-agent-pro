import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import logoWhite from '@/assets/logo_white.png';
import { MaintenanceSettingsProps } from '../types';

export const MaintenanceSettings: React.FC<MaintenanceSettingsProps> = ({
  settings,
  onSettingsChange
}) => {
  const handleSettingChange = (key: keyof typeof settings, value: boolean | string) => {
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
            Mantenimiento
          </span>
        </CardTitle>
        <CardDescription>
          Configuraciones de mantenimiento del sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="maintenance-mode">Modo Mantenimiento</Label>
            <p className="text-sm text-gray-500">Activar modo mantenimiento para toda la plataforma</p>
          </div>
          <Switch 
            id="maintenance-mode"
            checked={settings.maintenance_mode}
            onCheckedChange={(checked) => handleSettingChange('maintenance_mode', checked)}
          />
        </div>
        
        {settings.maintenance_mode && (
          <div>
            <Label htmlFor="maintenance-message">Mensaje de Mantenimiento</Label>
            <Textarea 
              id="maintenance-message"
              placeholder="El sistema está en mantenimiento. Volveremos pronto..."
              value={settings.maintenance_message}
              onChange={(e) => handleSettingChange('maintenance_message', e.target.value)}
              className="mt-2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
