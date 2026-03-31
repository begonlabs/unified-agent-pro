import React, { useCallback, useMemo } from 'react';
import { 
  useSidebarNavigation,
  useSidebarState,
  SidebarContent,
  MobileSidebar,
  SidebarProps
} from './index';

/**
 * Props optimizadas para ResponsiveSidebar
 */
interface OptimizedSidebarProps extends Omit<SidebarProps, 'setCurrentView'> {
  currentView: string;
  onViewChange: (view: string) => void;
  user: any;
}

/**
 * ResponsiveSidebar optimizado con memoización y callbacks estables
 */
const ResponsiveSidebarOptimized: React.FC<OptimizedSidebarProps> = ({
  currentView,
  onViewChange,
  onSignOut,
  user
}) => {
  // Hooks optimizados
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
  } = useSidebarNavigation(currentView, onViewChange, user);

  const { isMenuActive, isCollapsed, toggleCollapse, activateMenu } = useSidebarState();

  /**
   * Callbacks memoizados para evitar re-renderizados innecesarios
   */
  const memoizedHandleViewChange = useCallback((view: string) => {
    handleViewChange(view);
  }, [handleViewChange]);

  const memoizedHandleAdminAccess = useCallback(() => {
    handleAdminAccess();
  }, [handleAdminAccess]);

  const memoizedToggleSidebar = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  const memoizedCloseSidebar = useCallback(() => {
    closeSidebar();
  }, [closeSidebar]);

  const memoizedActivateMenu = useCallback(() => {
    activateMenu();
  }, [activateMenu]);

  const memoizedToggleCollapse = useCallback(() => {
    toggleCollapse();
  }, [toggleCollapse]);

  /**
   * Props memoizadas para SidebarContent
   */
  const sidebarContentProps = useMemo(() => ({
    currentView,
    setCurrentView: onViewChange,
    onSignOut,
    user,
    isAdmin,
    adminLoading,
    channelsStatus,
    channelsLoading,
    onAdminAccess: memoizedHandleAdminAccess,
    onViewChange: memoizedHandleViewChange,
    isMobile: false,
    isCollapsed,
    onToggleCollapse: memoizedToggleCollapse,
  }), [
    currentView,
    onViewChange,
    onSignOut,
    user,
    isAdmin,
    adminLoading,
    channelsStatus,
    channelsLoading,
    memoizedHandleAdminAccess,
    memoizedHandleViewChange,
    isCollapsed,
    memoizedToggleCollapse,
  ]);

  /**
   * Props memoizadas para MobileSidebar
   */
  const mobileSidebarProps = useMemo(() => ({
    currentView,
    setCurrentView: onViewChange,
    onSignOut,
    user,
    isAdmin,
    adminLoading,
    channelsStatus,
    channelsLoading,
    isOpen,
    onToggle: memoizedToggleSidebar,
    onClose: memoizedCloseSidebar,
    onAdminAccess: memoizedHandleAdminAccess,
    onViewChange: memoizedHandleViewChange,
    isMenuActive,
    onMenuActivate: memoizedActivateMenu,
  }), [
    currentView,
    onViewChange,
    onSignOut,
    user,
    isAdmin,
    adminLoading,
    channelsStatus,
    channelsLoading,
    isOpen,
    memoizedToggleSidebar,
    memoizedCloseSidebar,
    memoizedHandleAdminAccess,
    memoizedHandleViewChange,
    isMenuActive,
    memoizedActivateMenu,
  ]);

  /**
   * Renderizado condicional optimizado
   */
  if (!isMobile) {
    return (
      <div className="sticky top-0 h-screen z-40">
        <SidebarContent {...sidebarContentProps} />
      </div>
    );
  }

  return (
    <MobileSidebar {...mobileSidebarProps}>
      <SidebarContent {...sidebarContentProps} isMobile={true} />
    </MobileSidebar>
  );
};

export default ResponsiveSidebarOptimized;
