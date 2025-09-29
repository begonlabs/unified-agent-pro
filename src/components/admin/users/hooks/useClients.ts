import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ClientManagementService } from '../services/clientManagementService';
import { Client, UseClientsReturn } from '../types';

export const useClients = (): UseClientsReturn => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ClientManagementService.fetchClients();

      if (response.success) {
        setClients(response.clients);
      } else {
        toast({
          title: "Error al cargar clientes",
          description: response.error || "Error desconocido",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      toast({
        title: "Error inesperado",
        description: "No se pudieron cargar los clientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    clients,
    loading,
    fetchClients
  };
};
