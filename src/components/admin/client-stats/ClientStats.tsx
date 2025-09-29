import React, { useEffect } from 'react';
import { ClientStatsProps } from './types';
import { useClientStats } from './hooks/useClientStats';
import { useClientDetails } from './hooks/useClientDetails';
import {
  ClientStatsTable,
  ClientDetailsModal
} from './components/index';

const ClientStats: React.FC<ClientStatsProps> = () => {
  // Hooks
  const { clients, loading, fetchClientStats } = useClientStats();
  const { selectedClient, isModalOpen, openClientDetails, closeClientDetails } = useClientDetails();

  // Load client stats on mount
  useEffect(() => {
    fetchClientStats();
  }, [fetchClientStats]);

  return (
    <div className="space-y-6">
      <ClientStatsTable
        clients={clients}
        loading={loading}
        onViewDetails={openClientDetails}
      />

      <ClientDetailsModal
        isOpen={isModalOpen}
        client={selectedClient}
        onClose={closeClientDetails}
      />
    </div>
  );
};

export default ClientStats;
