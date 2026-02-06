import { supabaseAdmin } from '@/integrations/supabase/client';
import { supabaseSelect, handleSupabaseError } from '@/lib/supabaseUtils';
import {
  Client,
  Role,
  FetchClientsResponse,
  UpdateClientResponse,
  DeleteClientResponse,
  EditFormData,
  PlanType,
  RoleType,
  BadgeColorFunction
} from '../types';
import { PLAN_LIMITS } from '@/lib/channelPermissions';

export class ClientManagementService {
  // Predefined roles until roles table is created in Supabase
  static readonly PREDEFINED_ROLES: Role[] = [
    { id: 'admin', name: 'admin', description: 'Administrador completo' },
    { id: 'moderator', name: 'moderator', description: 'Moderador' },
    { id: 'user', name: 'user', description: 'Usuario estándar' }
  ];

  /**
   * Fetch all clients from the database
   */
  static async fetchClients(): Promise<FetchClientsResponse> {
    try {
      console.log('🔍 Fetching clients...');

      // Get clients using service role (without roles for now, until roles table is created)
      const { data: profiles, error: profilesError } = await supabaseSelect(
        supabaseAdmin
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
      );

      if (profilesError) throw profilesError;

      // Assign default role 'user' to all clients
      const clientsWithRoles = (profiles || []).map(profile => ({
        ...profile,
        role: 'user' // Default role until roles table is implemented
      }));

      console.log('✅ Clients fetched:', clientsWithRoles.length);
      return {
        clients: clientsWithRoles,
        success: true
      };

    } catch (error: unknown) {
      console.error('❌ Error fetching clients:', error);
      return {
        clients: [],
        success: false,
        error: handleSupabaseError(error, "Error al cargar clientes").description
      };
    }
  }

