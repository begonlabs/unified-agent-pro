import React from 'react';
import { Users } from 'lucide-react';
import { ClientStatsProps } from '../types';

export const ClientStats: React.FC<ClientStatsProps> = ({ stats }) => {
  return (
    <div className="px-3 sm:px-6 pt-3 sm:pt-6">
      <div className="rounded-2xl p-4 sm:p-6 bg-gradient-to-r from-[#3a0caa] to-[#710db2] text-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 rounded-lg bg-white/20">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                CRM - Gestión de Clientes
              </h1>
              <p className="text-white/80 text-sm">
                Administra tus leads, prospectos y clientes
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 text-center">
            <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-white/80">Total</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-200">{stats.leads}</div>
              <div className="text-xs text-white/80">Leads</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-200">{stats.prospects}</div>
              <div className="text-xs text-white/80">Prospectos</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-200">{stats.active}</div>
              <div className="text-xs text-white/80">Activos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
