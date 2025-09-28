import React from 'react';
import { Tabs } from '@/components/ui/tabs';
import { AdminPanelProps } from './types';
import { useAdminPanel } from './hooks/useAdminPanel';
import {
  AdminPanelHeader,
  AdminPanelNavigation,
  AdminPanelContent
} from './components/index';

const AdminPanel: React.FC<AdminPanelProps> = ({ user }) => {
  const {
    activeTab,
    supportView,
    setActiveTab,
    setSupportView,
    tabs
  } = useAdminPanel();

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <AdminPanelHeader user={user} />
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <AdminPanelNavigation 
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          
          <AdminPanelContent 
            tabs={tabs}
            activeTab={activeTab}
            supportView={supportView}
            onSupportViewChange={setSupportView}
          />
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
