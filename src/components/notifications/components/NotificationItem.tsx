import React from 'react';
import {
  MessageSquare,
  AlertCircle,
  Radio,
  CheckCircle,
  AlertTriangle,
  Wifi,
  Settings,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationItemProps, NotificationTypeConfig } from '../types';
import { NotificationService } from '../services/notificationService';

// Configuración de iconos y colores por tipo
const notificationConfig: Record<string, NotificationTypeConfig> = {
  message: {
    icon: MessageSquare,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-l-blue-500'
  },
  ticket: {
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-l-orange-500'
  },
  channel: {
    icon: Radio,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-l-green-500'
  },
  ai_response: {
    icon: CheckCircle,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-l-purple-500'
  },
  verification: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-l-yellow-500'
  },
  connection: {
    icon: Wifi,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-l-cyan-500'
  },
  system: {
    icon: Settings,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-l-gray-500'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-l-yellow-500'
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-l-red-500'
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onClick
}) => {
  const config = notificationConfig[notification.type] || notificationConfig.system;
  const Icon = config.icon;
  const isUnread = notification.status === 'unread';

  const handleClick = (e: React.MouseEvent) => {
    // No ejecutar onClick si se clickea el botón de eliminar
    if ((e.target as HTMLElement).closest('[data-delete-button]')) {
      return;
    }
    onClick(notification);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  const getPriorityBadge = () => {
    if (notification.priority === 'urgent' || notification.priority === 'high') {
      return (
        <Badge variant="destructive" className="text-[10px] h-5 px-1.5 animate-pulse bg-red-600 hover:bg-red-700">
          URGENTE
        </Badge>
      );
    }
    return null;
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative p-3 sm:p-4 cursor-pointer
        transition-all duration-200 hover:bg-gray-50
        ${isUnread ? 'bg-white' : 'bg-white/60'}
        group border-b border-gray-100 last:border-0
      `}
    >
      <div className="flex gap-3">
        {/* Icono */}
        <div className={`flex-shrink-0 mt-0.5 p-2 rounded-full ${config.bgColor} bg-opacity-60`}>
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <h4 className={`text-sm text-gray-900 line-clamp-1 ${isUnread ? 'font-semibold' : 'font-medium'}`}>
              {notification.title}
            </h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              {getPriorityBadge()}
              {isUnread && (
                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              )}
            </div>
          </div>

          <p className={`text-sm text-gray-600 line-clamp-2 mb-1.5 ${isUnread ? 'text-gray-700' : 'text-gray-500'}`}>
            {notification.message}
          </p>

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-400 flex-shrink-0">
              {NotificationService.formatNotificationDate(notification.created_at)}
            </span>

            {notification.action_label && (
              <span className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">
                {notification.action_label}
              </span>
            )}
          </div>
        </div>

        {/* Botón eliminar (visible en hover) */}
        <Button
          variant="ghost"
          size="icon"
          data-delete-button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 -mr-1 -mt-1 text-gray-400 hover:text-red-500 hover:bg-red-50"
          aria-label="Eliminar notificación"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

