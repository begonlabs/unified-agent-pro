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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Estadísticas por Clientes</h2>
        <p className="text-muted-foreground font-medium">
          Monitoriza el rendimiento individual y la actividad de cada empresa en la plataforma.
        </p>
      </div>

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
