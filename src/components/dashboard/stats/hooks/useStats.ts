import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRefreshListener } from '@/hooks/useDataRefresh';
import { StatsService } from '../services/statsService';
import { StatsData, ChartData, User } from '../types';

export const useStats = (user: User | null) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData>({
    totalMessages: 0,
    automatedMessages: 0,
    humanMessages: 0,
    clientMessages: 0,
    responseRate: 0,
    newLeads: 0,
    totalClients: 0,
    totalConversations: 0
  });
  const [chartData, setChartData] = useState<ChartData>({
    channelData: [],
    dailyData: [],
    automationData: []
  });
  const { toast } = useToast();

  const fetchStats = useCallback(async () => {
    if (!user?.id) {
      setStats({
        totalMessages: 0,
        automatedMessages: 0,
        humanMessages: 0,
        clientMessages: 0,
        responseRate: 0,
        newLeads: 0,
        totalClients: 0,
        totalConversations: 0
      });
      setChartData({
        channelData: [],
        dailyData: [],
        automationData: []
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Fetching stats for user:', user.id);
      
      const { stats: fetchedStats, chartData: fetchedChartData } = await StatsService.fetchUserStats(user.id);
      
      setStats(fetchedStats);
      setChartData(fetchedChartData);
      
    } catch (error: unknown) {
      const errorInfo = StatsService.handleSupabaseError(error, "No se pudieron cargar las estadísticas");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
      
      // Reset to empty state on error
      setStats({
        totalMessages: 0,
        automatedMessages: 0,
        humanMessages: 0,
        clientMessages: 0,
        responseRate: 0,
        newLeads: 0,
        totalClients: 0,
        totalConversations: 0
      });
      setChartData({
        channelData: [],
        dailyData: [],
        automationData: []
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    if (user?.id) {
      fetchStats();
    }
  }, [user?.id, fetchStats]);

  // Listen for data refresh events
  useRefreshListener(
    async () => {
      console.log('🔄 StatsView: Refreshing statistics data');
      await fetchStats();
    },
    'stats'
  );

  return { 
    stats, 
    chartData, 
    loading, 
    fetchStats 
  };
};
