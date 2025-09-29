import React from 'react';
import { Users, UserCheck } from 'lucide-react';
import { ClientStatsSectionProps } from '../types';
import { GeneralStatsService } from '../services/generalStatsService';
import { StatCard } from './StatCard';

export const ClientStatsSection: React.FC<ClientStatsSectionProps> = ({ stats }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <UserCheck className="h-6 w-6 text-[#3a0caa]" />
        <span className="text-transparent bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text">Resumen de Clientes</span>
      </h3>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clientes"
          value={stats.total_clients}
          description="Usuarios registrados"
          icon={Users}
        />

        <StatCard
          title="Plan Gratuito"
          value={stats.free_clients}
          description="Usuarios gratuitos"
          icon={Users}
          iconColor={GeneralStatsService.getPlanIconColor('free')}
          showPercentage={true}
          totalValue={stats.total_clients}
        />

        <StatCard
          title="Plan Premium"
          value={stats.premium_clients}
          description="Usuarios premium"
          icon={Users}
          iconColor={GeneralStatsService.getPlanIconColor('premium')}
          showPercentage={true}
          totalValue={stats.total_clients}
        />

        <StatCard
          title="Plan Enterprise"
          value={stats.enterprise_clients}
          description="Usuarios enterprise"
          icon={Users}
          iconColor={GeneralStatsService.getPlanIconColor('enterprise')}
          showPercentage={true}
          totalValue={stats.total_clients}
        />
      </div>
    </div>
  );
};
