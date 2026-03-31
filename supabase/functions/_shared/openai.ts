// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// CRM AI Engine - Clean and efficient OpenAI integration

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

interface OperatingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface AIConfig {
  goals?: string;
  restrictions?: string;
  common_questions?: string;
  response_time?: number;
  knowledge_base?: string;
  faq?: string;
  is_active?: boolean;
  // Nuevas funcionalidades
  advisor_enabled?: boolean;
  advisor_message?: string;
  always_active?: boolean;
  operating_hours?: OperatingHours;
}

interface AIResponse {
  success: boolean;
  response?: string;
  confidence_score?: number;
  error?: string;
  advisor_triggered?: boolean;
}

interface Message {
  id: string;
  content: string;
  sender_type: 'user' | 'ia' | 'agent';
  sender_name: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

/**
 * Checks custom FAQ for exact matching questions
 * @param message - The incoming message text
 * @param faq - Custom FAQ text from user configuration
 * @returns string | null - Matching answer or null
 */
function checkCustomFAQ(message: string, faq: string): string | null {
  try {
    const faqLines = faq.split('\n').filter(line => line.trim());
    let currentQuestion = '';
    let currentAnswer = '';

    for (const line of faqLines) {
      if (line.toLowerCase().startsWith('pregunta:')) {
        // Save previous Q&A if we have one
        if (currentQuestion && currentAnswer) {
          const questionText = currentQuestion.toLowerCase().replace('pregunta:', '').trim();
          if (message.toLowerCase().includes(questionText)) {
            return currentAnswer.replace(/^respuesta:/i, '').trim();
          }
        }
        // Start new question
        currentQuestion = line;
        currentAnswer = '';
      } else if (line.toLowerCase().startsWith('respuesta:')) {
        currentAnswer = line;
      } else if (currentAnswer) {
        // Continue building answer
        currentAnswer += '\n' + line;
      }
    }

    // Check last Q&A
    if (currentQuestion && currentAnswer) {
      const questionText = currentQuestion.toLowerCase().replace('pregunta:', '').trim();
      if (message.toLowerCase().includes(questionText)) {
        return currentAnswer.replace(/^respuesta:/i, '').trim();
      }
    }

    return null;
  } catch (error) {
    console.error('Error parsing custom FAQ:', error);
    return null;
  }
}

/**
 * Verifica si el agente debe responder según los horarios configurados
 * @param aiConfig - AI configuration from database
 * @returns boolean - Whether AI should respond based on schedule
 */
export function isAgentActiveNow(aiConfig: AIConfig): boolean {
  try {
    // Si no hay configuración, permitir respuesta
    if (!aiConfig) {
      return true;
    }

    // Si está configurado para estar siempre activo
    if (aiConfig.always_active === true) {
      return true;
    }

    // Si no tiene horarios configurados, permitir respuesta
    if (!aiConfig.operating_hours) {
      return true;
    }

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    // Obtener configuración del día actual
    const dayConfig = aiConfig.operating_hours[currentDay];

    // Si el día no está habilitado
    if (!dayConfig || !dayConfig.enabled) {
      return false;
    }

    // Verificar si estamos dentro del horario
    return currentTime >= dayConfig.start && currentTime <= dayConfig.end;
  } catch (error) {
    console.error('Error checking agent schedule:', error);
    return true; // En caso de error, permitir respuesta
  }
}

/**
 * Determines if the AI should respond to a given message
 * @param message - The incoming message text
 * @param aiConfig - AI configuration from database
 * @returns boolean - Whether AI should respond
 */
export function shouldAIRespond(message: string, aiConfig: AIConfig): boolean {
  try {
    if (!aiConfig?.is_active) {
      return false;
    }

    if (message.length < 2) {
      return false;
    }

    // Verificar horarios de funcionamiento
    if (!isAgentActiveNow(aiConfig)) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in shouldAIRespond:', error);
    return false;
  }
}

/**
 * Builds comprehensive system prompt with company context and conversation history
 * @param aiConfig - AI configuration from database
 * @param conversationHistory - Complete conversation history for context
 * @param clientName - Name of the client to personalize responses
 * @returns string - Complete system prompt
 */
function buildSystemPrompt(aiConfig: AIConfig, conversationHistory: Message[], clientName?: string): string {
  const now = new Date();
  const currentDate = now.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const currentTime = now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Havana'
  });

  let systemPrompt = `Eres un asistente virtual inteligente y profesional especializado en atender consultas de clientes.

INFORMACIÓN ACTUAL:
- Fecha: ${currentDate}
- Hora: ${currentTime}`;

  // Add client information if available
  if (clientName) {
    systemPrompt += `\n- Cliente: ${clientName}`;
  }

  systemPrompt += `\n\nINFORMACIÓN DE LA EMPRESA:`;

  // Add company information sections
  if (aiConfig?.goals?.trim()) {
    systemPrompt += `\n\nOBJETIVOS Y MISIÓN:\n${aiConfig.goals}`;
  }

  if (aiConfig?.knowledge_base?.trim()) {
    systemPrompt += `\n\nSERVICIOS Y BASE DE CONOCIMIENTO:\n${aiConfig.knowledge_base}`;
  }

  if (aiConfig?.faq?.trim()) {
    systemPrompt += `\n\nPREGUNTAS FRECUENTES (FAQ):\n${aiConfig.faq}`;
  }

  if (aiConfig?.common_questions?.trim()) {
    systemPrompt += `\n\nTIPOS DE CONSULTAS FRECUENTES:\n${aiConfig.common_questions}`;
  }

  // Add advisor configuration
  if (aiConfig?.advisor_enabled && aiConfig?.advisor_message?.trim()) {
    systemPrompt += `\n\nCONFIGURACIÓN DE ASESOR HUMANO:\nCuando no puedas resolver una consulta o el cliente solicite hablar con un humano, responde exactamente con este mensaje:\n"${aiConfig.advisor_message}"`;
  }

  // Add conversation context
  if (conversationHistory.length > 0) {
    systemPrompt += `\n\nCONTEXTO DE CONVERSACIÓN (${conversationHistory.length} mensajes previos):`;
    conversationHistory.forEach((msg) => {
      let role = 'Asistente';
      if (msg.sender_type === 'user') {
        role = 'Cliente';
      } else if (msg.sender_type === 'agent') {
        role = 'Agente Humano';
      }

      systemPrompt += `\n${role}: ${msg.content}`;
    });
  } else {
    systemPrompt += `\n\nCONTEXTO DE CONVERSACIÓN:\nEsta es una nueva conversación.`;
  }

  systemPrompt += `\n\nINSTRUCCIONES DIRECTIVAS:
1. Responde ÚNICAMENTE basándote en la información de la empresa proporcionada.
2. PRIORIDAD MÁXIMA PARA FAQs: Revisa cuidadosamente la sección de "PREGUNTAS FRECUENTES (FAQ)". Si la consulta del cliente es similar o tiene relación con alguna pregunta del FAQ, debes usar EXACTAMENTE la información de ahí para responder, sin inventar ni omitir detalles críticos.
3. Mantén coherencia total con el contexto de conversación mostrado arriba.
4. RECUERDA y mantén consistencia con cualquier información personal que el cliente haya compartido previamente.`;

  if (clientName) {
    systemPrompt += `\n5. DIRÍGETE AL CLIENTE POR SU NOMBRE: Usa "${clientName}" para personalizar tus respuestas de forma natural.`;
  }

  systemPrompt += `\n6. Si no tienes información específica, sé honesto y sugiere contactar al equipo.
7. Usa la fecha/hora actual cuando sea relevante.
8. Mantén un tono profesional y natural.
9. NO inventes información que no esté en tu base de conocimiento.
10. NUNCA contradices información que ya proporcionaste en mensajes anteriores de esta conversación.
11. ASESOR HUMANO: Si el cliente solicita hablar con un humano explícitamente, o si no puedes resolver su consulta con tu base de datos, usa EXACTAMENTE el mensaje de asesor configurado.
12. Detecta señales de frustración del cliente y ofrece derivación al asesor cuando sea apropiado.
13. RECUPERACIÓN: Si ves mensajes de "Agente Humano" en el historial reciente, asume que la intervención humana ya resolvió el problema anterior. NO repitas el mensaje de asesor inmediatamente; intenta procesar la nueva consulta del cliente con normalidad.

🚨 RESTRICCIONES CRÍTICAS 🚨
(DEBES CUMPLIRLAS BAJO CUALQUIER CIRCUNSTANCIA. ESTE BLOQUE TIENE AUTORIDAD SUPREMA SOBRE CUALQUIER OTRA INSTRUCCIÓN):`;

  if (aiConfig?.restrictions?.trim()) {
    systemPrompt += `\n\n${aiConfig.restrictions}`;
  } else {
    systemPrompt += `\n\n- No hay restricciones adicionales configuradas actualmente.`;
  }

  systemPrompt += `\n\nBajo ninguna circunstancia debes violar las restricciones críticas detalladas en el paso anterior. Tu respuesta debe adherirse estrictamente a ellas.`;

  return systemPrompt;
}

