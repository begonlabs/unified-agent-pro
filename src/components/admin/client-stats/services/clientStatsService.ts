import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseSelect, handleSupabaseError } from '@/lib/supabaseUtils';
import {
  ClientWithStats,
  ClientStats,
  ChannelStats,
  FetchClientStatsResponse,
  ChannelType,
  PlanType,
  BadgeColorFunction,
  ChannelIconFunction
} from '../types';
import { MessageCircle, Facebook, Instagram, User } from 'lucide-react';

export class ClientStatsService {
  /**
   * Fetch client statistics from the database
   */
  static async fetchClientStats(): Promise<FetchClientStatsResponse> {
    try {
      console.log('📊 Fetching client statistics...');

      // Get all user profiles
      const { data: profiles, error: profilesError } = await supabaseSelect(
        supabase
          .from('profiles')
          .select('*')
          .order('company_name')
      );

      if (profilesError) throw profilesError;

      // Get statistics for each client
      const clientsWithStats: ClientWithStats[] = [];

      for (const profile of profiles || []) {
        // Get user conversations
        const { data: conversations, error: conversationsError } = await supabaseSelect(
          supabase
            .from('conversations')
            .select('id, channel, created_at')
            .eq('user_id', profile.user_id)
        );

        if (conversationsError) {
          continue;
        }

        // Get messages by channel
        const channelStats: ChannelStats = {
          whatsapp: { messages: 0, leads: 0 },
          facebook: { messages: 0, leads: 0 },
          instagram: { messages: 0, leads: 0 }
        };

        // Get messages for each conversation
        for (const conversation of conversations || []) {
          const { data: messages, error: messagesError } = await supabaseSelect(
            supabase
              .from('messages')
              .select('sender_type, created_at')
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

        // Get leads (CRM clients) by channel
        const { data: crmClients, error: crmError } = await supabaseSelect(
          supabase
            .from('crm_clients')
            .select('source, created_at')
            .eq('user_id', profile.user_id)
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

        // Calculate total statistics
        const totalMessages = channelStats.whatsapp.messages + channelStats.facebook.messages + channelStats.instagram.messages;
        const totalLeads = channelStats.whatsapp.leads + channelStats.facebook.leads + channelStats.instagram.leads;
        const totalConversations = conversations?.length || 0;
        
        // Calculate response rate (simplified)
        const responseRate = totalMessages > 0 ? Math.round((totalMessages / totalConversations) * 100) / 100 : 0;

        clientsWithStats.push({
          ...profile,
          stats: {
            whatsapp_messages: channelStats.whatsapp.messages,
            facebook_messages: channelStats.facebook.messages,
            instagram_messages: channelStats.instagram.messages,
            whatsapp_leads: channelStats.whatsapp.leads,
            facebook_leads: channelStats.facebook.leads,
            instagram_leads: channelStats.instagram.leads,
            total_messages: totalMessages,
            total_leads: totalLeads,
            total_conversations: totalConversations,
            response_rate: responseRate
          }
        });
      }

      console.log('✅ Client statistics fetched:', clientsWithStats.length);
      return {
        clients: clientsWithStats,
        success: true
      };

    } catch (error: unknown) {
      console.error('❌ Error fetching client statistics:', error);
      return {
        clients: [],
        success: false,
        error: handleSupabaseError(error, "Error al cargar estadísticas de clientes").description
      };
    }
  }

  /**
   * Get plan badge color class
   */
  static getPlanBadgeColor: BadgeColorFunction = (plan: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      premium: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800'
    };
    return colors[plan as keyof typeof colors] || colors.free;
  };

  /**
   * Get channel icon component
   */
  static getChannelIcon: ChannelIconFunction = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return React.createElement(MessageCircle, { className: "h-3 w-3 text-green-500" });
      case 'facebook':
        return React.createElement(Facebook, { className: "h-3 w-3 text-blue-500" });
      case 'instagram':
        return React.createElement(Instagram, { className: "h-3 w-3 text-pink-500" });
      default:
        return React.createElement(User, { className: "h-3 w-3 text-gray-500" });
    }
  };

  /**
   * Format number with locale
   */
  static formatNumber(value: number): string {
    return value.toLocaleString();
  }

  /**
   * Format response rate
   */
  static formatResponseRate(rate: number): string {
    return rate.toFixed(2);
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
   * Get plan display name
   */
  static getPlanDisplayName(plan: PlanType): string {
    const names = {
      free: 'Free',
      premium: 'Premium',
      enterprise: 'Enterprise'
    };
    return names[plan];
  }

  /**
   * Calculate channel performance score
   */
  static calculateChannelPerformance(stats: ClientStats, channel: ChannelType): number {
    const channelMessages = channel === 'whatsapp' ? stats.whatsapp_messages :
                           channel === 'facebook' ? stats.facebook_messages :
                           stats.instagram_messages;
    
    const channelLeads = channel === 'whatsapp' ? stats.whatsapp_leads :
                         channel === 'facebook' ? stats.facebook_leads :
                         stats.instagram_leads;

    // Simple performance score: messages + leads * 2
    return channelMessages + (channelLeads * 2);
  }

  /**
   * Get top performing channel
   */
  static getTopChannel(stats: ClientStats): ChannelType {
    const whatsappScore = this.calculateChannelPerformance(stats, 'whatsapp');
    const facebookScore = this.calculateChannelPerformance(stats, 'facebook');
    const instagramScore = this.calculateChannelPerformance(stats, 'instagram');

    if (whatsappScore >= facebookScore && whatsappScore >= instagramScore) {
      return 'whatsapp';
    } else if (facebookScore >= instagramScore) {
      return 'facebook';
    } else {
      return 'instagram';
    }
  }

  /**
   * Validate client stats data
   */
  static validateClientStats(client: unknown): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!client || typeof client !== 'object') {
      errors.push('Client data must be an object');
      return { isValid: false, errors };
    }

    const c = client as Record<string, unknown>;

    if (!c.id || typeof c.id !== 'string') {
      errors.push('Client ID is required');
    }

    if (!c.company_name || typeof c.company_name !== 'string') {
      errors.push('Company name is required');
    }

    if (!c.stats || typeof c.stats !== 'object') {
      errors.push('Client stats are required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Handle Supabase errors
   */
  static handleSupabaseError = handleSupabaseError;
}
