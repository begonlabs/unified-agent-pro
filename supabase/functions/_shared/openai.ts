
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

    // Don't respond to very short messages (likely greetings)
    if (message.length < 3) {
      return false;
    }

    // Don't respond to common greetings (basic implementation)
    const greetings = ['hola', 'hi', 'hello', 'hey', 'buenas', 'saludos'];
    const lowerMessage = message.toLowerCase().trim();
    
    if (greetings.some(greeting => lowerMessage === greeting)) {
      return false;
    }

    // For now, respond to most messages
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
    // For now, return a simple response since OpenAI integration is not set up
    // This prevents the import error and allows the webhook to work
    
    console.log('🤖 Generating AI response for message:', message);
    console.log('📋 AI Config active:', aiConfig?.is_active);
    console.log('📜 Conversation history length:', conversationHistory.length);

    // Simple response based on configuration
    let response = "Gracias por tu mensaje. Un agente humano te responderá pronto.";
    
    if (aiConfig?.goals) {
      response = `Hola! ${aiConfig.goals} ¿En qué puedo ayudarte hoy?`;
    }

    // Simulate AI processing time
    if (aiConfig?.response_time && aiConfig.response_time > 0) {
      await new Promise(resolve => setTimeout(resolve, aiConfig.response_time * 1000));
    }

    return {
      success: true,
      response,
      confidence_score: 0.8
    };

  } catch (error) {
    console.error('Error generating AI response:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
