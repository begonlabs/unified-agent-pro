import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { useChannelsStatus } from '@/hooks/useChannelsStatus';
import { useSidebar } from '@/hooks/useSidebar';
import { SidebarService } from '../services/sidebarService';
import { SidebarState, UserType } from '../types';

export const useSidebarNavigation = (
  currentView: string,
  setCurrentView: (view: string) => void,
  user: UserType | null
) => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin(user);
  const { status: channelsStatus, loading: channelsLoading } = useChannelsStatus();
  const { isOpen, isMobile, toggleSidebar, closeSidebar } = useSidebar();

  const handleAdminAccess = useCallback(() => {
    navigate('/admin');
    closeSidebar();
  }, [navigate, closeSidebar]);

  const handleViewChange = useCallback((view: string) => {
    if (SidebarService.isValidView(view)) {
      setCurrentView(view);
      closeSidebar();
    }
  }, [setCurrentView, closeSidebar]);

  return {
    isAdmin,
    adminLoading,
    channelsStatus,
    channelsLoading,
    isOpen,
    isMobile,
    toggleSidebar,
    closeSidebar,
    handleAdminAccess,
    handleViewChange
  };
};
