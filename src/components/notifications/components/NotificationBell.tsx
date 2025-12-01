import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationPanel } from './NotificationPanel';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationBellProps, Notification } from '../types';

export const NotificationBell: React.FC<NotificationBellProps> = ({ isMobile = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const previousUnreadCount = useRef(0);
  const navigate = useNavigate();

  // Get current user ID
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const getUserId = async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications(userId);

  // Detectar nueva notificación y animar campanita
  useEffect(() => {
    if (unreadCount > previousUnreadCount.current && previousUnreadCount.current > 0) {
      setHasNewNotification(true);

      // Quitar animación después de 2 segundos
      setTimeout(() => {
        setHasNewNotification(false);
      }, 2000);
    }

    previousUnreadCount.current = unreadCount;
  }, [unreadCount]);

  const handleNotificationClick = (notification: Notification) => {
    // Marcar como leída
    if (notification.status === 'unread') {
      markAsRead(notification.id);
    }

    // Navegar si tiene URL de acción
    if (notification.action_url) {
      // Transform dashboard URLs from /dashboard/view-name to /dashboard?view=view-name
      let targetUrl = notification.action_url;

      // Parse the URL to handle query parameters
      const urlParts = targetUrl.split('?');
      const basePath = urlParts[0];
      const queryString = urlParts[1] || '';

      // Check if it's a dashboard sub-route (e.g., /dashboard/ai-agent or /dashboard/messages)
      const dashboardMatch = basePath.match(/^\/dashboard\/(.+)$/);
      if (dashboardMatch) {
        const viewName = dashboardMatch[1];
        // Combine view parameter with existing query parameters
        const viewParam = `view=${viewName}`;
        targetUrl = queryString
          ? `/dashboard?${viewParam}&${queryString}`
          : `/dashboard?${viewParam}`;
        console.log(`🔄 Transformed notification URL: ${notification.action_url} → ${targetUrl}`);
      }

      navigate(targetUrl);
    }

    // Cerrar panel
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size={isMobile ? "sm" : "default"}
          className={`relative hover:bg-gray-100 transition-all duration-300 ${hasNewNotification ? 'animate-bounce' : ''
            }`}
          aria-label="Notificaciones"
        >
          <Bell
            className={`${isMobile ? 'h-5 w-5' : 'h-5 w-5 sm:h-6 sm:w-6'
              } ${unreadCount > 0 ? 'text-[#3a0caa]' : 'text-gray-600'
              } transition-colors`}
          />

          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={`absolute -top-1 -right-1 ${isMobile ? 'h-4 w-4 text-[10px]' : 'h-5 w-5 text-xs'
                } flex items-center justify-center rounded-full p-0 bg-red-500 ${hasNewNotification ? 'animate-pulse' : ''
                }`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-full sm:w-[400px] p-0 mr-2 sm:mr-0 z-[100]"
        align="end"
        sideOffset={8}
      >
        <NotificationPanel
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDelete={deleteNotification}
          onNotificationClick={handleNotificationClick}
          loading={loading}
        />
      </PopoverContent>
    </Popover>
  );
};

