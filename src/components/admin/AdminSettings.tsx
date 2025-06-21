
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  Mail, 
  Shield, 
  Database,
  Settings,
  Save
} from 'lucide-react';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
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
  });
  
  const { toast } = useToast();

  const handleSaveSettings = () => {
    // Aquí se guardarían las configuraciones
    toast({
      title: "Configuración guardada",
      description: "Los cambios se han guardado exitosamente.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Configuración de Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
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
              checked={settings.notifications.email_enabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, email_enabled: checked }
                }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="new-client-alert">Alerta de Nuevo Cliente</Label>
              <p className="text-sm text-gray-500">Notificar cuando se registre un nuevo cliente</p>
            </div>
            <Switch 
              id="new-client-alert"
              checked={settings.notifications.new_client_alert}
              onCheckedChange={(checked) => 
                setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, new_client_alert: checked }
                }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="support-alert">Alerta de Mensaje de Soporte</Label>
              <p className="text-sm text-gray-500">Notificar nuevos mensajes de soporte</p>
            </div>
            <Switch 
              id="support-alert"
              checked={settings.notifications.support_message_alert}
              onCheckedChange={(checked) => 
                setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, support_message_alert: checked }
                }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="daily-report">Reporte Diario</Label>
              <p className="text-sm text-gray-500">Enviar reporte diario de actividad</p>
            </div>
            <Switch 
              id="daily-report"
              checked={settings.notifications.daily_report}
              onCheckedChange={(checked) => 
                setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, daily_report: checked }
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configuración de Email
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
                value={settings.email.smtp_host}
                onChange={(e) => 
                  setSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, smtp_host: e.target.value }
                  }))
                }
              />
            </div>
            
            <div>
              <Label htmlFor="smtp-port">Puerto</Label>
              <Input 
                id="smtp-port"
                placeholder="587"
                value={settings.email.smtp_port}
                onChange={(e) => 
                  setSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, smtp_port: e.target.value }
                  }))
                }
              />
            </div>
            
            <div>
              <Label htmlFor="smtp-user">Usuario</Label>
              <Input 
                id="smtp-user"
                placeholder="usuario@empresa.com"
                value={settings.email.smtp_user}
                onChange={(e) => 
                  setSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, smtp_user: e.target.value }
                  }))
                }
              />
            </div>
            
            <div>
              <Label htmlFor="smtp-password">Contraseña</Label>
              <Input 
                id="smtp-password"
                type="password"
                value={settings.email.smtp_password}
                onChange={(e) => 
                  setSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, smtp_password: e.target.value }
                  }))
                }
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="from-email">Email Remitente</Label>
            <Input 
              id="from-email"
              placeholder="noreply@empresa.com"
              value={settings.email.from_email}
              onChange={(e) => 
                setSettings(prev => ({
                  ...prev,
                  email: { ...prev.email, from_email: e.target.value }
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Seguridad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Seguridad
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
                value={settings.security.max_login_attempts}
                onChange={(e) => 
                  setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, max_login_attempts: parseInt(e.target.value) }
                  }))
                }
              />
            </div>
            
            <div>
              <Label htmlFor="session-timeout">Timeout de Sesión (horas)</Label>
              <Input 
                id="session-timeout"
                type="number"
                value={settings.security.session_timeout}
                onChange={(e) => 
                  setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, session_timeout: parseInt(e.target.value) }
                  }))
                }
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
              checked={settings.security.require_2fa}
              onCheckedChange={(checked) => 
                setSettings(prev => ({
                  ...prev,
                  security: { ...prev.security, require_2fa: checked }
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Mantenimiento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Mantenimiento
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
              checked={settings.maintenance.maintenance_mode}
              onCheckedChange={(checked) => 
                setSettings(prev => ({
                  ...prev,
                  maintenance: { ...prev.maintenance, maintenance_mode: checked }
                }))
              }
            />
          </div>
          
          {settings.maintenance.maintenance_mode && (
            <div>
              <Label htmlFor="maintenance-message">Mensaje de Mantenimiento</Label>
              <Textarea 
                id="maintenance-message"
                placeholder="El sistema está en mantenimiento. Volveremos pronto..."
                value={settings.maintenance.maintenance_message}
                onChange={(e) => 
                  setSettings(prev => ({
                    ...prev,
                    maintenance: { ...prev.maintenance, maintenance_message: e.target.value }
                  }))
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botón de Guardar */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
