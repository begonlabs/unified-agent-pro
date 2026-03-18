import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRefreshListener } from '@/hooks/useDataRefresh';
import { CRMService } from '../services/crmService';
import { Client, User, ClientFilters } from '../types';

export const useClients = (user: User | null, filters: ClientFilters) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const PAGE_SIZE = 20;

  // Independent Stats State
  const [stats, setStats] = useState({ total: 0, leads: 0, prospects: 0, active: 0, inactive: 0 });

  const { toast } = useToast();

  const fetchStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      const dbStats = await CRMService.fetchClientStats(user.id);
      setStats(dbStats);
    } catch (error) {
      console.error("Failed to fetch client stats", error);
    }
  }, [user?.id]);

  const fetchClients = useCallback(async (reset: boolean = false) => {
    if (!user?.id) {
      setClients([]);
      setLoading(false);
      return;
    }

    try {
      if (reset) setLoading(true);
      else setIsFetchingMore(true);

      const fetchPage = reset ? 0 : page;
      const fetchedClients = await CRMService.fetchClients(user.id, fetchPage, filters, PAGE_SIZE);
      
      if (reset) {
        setClients(fetchedClients);
      } else {
        setClients(prev => {
          const newClients = fetchedClients.filter(c => !prev.some(p => p.id === c.id));
          return [...prev, ...newClients];
        });
      }

      setHasMore(fetchedClients.length === PAGE_SIZE);
      setPage(reset ? 1 : fetchPage + 1);
    } catch (error: unknown) {
      const errorInfo = CRMService.handleSupabaseError(error, "No se pudieron cargar los clientes");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  }, [user?.id, page, filters.searchTerm, filters.filterStatus, filters.filterSource, toast]);

  const loadMore = useCallback(() => {
    if (!loading && !isFetchingMore && hasMore) {
      fetchClients(false);
    }
  }, [loading, isFetchingMore, hasMore, fetchClients]);

  // Initial and Dependency Load
  useEffect(() => {
    fetchClients(true);
  }, [user?.id, filters.searchTerm, filters.filterStatus, filters.filterSource]);

  useEffect(() => {
    fetchStats();
  }, [user?.id, fetchStats]);

  // Event listener for data refresh
  useRefreshListener(
    async () => {
      console.log('🔄 CRMView: Refreshing clients & stats');
      await Promise.all([fetchClients(true), fetchStats()]);
    },
    'crm'
  );

  return { 
    clients, 
    setClients, 
    loading, 
    isFetchingMore, 
    hasMore, 
    loadMore, 
    stats 
  };
};
