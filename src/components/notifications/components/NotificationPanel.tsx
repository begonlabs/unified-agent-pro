import React, { useState } from 'react';
import { CheckCheck, Loader2, Bell, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden max-h-[85vh] flex flex-col w-full sm:w-[400px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-white z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 text-lg">Notificaciones</h3>
            {unreadCount > 0 && (
              <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 text-xs px-2 h-5">
                {unreadCount} nuevas
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="h-8 px-2 text-gray-500 hover:text-blue-600 text-xs font-medium"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
              Marcar leídas
            </Button>
          )}
        </div>

        {/* Filtros Simples */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFilter('all')}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap
              ${filter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
            `}
          >
            Todas
          </button>

          {/* Mostrar solo filtros con notificaciones */}
          {(Object.keys(countByType) as NotificationType[]).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5
                ${filter === type
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
              `}
            >
              {notificationTypeLabels[type]}
              <span className={`text-[10px] px-1 rounded-full ${filter === type ? 'bg-white/20' : 'bg-gray-300/50'}`}>
                {countByType[type]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="flex-1 overflow-y-auto max-h-[400px] sm:max-h-[500px]">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 px-8 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-900 font-medium mb-1">
              {filter === 'all' ? 'Estás al día' : 'Sin notificaciones'}
            </p>
            <p className="text-sm text-gray-500">
              {filter === 'all'
                ? 'No tienes nuevas notificaciones en este momento.'
                : `No hay notificaciones de tipo "${notificationTypeLabels[filter]}"`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
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
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
        <Button variant="link" size="sm" className="text-xs text-gray-500 h-auto p-0 hover:no-underline">
          Ver historial completo
        </Button>
      </div>
    </div>
  );
};

