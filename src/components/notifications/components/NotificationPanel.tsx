import React, { useState } from 'react';
import { CheckCheck, Loader2, Bell, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { NotificationItem } from './NotificationItem';
import { NotificationPanelProps, NotificationType } from '../types';

const notificationTypeLabels: Record<NotificationType, string> = {
  message: 'Mensajes',
  ticket: 'Tickets',
  channel: 'Canales',
  channel_connection: 'Conexiones',
  channel_disconnection: 'Desconexiones',
  instagram_verification: 'Instagram',
  webhook_test: 'Webhooks',
  ai_response: 'IA',
  verification: 'Verificaciones',
  connection: 'Conexiones',
  system: 'Sistema',
  warning: 'Advertencias',
  error: 'Errores'
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onNotificationClick,
  loading = false
}) => {
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filtrar notificaciones
  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  // Contar por tipo
  const countByType = notifications.reduce((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1;
    return acc;
  }, {} as Record<NotificationType, number>);

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden max-h-[85vh]">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b bg-gradient-to-r from-[#3a0caa]/5 to-[#710db2]/5">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-[#3a0caa]" />
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">Notificaciones</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-7 w-7 sm:w-auto px-1 sm:px-2"
            >
              <Filter className="h-4 w-4" />
            </Button>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
                className="h-7 px-1 sm:px-2 text-[#3a0caa] hover:text-[#270a59]"
              >
                <CheckCheck className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Marcar todas</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="flex flex-wrap gap-1 mt-2 max-h-20 overflow-y-auto">
            <Badge
              variant={filter === 'all' ? 'default' : 'outline'}
              className="cursor-pointer text-xs whitespace-nowrap"
              onClick={() => setFilter('all')}
            >
              Todas ({notifications.length})
            </Badge>
            {(Object.keys(countByType) as NotificationType[]).map(type => (
              <Badge
                key={type}
                variant={filter === type ? 'default' : 'outline'}
                className="cursor-pointer text-xs whitespace-nowrap"
                onClick={() => setFilter(type)}
              >
                {notificationTypeLabels[type]} ({countByType[type]})
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Lista de notificaciones */}
      <ScrollArea className="h-[60vh] sm:h-[500px] max-h-[calc(85vh-10rem)]">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-[#3a0caa]" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 px-4">
            <Bell className="h-12 w-12 mb-2 opacity-20" />
            <p className="text-sm text-center">
              {filter === 'all' 
                ? 'No tienes notificaciones' 
                : `No hay notificaciones de ${notificationTypeLabels[filter]}`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
                onClick={onNotificationClick}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div className="p-3 border-t bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            {filteredNotifications.length} notificación{filteredNotifications.length !== 1 ? 'es' : ''}
            {filter !== 'all' && ` (filtrado: ${notificationTypeLabels[filter]})`}
          </p>
        </div>
      )}
    </div>
  );
};

