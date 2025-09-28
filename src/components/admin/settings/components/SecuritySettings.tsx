import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import logoWhite from '@/assets/logo_white.png';
import { SecuritySettingsProps } from '../types';

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  settings,
  onSettingsChange
}) => {
  const handleSettingChange = (key: keyof typeof settings, value: number | boolean) => {
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
            Seguridad
          </span>
        </CardTitle>
        <CardDescription>
          Configuraciones de seguridad del sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="max-attempts">Máximo Intentos de Login</Label>
            <Input 
              id="max-attempts"
              type="number"
              min="1"
              max="10"
              value={settings.max_login_attempts}
              onChange={(e) => handleSettingChange('max_login_attempts', parseInt(e.target.value))}
            />
          </div>
          
          <div>
            <Label htmlFor="session-timeout">Timeout de Sesión (horas)</Label>
            <Input 
              id="session-timeout"
              type="number"
              min="1"
              max="168"
              value={settings.session_timeout}
              onChange={(e) => handleSettingChange('session_timeout', parseInt(e.target.value))}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="require-2fa">Requerir Autenticación de Dos Factores</Label>
            <p className="text-sm text-gray-500">Obligar 2FA para nuevos usuarios</p>
          </div>
          <Switch 
            id="require-2fa"
            checked={settings.require_2fa}
            onCheckedChange={(checked) => handleSettingChange('require_2fa', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
};
