import { useNavigate } from 'react-router-dom';
import { AdminSidebarService } from '../services/adminSidebarService';
import { UseAdminSidebarReturn } from '../types';

export const useAdminSidebar = (): UseAdminSidebarReturn => {
  const navigate = useNavigate();

  // Get menu items from service
  const menuItems = AdminSidebarService.getMenuItems();

  // Handle menu item click
  const handleMenuClick = (itemId: string) => {
    // This will be handled by the parent component through onTabChange
    console.log('Menu item clicked:', itemId);
  };

  // Handle back to dashboard navigation
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return {
    menuItems,
    handleMenuClick,
    handleBackToDashboard
  };
};
