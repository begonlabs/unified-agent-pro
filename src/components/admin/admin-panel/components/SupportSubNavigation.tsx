import React from 'react';
import { MessageSquare, TrendingUp } from 'lucide-react';
import { SupportSubNavigationProps } from '../types';
import { AdminPanelService } from '../services/adminPanelService';

export const SupportSubNavigation: React.FC<SupportSubNavigationProps> = ({
  supportView,
  onSupportViewChange
}) => {
  const supportSubNav = AdminPanelService.getSupportSubNavigation();

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {supportSubNav.map((item) => {
        const Icon = item.icon;
        const isActive = supportView === item.id;
        const buttonClasses = AdminPanelService.getSupportButtonClasses(isActive);

        return (
          <button
            key={item.id}
            onClick={() => onSupportViewChange(item.id)}
            className={buttonClasses}
          >
            <Icon className="h-4 w-4 inline mr-2" />
            {item.title}
          </button>
        );
      })}
    </div>
  );
};
