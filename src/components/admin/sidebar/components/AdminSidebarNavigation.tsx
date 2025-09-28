import React from 'react';
import { AdminSidebarNavigationProps } from '../types';
import { AdminSidebarService } from '../services/adminSidebarService';

export const AdminSidebarNavigation: React.FC<AdminSidebarNavigationProps> = ({
  menuItems,
  activeTab,
  onTabChange
}) => {
  const handleMenuClick = (itemId: string) => {
    if (onTabChange) {
      onTabChange(itemId);
    }
  };

  return (
    <div className="flex-1 p-4">
      <div className="space-y-2">
        <div className="px-3 py-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Administración
          </h3>
        </div>
        
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive
                    ? AdminSidebarService.getActiveMenuItemClasses()
                    : AdminSidebarService.getInactiveMenuItemClasses()
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? AdminSidebarService.getActiveIconClasses() : ''}`} />
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
