import React from 'react';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  Star
} from 'lucide-react';
import logoWhite from '@/assets/logo_white.png';
import { useSupportStats } from './hooks';
import { SupportService } from './services';
import { StatsCard } from './components/StatsCard';
import { TicketDistribution } from './components/TicketDistribution';
import { TicketTrends } from './components/TicketTrends';

const SupportStats: React.FC = () => {
  const { stats, trends, loading, fetchStats } = useSupportStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Tickets"
          value={stats.totalTickets}
          description={`+${stats.ticketsThisWeek} esta semana`}
          icon={MessageSquare}
          iconColor="text-muted-foreground"
        />

        <StatsCard
          title="Tickets Abiertos"
          value={stats.openTickets}
          description={`${SupportService.calculatePercentage(stats.openTickets, stats.totalTickets)}% del total`}
          icon={AlertCircle}
          iconColor="text-red-500"
        />

        <StatsCard
          title="En Progreso"
          value={stats.inProgressTickets}
          description={`${SupportService.calculatePercentage(stats.inProgressTickets, stats.totalTickets)}% del total`}
          icon={Clock}
          iconColor="text-yellow-500"
        />

        <StatsCard
          title="Resueltos"
          value={stats.closedTickets}
          description={`${SupportService.calculatePercentage(stats.closedTickets, stats.totalTickets)}% del total`}
          icon={CheckCircle}
          iconColor="text-green-500"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tiempo Promedio"
          value={`${stats.avgResponseTime}h`}
          description="Tiempo de respuesta promedio"
          icon={Clock}
        />

        <StatsCard
          title="Satisfacción"
          value={`${stats.satisfactionRate}/5`}
          description="Calificación promedio"
          icon={Star}
          iconColor="text-yellow-500"
        />

        <StatsCard
          title="Esta Semana"
          value={stats.ticketsThisWeek}
          description="Tickets nuevos"
          icon={TrendingUp}
        />

        <StatsCard
          title="Este Mes"
          value={stats.ticketsThisMonth}
          description="Tickets nuevos"
          icon={Calendar}
        />
      </div>

      {/* Distribution and Trends */}
      <div className="grid gap-6 md:grid-cols-2">
        <TicketDistribution stats={stats} />
        <TicketTrends trends={trends} />
      </div>
    </div>
  );
};

export default SupportStats;
