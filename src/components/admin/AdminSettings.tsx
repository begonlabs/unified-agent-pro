
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Shield, 
  Database,
  Mail,
  Bell,
  Lock,
  Server,
  Users,
  Save,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    siteName: 'ChatBot AI Platform',
    siteDescription: 'Plataforma de automatización de mensajes con IA',
    adminEmail: 'admin@chatbotai.com',
    maxUsersPerPlan: 1000,
    enableRegistrations: true,
    enableNotifications: true,
    maintenanceMode: false,
    backupFrequency: 'daily',
    sessionTimeout: 24
  });

  const [apiSettings, setApiSettings] = useState({
    rateLimitPerMinute: 100,
    maxMessageLength: 4000,
    enableWebhooks: true,
    webhookRetries: 3
  });

  const { toast } = useToast();

  const handleSaveGeneralSettings = () => {
    toast({
      title: "Configuración guardada",
      description: "La configuración general ha sido actualizada exitosamente.",
    });
  };

  const handleSaveApiSettings = () => {
    toast({
      title: "Configuración API guardada",
      description: "La configuración de la API ha sido actualizada exitosamente.",
    });
  };

  const handleBackupNow = () => {
    toast({
      title: "Backup iniciado",
      description: "El backup de la base de datos ha comenzado. Te notificaremos cuando termine.",
    });
  };

  const systemStats = {
    totalUsers: 1247,
    totalMessages: 18569,
    storageUsed: '2.4 GB',
    uptime: '99.9%',
    lastBackup: '2024-01-07 02:00:00'
  };

  return (
    <div className="space-y-6 bg-zinc-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-mono font-black uppercase tracking-widest text-white">Configuración del Sistema</h2>
        <p className="text-zinc-400 font-mono tracking-wide">
          Administra la configuración general de la plataforma
        </p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-mono font-medium text-zinc-300 uppercase tracking-wider">Usuarios</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-white">{systemStats.totalUsers.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-mono font-medium text-zinc-300 uppercase tracking-wider">Mensajes</CardTitle>
            <Mail className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-white">{systemStats.totalMessages.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-mono font-medium text-zinc-300 uppercase tracking-wider">Almacenamiento</CardTitle>
            <Database className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-white">{systemStats.storageUsed}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-mono font-medium text-zinc-300 uppercase tracking-wider">Uptime</CardTitle>
            <Server className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-white">{systemStats.uptime}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-mono font-medium text-zinc-300 uppercase tracking-wider">Último Backup</CardTitle>
            <RefreshCw className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono font-bold text-white">{new Date(systemStats.lastBackup).toLocaleDateString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-white uppercase tracking-wider">
              <Settings className="h-5 w-5" />
              Configuración General
            </CardTitle>
            <CardDescription className="text-zinc-400 font-mono">
              Configuración básica de la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="site-name" className="text-zinc-300 font-mono uppercase tracking-wider">Nombre del Sitio</Label>
              <Input
                id="site-name"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="bg-zinc-700/50 border-zinc-600 text-white font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-description" className="text-zinc-300 font-mono uppercase tracking-wider">Descripción</Label>
              <Textarea
                id="site-description"
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                className="min-h-[80px] bg-zinc-700/50 border-zinc-600 text-white font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-zinc-300 font-mono uppercase tracking-wider">Email Administrador</Label>
              <Input
                id="admin-email"
                type="email"
                value={settings.adminEmail}
                onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                className="bg-zinc-700/50 border-zinc-600 text-white font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-users" className="text-zinc-300 font-mono uppercase tracking-wider">Máx. Usuarios por Plan</Label>
              <Input
                id="max-users"
                type="number"
                value={settings.maxUsersPerPlan}
                onChange={(e) => setSettings({ ...settings, maxUsersPerPlan: parseInt(e.target.value) })}
                className="bg-zinc-700/50 border-zinc-600 text-white font-mono"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-zinc-300 font-mono uppercase tracking-wider">Registros Habilitados</Label>
                  <p className="text-sm text-zinc-500 font-mono">Permitir nuevos registros de usuarios</p>
                </div>
                <Switch
                  checked={settings.enableRegistrations}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableRegistrations: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-zinc-300 font-mono uppercase tracking-wider">Notificaciones</Label>
                  <p className="text-sm text-zinc-500 font-mono">Enviar notificaciones por email</p>
                </div>
                <Switch
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-zinc-300 font-mono uppercase tracking-wider">Modo Mantenimiento</Label>
                  <p className="text-sm text-zinc-500 font-mono">Deshabilitar acceso temporal</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                />
              </div>
            </div>

            <Button 
              onClick={handleSaveGeneralSettings}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 font-mono uppercase tracking-wider"
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Configuración
            </Button>
          </CardContent>
        </Card>

        {/* Security & API Settings */}
        <div className="space-y-6">
          <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-mono text-white uppercase tracking-wider">
                <Shield className="h-5 w-5" />
                Seguridad & API
              </CardTitle>
              <CardDescription className="text-zinc-400 font-mono">
                Configuración de seguridad y límites de API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rate-limit" className="text-zinc-300 font-mono uppercase tracking-wider">Rate Limit (por minuto)</Label>
                <Input
                  id="rate-limit"
                  type="number"
                  value={apiSettings.rateLimitPerMinute}
                  onChange={(e) => setApiSettings({ ...apiSettings, rateLimitPerMinute: parseInt(e.target.value) })}
                  className="bg-zinc-700/50 border-zinc-600 text-white font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-message" className="text-zinc-300 font-mono uppercase tracking-wider">Máx. Caracteres por Mensaje</Label>
                <Input
                  id="max-message"
                  type="number"
                  value={apiSettings.maxMessageLength}
                  onChange={(e) => setApiSettings({ ...apiSettings, maxMessageLength: parseInt(e.target.value) })}
                  className="bg-zinc-700/50 border-zinc-600 text-white font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-timeout" className="text-zinc-300 font-mono uppercase tracking-wider">Timeout Sesión (horas)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                  className="bg-zinc-700/50 border-zinc-600 text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-zinc-300 font-mono uppercase tracking-wider">Webhooks Habilitados</Label>
                  <p className="text-sm text-zinc-500 font-mono">Permitir webhooks externos</p>
                </div>
                <Switch
                  checked={apiSettings.enableWebhooks}
                  onCheckedChange={(checked) => setApiSettings({ ...apiSettings, enableWebhooks: checked })}
                />
              </div>

              <Button 
                onClick={handleSaveApiSettings}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-mono uppercase tracking-wider"
              >
                <Lock className="h-4 w-4 mr-2" />
                Guardar Seguridad
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-mono text-white uppercase tracking-wider">
                <Database className="h-5 w-5" />
                Backup & Mantenimiento
              </CardTitle>
              <CardDescription className="text-zinc-400 font-mono">
                Gestión de copias de seguridad y mantenimiento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-zinc-700/30 rounded-sm border border-zinc-600">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-zinc-300 uppercase tracking-wider">Último Backup</span>
                  <Badge className="bg-green-600 text-white font-mono">Exitoso</Badge>
                </div>
                <p className="text-sm text-zinc-400 font-mono">{systemStats.lastBackup}</p>
              </div>

              <Button 
                onClick={handleBackupNow}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-mono uppercase tracking-wider"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Crear Backup Ahora
              </Button>

              {settings.maintenanceMode && (
                <div className="p-3 bg-orange-600/20 border border-orange-600/50 rounded-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-400" />
                    <span className="font-mono text-orange-300 text-sm uppercase tracking-wider">
                      Modo Mantenimiento Activo
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
