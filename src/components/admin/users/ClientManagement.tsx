import React, { useState, useEffect } from 'react';
import { ClientManagementProps, Client, EditFormData } from './types';
import { useClients } from './hooks/useClients';
import { useClientActions } from './hooks/useClientActions';
import { useClientForm } from './hooks/useClientForm';
import { ClientManagementService } from './services/clientManagementService';
import {
  ClientTable,
  ClientEditDialog,
  ClientDeleteDialog
} from './components/index';

const ClientManagement: React.FC<ClientManagementProps> = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);

  // Hooks
  const { clients, loading, fetchClients } = useClients();
  const { isUpdating, isDeleting, toggleClientStatus, updateClient, deleteClient } = useClientActions(fetchClients);
  const { formData, setFormData, resetForm, validateForm } = useClientForm();

  // Load clients on mount
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Handlers
  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setFormData({
      company_name: client.company_name,
      email: client.email,
      phone: client.phone || '',
      plan_type: client.plan_type,
      role: client.role || 'user',
      is_active: client.is_active
    });
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingClient(null);
    resetForm();
  };

  const handleUpdateClient = async () => {
    if (!editingClient) return;

    const validation = validateForm(formData);
    if (!validation.isValid) {
      // Show validation errors (you could use toast here)
      console.error('Validation errors:', validation.errors);
      return;
    }

    await updateClient(editingClient.id, formData);
    closeEditDialog();
  };

  const openDeleteDialog = (clientId: string) => {
    setDeleteClientId(clientId);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeleteClientId(null);
  };

  const handleDeleteClient = async () => {
    if (!deleteClientId) return;
    await deleteClient(deleteClientId);
    closeDeleteDialog();
  };

  return (
    <div className="space-y-6">
      <ClientTable
        clients={clients}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onEditClient={openEditDialog}
        onToggleStatus={toggleClientStatus}
        onDeleteClient={openDeleteDialog}
      />

      <ClientEditDialog
        isOpen={isEditDialogOpen}
        client={editingClient}
        formData={formData}
        loading={isUpdating}
        onClose={closeEditDialog}
        onFormChange={setFormData}
        onSave={handleUpdateClient}
      />

      <ClientDeleteDialog
        isOpen={isDeleteDialogOpen}
        clientId={deleteClientId}
        loading={isDeleting}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteClient}
      />
    </div>
  );
};

export default ClientManagement;
