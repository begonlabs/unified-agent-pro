import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ClientStatsService } from '../services/clientStatsService';
import { UseClientStatsReturn, ClientWithStats } from '../types';

export const useClientStats = (): UseClientStatsReturn => {
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchClientStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ClientStatsService.fetchClientStats();

      if (response.success) {
        setClients(response.clients);
      } else {
        toast({
          title: "Error al cargar estadísticas",
          description: response.error || "Error desconocido",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to fetch client stats:', error);
      toast({
        title: "Error inesperado",
        description: "No se pudieron cargar las estadísticas de clientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load data automatically when component mounts
  useEffect(() => {
    fetchClientStats();
  }, [fetchClientStats]);

  return {
    clients,
    loading,
    fetchClientStats
  };
};
