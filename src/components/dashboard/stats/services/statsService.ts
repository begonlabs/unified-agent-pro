import { supabase } from '@/integrations/supabase/client';
import { handleSupabaseError } from '@/lib/supabaseUtils';
import {
  StatsData,
  ChannelStat,
  DailyStat,
  FormattedDailyStat,
  AutomationData,
  ChartData,
  StatsServiceResponse,
  ConversationData,
  MessageData,
  ClientData,
  User
} from '../types';

export class StatsService {
  /**
   * Fetch all statistics data for a user
   */
  static async fetchUserStats(userId: string): Promise<StatsServiceResponse> {
    try {
      console.log('🔍 Fetching stats for user:', userId);
      
      // 1. Fetch conversations with messages
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          channel,
          created_at,
          client_id,
          messages (
            id,
            sender_type,
            is_automated,
            created_at
          )
        `)
        .eq('user_id', userId);
      
      if (conversationsError) {
        throw conversationsError;
      }
      
      // 2. Fetch clients
      const { data: clients, error: clientsError } = await supabase
        .from('crm_clients')
        .select('id, status, created_at')
        .eq('user_id', userId);
      
      if (clientsError) {
        throw clientsError;
      }
      
      console.log('Raw data loaded:', { 
        conversations: conversations?.length || 0, 
        clients: clients?.length || 0 
      });
      
      // 3. Process statistics
      const stats = this.processStats(conversations as ConversationData[], clients as ClientData[]);
      
      // 4. Process chart data
      const chartData = this.processChartData(conversations as ConversationData[]);
      
      console.log('Stats processed successfully:', {
        totalMessages: stats.totalMessages,
        automatedMessages: stats.automatedMessages,
        humanMessages: stats.humanMessages,
        responseRate: stats.responseRate,
        channels: chartData.channelData.length,
        dailyData: chartData.dailyData.length
      });
      
      return { stats, chartData };
      
    } catch (error: unknown) {
      console.error('Error loading stats:', error);
      throw error;
    }
  }

  /**
   * Process raw data into statistics
   */
  private static processStats(conversations: ConversationData[], clients: ClientData[]): StatsData {
    let totalMessages = 0;
    let automatedMessages = 0;
    let humanMessages = 0;
    let clientMessages = 0;
    let conversationsWithResponse = 0;
    
    const currentDate = new Date();
    const sevenDaysAgo = new Date(currentDate.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    // Process conversations and messages
    conversations?.forEach(conversation => {
      const messages = conversation.messages || [];
      const hasResponse = messages.some(m => 
        m.sender_type === 'ai' || m.sender_type === 'agent' || m.sender_type === 'human' || m.is_automated
      );
      
      if (hasResponse) {
        conversationsWithResponse++;
      }
      
      messages.forEach(message => {
        totalMessages++;
        
        if (message.sender_type === 'ai' || message.is_automated) {
          automatedMessages++;
        } else if (message.sender_type === 'agent' || message.sender_type === 'human') {
          humanMessages++;
        } else if (message.sender_type === 'client') {
          clientMessages++;
        }
      });
    });
    
    // Process client statistics
    const totalClients = clients?.length || 0;
    const newLeads = clients?.filter(client => {
      const createdAt = new Date(client.created_at);
      return createdAt >= sevenDaysAgo;
    }).length || 0;
    
    // Calculate response rate
    const responseRate = conversations?.length > 0 
      ? Math.round((conversationsWithResponse / conversations.length) * 100 * 100) / 100
      : 0;
    
    return {
      totalMessages,
      automatedMessages,
      humanMessages,
      clientMessages,
      responseRate,
      newLeads,
      totalClients,
      totalConversations: conversations?.length || 0
    };
  }

  /**
   * Process raw data into chart data
   */
  private static processChartData(conversations: ConversationData[]): ChartData {
    const channelStats: Record<string, ChannelStat> = {};
    const dailyStats: Record<string, DailyStat> = {};
    const currentDate = new Date();
    const sevenDaysAgo = new Date(currentDate.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    // Process channel statistics
    conversations?.forEach(conversation => {
      const messages = conversation.messages || [];
      const channel = conversation.channel;
      
      if (!channelStats[channel]) {
        channelStats[channel] = {
          name: this.getChannelDisplayName(channel),
          messages: 0,
          leads: 0,
          color: this.getChannelColor(channel)
        };
      }
      
      messages.forEach(message => {
        channelStats[channel].messages++;
        
        // Daily statistics (last 7 days)
        const messageDate = new Date(message.created_at);
        if (messageDate >= sevenDaysAgo) {
          const dateKey = messageDate.toDateString();
          if (!dailyStats[dateKey]) {
            dailyStats[dateKey] = {
              date: messageDate,
              messages: 0,
              leads: 0,
              responseRate: 0
            };
          }
          dailyStats[dateKey].messages++;
        }
      });
      
      // Count leads by channel
      if (conversation.client_id) {
        channelStats[channel].leads++;
      }
    });
    
    // Format channel data
    const channelData = Object.values(channelStats);
    
    // Format daily data
    const dailyData: FormattedDailyStat[] = Object.values(dailyStats)
      .sort((a: DailyStat, b: DailyStat) => a.date.getTime() - b.date.getTime())
      .map((day: DailyStat) => ({
        date: day.date.toLocaleDateString('es-ES', {
          month: '2-digit',
          day: '2-digit'
        }),
        messages: day.messages,
        leads: day.leads,
        responseRate: day.responseRate
      }));
    
    // Create automation data
    const totalMessages = channelData.reduce((sum, channel) => sum + channel.messages, 0);
    const automationData: AutomationData[] = [
      { name: 'Automatizados', value: 0, color: '#10B981' },
      { name: 'Humanos', value: 0, color: '#3B82F6' }
    ];
    
    return {
      channelData,
      dailyData,
      automationData
    };
  }

  /**
   * Get display name for channel
   */
  private static getChannelDisplayName(channel: string): string {
    switch (channel) {
      case 'whatsapp':
        return 'WhatsApp';
      case 'facebook':
        return 'Facebook';
      case 'instagram':
        return 'Instagram';
      default:
        return channel;
    }
  }

  /**
   * Get color for channel
   */
  private static getChannelColor(channel: string): string {
    switch (channel) {
      case 'whatsapp':
        return '#25D366';
      case 'facebook':
        return '#1877F2';
      case 'instagram':
        return '#E4405F';
      default:
        return '#6B7280';
    }
  }

  /**
   * Calculate automation data for pie chart
   */
  static calculateAutomationData(stats: StatsData): AutomationData[] {
    return [
      { name: 'Automatizados', value: stats.automatedMessages, color: '#10B981' },
      { name: 'Humanos', value: stats.humanMessages, color: '#3B82F6' }
    ];
  }

  /**
   * Handle Supabase errors
   */
  static handleSupabaseError = handleSupabaseError;
}
