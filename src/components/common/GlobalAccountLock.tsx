import React from 'react';
import { Lock, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GlobalAccountLockProps {
  onSignOut: () => void;
}

export const GlobalAccountLock: React.FC<GlobalAccountLockProps> = ({ onSignOut }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-white/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-red-100 rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Suscripción Inactiva
        </h2>
        <p className="text-gray-600 mb-6">
          Tu plan ha sido cancelado. Ya no tienes acceso a las funciones de la plataforma. Para restablecer el servicio puedes iniciar sesión con otra cuenta corporativa.
        </p>
        <div className="space-y-3">
          <Button 
            className="w-full bg-red-600 hover:bg-red-700 text-white" 
            onClick={onSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
  );
};
