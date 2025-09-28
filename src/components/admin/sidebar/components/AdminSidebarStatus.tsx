import React from 'react';
import { Shield } from 'lucide-react';
import { AdminSidebarService } from '../services/adminSidebarService';

export const AdminSidebarStatus: React.FC = () => {
  const statusInfo = AdminSidebarService.getAdminStatusInfo();

  return (
    <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-[#3a0caa]/5 to-[#710db2]/5">
      <div className="flex items-center gap-2 text-sm font-medium text-[#3a0caa] mb-3">
        <Shield className="h-4 w-4" />
        {statusInfo.title}
      </div>
      <p className="text-xs text-[#3a0caa]/70">
        {statusInfo.description}
      </p>
    </div>
  );
};
