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
    const viewportHeight = window.innerHeight;
    const panelWidth = isMobile ? Math.min(320, viewportWidth - 16) : 384; // 320px o w-96 (384px)
    const panelHeight = isMobile ? Math.min(viewportHeight * 0.5, 400) : 500; // Altura estimada del panel
    
    // Calcular posición vertical
    let top = rect.bottom + 8;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // Si no hay suficiente espacio abajo, abrir hacia arriba
    if (spaceBelow < panelHeight && spaceAbove > spaceBelow) {
      top = rect.top - panelHeight - 8;
    }
    
    // Asegurar que no se salga de la pantalla verticalmente
    if (top < 8) {
      top = 8;
    } else if (top + panelHeight > viewportHeight - 8) {
      top = viewportHeight - panelHeight - 8;
    }
    
    // Si estamos en mobile o si no hay espacio a la derecha
    if (viewportWidth < 640) {
      // Mobile: centrado horizontalmente con márgenes
      return {
        position: 'fixed' as const,
        top: `${top}px`,
        right: '8px',
        left: '8px',
        maxWidth: '384px',
        margin: '0 auto'
      };
    }
    
    // Desktop: calcular posición horizontal
    let left = rect.right - panelWidth;
    
    // Asegurar que no se salga de la pantalla horizontalmente
    if (left < 8) {
      left = 8;
    } else if (left + panelWidth > viewportWidth - 8) {
      left = viewportWidth - panelWidth - 8;
    }
    
    return {
      position: 'fixed' as const,
      top: `${top}px`,
      left: `${left}px`,
      width: `${panelWidth}px`
    };
  };

  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  // Actualizar posición cuando se abre o cambia el tamaño de la ventana
  useEffect(() => {
    if (isOpen) {
      setPanelStyle(getPanelPosition());
      
      // Recalcular posición al hacer scroll o resize
      const handleReposition = () => {
        if (isOpen) {
          setPanelStyle(getPanelPosition());
        }
      };
      
      window.addEventListener('resize', handleReposition);
      window.addEventListener('scroll', handleReposition, true);
      
      return () => {
        window.removeEventListener('resize', handleReposition);
        window.removeEventListener('scroll', handleReposition, true);
      };
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

