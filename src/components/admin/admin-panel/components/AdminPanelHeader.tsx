import React from 'react';
import logoWhite from '@/assets/logo_white.png';
import { AdminPanelHeaderProps } from '../types';
import { AdminPanelService } from '../services/adminPanelService';

export const AdminPanelHeader: React.FC<AdminPanelHeaderProps> = ({ user }) => {
  const headerConfig = AdminPanelService.getHeaderConfig();

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <img src={logoWhite} alt={headerConfig.logoAlt} className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text">
            {headerConfig.title}
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {headerConfig.subtitle}
          </p>
        </div>
      </div>
      <div className="mt-4 p-3 sm:p-4 bg-white rounded-lg shadow-sm border">
        <p className="text-sm text-gray-600">
          Conectado como: <span className="font-medium text-gray-900">{user.email}</span>
        </p>
      </div>
    </div>
  );
};
