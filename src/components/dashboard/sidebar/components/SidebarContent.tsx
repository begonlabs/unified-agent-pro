import React from 'react';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNavigation } from './SidebarNavigation';
import { AdminSection } from './AdminSection';
import { ChannelStatusSection } from './ChannelStatus';
import { SignOutButton } from './SignOutButton';
import { SidebarProps } from '../types';

interface SidebarContentProps extends SidebarProps {
  isAdmin: boolean;
  adminLoading: boolean;
  channelsStatus: {
    whatsapp: boolean;
    facebook: boolean;
    instagram: boolean;
  };
  channelsLoading: boolean;
  onAdminAccess: () => void;
  onViewChange: (view: string) => void;
  isMobile?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({
  currentView,
  onSignOut,
  isAdmin,
  adminLoading,
  channelsStatus,
  channelsLoading,
  onAdminAccess,
  onViewChange,
  isMobile = false,
  isCollapsed = false,
  onToggleCollapse
}) => {
  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white shadow-lg h-full flex flex-col transition-all duration-300 relative`}>
      {/* Botón de colapso (solo desktop) */}
      {!isMobile && onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-8 bg-white border rounded-full p-1 shadow-md hover:bg-gray-50 z-50 text-gray-500 hover:text-blue-600 transition-colors"
        >
          {isCollapsed ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          )}
        </button>
      )}

      <SidebarHeader isMobile={isMobile} isCollapsed={isCollapsed} />

      <SidebarNavigation
        currentView={currentView}
        onViewChange={onViewChange}
        isMobile={isMobile}
        isCollapsed={isCollapsed}
      />

      <AdminSection
        isAdmin={isAdmin}
        adminLoading={adminLoading}
        onAdminAccess={onAdminAccess}
        isMobile={isMobile}
        isCollapsed={isCollapsed}
      />

      <ChannelStatusSection
        channelsStatus={channelsStatus}
        channelsLoading={channelsLoading}
        isMobile={isMobile}
        isCollapsed={isCollapsed}
      />

      <SignOutButton
        onSignOut={onSignOut}
        isMobile={isMobile}
        isCollapsed={isCollapsed}
      />
    </div>
  );
};
