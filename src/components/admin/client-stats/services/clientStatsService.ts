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
      console.log('📊 Fetching client statistics (optimized)...');

      // 1. Attempt using optimized RPC first
      try {
        const { data: rpcData, error: rpcError } = await (supabase as any).rpc('get_admin_clients_stats');

        if (!rpcError && rpcData) {
          console.log('✅ Fetched admin stats via RPC');
          const clients: ClientWithStats[] = rpcData.map((item: any) => ({
            id: item.user_id,
            user_id: item.user_id,
            company_name: item.company_name,
            email: item.email,
            plan_type: item.plan_type || 'free',
            is_active: item.is_active,
            stats: {
              whatsapp_messages: Number(item.channel_messages?.whatsapp || 0),
              facebook_messages: Number(item.channel_messages?.facebook || 0),
              instagram_messages: Number(item.channel_messages?.instagram || 0),
              whatsapp_leads: Number(item.channel_leads?.whatsapp || 0),
              facebook_leads: Number(item.channel_leads?.facebook || 0),
              instagram_leads: Number(item.channel_leads?.instagram || 0),
              total_messages: Number(item.total_messages || 0),
              total_leads: Number(item.total_leads || 0),
              total_conversations: Number(item.total_conversations || 0),
              response_rate: Number(item.response_rate || 0)
            }
          }));
          return { clients, success: true };
        }
      } catch (e) {
        console.warn('⚠️ RPC optimization not available, falling back...');
      }

      // 2. Fallback: Manual but optimized aggregation
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('company_name');

      if (profilesError) throw profilesError;

      // Parallel fetching for performance
      const [convResult, leadResult] = await Promise.all([
        supabase.from('conversations').select('user_id, channel'),
        supabase.from('crm_clients').select('user_id, source')
      ]);

      const conversations = convResult.data || [];
      const crmClients = leadResult.data || [];
      const userStatsMap: Record<string, ClientStats> = {};

      // Initialize mapping
      profiles?.forEach(p => {
        userStatsMap[p.user_id] = {
          whatsapp_messages: 0,
          facebook_messages: 0,
          instagram_messages: 0,
          whatsapp_leads: 0,
          facebook_leads: 0,
          instagram_leads: 0,
          total_messages: 0,
          total_leads: 0,
          total_conversations: 0,
          response_rate: 0
        };
      });

      // Simple aggregation for conversations
      conversations.forEach((c: any) => {
        if (userStatsMap[c.user_id]) userStatsMap[c.user_id].total_conversations++;
      });

      // Simple aggregation for leads
      crmClients.forEach((c: any) => {
        if (userStatsMap[c.user_id]) {
          const rawSource = (c.source || 'whatsapp').toLowerCase();
          if (rawSource.startsWith('whatsapp')) userStatsMap[c.user_id].whatsapp_leads++;
          else if (rawSource.startsWith('facebook')) userStatsMap[c.user_id].facebook_leads++;
          else if (rawSource.startsWith('instagram')) userStatsMap[c.user_id].instagram_leads++;
        }
      });

      const clientsWithStats: ClientWithStats[] = (profiles || []).map(profile => {
        const stats = userStatsMap[profile.user_id];
        stats.total_leads = stats.whatsapp_leads + stats.facebook_leads + stats.instagram_leads;
        // Total messages is hard to get without N queries or the RPC, so it'll remain 0 or limited in fallback
        stats.total_messages = 0;
        stats.response_rate = 0;

        return {
          ...profile,
          stats
        };
      });

      return { clients: clientsWithStats, success: true };

    } catch (error: unknown) {
      console.error('❌ Error in ClientStatsService:', error);
      return {
        clients: [],
        success: false,
        error: handleSupabaseError(error, "Error al cargar estadísticas").description
      };
    }
  }

  /**
   * Get plan badge color class
   */
  static getPlanBadgeColor: BadgeColorFunction = (plan: string) => {
    const colors: Record<string, string> = {
      free: 'bg-slate-100 text-slate-800 border-slate-200',
      basico: 'bg-blue-100 text-blue-800 border-blue-200',
      avanzado: 'bg-purple-100 text-purple-800 border-purple-200',
      pro: 'bg-amber-100 text-amber-800 border-amber-200',
      empresarial: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      premium: 'bg-purple-100 text-purple-800 border-purple-200',
      enterprise: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    };
    return colors[plan.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  /**
   * Get channel icon component
   */
  static getChannelIcon: ChannelIconFunction = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return React.createElement(MessageCircle, { className: "h-3.5 w-3.5 text-emerald-500" });
      case 'facebook':
        return React.createElement(Facebook, { className: "h-3.5 w-3.5 text-blue-600" });
      case 'instagram':
        return React.createElement(Instagram, { className: "h-3.5 w-3.5 text-pink-600" });
      default:
        return React.createElement(User, { className: "h-3.5 w-3.5 text-slate-400" });
    }
  };

  /**
   * Format number with locale
   */
  static formatNumber(value: number): string {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toLocaleString();
  }

  /**
   * Format response rate
   */
  static formatResponseRate(rate: number): string {
    return rate.toFixed(1);
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
  static getPlanDisplayName(plan: string): string {
    const names: Record<string, string> = {
      free: 'Gratuito',
      basico: 'Básico',
      avanzado: 'Avanzado',
      pro: 'Pro',
      empresarial: 'Empresarial',
      premium: 'Avanzado',
      enterprise: 'Empresarial'
    };
    return names[plan.toLowerCase()] || plan;
  }

  /**
   * Top performing channel calculation
   */
  static getTopChannel(stats: ClientStats): ChannelType {
    const scores = {
      whatsapp: (stats.whatsapp_messages * 0.5) + (stats.whatsapp_leads * 5),
      facebook: (stats.facebook_messages * 0.5) + (stats.facebook_leads * 5),
      instagram: (stats.instagram_messages * 0.5) + (stats.instagram_leads * 5)
    };

    if (scores.whatsapp >= scores.facebook && scores.whatsapp >= scores.instagram) return 'whatsapp';
    if (scores.facebook >= scores.instagram) return 'facebook';
    return 'instagram';
  }

  /**
   * Handle Supabase errors
   */
  static handleSupabaseError = handleSupabaseError;
}
