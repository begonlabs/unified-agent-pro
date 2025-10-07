import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NotificationPanel } from './NotificationPanel';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationBellProps, Notification } from '../types';

export const NotificationBell: React.FC<NotificationBellProps> = ({ isMobile = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousUnreadCount = useRef(0);

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

  // Cerrar panel al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        bellRef.current &&
        panelRef.current &&
        !bellRef.current.contains(event.target as Node) &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Marcar como leída
    if (notification.status === 'unread') {
      markAsRead(notification.id);
    }

    // Navegar si tiene URL de acción
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }

    // Cerrar panel
    setIsOpen(false);
  };

  // Calcular posición del panel para que siempre sea visible
  const getPanelPosition = () => {
    if (!bellRef.current) return {};
    
    const rect = bellRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const panelWidth = isMobile ? Math.min(320, viewportWidth - 16) : 384; // 320px o w-96 (384px)
    
    // Si estamos en mobile o si no hay espacio a la derecha
    if (viewportWidth < 640 || rect.right + panelWidth > viewportWidth) {
      // Posicionar desde la derecha de la pantalla
      return {
        position: 'fixed' as const,
        top: `${rect.bottom + 8}px`,
        right: '8px',
        left: '8px',
        maxWidth: '384px',
        margin: '0 auto'
      };
    }
    
    // Desktop: posicionar relativo al botón
    return {
      position: 'fixed' as const,
      top: `${rect.bottom + 8}px`,
      left: `${rect.right - panelWidth}px`,
      width: `${panelWidth}px`
    };
  };

  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  // Actualizar posición cuando se abre
  useEffect(() => {
    if (isOpen) {
      setPanelStyle(getPanelPosition());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isMobile]);

  return (
    <div className="relative" ref={bellRef}>
      <Button
        variant="ghost"
        size={isMobile ? "sm" : "default"}
        onClick={handleBellClick}
        className={`relative hover:bg-gray-100 transition-all duration-300 ${
          hasNewNotification ? 'animate-bounce' : ''
        }`}
        aria-label="Notificaciones"
      >
        <Bell 
          className={`${
            isMobile ? 'h-5 w-5' : 'h-5 w-5 sm:h-6 sm:w-6'
          } ${
            unreadCount > 0 ? 'text-[#3a0caa]' : 'text-gray-600'
          } transition-colors`}
        />
        
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className={`absolute -top-1 -right-1 ${
              isMobile ? 'h-4 w-4 text-[10px]' : 'h-5 w-5 text-xs'
            } flex items-center justify-center rounded-full p-0 bg-red-500 ${
              hasNewNotification ? 'animate-pulse' : ''
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <div
          ref={panelRef}
          style={panelStyle}
          className="z-[9999]"
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
        </div>
      )}
    </div>
  );
};

