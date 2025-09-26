import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface SignOutButtonProps {
  onSignOut: () => void;
  isMobile?: boolean;
}

export const SignOutButton: React.FC<SignOutButtonProps> = ({
  onSignOut,
  isMobile = false
}) => {
  return (
    <div className={`p-2 sm:p-4 border-t bg-gradient-to-b from-[#3a0caa]/5 to-[#710db2]/5 flex-shrink-0 ${isMobile ? 'p-2' : 'p-4'}`}>
      <Button
        variant="outline"
        className={`w-full justify-start gap-2 sm:gap-3 text-[#3a0caa] hover:bg-[#3a0caa]/10 border-[#3a0caa]/20 hover:border-[#3a0caa]/30 transition-all duration-300 ${
          isMobile 
            ? 'text-sm h-9' 
            : 'text-base h-10'
        }`}
        onClick={onSignOut}
      >
        <LogOut className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
        <span className={isMobile ? 'hidden sm:inline' : ''}>
          Cerrar Sesión
        </span>
        {isMobile && (
          <span className="sm:hidden">Salir</span>
        )}
      </Button>
    </div>
  );
};
