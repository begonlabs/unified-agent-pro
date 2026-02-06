import React from 'react';
import { Users, UserCheck } from 'lucide-react';
import { ClientStatsSectionProps, PlanType } from '../types';
import { GeneralStatsService } from '../services/generalStatsService';
import { StatCard } from './StatCard';

export const ClientStatsSection: React.FC<ClientStatsSectionProps> = ({ stats }) => {
  const plans: { key: string; label: string; value: number; type: PlanType }[] = [
    { key: 'free', label: 'Plan Gratuito', value: stats.free_clients, type: 'free' },
    { key: 'basico', label: 'Plan Básico', value: stats.basico_clients, type: 'basico' },
    { key: 'avanzado', label: 'Plan Avanzado', value: stats.avanzado_clients, type: 'avanzado' },
    { key: 'pro', label: 'Plan Pro', value: stats.pro_clients, type: 'pro' },
    { key: 'empresarial', label: 'Plan Empresarial', value: stats.empresarial_clients, type: 'empresarial' }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <UserCheck className="h-6 w-6 text-[#3a0caa]" />
        <span className="text-transparent bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text">Resumen de Clientes</span>
      </h3>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          title="Total Clientes"
          value={stats.total_clients}
          description="Usuarios registrados"
          icon={Users}
        />

        {plans.map((plan) => (
          <StatCard
            key={plan.key}
            title={plan.label}
            value={plan.value}
            description={GeneralStatsService.getPlanDisplayName(plan.type)}
            icon={Users}
            iconColor={GeneralStatsService.getPlanIconColor(plan.type)}
            showPercentage={true}
            totalValue={stats.total_clients}
          />
        ))}
      </div>
    </div>
  );
};
