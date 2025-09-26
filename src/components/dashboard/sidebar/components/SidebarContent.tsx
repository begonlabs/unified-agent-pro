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
  isMobile = false
}) => {
  return (
    <div className="w-64 bg-white shadow-lg h-full flex flex-col">
      <SidebarHeader isMobile={isMobile} />
      
      <SidebarNavigation
        currentView={currentView}
        onViewChange={onViewChange}
        isMobile={isMobile}
      />

      <AdminSection
        isAdmin={isAdmin}
        adminLoading={adminLoading}
        onAdminAccess={onAdminAccess}
        isMobile={isMobile}
      />

      <ChannelStatusSection
        channelsStatus={channelsStatus}
        channelsLoading={channelsLoading}
        isMobile={isMobile}
      />

      <SignOutButton
        onSignOut={onSignOut}
        isMobile={isMobile}
      />
    </div>
  );
};
