import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Mail, 
  Shield, 
  AlertTriangle, 
  Star, 
  CheckCircle 
} from 'lucide-react';
import { NotificationSettings } from '../types';

interface NotificationsTabProps {
  notifications: NotificationSettings;
  onUpdateNotification: (key: keyof NotificationSettings, value: boolean) => void;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
  notifications,
  onUpdateNotification
}) => {
  return (
    <TabsContent value="notifications" className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            Preferencias de Notificaciones
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Personaliza cómo y cuándo recibir notificaciones de la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notificaciones por Email */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Notificaciones por Email
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h5 className="font-medium">Notificaciones por email</h5>
                    <p className="text-sm text-gray-500">Recibir notificaciones importantes por correo electrónico</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.email_notifications}
                  onCheckedChange={(checked) => onUpdateNotification('email_notifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Bell className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h5 className="font-medium">Nuevos mensajes</h5>
                    <p className="text-sm text-gray-500">Alertas cuando recibas nuevos mensajes de clientes</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.new_messages}
                  onCheckedChange={(checked) => onUpdateNotification('new_messages', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notificaciones del Sistema */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Notificaciones del Sistema
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <h5 className="font-medium">Límites de plan</h5>
                    <p className="text-sm text-gray-500">Avisos cuando te acerques a los límites de tu plan</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.plan_limits}
                  onCheckedChange={(checked) => onUpdateNotification('plan_limits', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Star className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h5 className="font-medium">Actualizaciones del producto</h5>
                    <p className="text-sm text-gray-500">Noticias sobre nuevas funciones y mejoras</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.product_updates}
                  onCheckedChange={(checked) => onUpdateNotification('product_updates', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Resumen de configuración */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Resumen de Configuración
            </h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Notificaciones por email: <span className="font-medium">{notifications.email_notifications ? 'Activadas' : 'Desactivadas'}</span></p>
              <p>• Nuevos mensajes: <span className="font-medium">{notifications.new_messages ? 'Activadas' : 'Desactivadas'}</span></p>
              <p>• Límites de plan: <span className="font-medium">{notifications.plan_limits ? 'Activadas' : 'Desactivadas'}</span></p>
              <p>• Actualizaciones: <span className="font-medium">{notifications.product_updates ? 'Activadas' : 'Desactivadas'}</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};
