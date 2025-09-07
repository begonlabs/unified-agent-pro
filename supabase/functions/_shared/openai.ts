// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// CRM AI Engine - Clean and efficient OpenAI integration

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

interface Message {
  id: string;
  content: string;
  sender_type: 'user' | 'ia';
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
 * @returns string - Complete system prompt
 */
function buildSystemPrompt(aiConfig: AIConfig, conversationHistory: Message[]): string {
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
- Hora: ${currentTime}

INFORMACIÓN DE LA EMPRESA:`;

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

  if (aiConfig?.restrictions?.trim()) {
    systemPrompt += `\n\nRESTRICCIONES Y PAUTAS:\n${aiConfig.restrictions}`;
  }

  // Add conversation context
  if (conversationHistory.length > 0) {
    systemPrompt += `\n\nCONTEXTO DE CONVERSACIÓN (${conversationHistory.length} mensajes previos):`;
    conversationHistory.forEach((msg) => {
      const role = msg.sender_type === 'user' ? 'Cliente' : 'Asistente';
      systemPrompt += `\n${role}: ${msg.content}`;
    });
  } else {
    systemPrompt += `\n\nCONTEXTO DE CONVERSACIÓN:\nEsta es una nueva conversación.`;
  }

  systemPrompt += `\n\nINSTRUCCIONES:
1. Responde ÚNICAMENTE basándote en la información de la empresa proporcionada
2. Si hay coincidencia exacta en FAQ, usa esa respuesta
3. IMPORTANTE: Mantén coherencia total con el contexto de conversación mostrado arriba
4. RECUERDA y mantén consistencia con cualquier información personal que el cliente haya compartido previamente (nombre, preferencias, etc.)
5. Si previamente mencionaste el nombre del cliente o cualquier dato personal, mantenlo a lo largo de toda la conversación
6. Si no tienes información específica, sé honesto y sugiere contactar al equipo
7. Respeta TODAS las restricciones sin excepción
8. Usa la fecha/hora actual cuando sea relevante
9. Mantén tono profesional y natural
10. NO inventes información que no esté en tu base de conocimiento
11. NUNCA contradices información que ya proporcionaste en mensajes anteriores de esta conversación`;

  return systemPrompt;
}

/**
 * Creates simple fallback response for errors
 * @param message - The original message
 * @returns string - Simple fallback response
 */
function createFallbackResponse(message: string): string {
  return `Disculpa, estoy experimentando dificultades técnicas en este momento. Tu mensaje "${message}" ha sido recibido. Por favor, intenta nuevamente en unos momentos o contacta directamente con nuestro equipo para asistencia inmediata.`;
}

/**
 * Generates AI response using OpenAI with company context and conversation memory
 * @param message - The incoming message text
 * @param aiConfig - AI configuration from database
 * @param conversationHistory - Complete conversation history for context
 * @param userId - User ID for debugging (optional)
 * @returns Promise<AIResponse> - AI response or error
 */
export async function generateAIResponse(
  message: string, 
  aiConfig: AIConfig, 
  conversationHistory: Message[] = [],
  userId?: string
): Promise<AIResponse> {
  try {
    console.log('🤖 Generating AI response for message length:', message.length);
    
    if (!aiConfig?.is_active) {
      return {
        success: false,
        error: 'AI is not active for this user'
      };
    }

    // Check custom FAQ first for exact matches
    if (aiConfig.faq) {
      const faqResponse = checkCustomFAQ(message.toLowerCase().trim(), aiConfig.faq);
      if (faqResponse) {
        console.log('✅ FAQ match found');
        return {
          success: true,
          response: faqResponse,
          confidence_score: 0.95
        };
      }
    }

    // Get OpenAI API key from environment variables
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      console.error('❌ OpenAI API key not configured in environment variables');
      console.error('🔧 Make sure OPENAI_API_KEY is set in your .env file');
      return {
        success: true,
        response: createFallbackResponse(message),
        confidence_score: 0.3
      };
    }

    // Validate API key format (OpenAI keys start with 'sk-')
    if (!openaiApiKey.startsWith('sk-')) {
      console.error('❌ Invalid OpenAI API key format. API keys should start with "sk-"');
      return {
        success: true,
        response: createFallbackResponse(message),
        confidence_score: 0.3
      };
    }

    console.log('✅ OpenAI API key loaded from environment variables');

    // Build prompts
    const systemPrompt = buildSystemPrompt(aiConfig, conversationHistory);
    const userPrompt = `Cliente: "${message}"

Responde a este mensaje siguiendo las instrucciones del system prompt y manteniendo coherencia con el contexto de la conversación.`;

    const model = 'gpt-4o-mini';
    console.log('🔗 Calling OpenAI API with context-aware prompts');
    console.log(`🤖 Using model: ${model}`);
    console.log(`📝 System prompt length: ${systemPrompt.length} characters`);
    console.log(`💬 User prompt length: ${userPrompt.length} characters`);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
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

    return {
      success: true,
      response: aiResponse,
      confidence_score: 0.9
    };

  } catch (error) {
    console.error('Error generating AI response:', error);
    return {
      success: true,
      response: createFallbackResponse(message),
      confidence_score: 0.3
    };
  }
}