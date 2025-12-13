import { supabase } from '@/integrations/supabase/client';
import { supabaseSelect, handleSupabaseError } from '@/lib/supabaseUtils';
import {
  Channel,
  WhatsAppConfig,
  FacebookConfig,
  InstagramConfig,
  User
} from '../types';


export class ChannelsService {
  /**
   * Obtiene todos los canales del usuario
   */
  static async fetchChannels(user: User | null): Promise<Channel[]> {
    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    const { data } = await supabaseSelect(
      supabase
        .from('communication_channels')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
    );

    return (data as Channel[]) || [];
  }

  /**
   * Verifica el estado de conexión de un canal específico
   */
  static getChannelStatus(channelType: string, channels: Channel[]): boolean {
    // Para WhatsApp, buscar tanto 'whatsapp' como 'whatsapp_green_api'
    let channel: Channel | undefined;
    if (channelType === 'whatsapp') {
      channel = channels.find(c => c.channel_type === 'whatsapp' || c.channel_type === 'whatsapp_green_api');
    } else {
      channel = channels.find(c => c.channel_type === channelType);
    }

    // Special logic for Instagram legacy compatibility
    if (channelType === 'instagram' && !channel) {
      channel = channels.find(c => c.channel_type === 'instagram_legacy');
    }

    if (!channel || !channel.channel_config) {
      return false;
    }

    switch (channelType) {
      case 'whatsapp': {
        // Si es Green API, solo verificar is_connected
        if (channel.channel_type === 'whatsapp_green_api') {
          return Boolean(channel.is_connected);
        }
        // Para WhatsApp Business API (Meta)
        const config = channel.channel_config as WhatsAppConfig;
        const hasPhoneNumberId = Boolean(config?.phone_number_id);
        const hasBusinessAccountId = Boolean(config?.business_account_id);
        const hasAccessToken = Boolean(config?.access_token);
        const isConnected = Boolean(channel.is_connected);
        return hasPhoneNumberId && hasBusinessAccountId && hasAccessToken && isConnected;
      }

      case 'facebook': {
        const config = channel.channel_config as FacebookConfig;
        const hasPageId = Boolean(config?.page_id);
        const hasPageToken = Boolean(config?.page_access_token);
        const hasUserToken = Boolean(config?.user_access_token);
        const isConnected = Boolean(channel.is_connected);
        return hasPageId && hasPageToken && hasUserToken && isConnected;
      }

      case 'instagram': {
        const config = channel.channel_config as InstagramConfig;
        const hasUsername = Boolean(config?.username);
        const hasAccessToken = Boolean(config?.access_token);
        const hasInstagramUserId = Boolean(config?.instagram_user_id);
        const isConnected = Boolean(channel.is_connected);

        // Relaxed validation: page_id and business_account_id are critical but
        // older connections or failed fetches might miss them.
        // We mainly need username + token + logic user id
        const hasEssentialIds = Boolean(config?.instagram_business_account_id) || Boolean(config?.page_id);

        // For legacy channels, requirements are simpler (Basic Display API)
        if (channel.channel_type === 'instagram_legacy') {
          return hasUsername && hasAccessToken && isConnected;
        }

        return hasUsername && hasAccessToken && hasInstagramUserId &&
          hasEssentialIds && isConnected;
      }

      default:
        return channel?.is_connected || false;
    }
  }







