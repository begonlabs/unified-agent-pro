// send-email/index.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Deno Edge Function: Send Email
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text: string;
  priority?: 'low' | 'medium' | 'high';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Validar request
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const emailData: EmailRequest = await req.json();

    if (!emailData.to || !emailData.subject || !emailData.html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📧 Solicitud de envío de correo a: ${emailData.to}`);

    // 2. Obtener API Key de Resend (o SMTP en el futuro)
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    // 3. MODO SIMULACIÓN: Si no hay API Key, solo loguear y retornar éxito
    if (!resendApiKey) {
      console.log('🚧 [MODO SIMULACIÓN] No se encontró RESEND_API_KEY.');
      console.log('---------------------------------------------------');
      console.log(`📨 Para: ${emailData.to}`);
      console.log(`📝 Asunto: ${emailData.subject}`);
      console.log(`📄 Contenido (inicio): ${emailData.text.substring(0, 100)}...`);
      console.log('---------------------------------------------------');
      console.log('✅ Correo "enviado" exitosamente (simulado)');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email sent successfully (Simulation Mode)',
          simulation: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. MODO REAL: Enviar usando Resend API
    console.log('🚀 Enviando correo real vía Resend API...');

    // El 'from' debe ser un dominio verificado en Resend. 
    // Por defecto usaremos 'onboarding@resend.dev' para pruebas si no hay uno configurado.
    const fromEmail = Deno.env.get('EMAIL_FROM') || 'onboarding@resend.dev';

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: fromEmail,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      })
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      console.error('❌ Error enviando con Resend:', errorData);
      throw new Error(`Resend API Error: ${JSON.stringify(errorData)}`);
    }

    const data = await resendResponse.json();
    console.log('✅ Correo enviado exitosamente vía Resend:', data);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        id: data.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('🔥 Error crítico en send-email:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
