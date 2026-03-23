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

    const plainTextBody = `
🎉 ¡Nuevo Cliente Registrado en OndAI!

Se acaba de registrar un nuevo usuario en la plataforma. Aquí están los detalles:

👤 Nombre: ${name}
✉️ Correo: ${email || 'No proporcionado'}
🌎 País: ${country || 'No especificado'}
📦 Plan Activado: ${plan_type ? plan_type.toUpperCase() : 'Básico'}
🕒 Hora (UY): ${uruguayTime}

Saludos,
El sistema automatizado de OndAI
`;

    // Enviar correo a los dos administradores
    await transporter.sendMail({
      from: `"Notificaciones OndAI" <${Deno.env.get('SMTP_USER') || 'noreply@ondai.ai'}>`,
      to: 'info@agenciatutak.uy, sarkispanosian@gmail.com',
      subject: `Nuevo Registro: ${name} (${plan_type || 'basico'})`,
      text: plainTextBody,
    });

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error enviando notificación administrativa:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