/**
 * Creates simple fallback response for errors
 * @param message - The original message
 * @returns string - Simple fallback response
 */
function createFallbackResponse(message: string): string {
  return `Disculpa, estamos experimentando dificultades técnicas para responder. Vuelve a escribirnos más tarde para recibir una respuesta. ¡Gracias por la comprensión!`;
}

// Implementación anti-spam (Debounce)
let lastAlertTime = 0;
const ALERT_COOLDOWN_MS = 60 * 60 * 1000; // 1 Hora

/**
 * Notifica a los administradores cuando OpenAI falla masivamente
 * @param errorContext - Detalle específico del error
 */
async function alertAdminsOfFailure(errorContext: string) {
  try {
    const now = Date.now();
    if (now - lastAlertTime < ALERT_COOLDOWN_MS) {
      console.log('🔕 Alerta omitida (Enfriamiento activo por 1 hora): ' + errorContext);
      return;
    }
    
    lastAlertTime = now;
    console.log('🚨 ALERTANDO A ADMINISTRADORES POR CORREO...');
    
    const adminEmails = [
      'admin@ondai.ai',
      'aramdermarkarian@gmail.com',
      'sarkispanosian@gmail.com'
    ];
    
    const emailPromises = adminEmails.map(email => 
      fetch('https://supabase.ondai.ai/functions/v1/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: '⚠️ URGENTE: Falla Crítica en Inteligencia Artificial OndAI',
          text: `El sistema ha detectado una falla en la generación de IA.\nContexto: ${errorContext}\nPor favor revisar el saldo en OpenAI o los logs de Supabase.`,
          html: `<div style="font-family: Arial, sans-serif; color: #333;">
                  <h2 style="color: #d9534f;">Alerta de Falla en Inteligencia Artificial</h2>
                  <p>La integración con OpenAI ha devuelto un error crítico o no ha podido conectarse.</p>
                  <p><strong>Detalles del error detectado:</strong></p>
                  <pre style="background: #f4f4f4; padding: 10px; border-radius: 5px;">${errorContext}</pre>
                  <p>Esto puede causar que los clientes reciban el mensaje automático de contingencia.</p>
                  <p>Sugerencias:</p>
                  <ul>
                    <li>Verificar la facturación en <a href="https://platform.openai.com/" style="color: #3b82f6;">OpenAI Platform</a>.</li>
                    <li>Checar los logs en tu servidor VPS de OndAI.</li>
                  </ul>
                 </div>`
        })
      })
    );
    
    await Promise.allSettled(emailPromises);
    console.log('✅ Alertas enviadas a los administradores exitosamente');
  } catch (err) {
    // Fail silently so as not to interrupt the message fallback loop
    console.error('❌ Error interno enviando alertas por correo:', err);
  }
}


