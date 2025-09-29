import React from 'react';
import { useGeneralStats } from './hooks/useGeneralStats';
import { ClientStatsSection } from './components/ClientStatsSection';
import { PlatformActivitySection } from './components/PlatformActivitySection';
import { ChannelActivitySection } from './components/ChannelActivitySection';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { ErrorState } from './components/ErrorState';

const GeneralStats: React.FC = () => {
  const { stats, loading, fetchGeneralStats } = useGeneralStats();

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!stats) {
    return <ErrorState onRetry={fetchGeneralStats} />;
  }

  return (
    <div className="space-y-6">
      <ClientStatsSection stats={stats} />
      <PlatformActivitySection stats={stats} />
      <ChannelActivitySection stats={stats} />
    </div>
  );
};

export default GeneralStats;