  /**
   * Toggle client active status
   */
  static async toggleClientStatus(clientId: string, currentStatus: boolean): Promise<UpdateClientResponse> {
    try {
      console.log('🔄 Toggling client status:', clientId);

      // First get the profile to ensure it exists
      const { data: profile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, company_name, is_active')
        .eq('id', clientId)
        .single();

      if (fetchError) throw fetchError;
      if (!profile) throw new Error('Cliente no encontrado');

      // Update is_active status using service role
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (updateError) throw updateError;

      console.log('✅ Client status updated:', profile.company_name);
      return {
        success: true,
        message: `${profile.company_name} ha sido ${!currentStatus ? 'activado' : 'desactivado'} exitosamente.`
      };

    } catch (error: unknown) {
      console.error('❌ Error updating client status:', error);
      const errorInfo = handleSupabaseError(error, "Error al actualizar estado");
      return {
        success: false,
        message: errorInfo.description,
        error: errorInfo.description
      };
    }
  }

  /**
   * Update client information
   */
  static async updateClient(clientId: string, formData: EditFormData): Promise<UpdateClientResponse> {
    try {
      console.log('📝 Updating client:', clientId);

      // Validate required data
      if (!formData.company_name.trim() || !formData.email.trim()) {
        return {
          success: false,
          message: "El nombre de la empresa y el email son obligatorios.",
          error: "Validation error"
        };
      }

      // Update profile using service role
      // Also set payment_status to 'active' if a paid plan is assigned manually
      const updateData: any = {
        company_name: formData.company_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        plan_type: formData.plan_type,
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      };

      // Set limits based on the assigned plan
      const limits = PLAN_LIMITS[formData.plan_type] || PLAN_LIMITS.free;
      updateData.messages_limit = limits.messages;
      updateData.clients_limit = limits.clients;

      // Set extra permissions based on plan
      updateData.has_statistics = ['avanzado', 'pro', 'empresarial'].includes(formData.plan_type);

      if (formData.plan_type === 'free' || formData.plan_type === 'basico') {
        updateData.crm_level = 'basic';
      } else {
        updateData.crm_level = 'complete';
      }

      // If it's a paid plan, ensure payment_status is 'active' so they can use the platform
      if (formData.plan_type !== 'free') {
        updateData.payment_status = 'active';
        updateData.is_trial = false;
      }

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', clientId);

      if (profileError) throw profileError;

      // TODO: Implement role update when roles table is created
      // For now we only show the selected role but don't save it

      console.log('✅ Client updated:', formData.company_name);
      return {
        success: true,
        message: `${formData.company_name} ha sido actualizado correctamente`
      };

    } catch (error: unknown) {
      console.error('❌ Error updating client:', error);
      const errorInfo = handleSupabaseError(error, "Error al actualizar cliente");
      return {
        success: false,
        message: errorInfo.description,
        error: errorInfo.description
      };
    }
  }

  /**
   * Delete client completely
   */
  static async deleteClient(clientId: string): Promise<DeleteClientResponse> {
    try {
      console.log('🗑️ Deleting client:', clientId);

      // First get the profile to get the user_id using service role
      const { data: profile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, company_name')
        .eq('id', clientId)
        .single();

      if (fetchError) throw fetchError;
      if (!profile) throw new Error('Cliente no encontrado');

      const companyName = profile.company_name;
      const userId = profile.user_id;

      // Delete the profile first using service role (this will trigger CASCADE in the database)
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', clientId);

      if (profileError) throw profileError;

      // Delete the user from Supabase auth using service role
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (authError) {
        console.warn('⚠️ Error deleting user from auth:', authError);
        // We don't throw error here because profile was already deleted
        // We just show a warning in the toast
        return {
          success: true,
          message: `${companyName} ha sido eliminado del perfil, pero puede haber quedado en el sistema de autenticación.`
        };
      } else {
        console.log('✅ Client deleted completely:', companyName);
        return {
          success: true,
          message: `${companyName} ha sido eliminado completamente del sistema.`
        };
      }

    } catch (error: unknown) {
      console.error('❌ Error deleting client:', error);
      const errorInfo = handleSupabaseError(error, "Error al eliminar cliente");
      return {
        success: false,
        message: errorInfo.description,
        error: errorInfo.description
      };
    }
  }

  /**
   * Get plan badge color class
   */
  static getPlanBadgeColor: BadgeColorFunction = (plan: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800 border-gray-300',
      basico: 'bg-blue-100 text-blue-800 border-blue-300',
      avanzado: 'bg-purple-100 text-purple-800 border-purple-300',
      pro: 'bg-amber-100 text-amber-800 border-amber-300',
      empresarial: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      // Fallbacks for legacy values
      premium: 'bg-purple-100 text-purple-800 border-purple-300',
      enterprise: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    };
    return colors[plan.toLowerCase() as keyof typeof colors] || colors.free;
  };

  /**
   * Get pretty plan label
   */
  static getPlanLabel = (plan: string): string => {
    const labels: Record<string, string> = {
      free: 'Gratuito',
      basico: 'Básico',
      avanzado: 'Avanzado',
      pro: 'Pro',
      empresarial: 'Empresarial',
      enterprise: 'Empresarial',
      premium: 'Avanzado'
    };
    return labels[plan.toLowerCase() as keyof typeof labels] || plan.toUpperCase();
  };

  /**
   * Get role badge color class
   */
  static getRoleBadgeColor: BadgeColorFunction = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      moderator: 'bg-orange-100 text-orange-800',
      user: 'bg-green-100 text-green-800'
    };
    return colors[role as keyof typeof colors] || colors.user;
  };

  /**
   * Filter clients based on search term
   */
  static filterClients(clients: Client[], searchTerm: string): Client[] {
    if (!searchTerm.trim()) return clients;

    const term = searchTerm.toLowerCase();
    return clients.filter(client =>
      client.company_name.toLowerCase().includes(term) ||
      client.email.toLowerCase().includes(term) ||
      (client.phone && client.phone.includes(term))
    );
  }

  /**
   * Validate form data
   */
  static validateFormData(formData: EditFormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!formData.company_name.trim()) {
      errors.push('El nombre de la empresa es requerido');
    }

    if (!formData.email.trim()) {
      errors.push('El email es requerido');
    }

    if (formData.email && !formData.email.includes('@')) {
      errors.push('El email debe ser válido');
    }

    if (formData.company_name.length > 100) {
      errors.push('El nombre de la empresa no puede exceder 100 caracteres');
    }

    if (formData.email.length > 255) {
      errors.push('El email no puede exceder 255 caracteres');
    }

    if (formData.phone && formData.phone.length > 20) {
      errors.push('El teléfono no puede exceder 20 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get default form data
   */
  static getDefaultFormData(): EditFormData {
    return {
      company_name: '',
      email: '',
      phone: '',
      plan_type: 'free',
      role: 'user',
      is_active: true
    };
  }

  /**
   * Get available plan types
   */
  static getPlanTypes(): { value: PlanType; label: string }[] {
    return [
      { value: 'free', label: 'Gratuito' },
      { value: 'basico', label: 'Básico' },
      { value: 'avanzado', label: 'Avanzado' },
      { value: 'pro', label: 'Pro' },
      { value: 'empresarial', label: 'Empresarial' }
    ];
  }

  /**
   * Get available roles
   */
  static getRoles(): Role[] {
    return this.PREDEFINED_ROLES;
  }

  /**
   * Handle Supabase errors
   */
  static handleSupabaseError = handleSupabaseError;
}
