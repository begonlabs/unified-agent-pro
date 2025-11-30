import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { StatsViewProps } from './types';
import { useStats, useTimeRange } from './hooks';
import { StatsService } from './services/statsService';
import {
  StatsHeader,
  StatsKPIs,
  ChannelChart,
  AutomationChart,
  ChannelDetails,
  DailyActivityChart,
  LoadingState,
  AuthErrorState,
  AuthLoadingState
} from './components';

const StatsView: React.FC<StatsViewProps> = ({ user: propUser }) => {
  // Get user from auth if not provided as prop
  const { user: authUser, loading: authLoading } = useAuth();
  const user = propUser || authUser;

  // Hooks
  // Hooks
  const { timeRange, setTimeRange, timeRangeOptions } = useTimeRange();
  const { stats, chartData, loading } = useStats(user, timeRange);

  // Calculate automation data for pie chart
  const automationData = StatsService.calculateAutomationData(stats);

  // Show loading while verifying authentication
  if (authLoading) {
    return <AuthLoadingState />;
  }

  // Show error if user is not authenticated
  if (!user) {
    return <AuthErrorState />;
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header with time range selector */}
      <StatsHeader
        userEmail={user.email || 'Usuario'}
        timeRange={timeRange}
        timeRangeOptions={timeRangeOptions}
        onTimeRangeChange={setTimeRange}
      />

      {/* Loading State */}
      {loading && <LoadingState />}

      {/* KPI Cards */}
      {!loading && <StatsKPIs stats={stats} />}

      {/* Charts Row 1 */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChannelChart channelData={chartData.channelData} />
          <AutomationChart automationData={automationData} />
        </div>
      )}

      {/* Channel Details */}
      {!loading && <ChannelDetails channelData={chartData.channelData} />}

      {/* Charts Row 2 */}
      {!loading && (
        <div className="grid grid-cols-1 gap-6">
          <DailyActivityChart dailyData={chartData.dailyData} />
        </div>
      )}
    </div>
  );
};

export default StatsView;
