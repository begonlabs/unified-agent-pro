// meta-oauth/index.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Deno Edge Function: Meta (Facebook) OAuth Redirect Handler
// Exchanges code -> user_access_token, fetches pages and page_access_tokens.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const errorParam = url.searchParams.get('error')

    // Handle user cancellation (e.g., clicking "Not Now" in the OAuth dialog)
    if (errorParam === 'access_denied') {
      console.log('User cancelled the OAuth flow or denied permissions.');
      const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://app.ondai.ai';
      const frontendCallbackUrl = `${frontendUrl}/dashboard?view=channels&error=user_cancelled`;

      return new Response(
        `<!DOCTYPE html><html><head><title>Conexión Cancelada</title><meta http-equiv="refresh" content="0;url=${frontendCallbackUrl}"><style>body{font-family:Arial,sans-serif;text-align:center;padding:50px;background:#f8fafc;color:#0f172a}.container{max-width:500px;margin:0 auto;background:white;padding:30px;border-radius:15px;box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1)}.spinner{border:3px solid #e2e8f0;border-top:3px solid #3b82f6;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin:20px auto}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style></head><body><div class="container"><h1>Conexión Cancelada</h1><p>No se realizaron cambios. Redirigiendo al panel...</p><div class="spinner"></div></div><script>setTimeout(()=>{window.location.href="${frontendCallbackUrl}"},1500)</script></body></html>`,
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    if (!code) {
      // If we don't have a code or an explicit access_denied error, show a generic redirect back to app
      console.error('Missing authorization code in OAuth callback');
      const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://app.ondai.ai';
      const frontendCallbackUrl = `${frontendUrl}/dashboard?view=channels&error=oauth_failed`;
      
      return new Response(
        `<!DOCTYPE html><html><head><title>Error de Conexión</title><meta http-equiv="refresh" content="0;url=${frontendCallbackUrl}"><style>body{font-family:Arial,sans-serif;text-align:center;padding:50px;background:#fee2e2;color:#991b1b}.container{max-width:500px;margin:0 auto;background:white;padding:30px;border-radius:15px;box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1)}.spinner{border:3px solid #fecaca;border-top:3px solid #ef4444;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin:20px auto}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style></head><body><div class="container"><h1>Error de Conexión</h1><p>No se pudo completar la vinculación. Redirigiendo al panel...</p><div class="spinner"></div></div><script>setTimeout(()=>{window.location.href="${frontendCallbackUrl}"},1500)</script></body></html>`,
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    // Get environment variables
    const appId = Deno.env.get('META_APP_ID')
    const appSecret = Deno.env.get('META_APP_SECRET')
    const redirectUri = Deno.env.get('META_REDIRECT_URI') || 'https://supabase.ondai.ai/functions/v1/meta-oauth'
    const graphVersion = Deno.env.get('META_GRAPH_VERSION') || 'v24.0'
    const verifyToken = Deno.env.get('META_VERIFY_TOKEN')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!appId || !appSecret || !supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Missing required environment variables',
          debug: {
            app_id_present: !!appId,
            app_secret_present: !!appSecret,
            supabase_url_present: !!supabaseUrl,
            service_key_present: !!supabaseServiceKey
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/${graphVersion}/oauth/access_token?` +
      `client_id=${appId}&` +
      `client_secret=${appSecret}&` +
      `redirect_uri=${redirectUri}&` +
      `code=${code}`
    )

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      return new Response(
        JSON.stringify({
          ok: false,
          error: `Error: HTTP ${tokenResponse.status}: ${errorText}`,
          debug: {
            request_url: req.url,
            computed_redirect_uri: redirectUri,
            graph_version: graphVersion,
            app_id_present: !!appId
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'No access token received',
          debug: { token_response: tokenData }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Exchange short-lived token for long-lived token (60 days)
    console.log('🔄 Exchanging for long-lived token...')
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/${graphVersion}/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${appId}&` +
      `client_secret=${appSecret}&` +
      `fb_exchange_token=${accessToken}`
    )

    let finalAccessToken = accessToken;

    if (longLivedResponse.ok) {
      const longLivedData = await longLivedResponse.json()
      if (longLivedData.access_token) {
        finalAccessToken = longLivedData.access_token
        console.log('✅ Long-lived token obtained')
      }
    } else {
      console.log('⚠️ Failed to exchange for long-lived token, using short-lived one')
      const errorText = await longLivedResponse.text()
      console.error('Exchange error:', errorText)
    }

    // Extract user ID and platform from the state parameter early for better debugging
    let userId: string | null = null;
    let platform: 'facebook' | 'instagram' = 'facebook'; // Default to Facebook
    if (state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state));
        userId = stateData.user_id;
        platform = stateData.platform || 'facebook';
      } catch (error) {
        console.error('Error parsing state parameter:', error);
      }
    }

    // Get user's pages with specific fields using the long-lived token
    // We include instagram_business_account here too so we can diagnose IG issues earlier
    const pagesResponse = await fetch(
      `https://graph.facebook.com/${graphVersion}/me/accounts?access_token=${finalAccessToken}&fields=id,name,access_token,tasks,category,instagram_business_account`
    )

    if (!pagesResponse.ok) {
      const errorText = await pagesResponse.text()
      return new Response(
        JSON.stringify({
          ok: false,
          error: `Error fetching pages: HTTP ${pagesResponse.status}: ${errorText}`,
          debug: { access_token_present: !!accessToken, userId }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const pagesData = await pagesResponse.json()
    const pages = pagesData.data || []

    // Fetch permissions to help diagnose issues
    const permsResponse = await fetch(`https://graph.facebook.com/${graphVersion}/me/permissions?access_token=${finalAccessToken}`);
    const permsData = await permsResponse.ok ? await permsResponse.json() : { data: [] };
    const grantedPerms = permsData.data.filter(p => p.status === 'granted').map(p => p.permission);

    if (pages.length === 0) {
      const errorMessage = platform === 'instagram'
        ? 'No se encontraron cuentas de Instagram (vías páginas de Facebook). Asegúrate de que tu cuenta de Instagram sea Profesional y esté vinculada a una página de Facebook que hayas seleccionado.'
        : 'No se encontraron páginas de Facebook para este usuario. Asegúrate de haber seleccionado las páginas en el diálogo de Facebook y de haber concedido el permiso "pages_show_list".';

      return new Response(
        JSON.stringify({
          ok: false,
          error: errorMessage,
          debug: {
            user_id: userId,
            platform,
            granted_permissions: grantedPerms,
            has_pages_show_list: grantedPerms.includes('pages_show_list'),
            suggestion: platform === 'instagram'
              ? 'Verifica que tu cuenta de Instagram esté vinculada a una página de Facebook y que hayas seleccionado esa página en el diálogo de autorización.'
              : 'Intenta reconectar y asegúrate de marcar TODAS las casillas de tus páginas en el proceso de autorización de Facebook.'
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Process based on platform
    if (platform === 'instagram') {
      const pagesWithInstagram = pages.filter(page => page.instagram_business_account);

      if (pagesWithInstagram.length === 0) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: 'No se encontraron Cuentas de Instagram Business vinculadas a tus páginas. Asegúrate de que tu cuenta de Instagram sea Profesional y esté correctamente vinculada a una página de Facebook.',
            debug: {
              pages_found: pages.length,
              granted_permissions: grantedPerms,
              has_instagram_basic: grantedPerms.includes('instagram_basic')
            }
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Use the first page with Instagram (in production, let user choose)
      const selectedPage = pagesWithInstagram[0];
      const igBusinessAccountId = selectedPage.instagram_business_account.id;
      const pageAccessToken = selectedPage.access_token;

      // Get Instagram account details
      const igAccountResponse = await fetch(
        `https://graph.facebook.com/${graphVersion}/${igBusinessAccountId}?access_token=${pageAccessToken}&fields=id,username,name,profile_picture_url,followers_count`
      );

      if (!igAccountResponse.ok) {
        const errorText = await igAccountResponse.text();
        return new Response(
          JSON.stringify({
            ok: false,
            error: `Error al obtener detalles de la cuenta de Instagram: ${errorText}`
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const igAccountData = await igAccountResponse.json();

      // Subscribe Facebook Page to webhooks for Instagram
      let igWebhookSubscribed = false;
      try {
        const webhookResponse = await fetch(
          `https://graph.facebook.com/${graphVersion}/${selectedPage.id}/subscribed_apps`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              access_token: pageAccessToken,
              subscribed_fields: 'messages,messaging_postbacks,message_reactions,messaging_seen'
            })
          }
        );

        if (webhookResponse.ok) {
          igWebhookSubscribed = true;
          console.log('Instagram webhook subscription successful for page:', selectedPage.id);
        }
      } catch (webhookError) {
        console.error('Instagram webhook subscription error:', webhookError);
      }

      // Update or create Instagram channel
      const { data: existingIgChannel } = await supabase
        .from('communication_channels')
        .select('id')
        .eq('user_id', userId)
        .eq('channel_type', 'instagram')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const instagramConfig = {
        instagram_user_id: igAccountData.id,
        instagram_business_account_id: igBusinessAccountId,
        username: igAccountData.username,
        access_token: pageAccessToken,
        page_id: selectedPage.id,
        page_access_token: pageAccessToken,
        connected_at: new Date().toISOString(),
        profile_picture_url: igAccountData.profile_picture_url,
        followers_count: igAccountData.followers_count,
        webhook_subscribed: igWebhookSubscribed
      };

      if (existingIgChannel) {
        await supabase
          .from('communication_channels')
          .update({
            channel_config: instagramConfig,
            is_connected: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingIgChannel.id);
      } else {
        await supabase
          .from('communication_channels')
          .insert({
            user_id: userId,
            channel_type: 'instagram',
            channel_config: instagramConfig,
            is_connected: true
          });
      }

      const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://app.ondai.ai';
      const frontendCallbackUrl = `${frontendUrl}/dashboard?success=true&instagram_user=${encodeURIComponent(igAccountData.username)}&channel=instagram&view=channels`;

      return new Response(
        `<!DOCTYPE html><html><head><title>Instagram Conectado</title><meta http-equiv="refresh" content="0;url=${frontendCallbackUrl}"><style>body{font-family:Arial,sans-serif;text-align:center;padding:50px;background:linear-gradient(135deg,#833ab4 0%,#fd1d1d 50%,#fcb045 100%);color:white}.container{max-width:500px;margin:0 auto;background:rgba(255,255,255,0.1);padding:30px;border-radius:15px;backdrop-filter:blur(10px)}.spinner{border:3px solid rgba(255,255,255,0.3);border-top:3px solid white;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin:20px auto}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style></head><body><div class="container"><h1>📸 Instagram Conectado Exitosamente</h1><p>Usuario: <strong>@${igAccountData.username}</strong></p><p>Redirigiendo al dashboard...</p><div class="spinner"></div></div><script>setTimeout(()=>{window.location.href="${frontendCallbackUrl}"},2000)</script></body></html>`,
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    // Facebook platform flow
    const selectedPage = pages[0];
    const pageId = selectedPage.id;
    const pageName = selectedPage.name;
    const pageAccessToken = selectedPage.access_token;

    // Subscribe the page to webhooks
    let fbWebhookSubscribed = false;
    try {
      const webhookResponse = await fetch(
        `https://graph.facebook.com/${graphVersion}/${pageId}/subscribed_apps?access_token=${pageAccessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscribed_fields: ['messages', 'messaging_postbacks', 'messaging_optins', 'message_deliveries', 'message_reads', 'message_echoes']
          })
        }
      )
      if (webhookResponse.ok) fbWebhookSubscribed = true;
    } catch (e) { console.error('FB Webhook error:', e); }

    // Update or create Facebook channel
    const { data: existingChannel } = await supabase
      .from('communication_channels')
      .select('id')
      .eq('user_id', userId)
      .eq('channel_type', 'facebook')
      .maybeSingle();

    const facebookConfig = {
      page_id: pageId,
      page_name: pageName,
      page_access_token: pageAccessToken,
      user_access_token: finalAccessToken,
      webhook_subscribed: fbWebhookSubscribed,
      connected_at: new Date().toISOString()
    };

    if (existingChannel) {
      await supabase
        .from('communication_channels')
        .update({
          channel_config: facebookConfig,
          is_connected: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingChannel.id);
    } else {
      await supabase
        .from('communication_channels')
        .insert({
          user_id: userId,
          channel_type: 'facebook',
          channel_config: facebookConfig,
          is_connected: true
        });
    }

    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://app.ondai.ai';
    const frontendCallbackUrl = `${frontendUrl}/dashboard?success=true&page_id=${pageId}&page_name=${encodeURIComponent(pageName)}&channel=facebook&view=channels`;

    return new Response(
      `<!DOCTYPE html><html><head><title>Facebook Conectado</title><meta http-equiv="refresh" content="0;url=${frontendCallbackUrl}"><style>body{font-family:Arial,sans-serif;text-align:center;padding:50px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white}.container{max-width:500px;margin:0 auto;background:rgba(255,255,255,0.1);padding:30px;border-radius:15px;backdrop-filter:blur(10px)}.spinner{border:3px solid rgba(255,255,255,0.3);border-top:3px solid white;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin:20px auto}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style></head><body><div class="container"><h1>✅ Facebook Conectado Exitosamente</h1><p>Página: <strong>${pageName}</strong></p><p>Redirigiendo al dashboard...</p><div class="spinner"></div></div><script>setTimeout(()=>{window.location.href="${frontendCallbackUrl}"},2000)</script></body></html>`,
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );

  } catch (error) {
    console.error('Error in meta-oauth function:', error)
    return new Response(
      JSON.stringify({
        ok: false,
        error: `Internal server error: ${error.message}`,
        debug: { request_url: req.url }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})