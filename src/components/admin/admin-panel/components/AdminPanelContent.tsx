import React, { Suspense } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { AdminPanelContentProps } from '../types';
import { SupportSubNavigation } from './SupportSubNavigation';
import { AdminPanelService } from '../services/adminPanelService';

export const AdminPanelContent: React.FC<AdminPanelContentProps> = ({
  tabs,
  activeTab,
  supportView,
  onSupportViewChange
}) => {
  const supportSubNav = AdminPanelService.getSupportSubNavigation();

  const renderTabContent = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return null;

    const Component = tab.component;

    if (tabId === 'support') {
      return (
        <div className="space-y-6">
          <SupportSubNavigation 
            supportView={supportView}
            onSupportViewChange={onSupportViewChange}
          />
          
          <Suspense fallback={<div className="flex justify-center p-8">Cargando...</div>}>
            {supportView === 'messages' && (
              <Suspense fallback={<div className="flex justify-center p-8">Cargando mensajes...</div>}>
                {React.createElement(supportSubNav.find(item => item.id === 'messages')?.component || React.Fragment)}
              </Suspense>
            )}
            {supportView === 'stats' && (
              <Suspense fallback={<div className="flex justify-center p-8">Cargando estadísticas...</div>}>
                {React.createElement(supportSubNav.find(item => item.id === 'stats')?.component || React.Fragment)}
              </Suspense>
            )}
          </Suspense>
        </div>
      );
    }

    return (
      <Suspense fallback={<div className="flex justify-center p-8">Cargando...</div>}>
        <Component />
      </Suspense>
    );
  };

  return (
    <>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="space-y-6">
          {renderTabContent(tab.id)}
        </TabsContent>
      ))}
    </>
  );
};
