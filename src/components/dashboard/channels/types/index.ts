import { User } from '@supabase/supabase-js';

// Facebook SDK types
export interface FacebookSDK {
  init: (config: {
    appId: string;
    cookie: boolean;
    xfbml: boolean;
    version: string;
  }) => void;
  login: (
    callback: (response: FacebookLoginResponse) => void,
    options: {
      config_id?: string;
      response_type?: string;
      override_default_response_type?: boolean;
      extras?: Record<string, unknown>;
    }
  ) => void;
}

export interface FacebookLoginResponse {
  status: string;
  code?: string;
  authResponse?: {
    code?: string;
    accessToken?: string;
  };
}

declare global {
  interface Window {
    FB: FacebookSDK;
    fbAsyncInit: () => void;
  }
}

export type ChannelType = 'whatsapp' | 'facebook' | 'instagram' | string;

export interface WhatsAppConfig {
  phone_number: string;
  phone_number_id?: string;
  business_account_id?: string;
  access_token?: string;
  display_phone_number?: string;
  verified_name?: string;
  business_name?: string;
  account_review_status?: string;
  business_verification_status?: string;
  webhook_configured?: boolean;
  webhook_url?: string;
  connected_at?: string;
}

export interface FacebookConfig {
  page_id: string;
  page_name: string;
  page_access_token: string;
  user_access_token: string;
  webhook_subscribed: boolean;
  connected_at: string;
}

export interface InstagramConfig {
  username: string;
  instagram_user_id: string;
  instagram_business_account_id: string;
  access_token: string;
  page_id: string; // Facebook page ID linked to Instagram
  page_access_token: string; // Page access token
  connected_at: string;
  profile_picture_url?: string;
  followers_count?: number;
  webhook_subscribed?: boolean;
}


export type ChannelConfig = WhatsAppConfig | FacebookConfig | InstagramConfig | null;

export interface Channel {
  id: string;
  channel_type: ChannelType;
  channel_config: ChannelConfig;
  is_connected: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChannelCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  connected: boolean;
  description: string;
  children: React.ReactNode;
}

export interface VerificationCodeDisplayProps {
  // Deprecated - no longer used
}


export interface WhatsAppChannelProps {
  channels: Channel[];
  isConnectingWhatsApp: boolean;
  onConnect: () => Promise<void>;
  onReconnect: () => Promise<void>;
  onDisconnect: (channelId: string) => void;
}

export interface FacebookChannelProps {
  channels: Channel[];
  onConnect: () => Promise<void>;
  onReconnect: () => Promise<void>;
  onDisconnect: (channelId: string) => void;
  onTestWebhook: (channelId: string) => Promise<void>;
}

export interface InstagramChannelProps {
  channels: Channel[];
  onConnect: () => Promise<void>;
  onReconnect: () => Promise<void>;
  onDisconnect: (channelId: string) => void;
}


export interface ChannelStatusProps {
  channels: Channel[];
  getChannelStatus: (channelType: string) => boolean;
}


export interface ChannelsViewProps {
  user: User | null;
}

export type { User };