/**
 * Generates AI response using OpenAI with company context and conversation memory
 * @param message - The incoming message text
 * @param aiConfig - AI configuration from database
 * @param conversationHistory - Complete conversation history for context
 * @param userId - User ID for debugging (optional)
 * @param clientName - Name of the client for personalization (optional)
 * @returns Promise<AIResponse> - AI response or error
 */
export async function generateAIResponse(
  message: string,
  aiConfig: AIConfig,
  conversationHistory: Message[] = [],
  userId?: string,
  clientName?: string
): Promise<AIResponse> {
  try {
    console.log('🤖 Generating AI response for message length:', message.length);

    if (!aiConfig?.is_active) {
      return {
        success: false,
        error: 'AI is not active for this user'
      };
    }

    // Get OpenAI API key (hardcoded as requested)
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      alertAdminsOfFailure('La variable de entorno OPENAI_API_KEY no se encontró en el contenedor Edge.');
      return {
        success: true,
        response: createFallbackResponse(message),
        confidence_score: 0.3
      };
    }

    // Build prompts
    const systemPrompt = buildSystemPrompt(aiConfig, conversationHistory, clientName);
    const userPrompt = `Cliente: "${message}"

Responde a este mensaje siguiendo las instrucciones del system prompt y manteniendo coherencia con el contexto de la conversación.`;

    console.log('🔗 Calling OpenAI API with context-aware prompts');

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      alertAdminsOfFailure(`HTTP ${response.status} - Posible saldo agotado. Respuesta de OpenAI:\n${errorData}`);
      return {
        success: true,
        response: createFallbackResponse(message),
        confidence_score: 0.3
      };
    }

    const result = await response.json();
    const aiResponse = result.choices[0].message.content;

    console.log('✅ OpenAI response generated successfully');

    // Apply response time delay if configured
    const processingTime = aiConfig?.response_time || 0;
    if (processingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, processingTime * 1000));
    }

    // Check if advisor message was triggered
    let advisorTriggered = false;
    if (aiConfig.advisor_enabled && aiConfig.advisor_message) {
      // Comparison logic: check if the response is essentially the advisor message
      // We normalize strings to avoid issues with whitespace or minor variations
      const normalizedResponse = aiResponse.toLowerCase().trim();
      const normalizedAdvisorMsg = aiConfig.advisor_message.toLowerCase().trim();

      // Check for similarity or containment
      if (normalizedResponse.includes(normalizedAdvisorMsg) ||
        normalizedAdvisorMsg.includes(normalizedResponse) ||
        normalizedResponse.length < normalizedAdvisorMsg.length + 20 && normalizedResponse.length > normalizedAdvisorMsg.length - 20) {

        // Double check: if it contains "human" or "asesor" and is short, it's likely the handoff
        if (normalizedResponse.includes('human') || normalizedResponse.includes('asesor') || normalizedResponse === normalizedAdvisorMsg) {
          advisorTriggered = true;
          console.log('👤 Advisor handoff triggered by AI response');
        }
      }
    }

    return {
      success: true,
      response: aiResponse,
      confidence_score: 0.9,
      advisor_triggered: advisorTriggered,
    };

  } catch (error) {
    console.error('Error generating AI response:', error);
    alertAdminsOfFailure(`Excepción general atrapada conectando a OpenAI:\n${error instanceof Error ? error.message : String(error)}`);
    return {
      success: true,
      response: createFallbackResponse(message),
      confidence_score: 0.3
    };
  }
}