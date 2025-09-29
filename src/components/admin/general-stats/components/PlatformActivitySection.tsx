import React from 'react';
import { MessageSquare, UserPlus, MessageCircle, TrendingUp, Activity } from 'lucide-react';
import { PlatformActivitySectionProps } from '../types';
import { StatCard } from './StatCard';

export const PlatformActivitySection: React.FC<PlatformActivitySectionProps> = ({ stats }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Activity className="h-6 w-6 text-[#3a0caa]" />
        <span className="text-transparent bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text">Actividad de la Plataforma</span>
      </h3>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Mensajes"
          value={stats.total_messages_platform}
          description="Mensajes procesados"
          icon={MessageSquare}
        />

        <StatCard
          title="Total Leads"
          value={stats.total_leads_platform}
          description="Leads generados"
          icon={UserPlus}
        />

        <StatCard
          title="Conversaciones"
          value={stats.total_conversations}
          description="Conversaciones activas"
          icon={MessageCircle}
        />

        <StatCard
          title="Clientes Activos"
          value={stats.active_clients}
          description="Clientes activos"
          icon={TrendingUp}
          iconColor="text-green-500"
          showPercentage={true}
          totalValue={stats.total_clients}
        />
      </div>
    </div>
  );
};
