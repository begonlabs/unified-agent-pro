import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import logoWhite from '@/assets/logo_white.png';
import { EmailSettingsProps } from '../types';

export const EmailSettings: React.FC<EmailSettingsProps> = ({
  settings,
  onSettingsChange
}) => {
  const handleSettingChange = (key: keyof typeof settings, value: string) => {
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
            Configuración de Email
          </span>
        </CardTitle>
        <CardDescription>
          Configura el servidor SMTP para envío de emails
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="smtp-host">Servidor SMTP</Label>
            <Input 
              id="smtp-host"
              placeholder="smtp.gmail.com"
              value={settings.smtp_host}
              onChange={(e) => handleSettingChange('smtp_host', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="smtp-port">Puerto</Label>
            <Input 
              id="smtp-port"
              placeholder="587"
              value={settings.smtp_port}
              onChange={(e) => handleSettingChange('smtp_port', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="smtp-user">Usuario</Label>
            <Input 
              id="smtp-user"
              placeholder="usuario@empresa.com"
              value={settings.smtp_user}
              onChange={(e) => handleSettingChange('smtp_user', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="smtp-password">Contraseña</Label>
            <Input 
              id="smtp-password"
              type="password"
              value={settings.smtp_password}
              onChange={(e) => handleSettingChange('smtp_password', e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="from-email">Email Remitente</Label>
          <Input 
            id="from-email"
            placeholder="noreply@empresa.com"
            value={settings.from_email}
            onChange={(e) => handleSettingChange('from_email', e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
};
