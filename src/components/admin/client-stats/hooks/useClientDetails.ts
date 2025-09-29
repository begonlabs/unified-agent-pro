import { useState } from 'react';
import { UseClientDetailsReturn, ClientWithStats } from '../types';

export const useClientDetails = (): UseClientDetailsReturn => {
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openClientDetails = (client: ClientWithStats) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const closeClientDetails = () => {
    setSelectedClient(null);
    setIsModalOpen(false);
  };

  return {
    selectedClient,
    isModalOpen,
    openClientDetails,
    closeClientDetails
  };
};
