import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CRMService } from '../services/crmService';
import { Client, User, ClientFormData } from '../types';

export const useClientActions = (user: User | null, clients: Client[], setClients: React.Dispatch<React.SetStateAction<Client[]>>) => {
  const { toast } = useToast();

  const updateClientStatus = useCallback(async (clientId: string, status: string) => {
    if (!user?.id) {
      toast({
        title: "Error de autenticación",
        description: "Debes estar autenticado para actualizar clientes",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🔄 Updating client status for user:', user.id, 'client:', clientId);
      
      await CRMService.updateClientStatus(clientId, status, user.id);

      setClients(prev => prev.map(client => 
        client.id === clientId ? { ...client, status } : client
      ));
      
      toast({
        title: "Estado actualizado",
        description: "El estado del cliente ha sido actualizado",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo actualizar el estado";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [user, setClients, toast]);

  const updateClient = useCallback(async (clientId: string, formData: ClientFormData) => {
    if (!user?.id) return;

    try {
      const { countryCode, number } = CRMService.parsePhoneNumber(formData.phone);
      
      const clientData = {
        name: formData.name,
        email: formData.email || null,
        phone: number || null,
        phone_country_code: countryCode,
        status: formData.status,
        custom_status: formData.custom_status || null,
        country: formData.country || null,
        address: formData.address || null,
        city: formData.city || null,
        notes: formData.notes || null,
        tags: formData.tags
      };

      await CRMService.updateClient(clientId, clientData, user.id);

      setClients(prev => prev.map(client => 
        client.id === clientId 
          ? { 
              ...client, 
              ...formData,
              phone: number,
              phone_country_code: countryCode
            }
          : client
      ));
      
      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente han sido actualizados correctamente",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente",
        variant: "destructive",
      });
    }
  }, [user, setClients, toast]);

  return {
    updateClientStatus,
    updateClient
  };
};
