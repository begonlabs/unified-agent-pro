import React from 'react';
import logoWhite from '@/assets/logo_white.png';

export const AdminSidebarHeader: React.FC = () => (
  <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#3a0caa] to-[#710db2]">
    <div className="flex items-center gap-3">
      <div className="relative">
        <img src={logoWhite} alt="OndAI Logo" className="h-8 w-8" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-white">Panel Admin</h1>
        <p className="text-sm text-white/80">
          Gestión de la Plataforma
        </p>
      </div>
    </div>
  </div>
);
