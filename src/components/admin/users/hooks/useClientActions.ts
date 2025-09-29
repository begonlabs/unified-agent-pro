import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ClientManagementService } from '../services/clientManagementService';
import { EditFormData, UseClientActionsReturn } from '../types';

export const useClientActions = (onClientsChange: () => void): UseClientActionsReturn => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const toggleClientStatus = async (clientId: string, currentStatus: boolean) => {
    try {
      setIsUpdating(true);
      const response = await ClientManagementService.toggleClientStatus(clientId, currentStatus);

      if (response.success) {
        toast({
          title: "Estado actualizado",
          description: response.message,
        });
        onClientsChange();
      } else {
        toast({
          title: "Error al actualizar estado",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to toggle client status:', error);
      toast({
        title: "Error inesperado",
        description: "No se pudo actualizar el estado del cliente.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const updateClient = async (clientId: string, formData: EditFormData) => {
    try {
      setIsUpdating(true);
      const response = await ClientManagementService.updateClient(clientId, formData);

      if (response.success) {
        toast({
          title: "Cliente actualizado",
          description: response.message,
        });
        onClientsChange();
      } else {
        toast({
          title: "Error al actualizar cliente",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to update client:', error);
      toast({
        title: "Error inesperado",
        description: "No se pudo actualizar el cliente.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteClient = async (clientId: string) => {
    try {
      setIsDeleting(true);
      const response = await ClientManagementService.deleteClient(clientId);

      if (response.success) {
        toast({
          title: "Cliente eliminado",
          description: response.message,
        });
        onClientsChange();
      } else {
        toast({
          title: "Error al eliminar cliente",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to delete client:', error);
      toast({
        title: "Error inesperado",
        description: "No se pudo eliminar el cliente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isUpdating,
    isDeleting,
    toggleClientStatus,
    updateClient,
    deleteClient
  };
};
