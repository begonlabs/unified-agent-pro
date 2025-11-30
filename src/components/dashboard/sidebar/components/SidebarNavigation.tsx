import React from 'react';
import { Button } from '@/components/ui/button';
import { SidebarService } from '../services/sidebarService';
import { MenuItem } from '../types';

interface SidebarNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isMobile?: boolean;
  isCollapsed?: boolean;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  currentView,
  onViewChange,
  isMobile = false,
  isCollapsed = false
}) => {
  const menuItems = SidebarService.getMenuItems();

  return (
    <nav className={`flex-1 p-2 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto ${isMobile ? 'p-2' : 'p-4'}`}>
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.id}
            variant={currentView === item.id ? "default" : "ghost"}
            className={`w-full ${isCollapsed ? 'justify-center' : 'justify-start'} gap-2 sm:gap-3 ${isMobile
                ? 'text-sm h-9'
                : 'text-base h-11'
              }`}
            onClick={() => onViewChange(item.id)}
          >
            <Icon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
            {!isCollapsed && (
              <span className={isMobile ? 'hidden sm:inline' : ''}>
                {item.label}
              </span>
            )}
            {isMobile && !isCollapsed && (
              <span className="sm:hidden">
                {item.shortLabel || item.label.split(' ')[0]}
              </span>
            )}
          </Button>
        );
      })}
    </nav>
  );
};
