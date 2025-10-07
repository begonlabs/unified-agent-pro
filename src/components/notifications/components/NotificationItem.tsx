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
    if (notification.priority === 'urgent') {
      return <Badge variant="destructive" className="text-xs">Urgente</Badge>;
    }
    if (notification.priority === 'high') {
      return <Badge variant="default" className="text-xs bg-orange-500">Alta</Badge>;
    }
    return null;
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative p-2 sm:p-3 border-l-4 ${config.borderColor} cursor-pointer
        transition-all duration-200 hover:shadow-md
        ${isUnread ? `${config.bgColor} border` : 'bg-white border border-gray-200'}
        ${isUnread ? 'font-medium' : 'font-normal'}
        group
      `}
    >
      {/* Indicador de no leída */}
      {isUnread && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      )}

      <div className="flex gap-2 sm:gap-3">
        {/* Icono */}
        <div className={`flex-shrink-0 p-1.5 sm:p-2 rounded-lg ${config.bgColor}`}>
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${config.color}`} />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0 pr-6 sm:pr-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-1">
              {notification.title}
            </h4>
            <div className="flex-shrink-0">
              {getPriorityBadge()}
            </div>
          </div>

          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
            {notification.message}
          </p>

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-400 flex-shrink-0">
              {NotificationService.formatNotificationDate(notification.created_at)}
            </span>

            {notification.action_label && (
              <span className="text-xs text-[#3a0caa] font-medium truncate">
                {notification.action_label} →
              </span>
            )}
          </div>
        </div>

        {/* Botón eliminar (visible en hover en desktop, siempre visible en mobile) */}
        <Button
          variant="ghost"
          size="sm"
          data-delete-button
          onClick={handleDelete}
          className="sm:opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-red-100 flex-shrink-0 absolute right-1 top-1 sm:relative sm:right-0 sm:top-0"
          aria-label="Eliminar notificación"
        >
          <X className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
};

