import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useSidebar } from '@/hooks/useSidebar';
import { useAdminSidebar } from './hooks/useAdminSidebar';
import { AdminSidebarProps } from './types';
import {
  AdminSidebarHeader,
  AdminSidebarNavigation,
  AdminSidebarStatus,
  AdminSidebarActions
} from './components';

const ResponsiveAdminSidebar = ({ onSignOut, activeTab = 'clients', onTabChange }: AdminSidebarProps) => {
  const { isOpen, isMobile, toggleSidebar, closeSidebar } = useSidebar();
  const [isMenuActive, setIsMenuActive] = useState(false);
  const { menuItems, handleBackToDashboard } = useAdminSidebar();
  
  // Efecto para volver a semitransparente después de unos segundos
  useEffect(() => {
    if (isMenuActive) {
      const timer = setTimeout(() => {
        setIsMenuActive(false);
      }, 3000); // 3 segundos
      
      return () => clearTimeout(timer);
    }
  }, [isMenuActive]);

  const handleMenuClick = (itemId: string) => {
    if (onTabChange) {
      onTabChange(itemId);
    }
    closeSidebar();
  };

  const handleBackToDashboardWithClose = () => {
    handleBackToDashboard();
    closeSidebar();
  };

  const SidebarContent = () => (
    <div className="w-72 bg-white shadow-lg h-full flex flex-col border-r border-gray-200">
      <AdminSidebarHeader />
      <AdminSidebarNavigation 
        menuItems={menuItems}
        activeTab={activeTab}
        onTabChange={handleMenuClick}
      />
      <AdminSidebarStatus />
      <AdminSidebarActions 
        onSignOut={onSignOut} 
        onBackToDashboard={handleBackToDashboardWithClose}
      />
    </div>
  );

  // Desktop Sidebar (fixed)
  if (!isMobile) {
    return (
      <div className="sticky top-0 h-screen">
        <SidebarContent />
      </div>
    );
  }

  // Mobile Sidebar (drawer)
  return (
    <Sheet open={isOpen} onOpenChange={toggleSidebar}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMenuActive(true)}
          className={`fixed top-2 left-0 z-50 lg:hidden shadow-lg hover:shadow-xl rounded-l-none rounded-r-lg p-2 transition-all duration-300 ${
            isMenuActive 
              ? 'bg-white opacity-100' 
              : 'bg-white/70 opacity-70 hover:opacity-100'
          }`}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72">
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );
};

export default ResponsiveAdminSidebar;
