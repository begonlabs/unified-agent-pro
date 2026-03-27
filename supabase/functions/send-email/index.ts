// send-email/index.ts
// @ts-nocheck
// Deno Edge Function: Send Email via Corporate Mailcow SMTP
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import nodemailer from 'npm:nodemailer';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text: string;
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

    if (!emailData.to || !emailData.subject || (!emailData.html && !emailData.text)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📧 Solicitud de envío masivo/alerta a: ${emailData.to}`);

    // 2. Obtener credenciales seguras SMTP (Mailcow / GoTrue local)
    const smtpHost = Deno.env.get('SMTP_HOST') || 'mail.ondai.ai';
    const smtpPort = Deno.env.get('SMTP_PORT') || '465';
    // Mapeo adaptativo: soporta SMTP_USER o SMTP_ADMIN_EMAIL, con hard-fallback a la cuenta oficial de OndAI
    const smtpUser = Deno.env.get('SMTP_USER') || Deno.env.get('SMTP_ADMIN_EMAIL') || 'hola@ondai.ai';
    const smtpPass = Deno.env.get('SMTP_PASS') || Deno.env.get('SMTP_PASSWORD') || 'TTridG,77,{';
    
    // Remitente puede personalizarse o recaer en el correo central autenticado
    const fromEmail = Deno.env.get('EMAIL_FROM') || smtpUser || 'admin@ondai.ai';

    // 3. MODO SIMULACIÓN: Si faltan contraseñas protegidas
    if (!smtpUser || !smtpPass) {
      console.log('🚧 [MODO SIMULACIÓN] Faltan variables SMTP_USER o SMTP_PASS en el .env');
      console.log(`📨 Para: ${emailData.to}`);
      console.log(`📝 Asunto: ${emailData.subject}`);
      console.log('✅ Correo "enviado" exitosamente (Simulado temporalmente en logs)');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email sent successfully (Simulation Mode due to missing SMTP_PASS)',
          simulation: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. MODO REAL: Abriendo portal Nodemailer hacia servidor Mailcow SMTP
    console.log(`🚀 Despachando transporte seguro SSL/TLS vía ${smtpHost}:${smtpPort}...`);

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465, // True para puerto 465, False para puerto 587 TLS automático
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        // En caso de que el certificado de Mailcow esté autofirmado por alguna razón, no abortar la red:
        rejectUnauthorized: false
      }
    });

    // Validar conexión preventiva con el Mailcow
    await transporter.verify();

    // Inyectar el payload en la tubería
    const info = await transporter.sendMail({
      from: `"OndAI System" <${fromEmail}>`,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
    });

    console.log('✅ Transporte SMTP completado. MessageID:', info.messageId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email dispatched via Mailcow SMTP',
        id: info.messageId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('🔥 Error crítico en transporte send-email SMTP:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
