import React from 'react';
import logoWhite from '@/assets/logo_white.png';

interface SidebarHeaderProps {
  isMobile?: boolean;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ isMobile = false }) => {
  return (
    <div className={`p-3 sm:p-6 border-b bg-gradient-to-r from-[#3a0caa]/5 to-[#710db2]/5 ${isMobile ? 'p-3' : 'p-6'}`}>
      <div className="flex items-center gap-2 sm:gap-3 group">
        <div className="relative">
          <img 
            src={logoWhite} 
            alt="OndAI Logo" 
            className={`group-hover:scale-110 transition-all duration-300 ${
              isMobile ? 'h-6 w-6' : 'h-8 w-8'
            }`} 
          />
        </div>
        <div>
          <h1 className={`font-bold text-transparent bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text group-hover:from-[#270a59] group-hover:to-[#2b0a63] transition-all duration-300 ${
            isMobile ? 'text-lg' : 'text-xl'
          }`}>
            OndAI
          </h1>
          <p className={`text-gray-500 font-medium ${isMobile ? 'text-xs hidden sm:block' : 'text-sm'}`}>
            Powered by AI
          </p>
        </div>
      </div>
    </div>
  );
};
