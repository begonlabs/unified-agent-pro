import React from 'react';
import { AdminSidebarProps } from './types';
import { useAdminSidebar } from './hooks/useAdminSidebar';
import {
  AdminSidebarHeader,
  AdminSidebarNavigation,
  AdminSidebarStatus,
  AdminSidebarActions
} from './components/index';

const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  onSignOut, 
  activeTab = 'clients', 
  onTabChange 
}) => {
  const { menuItems } = useAdminSidebar();

  return (
    <div className="w-72 bg-white shadow-lg h-screen flex flex-col border-r border-gray-200">
      <AdminSidebarHeader />
      <AdminSidebarNavigation 
        menuItems={menuItems}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
      <AdminSidebarStatus />
      <AdminSidebarActions onSignOut={onSignOut} />
    </div>
  );
};

export default AdminSidebar;
