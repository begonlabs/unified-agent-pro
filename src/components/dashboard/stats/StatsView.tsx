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
import { useProfile } from '@/components/dashboard/profile/hooks/useProfile';
import { hasStatisticsAccess, getMessageUsagePercentage, PLAN_LIMITS } from '@/lib/channelPermissions';
import { Lock, BarChart3, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const StatsView: React.FC<StatsViewProps> = ({ user: propUser }) => {
  // Get user from auth if not provided as prop
  const { user: authUser, loading: authLoading } = useAuth();
  const user = propUser || authUser;

  // Profile and Permissions
  const { profile } = useProfile(user);
  const hasAccess = profile ? hasStatisticsAccess(profile) : true;

  // Hooks
  // Hooks
  const { timeRange, setTimeRange, dateRange, setDateRange, timeRangeOptions } = useTimeRange();
  const { stats, chartData, loading } = useStats(user, timeRange, dateRange);

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
    <div className="relative min-h-screen bg-gray-50 p-6">
      {!hasAccess && (
        <div className="absolute inset-x-3 inset-y-3 sm:inset-x-6 sm:inset-y-6 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-50/60 backdrop-blur-[2px] rounded-xl" />
          <div className="relative bg-white p-6 md:p-8 rounded-xl shadow-xl border border-gray-200 max-w-md text-center m-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200 ring-4 ring-gray-50">
              <Lock className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Estadísticas Bloqueadas</h3>
            <p className="text-gray-600 mb-6 font-medium">
              Obtén datos valiosos sobre tu rendimiento y canales. Esta función está disponible en planes superiores.
            </p>
            <button
              onClick={() => window.location.href = '/dashboard?view=profile&tab=subscription'}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors w-full shadow-sm"
            >
              Mejorar Plan
            </button>
          </div>
        </div>
      )}

      <div className={`space-y-6 ${!hasAccess ? 'pointer-events-none select-none opacity-60' : ''}`}>
        {/* Header with time range selector */}
      <StatsHeader
        userEmail={user.email || 'Usuario'}
        timeRange={timeRange}
        timeRangeOptions={timeRangeOptions}
        onTimeRangeChange={setTimeRange}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {/* Loading State */}
      {loading && <LoadingState />}

      {/* KPI Cards */}
      {!loading && <StatsKPIs stats={stats} />}

      {/* Plan Usage Card */}
      {profile && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-600" />
              Consumo de Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Mensajes IA Enviados</span>
                  <span className="text-sm text-gray-500">
                    {profile.messages_sent_this_month || 0} / {profile.messages_limit ?? PLAN_LIMITS[profile.plan_type]?.messages ?? 0}
                  </span>
                </div>
                <div className="relative">
                  <Progress
                    value={getMessageUsagePercentage(profile)}
                    className="h-3 bg-gray-100 border border-gray-200"
                    indicatorClassName={`${getMessageUsagePercentage(profile) >= 90
                        ? 'bg-gradient-to-r from-amber-500 to-red-500'
                        : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
                      } transition-all duration-1000 ease-out`}
                  />
                  {/* Shimmer overlay */}
                  <div
                    className="absolute top-0 left-0 h-full w-full overflow-hidden rounded-full pointer-events-none"
                    style={{ width: `${getMessageUsagePercentage(profile)}%` }}
                  >
                    <div className="h-full w-full animate-shimmer"></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Se renueva el {new Date(profile.subscription_end || new Date()).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
    </div>
  );
};

export default StatsView;
