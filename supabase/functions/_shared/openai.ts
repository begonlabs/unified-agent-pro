/**
 * Utility functions for OpenAI integration
 */

interface AIConfiguration {
  goals?: string;
  restrictions?: string;
  knowledge_base?: string;
  faq?: string;
  response_time?: number;
}

interface OpenAIResponse {
  success: boolean;
  response?: string;
  error?: string;
  confidence_score?: number;
}

/**
 * Generate AI response using OpenAI API
 */
export async function generateAIResponse(
  userMessage: string,
  aiConfig: AIConfiguration,
  conversationHistory: string[] = []
): Promise<OpenAIResponse> {
  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY no configurada');
      return {
        success: false,
        error: 'OpenAI API key no configurada'
      };
    }

    // Construir el contexto para la IA
    const systemPrompt = buildSystemPrompt(aiConfig);
    const messages = buildMessageHistory(systemPrompt, userMessage, conversationHistory);

    console.log('🤖 Enviando request a OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Modelo económico y eficiente
        messages: messages,
        max_tokens: 300, // Límite para respuestas concisas
        temperature: 0.7, // Balance entre creatividad y consistencia
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Error OpenAI API:', response.status, errorData);
      return {
        success: false,
        error: `OpenAI API Error: ${response.status}`
      };
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim();

    if (!aiResponse) {
      console.error('❌ No response from OpenAI');
      return {
        success: false,
        error: 'No se recibió respuesta de la IA'
      };
    }

    // Calcular score de confianza basado en la longitud y calidad de la respuesta
    const confidence_score = calculateConfidenceScore(aiResponse, userMessage);

    console.log('✅ Respuesta de IA generada:', {
      length: aiResponse.length,
      confidence: confidence_score
    });

    return {
      success: true,
      response: aiResponse,
      confidence_score
    };

  } catch (error) {
    console.error('❌ Error generando respuesta de IA:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Build system prompt from AI configuration
 */
function buildSystemPrompt(config: AIConfiguration): string {
  let prompt = `Eres un asistente de atención al cliente inteligente y útil.

CONTEXTO DE LA EMPRESA:
${config.knowledge_base || 'No se ha proporcionado información específica de la empresa.'}

TUS OBJETIVOS:
${config.goals || 'Proporcionar atención al cliente excelente y resolver consultas de manera eficiente.'}

RESTRICCIONES IMPORTANTES:
${config.restrictions || 'Mantén un tono profesional y amigable en todo momento.'}

PREGUNTAS FRECUENTES:
${config.faq || 'No se han configurado preguntas frecuentes específicas.'}

INSTRUCCIONES:
- Responde de manera concisa y útil
- Mantén un tono amigable y profesional
- Si no sabes algo, sé honesto al respecto
- Deriva a un humano si la consulta es muy compleja
- Usa la información de la empresa cuando sea relevante
- No inventes información que no tengas`;

  return prompt;
}

/**
 * Build message history for OpenAI
 */
function buildMessageHistory(
  systemPrompt: string,
  userMessage: string,
  conversationHistory: string[]
): any[] {
  const messages = [
    {
      role: 'system',
      content: systemPrompt
    }
  ];

  // Agregar historial de conversación (últimos 10 mensajes para mantener contexto)
  const recentHistory = conversationHistory.slice(-10);
  recentHistory.forEach((msg, index) => {
    messages.push({
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: msg
    });
  });

  // Agregar mensaje actual del usuario
  messages.push({
    role: 'user',
    content: userMessage
  });

  return messages;
}

/**
 * Calculate confidence score for AI response
 */
function calculateConfidenceScore(aiResponse: string, userMessage: string): number {
  let score = 0.5; // Base score

  // Factor por longitud de respuesta (respuestas muy cortas o muy largas bajan confianza)
  const responseLength = aiResponse.length;
  if (responseLength >= 20 && responseLength <= 200) {
    score += 0.2;
  } else if (responseLength < 10) {
    score -= 0.3;
  } else if (responseLength > 300) {
    score -= 0.1;
  }

  // Factor por contenido (evitar respuestas genéricas)
  const genericPhrases = ['no sé', 'no estoy seguro', 'lo siento', 'disculpa'];
  const hasGenericPhrase = genericPhrases.some(phrase => 
    aiResponse.toLowerCase().includes(phrase)
  );
  if (hasGenericPhrase) {
    score -= 0.2;
  }

  // Factor por relevancia (si menciona palabras clave del mensaje del usuario)
  const userWords = userMessage.toLowerCase().split(' ').filter(word => word.length > 3);
  const responseWords = aiResponse.toLowerCase();
  const relevantWords = userWords.filter(word => responseWords.includes(word));
  if (relevantWords.length > 0) {
    score += Math.min(0.3, relevantWords.length * 0.1);
  }

  // Asegurar que esté entre 0 y 1
  return Math.max(0, Math.min(1, score));
}

/**
 * Check if AI should respond based on message content and configuration
 */
export function shouldAIRespond(
  message: string,
  aiConfig: AIConfiguration
): boolean {
  // No responder a mensajes muy cortos o saludos simples
  const trivialMessages = ['hola', 'hi', 'hey', 'buenos días', 'buenas'];
  const messageWords = message.toLowerCase().trim().split(' ');
  
  if (messageWords.length === 1 && trivialMessages.includes(messageWords[0])) {
    return false;
  }

  // No responder a mensajes con información personal sensible
  const sensitivePatterns = [
    /\b\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4}\b/, // Tarjetas de crédito
    /\b\d{3}[\s-]\d{2}[\s-]\d{4}\b/, // SSN format
    /password|contraseña|clave/i
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(message)) {
      return false;
    }
  }

  return true;
}
