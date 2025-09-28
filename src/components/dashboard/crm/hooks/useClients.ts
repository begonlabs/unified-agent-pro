import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRefreshListener } from '@/hooks/useDataRefresh';
import { CRMService } from '../services/crmService';
import { Client, User } from '../types';

export const useClients = (user: User | null) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchClients = useCallback(async () => {
    if (!user?.id) {
      setClients([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Fetching clients for user:', user.id);
      
      const fetchedClients = await CRMService.fetchClients(user.id);
      console.log('👥 Clients fetched:', fetchedClients.length);
      setClients(fetchedClients);
    } catch (error: unknown) {
      const errorInfo = CRMService.handleSupabaseError(error, "No se pudieron cargar los clientes");
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
      fetchClients();
    }
  }, [user?.id, fetchClients]);

  // Escuchar eventos de refresh de datos
  useRefreshListener(
    async () => {
      console.log('🔄 CRMView: Refreshing clients data');
      await fetchClients();
    },
    'crm'
  );

  return { clients, setClients, loading, fetchClients };
};
