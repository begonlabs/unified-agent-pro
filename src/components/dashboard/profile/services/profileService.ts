import { supabase } from '@/integrations/supabase/client';
import { supabaseSelect, supabaseUpdate, handleSupabaseError } from '@/lib/supabaseUtils';
import { Profile, ProfileFormData, NotificationSettings, Plan } from '../types';
import { Star, Zap, Crown } from 'lucide-react';

export class ProfileService {
  /**
   * Obtiene el perfil del usuario actual
   */
  static async fetchProfile(userId: string): Promise<Profile | null> {
    const { data } = await supabaseSelect(
      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
    );

    return data;
  }

  /**
   * Actualiza el perfil del usuario
   */
  static async updateProfile(userId: string, profileData: ProfileFormData): Promise<void> {
    const { countryCode, number } = this.parsePhoneNumber(profileData.phone);

    await supabaseUpdate(
      supabase
        .from('profiles')
        .update({
          company_name: profileData.company_name.trim(),
          email: profileData.email.trim(),
          phone: number || null,
          phone_country_code: countryCode,
          country: profileData.country || 'US',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
    );
  }

  /**
   * Valida los datos del perfil
   */
  static validateProfile(profileData: ProfileFormData): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    if (!profileData.company_name.trim()) {
      errors.company_name = 'El nombre de la empresa es obligatorio';
    }

    if (!profileData.email.trim()) {
      errors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      errors.email = 'El formato del email no es válido';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Parsea un número de teléfono en código de país y número
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
   * Obtiene los planes disponibles
   */
  static getPlans(currentPlanType: string): Plan[] {
    return [
      {
        name: 'Gratuito',
        price: '$0',
        description: 'Prueba de 7 días',
        features: [
          '7 días de prueba',
          'Máx. 1 Facebook + 1 Instagram',
          'Sin WhatsApp',
          'CRM básico',
          'Soporte bajo y normal'
        ],
        current: currentPlanType === 'free',
        icon: Star,
        color: 'text-gray-500',
        bgColor: 'bg-gray-50',
        isTrial: true
      },
      {
        name: 'Básico',
        price: '$49',
        description: 'Ideal para pequeños negocios',
        features: [
          '3 canales (1 FB + 1 IG + 1 WhatsApp)',
          '10,000 mensajes/mes',
          '200 clientes',
          'Sin CRM',
          'Sin estadísticas',
          'Soporte bajo y normal'
        ],
        current: currentPlanType === 'basico',
        icon: Zap,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50'
      },
      {
        name: 'Avanzado',
        price: '$139',
        description: 'Para empresas medianas',
        features: [
          '3 canales (1 FB + 1 IG + 1 WhatsApp)',
          '30,000 mensajes/mes',
          '600 clientes',
          'CRM completo',
          'Estadísticas',
          'Soporte bajo y normal'
        ],
        current: currentPlanType === 'avanzado',
        icon: Zap,
        color: 'text-purple-500',
        bgColor: 'bg-purple-50'
      },
      {
        name: 'Pro',
        price: '$299',
        description: 'Pensado para empresas con alta intensidad',
        features: [
          '3 canales (1 FB + 1 IG + 1 WhatsApp)',
          '70,000 mensajes/mes',
          '2,000 clientes',
          'CRM completo',
          'Estadísticas',
          'Soporte: Bajo, Normal, Alta, Urgente'
        ],
        current: currentPlanType === 'pro',
        icon: Crown,
        color: 'text-amber-500',
        bgColor: 'bg-amber-50'
      },
      {
        name: 'Empresarial',
        price: '$399',
        description: 'Solución completa para empresas',
        features: [
          '3 canales (1 FB + 1 IG + 1 WhatsApp)',
          '100,000 mensajes/mes',
          '3,000 clientes',
          'CRM completo',
          'Estadísticas',
          'Soporte: Bajo, Normal, Alta, Urgente',
          'Chat en vivo (próximamente)'
        ],
        current: currentPlanType === 'empresarial',
        icon: Crown,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-50'
      }
    ];
  }

  /**
   * Obtiene el color del plan
   */
  static getPlanColor(planType: string): string {
    switch (planType) {
      case 'free': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'basico': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'avanzado': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'pro': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'empresarial': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  /**
   * Obtiene el icono del plan
   */
  static getPlanIcon(planType: string) {
    switch (planType) {
      case 'free': return Star;
      case 'basico': return Zap;
      case 'avanzado': return Zap;
      case 'pro': return Crown;
      case 'empresarial': return Crown;
      default: return Star;
    }
  }

  /**
   * Formatea una fecha
   */
  static formatDate(dateString?: string): string {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Obtiene las iniciales de un nombre
   */
  static getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  /**
   * Maneja errores de Supabase
   */
  static handleSupabaseError = handleSupabaseError;
}
