import { supabase } from '@/integrations/supabase/client';
import { supabaseSelect, handleSupabaseError } from '@/lib/supabaseUtils';
import {
  Channel,
  WhatsAppConfig,
  FacebookConfig,
  InstagramConfig,
  InstagramVerification,
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
    const channel = channels.find(c => c.channel_type === channelType);

    if (!channel || !channel.channel_config) {
      return false;
    }

    switch (channelType) {
      case 'whatsapp': {
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
        const hasAccountType = Boolean(config?.account_type);
        const isConnected = Boolean(channel.is_connected);
        const isTokenValid = config?.expires_at ? new Date(config.expires_at) > new Date() : false;

        return hasUsername && hasAccessToken && hasInstagramUserId && hasAccountType &&
          isConnected && isTokenValid;
      }

      default:
        return channel?.is_connected || false;
    }
  }

  /**
   * Verifica si Instagram necesita verificación
   */
  static instagramNeedsVerification(config: InstagramConfig): boolean {
    return config.instagram_user_id === config.instagram_business_account_id ||
      !config.instagram_business_account_id;
  }

  /**
   * Genera código de verificación para Instagram
   */
  static async generateInstagramVerificationCode(channelId: string, user: User): Promise<InstagramVerification> {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_EDGE_BASE_URL}/functions/v1/generate-instagram-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify({
        channel_id: channelId
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Error generando código de verificación');
    }

    return {
      id: `${channelId}_${Date.now()}`,
      verification_code: result.verification_code,
      status: 'pending',
      expires_at: result.expires_at
    };
  }

  /**
   * Verifica el estado de verificación de Instagram
   */
  static async checkVerificationStatus(channelId: string, user: User): Promise<boolean> {
    const { data: channel } = await supabase
      .from('communication_channels')
      .select('channel_config, updated_at')
      .eq('id', channelId)
      .eq('user_id', user.id)
      .single();

    if (channel) {
      const config = channel.channel_config as unknown as InstagramConfig;
      const needsVerification = this.instagramNeedsVerification(config);

      return !needsVerification && Boolean(config.verified_at);
    }

    return false;
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
   * Construye URL de OAuth para Instagram
   */
  static buildInstagramOAuthUrl(user: User): string {
    const INSTAGRAM_CLIENT_ID = import.meta.env.VITE_INSTAGRAM_BASIC_APP_ID || '1215743729877419';
    const EDGE_BASE_URL = import.meta.env.VITE_SUPABASE_EDGE_BASE_URL || 'https://supabase.ondai.ai';

    const redirectUri = `${EDGE_BASE_URL}/functions/v1/instagram-oauth`;

    const scope = [
      'instagram_business_basic',
      'instagram_business_manage_messages',
      'instagram_business_manage_comments',
      'instagram_business_content_publish',
      'instagram_business_manage_insights'
    ].join(',');

    const state = encodeURIComponent(JSON.stringify({
      user_id: user.id
    }));

    return `https://www.instagram.com/oauth/authorize?` +
      `client_id=${INSTAGRAM_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `state=${state}`;
  }

  /**
   * Maneja errores de Supabase
   */
  static handleSupabaseError = handleSupabaseError;
}
