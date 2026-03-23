import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import nodemailer from 'npm:nodemailer';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    
    // Extract data from pg_net trigger (record is inside payload.record)
    const record = payload.record || payload; // support both pg_net and direct invocation

    const { first_name, last_name, country, plan_type, created_at, email } = record;

    if (!first_name) {
      return new Response(JSON.stringify({ error: 'Faltan datos en el payload' }), { status: 400, headers: corsHeaders });
    }

    const name = `${first_name} ${last_name || ''}`.trim();
    
    // Formatear hora de Uruguay
    const dateStr = created_at ? new Date(created_at) : new Date();
    const uruguayTime = new Intl.DateTimeFormat('es-UY', {
      timeZone: 'America/Montevideo',
      dateStyle: 'full',
      timeStyle: 'long'
    }).format(dateStr);

    // Configurar SMTP
    const transporter = nodemailer.createTransport({
      host: Deno.env.get('SMTP_HOST') || 'mail.ondai.ai',
      port: Number(Deno.env.get('SMTP_PORT')) || 587,
      secure: false, // true for 465, false for 587
      auth: {
        user: Deno.env.get('SMTP_USER') || 'noreply@ondai.ai',
        pass: Deno.env.get('SMTP_PASS') || 'Admin.2025@', // Fallback from VPS config
      },
      tls: {
          rejectUnauthorized: false
      }
    });

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #3a0caa;">🎉 ¡Nuevo Cliente Registrado en OndAI!</h2>
        <p>Se acaba de registrar un nuevo usuario en la plataforma. Aquí están los detalles:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p><strong>👤 Nombre:</strong> ${name}</p>
          <p><strong>✉️ Correo:</strong> ${email || 'No proporcionado'}</p>
          <p><strong>🌎 País:</strong> ${country || 'No especificado'}</p>
          <p><strong>📦 Plan Activado:</strong> ${plan_type ? plan_type.toUpperCase() : 'Básico'}</p>
          <p><strong>🕒 Hora (UY):</strong> ${uruguayTime}</p>
        </div>
        <p>Saludos,<br>El sistema automatizado de OndAI</p>
      </div>
    `;

    // Enviar correo a los dos administradores
    await transporter.sendMail({
      from: `"Notificaciones OndAI" <${Deno.env.get('SMTP_USER') || 'noreply@ondai.ai'}>`,
      to: 'info@agenciatutak.uy, sarkispanosian@gmail.com',
      subject: `Nuevo Registro: ${name} (${plan_type || 'basico'})`,
      html: htmlBody,
    });

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error enviando notificación administrativa:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
