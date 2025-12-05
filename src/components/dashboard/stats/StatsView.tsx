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

  // Show restricted view if no access
  if (!hasAccess) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <Card className="max-w-2xl w-full shadow-lg border-blue-100">
          <CardContent className="p-8 text-center space-y-6">
            <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-10 w-10 text-blue-600" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Estadísticas Avanzadas</h2>
              <p className="text-gray-500 max-w-md mx-auto">
                Obtén insights valiosos sobre tu rendimiento, actividad de canales y automatizaciones.
                Esta función está disponible en los planes Avanzado, Pro y Empresarial.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-lg mx-auto py-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">KPIs en tiempo real</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-sm font-medium">Gráficos de actividad</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <span className="text-sm font-medium">Análisis de canales</span>
              </div>
            </div>

            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
              onClick={() => window.location.href = '/dashboard?view=profile&tab=subscription'}
            >
              <Lock className="h-4 w-4 mr-2" />
              Actualizar Plan para Ver Estadísticas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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
  );
};

export default StatsView;
