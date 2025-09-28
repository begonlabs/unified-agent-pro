import { useState } from 'react';
import { AdminPanelService } from '../services/adminPanelService';
import { UseAdminPanelReturn } from '../types';

export const useAdminPanel = (): UseAdminPanelReturn => {
  const [activeTab, setActiveTab] = useState('clients');
  const [supportView, setSupportView] = useState('messages');

  // Get tab configuration from service
  const tabConfig = AdminPanelService.getTabConfiguration();
  const tabs = tabConfig.tabs;

  return {
    activeTab,
    supportView,
    setActiveTab,
    setSupportView,
    tabs
  };
};
