import { useState, useEffect } from 'react';
import { Client, ClientFormData } from '../types';
import { CRMService } from '../services/crmService';

export const useClientForm = () => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    status: 'lead',
    custom_status: '',
    country: '',
    address: '',
    city: '',
    notes: '',
    tags: []
  });

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    const fullPhone = client.phone_country_code && client.phone 
      ? `${client.phone_country_code} ${client.phone}`
      : client.phone || '';
    
    setFormData({
      name: client.name,
      email: client.email || '',
      phone: fullPhone,
      status: client.status,
      custom_status: client.custom_status || '',
      country: client.country || '',
      address: client.address || '',
      city: client.city || '',
      notes: client.notes || '',
      tags: client.tags || []
    });
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingClient(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      status: 'lead',
      custom_status: '',
      country: '',
      address: '',
      city: '',
      notes: '',
      tags: []
    });
  };

  const updateFormData = (newFormData: Partial<ClientFormData>) => {
    setFormData(prev => ({ ...prev, ...newFormData }));
  };

  return {
    isEditDialogOpen,
    editingClient,
    formData,
    openEditDialog,
    closeEditDialog,
    updateFormData
  };
};
