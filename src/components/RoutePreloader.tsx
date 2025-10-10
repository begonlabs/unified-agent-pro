import React from 'react';
import { useRoutePreloader, useInteractionBasedPreload, useIdlePreload } from '@/hooks/useRoutePreloader';

/**
 * Componente para preloading automático
 * Separado del archivo de hooks para evitar warnings de react-refresh
 */
export const RoutePreloader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useRoutePreloader();
  useInteractionBasedPreload();
  useIdlePreload();

  return <>{children}</>;
};
