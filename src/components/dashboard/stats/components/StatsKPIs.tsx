import React from 'react';
import { MessageSquare, TrendingUp, Users, Bot } from 'lucide-react';
import { StatCard } from './StatCard';
import { StatsData } from '../types';

interface StatsKPIsProps {
  stats: StatsData;
}

export const StatsKPIs: React.FC<StatsKPIsProps> = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <StatCard
      title="Mensajes Totales"
      value={stats.totalMessages.toLocaleString()}
      icon={MessageSquare}
      color="text-blue-600"
      subtitle="+12% vs mes anterior"
    />
    <StatCard
      title="Tasa de Respuesta"
      value={`${stats.responseRate}%`}
      icon={TrendingUp}
      color="text-green-600"
      subtitle="+2.3% vs mes anterior"
    />
    <StatCard
      title="Nuevos Leads"
      value={stats.newLeads}
      icon={Users}
      color="text-purple-600"
      subtitle="+8% vs mes anterior"
    />
    <StatCard
      title="Mensajes IA"
      value={`${stats.totalMessages > 0 ? ((stats.automatedMessages / stats.totalMessages) * 100).toFixed(1) : '0.0'}%`}
      icon={Bot}
      color="text-emerald-600"
      subtitle="Automatización"
    />
  </div>
);
