import { useState } from 'react';
import { ClientFilters } from '../types';

export const useClientFilters = () => {
  const [filters, setFilters] = useState<ClientFilters>({
    searchTerm: '',
    filterStatus: 'all',
    filterSource: 'all'
  });

  const updateFilters = (newFilters: Partial<ClientFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    filters,
    updateFilters
  };
};
