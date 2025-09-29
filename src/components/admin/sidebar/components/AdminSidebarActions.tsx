import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut } from 'lucide-react';
import { AdminSidebarActionsProps } from '../types';
import { AdminSidebarService } from '../services/adminSidebarService';

export const AdminSidebarActions: React.FC<AdminSidebarActionsProps> = ({
  onSignOut,
  onBackToDashboard
}) => {
  const buttonClasses = AdminSidebarService.getButtonClasses();
  const fullButtonClasses = `${buttonClasses.base} ${buttonClasses.hover} ${buttonClasses.border}`;

  const handleBackToDashboard = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 space-y-2">
      <Button
        variant="outline"
        className={`${fullButtonClasses} justify-start gap-3`}
        onClick={handleBackToDashboard}
      >
        <ArrowLeft className="h-5 w-5" />
        Volver al Dashboard
      </Button>
      
      <Button
        variant="outline"
        className={`${fullButtonClasses} justify-start gap-3`}
        onClick={onSignOut}
      >
        <LogOut className="h-5 w-5" />
        Cerrar Sesión Admin
      </Button>
    </div>
  );
};
