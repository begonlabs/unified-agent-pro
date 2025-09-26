import { useState, useEffect } from 'react';
import { SidebarState } from '../types';

export const useSidebarState = () => {
  const [isMenuActive, setIsMenuActive] = useState(false);
  
  // Efecto para volver a semitransparente después de unos segundos
  useEffect(() => {
    if (isMenuActive) {
      const timer = setTimeout(() => {
        setIsMenuActive(false);
      }, 3000); // 3 segundos
      
      return () => clearTimeout(timer);
    }
  }, [isMenuActive]);

  const activateMenu = () => {
    setIsMenuActive(true);
  };

  const deactivateMenu = () => {
    setIsMenuActive(false);
  };

  return {
    isMenuActive,
    activateMenu,
    deactivateMenu
  };
};
