import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { GeneralStatsService } from '../services/generalStatsService';
import { UseGeneralStatsReturn, GeneralStatsData } from '../types';

export const useGeneralStats = (): UseGeneralStatsReturn => {
  const [stats, setStats] = useState<GeneralStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchGeneralStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await GeneralStatsService.fetchGeneralStats();

      if (response.success) {
        setStats(response.stats);
      } else {
        toast({
          title: "Error al cargar estadísticas",
          description: response.error || "Error desconocido",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to fetch general stats:', error);
      toast({
        title: "Error inesperado",
        description: "No se pudieron cargar las estadísticas generales.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    stats,
    loading,
    fetchGeneralStats
  };
};
