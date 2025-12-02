import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CRMViewProps } from './types';
import { useClients } from './hooks/useClients';
import { useClientFilters } from './hooks/useClientFilters';
import { useClientActions } from './hooks/useClientActions';
import { useExport } from './hooks/useExport';
import { useClientForm } from './hooks/useClientForm';
import { CRMService } from './services/crmService';
import { ClientStats } from './components/ClientStats';
import { ClientFilters } from './components/ClientFilters';
import { ClientCard } from './components/ClientCard';
import { ClientList } from './components/ClientList';
import { EditClientDialog } from './components/EditClientDialog';
import { ViewMode } from './types';
import { useProfile } from '@/components/dashboard/profile/hooks/useProfile';
import { getCRMLevel, canCreateClient } from '@/lib/channelPermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

const CRMView: React.FC<CRMViewProps> = ({ user: propUser }) => {
  console.log('CRMView: Component is rendering!');

  // Obtener usuario de auth si no se pasa como prop
  const { user: authUser } = useAuth();
  const currentUser = propUser || authUser;

  // Hooks principales
  const { clients, setClients, loading } = useClients(currentUser);
  const { filters, filteredClients, updateFilters } = useClientFilters(clients);
  const { updateClientStatus, updateClient, deleteClient } = useClientActions(currentUser, clients, setClients);
  const { exportToCSV, exportToExcel } = useExport();
  const {
    isEditDialogOpen,
    editingClient,
    formData,
    openEditDialog,
    closeEditDialog,
    updateFormData
  } = useClientForm();

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Profile and Permissions
  const { profile } = useProfile(currentUser);
  const crmLevel = profile ? getCRMLevel(profile) : 'basic';
  const clientCheck = profile ? canCreateClient(profile, clients.length) : { allowed: true };

  // Calcular estadísticas
  const clientStats = CRMService.calculateStats(clients);

  // Handlers
  const handleExportCSV = () => exportToCSV(filteredClients);
  const handleExportExcel = () => exportToExcel(filteredClients);

  const handleSaveClient = async () => {
    if (editingClient) {
      await updateClient(editingClient.id, formData);
      closeEditDialog();
    }
  };

  console.log('CRMView: User ID:', currentUser?.id, 'Loading:', loading, 'Clients count:', clients.length);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Page Header con estadísticas */}
      <ClientStats stats={clientStats} />

      {/* Plan Limits Warning */}
      {!clientCheck.allowed && (
        <div className="px-3 sm:px-6 mt-4">
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
            <Lock className="h-4 w-4 text-red-600" />
            <AlertDescription className="ml-2 flex items-center gap-2">
              <span>{clientCheck.reason || "Has alcanzado el límite de clientes de tu plan."}</span>
              <button
                className="underline font-semibold hover:text-red-900"
                onClick={() => window.location.href = '/dashboard?view=profile&tab=subscription'}
              >
                Mejorar Plan
              </button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 p-3 sm:p-6">
        <Card className="h-full flex flex-col">
          <CardHeader className="border-b p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  Base de Clientes
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Los clientes se crean automáticamente cuando reciben mensajes
                </p>
              </div>
            </div>

            {/* Filtros y exportación */}
            <ClientFilters
              filters={filters}
              onFiltersChange={updateFilters}
              onExportCSV={handleExportCSV}
              onExportExcel={handleExportExcel}
              filteredClientsCount={filteredClients.length}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando clientes...</p>
                  </div>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No hay clientes</h3>
                  <p className="text-sm">
                    {filters.searchTerm || filters.filterStatus !== 'all' || filters.filterSource !== 'all'
                      ? 'No se encontraron clientes con los filtros aplicados'
                      : 'Los clientes aparecerán aquí cuando envíen mensajes'
                    }
                  </p>
                </div>
              ) : (
                viewMode === 'grid' ? (
                  <div className="grid gap-3 sm:gap-4 p-3 sm:p-6">
                    {filteredClients.map((client) => (
                      <ClientCard
                        key={client.id}
                        client={client}
                        onEdit={openEditDialog}
                        onStatusChange={updateClientStatus}
                        crmLevel={crmLevel}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-3 sm:p-6">
                    <ClientList
                      clients={filteredClients}
                      onEdit={openEditDialog}
                      onStatusChange={updateClientStatus}
                      onDelete={deleteClient}
                      crmLevel={crmLevel}
                    />
                  </div>
                )
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de edición */}
      <EditClientDialog
        isOpen={isEditDialogOpen}
        client={editingClient}
        formData={formData}
        onClose={closeEditDialog}
        onSave={handleSaveClient}
        onFormChange={updateFormData}
      />
    </div>
  );
};

export default CRMView;
