import { useState, useEffect } from 'react';
import { SidebarState } from '../types';

export const useSidebarState = () => {
  const [isMenuActive, setIsMenuActive] = useState(false);
  
  // Estado colapsado con persistencia
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  
  // Efecto para volver a semitransparente después de unos segundos
  useEffect(() => {
    if (isMenuActive) {
      const timer = setTimeout(() => {
        setIsMenuActive(false);
      }, 3000); // 3 segundos
      
      return () => clearTimeout(timer);
    }
  }, [isMenuActive]);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebar-collapsed', String(newState));
      return newState;
    });
  };

  const activateMenu = () => {
    setIsMenuActive(true);
  };

  const deactivateMenu = () => {
    setIsMenuActive(false);
  };

  return {
    isMenuActive,
    isCollapsed,
    toggleCollapse,
    activateMenu,
    deactivateMenu
  };
};
