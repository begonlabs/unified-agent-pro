import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SupportService } from '../services/supportService';
import { UseSupportStatsReturn, SupportStats, TicketTrend } from '../types';

export const useSupportStats = (): UseSupportStatsReturn => {
  const [stats, setStats] = useState<SupportStats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    closedTickets: 0,
    avgResponseTime: 0,
    satisfactionRate: 0,
    ticketsThisWeek: 0,
    ticketsThisMonth: 0
  });
  const [trends, setTrends] = useState<TicketTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await SupportService.fetchSupportStats();

      if (response.success) {
        setStats(response.stats);
        setTrends(response.trends);
      } else {
        toast({
          title: "Error al cargar estadísticas",
          description: response.error || "Error desconocido",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to fetch support stats:', error);
      toast({
        title: "Error inesperado",
        description: "No se pudieron cargar las estadísticas de soporte.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    stats,
    trends,
    loading,
    fetchStats
  };
};
