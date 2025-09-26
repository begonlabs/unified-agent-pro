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
        name: 'Free',
        price: '$0',
        description: 'Perfecto para comenzar',
        features: ['1 canal de comunicación', '100 mensajes/mes', 'IA básica', 'Soporte por email'],
        current: currentPlanType === 'free',
        icon: Star,
        color: 'text-gray-500',
        bgColor: 'bg-gray-50'
      },
      {
        name: 'Premium',
        price: '$29',
        description: 'Para empresas en crecimiento',
        features: ['3 canales', '2,000 mensajes/mes', 'IA avanzada', 'Soporte prioritario', 'Análisis detallados'],
        current: currentPlanType === 'premium',
        icon: Zap,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50'
      },
      {
        name: 'Enterprise',
        price: '$99',
        description: 'Solución completa',
        features: ['Canales ilimitados', 'Mensajes ilimitados', 'IA personalizada', 'Soporte 24/7', 'API completa', 'Integraciones avanzadas'],
        current: currentPlanType === 'enterprise',
        icon: Crown,
        color: 'text-purple-500',
        bgColor: 'bg-purple-50'
      }
    ];
  }

  /**
   * Obtiene el color del plan
   */
  static getPlanColor(planType: string): string {
    switch (planType) {
      case 'free': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'premium': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'enterprise': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  /**
   * Obtiene el icono del plan
   */
  static getPlanIcon(planType: string) {
    switch (planType) {
      case 'free': return Star;
      case 'premium': return Zap;
      case 'enterprise': return Crown;
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
