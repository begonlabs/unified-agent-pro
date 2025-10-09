// send-welcome-email/index.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Deno Edge Function: Send Welcome Email
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WelcomeEmailRequest {
  userId: string;
  userName: string;
  userEmail: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const { userId, userName, userEmail }: WelcomeEmailRequest = await req.json();

    // Validate required fields
    if (!userId || !userName || !userEmail) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: userId, userName, userEmail' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid email format' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Call the send-email function to send welcome email
    const { data, error } = await supabaseClient.functions.invoke('send-email', {
      body: {
        to: userEmail,
        subject: '🎉 ¡Bienvenido a OndAI! Tu plataforma de automatización inteligente',
        html: getWelcomeEmailHTML(userName, userEmail),
        text: getWelcomeEmailText(userName, userEmail),
        priority: 'high',
        emailType: 'welcome'
      }
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to send welcome email' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log the email send event
    try {
      await supabaseClient
        .from('email_logs')
        .insert({
          user_id: userId,
          to_email: userEmail,
          subject: '🎉 ¡Bienvenido a OndAI! Tu plataforma de automatización inteligente',
          email_type: 'welcome',
          priority: 'high',
          status: 'sent',
          metadata: {
            user_name: userName,
            welcome_email: true
          }
        });
    } catch (logError) {
      console.error('Error logging email:', logError);
      // Don't fail the request if logging fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent successfully',
        data: data 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Welcome email function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function getWelcomeEmailHTML(userName: string, userEmail: string): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>¡Bienvenido a OndAI!</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #3a0caa 0%, #710db2 50%, #a855f7 100%); padding: 40px 20px; text-align: center; }
        .logo { width: 80px; height: 80px; margin: 0 auto 20px; background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQwIDBDMTcuOTA5IDAgMCAxNy45MDkgMCA0MEMwIDYyLjA5MSAxNy45MDkgODAgNDAgODBDNjIuMDkxIDgwIDgwIDYyLjA5MSA4MCA0MEM4MCAxNy45MDkgNjIuMDkxIDAgNDAgMFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0yMCAyMEw2MCAyMEw2MCA2MEwyMCA2MEwyMCAyMFoiIGZpbGw9IiMzYTBjYWEiLz4KPHBhdGggZD0iTTMwIDMwTDUwIDMwTDUwIDUwTDMwIDUwTDMwIDMwWiIgZmlsbD0iIzcxMGRiMiIvPgo8L3N2Zz4K') no-repeat center; background-size: contain; }
        .content { padding: 40px 30px; }
        .welcome-title { color: #1e293b; font-size: 28px; font-weight: 700; margin: 0 0 16px; text-align: center; }
        .welcome-subtitle { color: #64748b; font-size: 18px; font-weight: 400; margin: 0 0 30px; text-align: center; line-height: 1.5; }
        .features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
        .feature-card { background: #f8fafc; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0; }
        .feature-icon { font-size: 32px; margin-bottom: 12px; }
        .feature-title { color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 8px; }
        .feature-desc { color: #64748b; font-size: 14px; margin: 0; line-height: 1.4; }
        .cta-section { background: linear-gradient(135deg, #3a0caa, #710db2); padding: 30px; border-radius: 16px; text-align: center; margin: 30px 0; }
        .cta-title { color: white; font-size: 20px; font-weight: 600; margin: 0 0 12px; }
        .cta-desc { color: rgba(255,255,255,0.9); font-size: 16px; margin: 0 0 24px; }
        .cta-button { display: inline-block; background: white; color: #3a0caa; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; transition: transform 0.2s; }
        .cta-button:hover { transform: translateY(-2px); }
        .steps-section { margin: 30px 0; }
        .step { display: flex; align-items: center; margin: 20px 0; padding: 16px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #3a0caa; }
        .step-number { background: #3a0caa; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; margin-right: 16px; }
        .step-content h3 { color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 4px; }
        .step-content p { color: #64748b; font-size: 14px; margin: 0; }
        .footer { background: #1e293b; padding: 30px; text-align: center; }
        .footer-text { color: #94a3b8; font-size: 14px; margin: 0 0 16px; }
        .social-links { margin: 20px 0; }
        .social-link { display: inline-block; margin: 0 8px; color: #94a3b8; text-decoration: none; font-size: 14px; }
        .social-link:hover { color: white; }
        @media (max-width: 600px) {
          .features-grid { grid-template-columns: 1fr; }
          .content { padding: 20px; }
          .welcome-title { font-size: 24px; }
          .welcome-subtitle { font-size: 16px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header con logo -->
        <div class="header">
          <div class="logo"></div>
          <h1 style="color: white; font-size: 32px; font-weight: 700; margin: 0;">¡Bienvenido a OndAI!</h1>
          <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 8px 0 0;">Tu plataforma de automatización inteligente</p>
        </div>

        <!-- Contenido principal -->
        <div class="content">
          <h2 class="welcome-title">¡Hola ${userName}! 👋</h2>
          <p class="welcome-subtitle">
            Estamos emocionados de tenerte en OndAI. Tu cuenta ha sido creada exitosamente y estás listo para comenzar tu viaje hacia la automatización inteligente.
          </p>

          <!-- Grid de características -->
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🤖</div>
              <h3 class="feature-title">Agente IA Inteligente</h3>
              <p class="feature-desc">Configura tu asistente virtual personalizado para responder automáticamente a tus clientes</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📱</div>
              <h3 class="feature-title">Multi-Canal</h3>
              <p class="feature-desc">Conecta WhatsApp, Facebook e Instagram en una sola plataforma</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3 class="feature-title">Analytics Avanzados</h3>
              <p class="feature-desc">Monitorea el rendimiento y optimiza tus conversaciones</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">⚡</div>
              <h3 class="feature-title">Respuesta Rápida</h3>
              <p class="feature-desc">Responde a tus clientes en segundos, las 24 horas del día</p>
            </div>
          </div>

          <!-- Call to Action -->
          <div class="cta-section">
            <h3 class="cta-title">¡Comienza Ahora!</h3>
            <p class="cta-desc">Configura tu primer agente IA en menos de 5 minutos</p>
            <a href="https://ondai.ai/dashboard/ai-agent" class="cta-button">Configurar Mi Agente IA</a>
          </div>

          <!-- Pasos para comenzar -->
          <div class="steps-section">
            <h3 style="color: #1e293b; font-size: 20px; font-weight: 600; margin: 0 0 20px; text-align: center;">🚀 Cómo Comenzar</h3>
            
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <h3>Configura tu Agente IA</h3>
                <p>Define objetivos, restricciones y personaliza las respuestas</p>
              </div>
            </div>
            
            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <h3>Conecta tus Canales</h3>
                <p>Integra WhatsApp, Facebook e Instagram para recibir mensajes</p>
              </div>
            </div>
            
            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <h3>¡Activa y Disfruta!</h3>
                <p>Tu agente comenzará a responder automáticamente</p>
              </div>
            </div>
          </div>

          <!-- Información adicional -->
          <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; border-left: 4px solid #0ea5e9; margin: 30px 0;">
            <h4 style="color: #0c4a6e; font-size: 16px; font-weight: 600; margin: 0 0 8px;">💡 Tip de Bienvenida</h4>
            <p style="color: #0c4a6e; font-size: 14px; margin: 0;">
              <strong>¿Sabías que?</strong> Los usuarios que configuran su agente IA en la primera semana tienen un 85% más de satisfacción. 
              ¡No esperes más y comienza a automatizar tus conversaciones!
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p class="footer-text">
            Este correo fue enviado a ${userEmail} porque te registraste en OndAI
          </p>
          <div class="social-links">
            <a href="https://ondai.ai" class="social-link">🌐 Sitio Web</a>
            <a href="https://ondai.ai/support" class="social-link">💬 Soporte</a>
            <a href="https://ondai.ai/docs" class="social-link">📚 Documentación</a>
          </div>
          <p style="color: #64748b; font-size: 12px; margin: 16px 0 0;">
            © 2025 OndAI. Todos los derechos reservados.<br>
            Si no deseas recibir estos correos, puedes <a href="#" style="color: #94a3b8;">cancelar la suscripción</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getWelcomeEmailText(userName: string, userEmail: string): string {
  return `¡Bienvenido a OndAI, ${userName}!

Tu cuenta ha sido creada exitosamente. Estamos emocionados de tenerte en nuestra plataforma de automatización inteligente.

🚀 Cómo comenzar:
1. Configura tu Agente IA - Define objetivos y personaliza respuestas
2. Conecta tus Canales - Integra WhatsApp, Facebook e Instagram  
3. ¡Activa y Disfruta! - Tu agente responderá automáticamente

Características principales:
🤖 Agente IA Inteligente - Responde automáticamente a tus clientes
📱 Multi-Canal - WhatsApp, Facebook e Instagram en una plataforma
📊 Analytics Avanzados - Monitorea rendimiento y optimiza conversaciones
⚡ Respuesta Rápida - 24/7 disponible para tus clientes

¡Comienza ahora! Configura tu primer agente IA:
https://ondai.ai/dashboard/ai-agent

¿Necesitas ayuda? Visita nuestro centro de soporte:
https://ondai.ai/support

¡Bienvenido al futuro de la automatización!

El equipo de OndAI
https://ondai.ai`;
}
