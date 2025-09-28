import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRefreshListener } from '@/hooks/useDataRefresh';
import { SupportService } from '../services/supportService';
import { SupportTicket, User } from '../types';

export const useSupportTickets = (user: User | null) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchTickets = useCallback(async () => {
    if (!user?.id) {
      setTickets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Fetching support tickets for user:', user.id);
      
      const fetchedTickets = await SupportService.fetchTickets(user.id);
      setTickets(fetchedTickets);
      
    } catch (error: unknown) {
      const errorInfo = SupportService.handleSupabaseError(error, "No se pudieron cargar los tickets de soporte");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    if (user?.id) {
      fetchTickets();
    }
  }, [user?.id, fetchTickets]);

  // Listen for data refresh events
  useRefreshListener(
    async () => {
      console.log('🔄 SupportView: Refreshing tickets data');
      await fetchTickets();
    },
    'support'
  );

  return { 
    tickets, 
    setTickets,
    loading, 
    fetchTickets 
  };
};
