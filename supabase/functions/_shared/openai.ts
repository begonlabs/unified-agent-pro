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
 * Checks custom FAQ for matching questions
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
          if (message.includes(currentQuestion.toLowerCase().replace('pregunta:', '').trim())) {
            return currentAnswer.trim();
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
      if (message.includes(currentQuestion.toLowerCase().replace('pregunta:', '').trim())) {
        return currentAnswer.trim();
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
 * Builds a dynamic prompt based on user's AI configuration
 * @param aiConfig - AI configuration from database
 * @param message - The incoming message
 * @param conversationHistory - Recent conversation history
 * @returns string - Dynamic prompt for AI response
 */
function buildDynamicPrompt(aiConfig: AIConfig, message: string, conversationHistory: string[]): string {
  const prompt = `Eres un asistente virtual inteligente y amigable. Tu objetivo es ayudar a los usuarios de manera efectiva y personalizada.

CONTEXTO DE LA EMPRESA:
${aiConfig?.goals ? `OBJETIVOS: ${aiConfig.goals}` : 'No hay objetivos específicos definidos.'}

${aiConfig?.knowledge_base ? `BASE DE CONOCIMIENTO: ${aiConfig.knowledge_base}` : 'No hay base de conocimiento específica.'}

${aiConfig?.restrictions ? `RESTRICCIONES IMPORTANTES: ${aiConfig.restrictions}` : 'No hay restricciones específicas.'}

${aiConfig?.common_questions ? `PREGUNTAS COMUNES: ${aiConfig.common_questions}` : 'No hay preguntas comunes predefinidas.'}

INSTRUCCIONES:
1. Responde de manera natural, amigable y profesional
2. Usa ÚNICAMENTE la información proporcionada en el contexto
3. Si no tienes información específica sobre algo, sé honesto y ofrece alternativas
4. Mantén un tono conversacional pero informativo
5. Si hay restricciones, respétalas completamente
6. Personaliza tu respuesta basándote en los objetivos de la empresa

MENSAJE DEL USUARIO: "${message}"

${conversationHistory.length > 0 ? `HISTORIAL DE CONVERSACIÓN RECIENTE:\n${conversationHistory.slice(-3).join('\n')}` : ''}

Responde de manera natural y útil, usando la información del contexto proporcionado.`;

  return prompt;
}

/**
 * Generates an AI response using dynamic prompt engineering
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
    console.log('🎯 AI Goals:', aiConfig?.goals?.substring(0, 100) + '...');
    console.log('🚫 AI Restrictions:', aiConfig?.restrictions?.substring(0, 100) + '...');

    // Check if AI is active
    if (!aiConfig?.is_active) {
      return {
        success: false,
        error: 'AI is not active for this user'
      };
    }

    // First, check custom FAQ for exact matches
    if (aiConfig.faq) {
      const faqResponse = checkCustomFAQ(message.toLowerCase().trim(), aiConfig.faq);
      if (faqResponse) {
        console.log('✅ Found FAQ match');
        return {
          success: true,
          response: faqResponse,
          confidence_score: 0.95
        };
      }
    }

    // Build dynamic prompt based on user configuration
    const dynamicPrompt = buildDynamicPrompt(aiConfig, message, conversationHistory);
    console.log('📝 Dynamic prompt built, length:', dynamicPrompt.length);

    // Generate response using the dynamic prompt
    let response = "";
    const confidence = 0.8;

    // For now, we'll use a simplified response generation
    // In a real implementation, this would call OpenAI API with the dynamic prompt
    response = generateContextualResponse(message, aiConfig, conversationHistory);

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

/**
 * Generates a contextual response based on user configuration
 * @param message - The incoming message
 * @param aiConfig - AI configuration
 * @param conversationHistory - Recent conversation history
 * @returns string - Generated response
 */
function generateContextualResponse(message: string, aiConfig: AIConfig, conversationHistory: string[]): string {
  const lowerMessage = message.toLowerCase().trim();
  
  // Check if we have specific information to work with
  const hasGoals = aiConfig?.goals && aiConfig.goals.trim().length > 0;
  const hasKnowledge = aiConfig?.knowledge_base && aiConfig.knowledge_base.trim().length > 0;
  const hasRestrictions = aiConfig?.restrictions && aiConfig.restrictions.trim().length > 0;
  const hasCommonQuestions = aiConfig?.common_questions && aiConfig.common_questions.trim().length > 0;

  // Generate greeting response
  if (lowerMessage.match(/^(hola|hello|hi|buenas|hey|saludos)/)) {
    if (hasGoals) {
      return `¡Hola! 👋 Soy tu asistente virtual. ${aiConfig.goals.substring(0, 150)}... ¿En qué puedo ayudarte hoy?`;
    } else {
      return "¡Hola! 👋 Bienvenido/a. Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?";
    }
  }

  // Generate service/product response
  if (lowerMessage.includes('servicio') || lowerMessage.includes('producto') || lowerMessage.includes('ofreces') || lowerMessage.includes('haces')) {
    if (hasKnowledge) {
      return `¡Excelente pregunta! 🌟 

Basándome en nuestra información:
${aiConfig.knowledge_base.substring(0, 300)}...

¿Te interesa algún aspecto específico? ¡Cuéntame más detalles!`;
    } else if (hasGoals) {
      return `¡Excelente pregunta! 🌟 

${aiConfig.goals.substring(0, 200)}...

¿Te gustaría saber más sobre algún aspecto específico?`;
    } else {
      return "¡Excelente pregunta! 🌟 Estoy aquí para ayudarte con información sobre nuestros servicios. ¿Podrías ser más específico sobre lo que te interesa?";
    }
  }

  // Generate pricing response
  if (lowerMessage.includes('precio') || lowerMessage.includes('costo') || lowerMessage.includes('cuanto') || lowerMessage.includes('tarifa')) {
    if (hasRestrictions && aiConfig.restrictions.toLowerCase().includes('precio')) {
      return `💰 Entiendo tu interés en nuestros precios. 

${aiConfig.restrictions.substring(0, 200)}...

¿Te gustaría que te ayude con otra consulta mientras tanto?`;
    } else if (hasKnowledge && aiConfig.knowledge_base.toLowerCase().includes('precio')) {
      return `💰 Basándome en nuestra información:

${aiConfig.knowledge_base.substring(0, 300)}...

¿Te gustaría más detalles sobre algún aspecto específico?`;
    } else {
      return "💰 Entiendo tu interés en nuestros precios. Para darte información precisa, necesito conocer más sobre tus necesidades específicas. ¿Podrías contarme qué tipo de servicio te interesa?";
    }
  }

  // Generate contact response
  if (lowerMessage.includes('contacto') || lowerMessage.includes('telefono') || lowerMessage.includes('email') || lowerMessage.includes('direccion')) {
    if (hasKnowledge && aiConfig.knowledge_base.toLowerCase().includes('contacto')) {
      return `📞 Basándome en nuestra información:

${aiConfig.knowledge_base.substring(0, 300)}...

¿Hay algo específico en lo que pueda ayudarte?`;
    } else {
      return "📞 Para información de contacto específica, te recomiendo revisar nuestra información oficial. ¿Hay algo más en lo que pueda ayudarte?";
    }
  }

  // Generate schedule/time response
  if (lowerMessage.includes('hora') || lowerMessage.includes('tiempo') || lowerMessage.includes('cuando') || lowerMessage.includes('horario')) {
    if (hasKnowledge && aiConfig.knowledge_base.toLowerCase().includes('hora')) {
      return `⏰ Basándome en nuestra información:

${aiConfig.knowledge_base.substring(0, 300)}...

¿En qué más puedo ayudarte?`;
    } else {
      return "⏰ Como asistente virtual, estoy disponible 24/7 para ayudarte con información inicial. ¿En qué puedo ayudarte ahora mismo?";
    }
  }

  // Generate thanks response
  if (lowerMessage.includes('gracias') || lowerMessage.includes('thanks')) {
    return "¡De nada! 😊 Me da mucho gusto ayudarte. ¿Hay algo más en lo que pueda asistirte?";
  }

  // Generate response for common questions
  if (hasCommonQuestions) {
    const commonQuestions = aiConfig.common_questions.toLowerCase();
    if (commonQuestions.includes(lowerMessage.substring(0, 20))) {
      return `Basándome en nuestras preguntas comunes:

${aiConfig.common_questions.substring(0, 300)}...

¿Te ayuda esto con tu consulta?`;
    }
  }

  // Default contextual response
  if (hasGoals) {
    return `¡Entiendo! 🤔 

${aiConfig.goals.substring(0, 200)}...

Basándome en tu mensaje "${message}", puedo ayudarte con información específica. ¿Podrías ser más específico sobre lo que necesitas?`;
  } else if (hasKnowledge) {
    return `¡Entiendo! 🤔 

Basándome en nuestra información:
${aiConfig.knowledge_base.substring(0, 200)}...

¿Hay algo específico sobre lo que te gustaría saber más?`;
  } else {
    return `¡Entiendo! 🤔 

Estoy aquí para ayudarte. Basándome en tu mensaje "${message}", ¿podrías ser más específico sobre lo que necesitas? Así podré darte la mejor información posible.`;
  }
}
