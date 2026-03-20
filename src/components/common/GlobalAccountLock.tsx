import React from 'react';
import { Lock, LogOut, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GlobalAccountLockProps {
  onSignOut: () => void;
  isTrialExpired?: boolean;
}

export const GlobalAccountLock: React.FC<GlobalAccountLockProps> = ({ onSignOut, isTrialExpired }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-white/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-red-100 rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isTrialExpired ? "Prueba Gratuita Finalizada" : "Suscripción Inactiva"}
        </h2>
        <p className="text-gray-600 mb-6">
          {isTrialExpired 
            ? "Tu plan gratuito ya venció. Por favor contrata un plan de pago para continuar usando la plataforma."
            : "Tu plan ha sido cancelado. Ya no tienes acceso a las funciones de la plataforma."}
        </p>
        <div className="space-y-3">
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white" 
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('view', 'profile');
              url.searchParams.set('tab', 'plans');
              window.location.href = url.toString();
            }}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Renovar Plan
          </Button>
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
