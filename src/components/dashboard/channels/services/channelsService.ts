import { supabase } from '@/integrations/supabase/client';
import { supabaseSelect, handleSupabaseError } from '@/lib/supabaseUtils';
import {
  Channel,
  WhatsAppConfig,
  FacebookConfig,
  InstagramConfig,
  User
} from '../types';
import { getGreenApiHost } from '@/utils/greenApiUtils';


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
    if (!Array.isArray(channels)) return false;

    // Para WhatsApp, buscar tanto 'whatsapp' como 'whatsapp_green_api'
    let channel: Channel | undefined;
    if (channelType === 'whatsapp') {
      return channels.some(c => (c.channel_type === 'whatsapp' || c.channel_type === 'whatsapp_green_api') && c.is_connected);
    } else {
      return channels.some(c => c.channel_type === channelType && c.is_connected);
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
   * Desconecta o elimina permanentemente un canal
   */
  static async disconnectChannel(channelId: string, user: User, hardDelete: boolean = false): Promise<void> {
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
          const host = getGreenApiHost(idInstance, apiUrl).replace(/\/$/, '');
          const url = `${host}/waInstance${idInstance}/logout/${apiTokenInstance}`;
          console.log('🔓 Cerrando sesión en Green API:', url.replace(apiTokenInstance, 'REDACTED'));

          const response = await fetch(url, { method: 'GET' });
          if (response.ok) {
            const result = await response.json();
            console.log('✅ Cierre de sesión exitoso:', result);
          } else {
            const errorText = await response.text();
            console.warn('⚠️ Error al cerrar sesión en Green API, continuando con eliminación:', errorText);
          }
        } catch (e) {
          console.error('❌ Error fatal al intentar cerrar sesión en Green API:', e);
          // Continuamos con la eliminación aunque falle el cierre de sesión externo
        }
      }
    }

    // 3. Update or Delete from Supabase
    // Si el canal es de tipo whatsapp (cualquiera), marcamos TODOS como desconectados para este usuario
    const isWhatsApp = channel && (channel.channel_type === 'whatsapp' || channel.channel_type === 'whatsapp_green_api');

    if (isWhatsApp) {
      if (hardDelete) {
        // Full removal from Green API and Supabase
        const { idInstance } = channel.channel_config as any;
        console.log(`🧨 Eliminación permanente solicitada para instancia: ${idInstance}`);

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_EDGE_BASE_URL}/functions/v1/delete-green-api-instance`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idInstance,
            user_id: user.id
          })
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Error al eliminar la instancia permanentemente');
        }
      } else {
        // For ALL whatsapp types for this user, mark as disconnected
        // This solves desync issues where orphans might still be 'is_connected: true'
        console.log(`📝 Marcando TODOS los canales de WhatsApp del usuario ${user.id} como desconectados`);

        const { error } = await supabase
          .from('communication_channels')
          .update({
            is_connected: false
          })
          .eq('user_id', user.id)
          .in('channel_type', ['whatsapp', 'whatsapp_green_api']);

        if (error) {
          console.error('❌ Error al actualizar is_connected en Supabase:', error);
          throw error;
        }
      }
      console.log('✅ Canal de WhatsApp procesado correctamente');
    } else {
      // For other channels, we delete as before
      const { error } = await supabase
        .from('communication_channels')
        .delete()
        .eq('id', channelId)
        .eq('user_id', user.id);

      if (error) throw error;
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
   * Maneja errores de Supabase
   */
  static handleSupabaseError = handleSupabaseError;
}
