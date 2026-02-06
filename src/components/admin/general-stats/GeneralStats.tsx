import React from 'react';
import { useGeneralStats } from './hooks/useGeneralStats';
import { ClientStatsSection } from './components/ClientStatsSection';
import { PlatformActivitySection } from './components/PlatformActivitySection';
import { ChannelActivitySection } from './components/ChannelActivitySection';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { ErrorState } from './components/ErrorState';
import { ActivityChartsSection } from './components/ActivityChartsSection';

const GeneralStats: React.FC = () => {
  const { stats, loading, fetchGeneralStats } = useGeneralStats();

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!stats) {
    return <ErrorState onRetry={fetchGeneralStats} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Estadísticas Generales</h2>
        <p className="text-muted-foreground">
          Visualiza el rendimiento global de la plataforma y el crecimiento de clientes.
        </p>
      </div>

      <ClientStatsSection stats={stats} />

      <ActivityChartsSection stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <PlatformActivitySection stats={stats} />
        <ChannelActivitySection stats={stats} />
      </div>
    </div>
  );
};

export default GeneralStats;
