import { supabase } from '@/integrations/supabase/client';
import { supabaseSelect, handleSupabaseError } from '@/lib/supabaseUtils';
import { Client, User } from '../types';

export class CRMService {
  /**
   * Obtiene todos los clientes del usuario
   */
  static async fetchClients(userId: string): Promise<Client[]> {
    const { data } = await supabaseSelect(
      supabase
        .from('crm_clients')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    );
    return (data as Client[]) || [];
  }

  /**
   * Actualiza el estado de un cliente
   */
  static async updateClientStatus(clientId: string, status: string, userId: string): Promise<void> {
    // Verificar que el cliente pertenezca al usuario
    const { data: clientCheck } = await supabase
      .from('crm_clients')
      .select('user_id')
      .eq('id', clientId)
      .eq('user_id', userId)
      .single();

    if (!clientCheck) {
      throw new Error('No tienes permisos para actualizar este cliente');
    }

    const { error } = await supabase
      .from('crm_clients')
      .update({ status })
      .eq('id', clientId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  }

  /**
   * Actualiza un cliente completo
   */
  static async updateClient(clientId: string, clientData: Partial<Client>, userId: string): Promise<void> {
    const { error } = await supabase
      .from('crm_clients')
      .update(clientData)
      .eq('id', clientId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  }

  /**
   * Genera contenido CSV para exportación
   */
  static generateCSV(clients: Client[]): string {
    const headers = [
      'Nombre',
      'Email',
      'Teléfono',
      'Código País',
      'Estado',
      'Estado Personalizado',
      'País',
      'Ciudad',
      'Dirección',
      'Notas',
      'Origen',
      'Fecha Registro'
    ];

    const csvContent = [
      headers.join(','),
      ...clients.map(client => [
        `"${client.name}"`,
        `"${client.email || ''}"`,
        `"${client.phone || ''}"`,
        `"${client.phone_country_code || ''}"`,
        `"${client.status}"`,
        `"${client.custom_status || ''}"`,
        `"${client.country || ''}"`,
        `"${client.city || ''}"`,
        `"${client.address || ''}"`,
        `"${client.notes || ''}"`,
        `"${client.source || 'manual'}"`,
        `"${new Date(client.created_at).toLocaleDateString('es-ES')}"`
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Genera contenido Excel para exportación
   */
  static generateExcel(clients: Client[]): string {
    // Para simplificar, generamos un CSV que se puede abrir en Excel
    // En una implementación más avanzada se podría usar una librería como xlsx
    return CRMService.generateCSV(clients);
  }

  /**
   * Descarga un archivo
   */
  static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Parsea número de teléfono en código de país y número
   */
  static parsePhoneNumber(phoneNumber: string): { countryCode: string; number: string } {
    if (!phoneNumber) return { countryCode: '+1', number: '' };

    const match = phoneNumber.match(/^(\+\d{1,4})\s?(.*)$/);
    if (match) {
      return { countryCode: match[1], number: match[2] };
    }

    return { countryCode: '+1', number: phoneNumber };
  }

  /**
   * Obtiene el color del estado del cliente
   */
  static getStatusColor(status: string): string {
    switch (status) {
      case 'lead':
        return 'bg-yellow-100 text-yellow-800';
      case 'prospect':
        return 'bg-blue-100 text-blue-800';
      case 'client':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  }

  /**
   * Filtra clientes según criterios
   */
  static filterClients(clients: Client[], filters: { searchTerm: string; filterStatus: string; filterSource: string }): Client[] {
    return clients.filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        client.phone?.includes(filters.searchTerm);
      const matchesStatus = filters.filterStatus === 'all' || client.status === filters.filterStatus;

      // Normalize source for filtering: treat whatsapp_green_api as whatsapp
      const normalizedClientSource = client.source === 'whatsapp_green_api' ? 'whatsapp' : client.source;
      const matchesSource = filters.filterSource === 'all' || normalizedClientSource === filters.filterSource;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }

  /**
   * Calcula estadísticas de clientes
   */
  static calculateStats(clients: Client[]): { total: number; leads: number; prospects: number; active: number; inactive: number } {
    return {
      total: clients.length,
      leads: clients.filter(c => c.status === 'lead').length,
      prospects: clients.filter(c => c.status === 'prospect').length,
      active: clients.filter(c => c.status === 'client').length,
      inactive: clients.filter(c => c.status === 'inactive').length
    };
  }

  static handleSupabaseError = handleSupabaseError;
}
