// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Shared OpenAI integration functions

interface AIConfig {
  goals?: string;
  restrictions?: string;
  common_questions?: string;
  response_time?: number;
  knowledge_base?: string;
  faq?: string;
  is_active?: boolean;
}

interface AIResponse {
  success: boolean;
  response?: string;
  confidence_score?: number;
  error?: string;
}

/**
 * Determines if the AI should respond to a given message
 * @param message - The incoming message text
 * @param aiConfig - AI configuration from database
 * @returns boolean - Whether AI should respond
 */
export function shouldAIRespond(message: string, aiConfig: AIConfig): boolean {
  try {
    // Basic logic - AI responds if config is active
    if (!aiConfig?.is_active) {
      return false;
    }

    // Don't respond to very short messages
    if (message.length < 2) {
      return false;
    }

    // Respond to most messages - IA is now more active
    return true;

  } catch (error) {
    console.error('Error in shouldAIRespond:', error);
    return false;
  }
}

/**
 * Generates an AI response for a given message
 * @param message - The incoming message text
 * @param aiConfig - AI configuration from database
 * @param conversationHistory - Recent conversation history
 * @returns Promise<AIResponse> - AI response or error
 */
export async function generateAIResponse(
  message: string, 
  aiConfig: AIConfig, 
  conversationHistory: string[] = []
): Promise<AIResponse> {
  try {
    console.log('🤖 Generating AI response for message:', message);
    console.log('📋 AI Config active:', aiConfig?.is_active);
    console.log('📜 Conversation history length:', conversationHistory.length);

    // Analyze message and generate contextual response
    const lowerMessage = message.toLowerCase().trim();
    let response = "";
    let confidence = 0.8;

    // Pattern matching for different types of messages
    if (lowerMessage.match(/^(hola|hello|hi|buenas|hey|saludos)/)) {
      response = "¡Hola! 👋 Bienvenido/a. Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?";
      confidence = 0.9;
    } 
    else if (lowerMessage.includes('servicio') || lowerMessage.includes('producto')) {
      response = `¡Excelente pregunta! 🌟 

Nuestros principales servicios incluyen:
• Consultoría personalizada
• Soporte técnico especializado
• Soluciones empresariales
• Atención al cliente 24/7

¿Te interesa algún servicio en particular? ¡Cuéntame más detalles!`;
      confidence = 0.95;
    }
    else if (lowerMessage.includes('precio') || lowerMessage.includes('costo') || lowerMessage.includes('cuanto')) {
      response = `💰 Me encanta que preguntes sobre precios - ¡significa que estás realmente interesado/a!

Para darte una cotización exacta, necesito conocer un poco más sobre tus necesidades específicas.

¿Podrías contarme:
• ¿Qué tipo de servicio te interesa?
• ¿Cuál es el alcance de tu proyecto?

¡Así podré darte la mejor propuesta! 😊`;
      confidence = 0.9;
    }
    else if (lowerMessage.includes('hora') || lowerMessage.includes('tiempo') || lowerMessage.includes('cuando')) {
      response = `⏰ ¡Excelente timing! 

Nuestro horario de atención es:
📅 Lunes a Viernes: 8:00 AM - 6:00 PM
📅 Sábados: 9:00 AM - 2:00 PM

Pero como soy un asistente virtual, ¡estoy disponible 24/7 para ayudarte con información inicial!

¿En qué puedo ayudarte ahora mismo?`;
      confidence = 0.85;
    }
    else if (lowerMessage.includes('contacto') || lowerMessage.includes('telefono') || lowerMessage.includes('email')) {
      response = `📞 ¡Por supuesto! Aquí tienes nuestros datos de contacto:

📧 Email: info@empresa.com
📱 WhatsApp: +1 (555) 123-4567
🌐 Sitio web: www.empresa.com

También puedes continuar esta conversación conmigo para resolver tus dudas de inmediato.

¿Hay algo específico en lo que pueda ayudarte?`;
      confidence = 0.9;
    }
    else if (lowerMessage.includes('gracias') || lowerMessage.includes('thanks')) {
      response = "¡De nada! 😊 Me da mucho gusto ayudarte. ¿Hay algo más en lo que pueda asistirte?";
      confidence = 0.8;
    }
    else {
      // Generic but helpful response for any other message
      response = `¡Entiendo! 🤔 

${aiConfig?.goals || 'Estoy aquí para ayudarte con cualquier consulta.'}

Basándome en tu mensaje "${message}", puedo ayudarte con:
• Información sobre nuestros servicios
• Precios y cotizaciones  
• Horarios de atención
• Contacto directo con un especialista

¿Qué te gustaría saber específicamente?`;
      confidence = 0.7;
    }

    // Add FAQ context if available
    if (aiConfig?.faq && confidence < 0.8) {
      response += `\n\n📚 También puedes revisar nuestras preguntas frecuentes: ${aiConfig.faq}`;
    }

    // Simulate realistic processing time
    const processingTime = aiConfig?.response_time || 1;
    if (processingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, processingTime * 1000));
    }

    return {
      success: true,
      response,
      confidence_score: confidence
    };

  } catch (error) {
    console.error('Error generating AI response:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
