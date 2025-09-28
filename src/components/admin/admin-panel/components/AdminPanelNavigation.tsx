import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminPanelNavigationProps } from '../types';
import { AdminPanelService } from '../services/adminPanelService';

export const AdminPanelNavigation: React.FC<AdminPanelNavigationProps> = ({
  tabs,
  activeTab,
  onTabChange
}) => {
  const breakpoints = AdminPanelService.getBreakpoints();
  const activeTabClasses = AdminPanelService.getActiveTabClasses();
  const mobileTabClasses = AdminPanelService.getMobileTabClasses();
  const desktopTabClasses = AdminPanelService.getDesktopTabClasses();

  return (
    <>
      {/* Mobile Navigation - Scrollable */}
      <div className={breakpoints.mobile}>
        <div className="flex overflow-x-auto space-x-2 pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={`${mobileTabClasses} ${activeTabClasses}`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.shortTitle}</span>
              </TabsTrigger>
            );
          })}
        </div>
      </div>

      {/* Desktop Navigation */}
      <TabsList className={`${breakpoints.desktop} w-full grid-cols-5 bg-white shadow-sm`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={`${desktopTabClasses} ${activeTabClasses}`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.title}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </>
  );
};
