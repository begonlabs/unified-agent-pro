import { useState, useMemo } from 'react';
import { Client, ClientFilters } from '../types';
import { CRMService } from '../services/crmService';

export const useClientFilters = (clients: Client[]) => {
  const [filters, setFilters] = useState<ClientFilters>({
    searchTerm: '',
    filterStatus: 'all',
    filterSource: 'all'
  });

  const filteredClients = useMemo(() => {
    return CRMService.filterClients(clients, filters);
  }, [clients, filters]);

  const updateFilters = (newFilters: Partial<ClientFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    filters,
    filteredClients,
    updateFilters
  };
};
