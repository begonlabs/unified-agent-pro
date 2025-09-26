import React from 'react';
import { 
  useSidebarNavigation,
  useSidebarState,
  SidebarContent,
  MobileSidebar,
  SidebarProps
} from './index';

const ResponsiveSidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  onSignOut,
  user
}) => {
  const {
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
  } = useSidebarNavigation(currentView, setCurrentView, user);

  const { isMenuActive, activateMenu } = useSidebarState();

  // Desktop Sidebar (fixed)
  if (!isMobile) {
    return (
      <div className="sticky top-0 h-screen">
        <SidebarContent
          currentView={currentView}
          setCurrentView={setCurrentView}
          onSignOut={onSignOut}
          user={user}
          isAdmin={isAdmin}
          adminLoading={adminLoading}
          channelsStatus={channelsStatus}
          channelsLoading={channelsLoading}
          onAdminAccess={handleAdminAccess}
          onViewChange={handleViewChange}
          isMobile={false}
        />
      </div>
    );
  }

  // Mobile Sidebar (drawer)
  return (
    <MobileSidebar
      isOpen={isOpen}
      isMenuActive={isMenuActive}
      onToggle={toggleSidebar}
      onMenuActivate={activateMenu}
    >
      <SidebarContent
        currentView={currentView}
        setCurrentView={setCurrentView}
        onSignOut={onSignOut}
        user={user}
        isAdmin={isAdmin}
        adminLoading={adminLoading}
        channelsStatus={channelsStatus}
        channelsLoading={channelsLoading}
        onAdminAccess={handleAdminAccess}
        onViewChange={handleViewChange}
        isMobile={true}
      />
    </MobileSidebar>
  );
};

export default ResponsiveSidebar;
