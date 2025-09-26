import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Crown } from 'lucide-react';

interface AdminSectionProps {
  isAdmin: boolean;
  adminLoading: boolean;
  onAdminAccess: () => void;
  isMobile?: boolean;
}

export const AdminSection: React.FC<AdminSectionProps> = ({
  isAdmin,
  adminLoading,
  onAdminAccess,
  isMobile = false
}) => {
  if (adminLoading || !isAdmin) {
    return null;
  }

  return (
    <div className={`p-2 sm:p-4 border-t border-[#3a0caa]/20 bg-gradient-to-b from-[#3a0caa]/5 to-[#710db2]/5 ${isMobile ? 'p-2' : 'p-4'}`}>
      {!isMobile && (
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#3a0caa] flex items-center gap-2">
            <Crown className="h-4 w-4 text-[#3a0caa]" />
            Panel Admin
          </h3>
          <Badge 
            variant="secondary" 
            className="bg-gradient-to-r from-[#3a0caa]/10 to-[#710db2]/10 text-[#3a0caa] border-[#3a0caa]/20 text-xs"
          >
            Administrador
          </Badge>
        </div>
      )}
      
      <Button
        onClick={onAdminAccess}
        className={`w-full justify-start gap-2 sm:gap-3 bg-gradient-to-r from-[#3a0caa] to-[#710db2] hover:from-[#270a59] hover:to-[#2b0a63] text-white shadow-lg hover:shadow-xl transition-all duration-300 ${
          isMobile 
            ? 'text-sm h-9' 
            : 'text-base h-10 transform hover:scale-105'
        }`}
      >
        <Shield className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
        <span className={isMobile ? 'hidden sm:inline' : ''}>
          Dashboard Admin
        </span>
        {isMobile && (
          <span className="sm:hidden">Admin</span>
        )}
      </Button>
      
      {!isMobile && (
        <p className="text-xs text-[#3a0caa] mt-2 leading-relaxed">
          Acceso completo a la gestión de la plataforma
        </p>
      )}
    </div>
  );
};