  /**
   * Procesa la autorización de WhatsApp
   */
  static async processWhatsAppAuth(code: string, state: string, user: User): Promise<{ businessName: string; phoneNumber: string }> {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_EDGE_BASE_URL}/functions/v1/whatsapp-embedded-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code,
        state: state,
        userId: user.id
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Error desconocido al conectar WhatsApp');
    }

    return result.data;
  }

  /**
   * Desconecta un canal
   */
  static async disconnectChannel(channelId: string, user: User): Promise<void> {
    // 1. Fetch channel details to check if we need to perform external logout
    const { data: channel } = await supabase
      .from('communication_channels')
      .select('*')
      .eq('id', channelId)
      .eq('user_id', user.id)
      .single();

    // 2. If it's Green API, call logout endpoint
    if (channel && channel.channel_type === 'whatsapp_green_api') {
      const config = channel.channel_config as any;
      const { idInstance, apiTokenInstance, apiUrl } = config;

      if (idInstance && apiTokenInstance) {
        try {
          const baseUrl = apiUrl || 'https://7107.api.green-api.com';
          const url = `${baseUrl}/waInstance${idInstance}/logout/${apiTokenInstance}`;
          console.log('Logging out from Green API:', url);

          const response = await fetch(url, { method: 'POST' });
          const result = await response.json();
          console.log('Green API Logout result:', result);
        } catch (e) {
          console.error('Error logging out from Green API:', e);
          // We continue with deletion even if logout fails
        }
      }
    }

    // 3. Delete from Supabase
    const { error } = await supabase
      .from('communication_channels')
      .delete()
      .eq('id', channelId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }
  }

  /**
   * Prueba el webhook de Facebook
   */
  static async testFacebookWebhook(channelId: string, user: User): Promise<void> {
    const { data: channel } = await supabase
      .from('communication_channels')
      .select('*')
      .eq('id', channelId)
      .eq('user_id', user.id)
      .single();

    if (!channel || channel.channel_type !== 'facebook') {
      throw new Error('Canal de Facebook no encontrado');
    }

    const config = channel.channel_config as unknown as FacebookConfig;
    const pageAccessToken = config.page_access_token;
    const pageId = config.page_id;

    if (!pageAccessToken) {
      throw new Error('Token de acceso no encontrado');
    }

    const webhookUrl = `${import.meta.env.VITE_SUPABASE_EDGE_BASE_URL}/functions/v1/meta-webhook`;

    const testMessage = `Test desde OndAI - ${new Date().toLocaleTimeString()}`;

    const webhookTestMessage = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        object: 'page',
        entry: [{
          id: pageId,
          time: Date.now(),
          messaging: [{
            sender: { id: 'test_user_123' },
            recipient: { id: pageId },
            timestamp: Date.now(),
            message: {
              text: testMessage,
              mid: 'test_message_' + Date.now()
            }
          }]
        }]
      })
    });

    if (!webhookTestMessage.ok) {
      const errorData = await webhookTestMessage.text();
      throw new Error(`Webhook test failed: ${errorData}`);
    }
  }

  /**
   * Construye URL de OAuth para Facebook
   */
  static buildFacebookOAuthUrl(user: User): string {
    const META_APP_ID = import.meta.env.VITE_META_APP_ID || '728339836340255';
    const META_GRAPH_VERSION = import.meta.env.VITE_META_GRAPH_VERSION || 'v24.0';
    const EDGE_BASE_URL = import.meta.env.VITE_SUPABASE_EDGE_BASE_URL || 'https://supabase.ondai.ai';

    const redirectUri = `${EDGE_BASE_URL}/functions/v1/meta-oauth`;
    const scope = [
      'pages_show_list',
      'pages_manage_metadata',
      'pages_messaging',
      'pages_read_engagement',
      'business_management', // Added for Business Manager pages
      'public_profile'
    ].join(',');

    const state = encodeURIComponent(JSON.stringify({ user_id: user.id }));

    return `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth?client_id=${encodeURIComponent(META_APP_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&auth_type=rerequest`;
  }

  /**
   * Construye URL de OAuth para Instagram (usando Meta Graph API)
   */
  static buildInstagramOAuthUrl(user: User): string {
    const META_APP_ID = import.meta.env.VITE_META_APP_ID || '728339836340255';
    const META_GRAPH_VERSION = import.meta.env.VITE_META_GRAPH_VERSION || 'v24.0';
    const EDGE_BASE_URL = import.meta.env.VITE_SUPABASE_EDGE_BASE_URL || 'https://supabase.ondai.ai';

    const redirectUri = `${EDGE_BASE_URL}/functions/v1/meta-oauth`;
    const scope = [
      'pages_show_list',
      'pages_manage_metadata',
      'pages_messaging',
      'pages_read_engagement',
      'instagram_basic',
      'instagram_manage_messages',
      'business_management',
      'public_profile'
    ].join(',');

    const state = encodeURIComponent(JSON.stringify({
      user_id: user.id,
      platform: 'instagram' // Indicate we want Instagram
    }));

    return `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth?client_id=${encodeURIComponent(META_APP_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&auth_type=rerequest`;
  }

  /**
   * Inicia el proceso de autenticación legacy de Instagram (Basic Display)
   */
  static async startInstagramLegacyAuth(user: User): Promise<string> {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_EDGE_BASE_URL}/functions/v1/start-instagram-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user.id
      })
    });

    const result = await response.json();

    if (!result.success || !result.auth_url) {
      throw new Error(result.error || 'Error al iniciar autenticación de Instagram Legacy');
    }

    return result.auth_url;
  }

  /**
   * Maneja errores de Supabase
   */
  static handleSupabaseError = handleSupabaseError;
}
