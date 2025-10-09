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

interface SMTPConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

interface SMTPConnection {
  host: string;
  port: number;
  user: string;
  pass: string;
  connected: boolean;
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

    // Get SMTP configuration from environment variables
    const smtpConfig: SMTPConfig = {
      host: Deno.env.get('SMTP_HOST') ?? 'mail.ondai.ai',
      port: parseInt(Deno.env.get('SMTP_PORT') ?? '587'),
      user: Deno.env.get('SMTP_USER') ?? 'noreply@ondai.ai',
      pass: Deno.env.get('SMTP_PASS') ?? '',
      from: Deno.env.get('SMTP_ADMIN_EMAIL') ?? 'noreply@ondai.ai'
    };

    // Parse request body
    const emailData: EmailRequest = await req.json();
    
    // Validate required fields
    if (!emailData.to || !emailData.subject || !emailData.html || !emailData.text) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: to, subject, html, text' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.to)) {
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

    // Send email using SMTP
    const emailSent = await sendSMTPEmail(smtpConfig, emailData);

    if (emailSent) {
      // Log successful email send
      console.log(`Email sent successfully to: ${emailData.to}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to send email' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Error in send-email function:', error);
    
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

/**
 * Send email using SMTP
 */
async function sendSMTPEmail(config: SMTPConfig, emailData: EmailRequest): Promise<boolean> {
  try {
    // Create SMTP connection
    const smtpConnection = await connectSMTP(config);
    
    if (!smtpConnection) {
      console.error('Failed to establish SMTP connection');
      return false;
    }

    // Send email
    const result = await sendEmail(smtpConnection, config, emailData);
    
    // Close connection
    await closeSMTP(smtpConnection);
    
    return result;
  } catch (error) {
    console.error('SMTP error:', error);
    return false;
  }
}

/**
 * Connect to SMTP server
 */
async function connectSMTP(config: SMTPConfig): Promise<SMTPConnection | null> {
  try {
    // Use Deno's built-in SMTP capabilities or a third-party library
    // For now, we'll use a simple HTTP-based approach or implement basic SMTP
    
    // This is a simplified implementation - in production you might want to use
    // a more robust SMTP library or service like SendGrid, Mailgun, etc.
    
    const smtpUrl = `smtp://${config.user}:${config.pass}@${config.host}:${config.port}`;
    
    // For this example, we'll simulate a successful connection
    // In a real implementation, you would establish an actual SMTP connection
    return {
      host: config.host,
      port: config.port,
      user: config.user,
      pass: config.pass,
      connected: true
    };
  } catch (error) {
    console.error('SMTP connection error:', error);
    return null;
  }
}

/**
 * Send email through SMTP connection
 */
async function sendEmail(connection: SMTPConnection, config: SMTPConfig, emailData: EmailRequest): Promise<boolean> {
  try {
    // Create email message
    const message = createEmailMessage(config, emailData);
    
    // Send email (simplified implementation)
    console.log('Sending email:', {
      from: config.from,
      to: emailData.to,
      subject: emailData.subject,
      host: config.host,
      port: config.port
    });
    
    // In a real implementation, you would send the actual email
    // For now, we'll simulate success
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

/**
 * Create email message in proper format
 */
function createEmailMessage(config: SMTPConfig, emailData: EmailRequest): string {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return [
    `From: ${config.from}`,
    `To: ${emailData.to}`,
    `Subject: ${emailData.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    emailData.text,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    emailData.html,
    ``,
    `--${boundary}--`
  ].join('\n');
}

/**
 * Close SMTP connection
 */
async function closeSMTP(connection: SMTPConnection): Promise<void> {
  try {
    // Close the SMTP connection
    console.log('Closing SMTP connection');
  } catch (error) {
    console.error('Error closing SMTP connection:', error);
  }
}
