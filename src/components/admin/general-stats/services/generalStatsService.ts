import { supabase } from '@/integrations/supabase/client';
import { supabaseSelect, handleSupabaseError } from '@/lib/supabaseUtils';
import {
  GeneralStatsData,
  PlanCounts,
  ChannelStats,
  FetchGeneralStatsResponse,
  PlanType,
  ChannelType,
  IconColorFunction,
  ChannelIconColorFunction
} from '../types';

export class GeneralStatsService {
  /**
   * Fetch general statistics from the database
   */
  static async fetchGeneralStats(): Promise<FetchGeneralStatsResponse> {
    try {
      console.log('📊 Fetching general statistics...');

      // Get client statistics by plan
      const { data: profiles, error: profilesError } = await supabaseSelect(
        supabase
          .from('profiles')
          .select('plan_type, is_active')
      );

      if (profilesError) throw profilesError;

      // Count clients by plan
      const planCounts: PlanCounts = {
        free: 0,
        premium: 0,
        enterprise: 0,
        active: 0,
        inactive: 0
      };

      for (const profile of profiles || []) {
        if (profile.is_active) {
          planCounts.active++;
        } else {
          planCounts.inactive++;
        }

        switch (profile.plan_type) {
          case 'free':
            planCounts.free++;
            break;
          case 'premium':
            planCounts.premium++;
            break;
          case 'enterprise':
            planCounts.enterprise++;
            break;
        }
      }

      // Get message statistics by channel
      const { data: conversations, error: conversationsError } = await supabaseSelect(
        supabase
          .from('conversations')
          .select('id, channel')
      );

      if (conversationsError) throw conversationsError;

      const channelStats: ChannelStats = {
        whatsapp: { messages: 0, leads: 0 },
        facebook: { messages: 0, leads: 0 },
        instagram: { messages: 0, leads: 0 }
      };

      // Count messages by channel
      for (const conversation of conversations || []) {
        const { data: messages, error: messagesError } = await supabaseSelect(
          supabase
            .from('messages')
            .select('id')
            .eq('conversation_id', conversation.id)
        );

        if (messagesError) {
          continue;
        }

        const channel = conversation.channel as keyof ChannelStats;
        if (channelStats[channel]) {
          channelStats[channel].messages += messages?.length || 0;
        }
      }

      // Get leads by channel from CRM
      const { data: crmClients, error: crmError } = await supabaseSelect(
        supabase
          .from('crm_clients')
          .select('source')
      );

      if (!crmError) {
        // Count leads by channel
        for (const client of crmClients || []) {
          const source = client.source as keyof ChannelStats;
          if (channelStats[source]) {
            channelStats[source].leads += 1;
          }
        }
      }

      // Calculate totals
      const totalMessages = channelStats.whatsapp.messages + channelStats.facebook.messages + channelStats.instagram.messages;
      const totalLeads = channelStats.whatsapp.leads + channelStats.facebook.leads + channelStats.instagram.leads;
      const totalConversations = conversations?.length || 0;

      const generalStats: GeneralStatsData = {
        total_clients: profiles?.length || 0,
        free_clients: planCounts.free,
        premium_clients: planCounts.premium,
        enterprise_clients: planCounts.enterprise,
        total_messages_platform: totalMessages,
        total_leads_platform: totalLeads,
        whatsapp_messages: channelStats.whatsapp.messages,
        facebook_messages: channelStats.facebook.messages,
        instagram_messages: channelStats.instagram.messages,
        whatsapp_leads: channelStats.whatsapp.leads,
        facebook_leads: channelStats.facebook.leads,
        instagram_leads: channelStats.instagram.leads,
        total_conversations: totalConversations,
        active_clients: planCounts.active,
        inactive_clients: planCounts.inactive
      };

      console.log('✅ General statistics fetched successfully');
      return {
        stats: generalStats,
        success: true
      };

    } catch (error: unknown) {
      console.error('❌ Error fetching general statistics:', error);
      return {
        stats: {
          total_clients: 0,
          free_clients: 0,
          premium_clients: 0,
          enterprise_clients: 0,
          total_messages_platform: 0,
          total_leads_platform: 0,
          whatsapp_messages: 0,
          facebook_messages: 0,
          instagram_messages: 0,
          whatsapp_leads: 0,
          facebook_leads: 0,
          instagram_leads: 0,
          total_conversations: 0,
          active_clients: 0,
          inactive_clients: 0
        },
        success: false,
        error: handleSupabaseError(error, "Error al cargar estadísticas generales").description
      };
    }
  }

  /**
   * Get plan icon color
   */
  static getPlanIconColor: IconColorFunction = (plan: PlanType) => {
    const colors = {
      free: 'text-gray-500',
      premium: 'text-blue-500',
      enterprise: 'text-purple-500'
    };
    return colors[plan];
  };

  /**
   * Get channel icon color
   */
  static getChannelIconColor: ChannelIconColorFunction = (channel: ChannelType) => {
    const colors = {
      whatsapp: 'text-green-500',
      facebook: 'text-blue-500',
      instagram: 'text-pink-500'
    };
    return colors[channel];
  };

  /**
   * Format number with locale
   */
  static formatNumber(value: number): string {
    return value.toLocaleString();
  }

  /**
   * Calculate percentage
   */
  static calculatePercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  /**
   * Get plan display name
   */
  static getPlanDisplayName(plan: PlanType): string {
    const names = {
      free: 'Plan Gratuito',
      premium: 'Plan Premium',
      enterprise: 'Plan Enterprise'
    };
    return names[plan];
  }

  /**
   * Get channel display name
   */
  static getChannelDisplayName(channel: ChannelType): string {
    const names = {
      whatsapp: 'WhatsApp',
      facebook: 'Facebook',
      instagram: 'Instagram'
    };
    return names[channel];
  }

  /**
   * Validate general stats data
   */
  static validateGeneralStats(stats: unknown): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!stats || typeof stats !== 'object') {
      errors.push('Stats data must be an object');
      return { isValid: false, errors };
    }

    const s = stats as Record<string, unknown>;

    if (typeof s.total_clients !== 'number' || s.total_clients < 0) {
      errors.push('Total clients must be a non-negative number');
    }

    if (typeof s.total_messages_platform !== 'number' || s.total_messages_platform < 0) {
      errors.push('Total messages must be a non-negative number');
    }

    if (typeof s.total_leads_platform !== 'number' || s.total_leads_platform < 0) {
      errors.push('Total leads must be a non-negative number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get loading skeleton count
   */
  static getLoadingSkeletonCount(): number {
    return 8; // Number of cards to show while loading
  }

  /**
   * Handle Supabase errors
   */
  static handleSupabaseError = handleSupabaseError;
}
