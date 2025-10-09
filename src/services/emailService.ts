import { supabase } from '@/integrations/supabase/client';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailData {
  to: string;
  template: EmailTemplate;
  variables?: Record<string, string>;
  priority?: 'low' | 'medium' | 'high';
}

export interface EmailPreferences {
  notifications: boolean;
  marketing: boolean;
  system: boolean;
  aiAgent: boolean;
  channels: boolean;
}

export class EmailService {
  private static readonly SMTP_CONFIG = {
    host: import.meta.env.VITE_SMTP_HOST || 'mail.ondai.ai',
    port: parseInt(import.meta.env.VITE_SMTP_PORT || '587'),
    user: import.meta.env.VITE_SMTP_USER || 'noreply@ondai.ai',
    pass: import.meta.env.VITE_SMTP_PASS || '',
    from: import.meta.env.VITE_SMTP_ADMIN_EMAIL || 'noreply@ondai.ai'
  };

  /**
   * Envía un correo usando la Edge Function de Supabase
   */
  static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailData.to,
          subject: emailData.template.subject,
          html: emailData.template.html,
          text: emailData.template.text,
          priority: emailData.priority || 'medium'
        }
      });

      if (error) {
        console.error('Error sending email:', error);
        return false;
      }

      return data?.success || false;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }

  /**
   * Obtiene las preferencias de email del usuario
   */
  static async getUserEmailPreferences(userId: string): Promise<EmailPreferences | null> {
    try {
      // Table will be created by setup_email_system.sql
      const { data, error } = await (supabase as unknown as {
        from: (table: string) => {
          select: (columns: string) => {
            eq: (column: string, value: string) => {
              single: () => Promise<{ data: EmailPreferences | null; error: { code?: string } | null }>;
            };
          };
        };
      })
        .from('user_email_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching email preferences:', error);
        return null;
      }

      return (data as EmailPreferences) || this.getDefaultEmailPreferences();
    } catch (error) {
      console.error('Error fetching email preferences:', error);
      return this.getDefaultEmailPreferences();
    }
  }

  /**
   * Actualiza las preferencias de email del usuario
   */
  static async updateUserEmailPreferences(
    userId: string, 
    preferences: Partial<EmailPreferences>
  ): Promise<boolean> {
    try {
      // Table will be created by setup_email_system.sql
      const { error } = await (supabase as unknown as {
        from: (table: string) => {
          upsert: (data: Record<string, unknown>) => Promise<{ error: { code?: string } | null }>;
        };
      })
        .from('user_email_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating email preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating email preferences:', error);
      return false;
    }
  }

  /**
   * Verifica si el usuario quiere recibir emails de un tipo específico
   */
  static async shouldSendEmail(
    userId: string, 
    emailType: keyof EmailPreferences
  ): Promise<boolean> {
    const preferences = await this.getUserEmailPreferences(userId);
    return preferences?.[emailType] ?? true; // Default to true if no preferences set
  }

  /**
   * Templates de correo predefinidos
   */
  static getTemplates() {
    return {
      // Template para notificaciones del agente IA
      aiAgentActivated: (userName: string): EmailTemplate => ({
        subject: '🤖 Tu Agente IA ha sido Activado - OndAI',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3a0caa, #710db2); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">¡Tu Agente IA está Activo!</h1>
            </div>
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333;">Hola ${userName},</h2>
              <p style="color: #666; line-height: 1.6;">
                ¡Excelente noticia! Tu agente de inteligencia artificial ha sido activado y está listo para responder automáticamente a los mensajes de tus clientes.
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3a0caa;">
                <h3 style="color: #3a0caa; margin-top: 0;">¿Qué significa esto?</h3>
                <ul style="color: #666;">
                  <li>Tu agente responderá automáticamente a los mensajes</li>
                  <li>Proporcionará información basada en tu configuración</li>
                  <li>Derivará consultas complejas a humanos (si está configurado)</li>
                  <li>Trabajará según los horarios que hayas establecido</li>
                </ul>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://ondai.ai/dashboard/ai-agent" 
                   style="background: #3a0caa; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Ver Configuración del Agente
                </a>
              </div>
            </div>
            <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
              <p>Este correo fue enviado desde OndAI - Tu plataforma de automatización inteligente</p>
            </div>
          </div>
        `,
        text: `Hola ${userName},\n\n¡Tu agente IA ha sido activado! Ahora responderá automáticamente a los mensajes de tus clientes.\n\nVer configuración: https://ondai.ai/dashboard/ai-agent`
      }),

      // Template para progreso de entrenamiento
      trainingComplete: (userName: string, completionPercentage: number): EmailTemplate => ({
        subject: '🎉 ¡Entrenamiento Completo! - OndAI',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">¡Entrenamiento Completo!</h1>
            </div>
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333;">¡Felicitaciones ${userName}!</h2>
              <p style="color: #666; line-height: 1.6;">
                Tu agente de inteligencia artificial ha alcanzado el <strong>${completionPercentage}% de configuración</strong> y está completamente listo para brindar un servicio excepcional a tus clientes.
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <h3 style="color: #10b981; margin-top: 0;">Tu agente está configurado con:</h3>
                <ul style="color: #666;">
                  <li>✅ Objetivos claros y específicos</li>
                  <li>✅ Restricciones de seguridad</li>
                  <li>✅ Base de conocimiento completa</li>
                  <li>✅ Respuestas frecuentes</li>
                  <li>✅ Configuración de horarios</li>
                  <li>✅ Asesor humano (si aplica)</li>
                </ul>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://ondai.ai/dashboard/ai-agent" 
                   style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Ver Mi Agente IA
                </a>
              </div>
            </div>
          </div>
        `,
        text: `¡Felicitaciones ${userName}! Tu agente IA está ${completionPercentage}% configurado y listo para usar.\n\nVer configuración: https://ondai.ai/dashboard/ai-agent`
      }),

      // Template para errores críticos
      criticalError: (userName: string, errorType: string): EmailTemplate => ({
        subject: '⚠️ Error Crítico Requiere Atención - OndAI',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Error Crítico Detectado</h1>
            </div>
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333;">Hola ${userName},</h2>
              <p style="color: #666; line-height: 1.6;">
                Hemos detectado un error crítico en tu configuración de OndAI que requiere tu atención inmediata.
              </p>
              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                <h3 style="color: #ef4444; margin-top: 0;">Tipo de Error:</h3>
                <p style="color: #666; margin: 0;">${errorType}</p>
              </div>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">¿Qué hacer?</h3>
                <ol style="color: #666;">
                  <li>Revisa la configuración en tu dashboard</li>
                  <li>Verifica que todos los campos requeridos estén completos</li>
                  <li>Si el problema persiste, contacta a soporte</li>
                </ol>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://ondai.ai/dashboard" 
                   style="background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Revisar Configuración
                </a>
              </div>
            </div>
          </div>
        `,
        text: `Hola ${userName},\n\nError crítico detectado: ${errorType}\n\nPor favor revisa tu configuración en: https://ondai.ai/dashboard`
      }),

      // Template de bienvenida para nuevos usuarios
      welcomeEmail: (userName: string, userEmail: string): EmailTemplate => ({
        subject: '🎉 ¡Bienvenido a OndAI! Tu plataforma de automatización inteligente',
        html: `
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
        `,
        text: `¡Bienvenido a OndAI, ${userName}!

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
https://ondai.ai`
      }),

      // Template para conexiones de canales
      channelConnected: (userName: string, channelName: string, channelType: string): EmailTemplate => ({
        subject: `✅ ${channelName} Conectado Exitosamente - OndAI`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3a0caa, #710db2); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">¡Canal Conectado!</h1>
            </div>
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333;">Hola ${userName},</h2>
              <p style="color: #666; line-height: 1.6;">
                ¡Excelente! Has conectado exitosamente tu canal de <strong>${channelName}</strong> a OndAI.
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3a0caa;">
                <h3 style="color: #3a0caa; margin-top: 0;">¿Qué puedes hacer ahora?</h3>
                <ul style="color: #666;">
                  <li>Recibir mensajes automáticamente en tu dashboard</li>
                  <li>Configurar respuestas automáticas con tu agente IA</li>
                  <li>Gestionar conversaciones desde un solo lugar</li>
                  <li>Ver estadísticas de interacciones</li>
                </ul>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://ondai.ai/dashboard/channels" 
                   style="background: #3a0caa; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Ver Canales
                </a>
              </div>
            </div>
          </div>
        `,
        text: `Hola ${userName},\n\n¡${channelName} conectado exitosamente!\n\nVer canales: https://ondai.ai/dashboard/channels`
      })
    };
  }

  /**
   * Preferencias por defecto
   */
  private static getDefaultEmailPreferences(): EmailPreferences {
    return {
      notifications: true,
      marketing: false,
      system: true,
      aiAgent: true,
      channels: true
    };
  }

  /**
   * Reemplaza variables en el template
   */
  private static replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  }

  /**
   * Envía correo de bienvenida a un nuevo usuario
   */
  static async sendWelcomeEmail(userId: string, userName: string, userEmail: string): Promise<boolean> {
    try {
      // Verificar si el usuario quiere recibir emails de bienvenida
      const shouldSend = await this.shouldSendEmail(userId, 'notifications');
      
      if (!shouldSend) {
        console.log('User has disabled welcome emails');
        return false;
      }

      // Obtener template de bienvenida
      const template = this.getTemplates().welcomeEmail(userName, userEmail);
      
      // Enviar correo
      const success = await this.sendEmail({
        to: userEmail,
        template,
        priority: 'high'
      });

      if (success) {
        console.log(`Welcome email sent successfully to ${userEmail}`);
      }

      return success;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }
}
