import { supabase } from '@/integrations/supabase/client';
import { supabaseSelect, handleSupabaseError } from '@/lib/supabaseUtils';
import { Client, User } from '../types';

export class CRMService {
  /**
   * Obtiene todos los clientes del usuario
   */
  static async fetchClients(
    userId: string,
    page: number = 0,
    filters?: { searchTerm?: string; filterStatus?: string; filterSource?: string },
    pageSize: number = 20
  ): Promise<Client[]> {
    let query = supabase
      .from('crm_clients')
      .select('*')
      .eq('user_id', userId);

    if (filters) {
      if (filters.filterStatus && filters.filterStatus !== 'all') {
        query = query.eq('status', filters.filterStatus);
      }
      
      if (filters.filterSource && filters.filterSource !== 'all') {
        if (filters.filterSource === 'whatsapp') {
          // @ts-ignore - Supabase type depth limit workaround
          query = query.in('source', ['whatsapp', 'whatsapp_green_api']);
        } else {
          query = query.eq('source', filters.filterSource);
        }
      }

      if (filters.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%,phone.ilike.%${filters.searchTerm}%`);
      }
    }

    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }

    return (data as Client[]) || [];
  }

  /**
   * Obtiene las estadísticas de clientes directamente desde la base de datos (Head Counts)
   */
  static async fetchClientStats(userId: string): Promise<{ total: number; leads: number; prospects: number; active: number; inactive: number }> {
    const promises = [
      supabase.from('crm_clients').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('crm_clients').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'lead'),
      supabase.from('crm_clients').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'prospect'),
      supabase.from('crm_clients').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'client'),
      supabase.from('crm_clients').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'inactive')
    ];

    const results = await Promise.all(promises);

    const errorResult = results.find(result => result.error);
    if (errorResult && errorResult.error) {
      throw errorResult.error;
    }

    return {
      total: results[0].count || 0,
      leads: results[1].count || 0,
      prospects: results[2].count || 0,
      active: results[3].count || 0,
      inactive: results[4].count || 0,
    };
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
   * Elimina un cliente
   */
  static async deleteClient(clientId: string, userId: string): Promise<void> {
    // Verificar que el cliente pertenezca al usuario
    const { data: clientCheck } = await supabase
      .from('crm_clients')
      .select('user_id')
      .eq('id', clientId)
      .eq('user_id', userId)
      .single();

    if (!clientCheck) {
      throw new Error('No tienes permisos para eliminar este cliente');
    }

    const { error } = await supabase
      .from('crm_clients')
      .delete()
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
