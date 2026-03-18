import * as fs from 'fs';

// Copia exacta de la función actual de producción
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
          console.log(`[DEBUG] Comparing msg: "${message.toLowerCase()}" includes qt: "${questionText}" ?`);
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
      console.log(`[DEBUG L] Comparing msg: "${message.toLowerCase()}" includes qt: "${questionText}" ?`);
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

// Simulando el texto correcto que el sistema espera
const CorrectFAQText = `
Pregunta: ¿Cuáles son los horarios de atención en la ENE?
Respuesta: Los horarios de atención en la ENE son de lunes a viernes de 10 a 20 hs, y los sábados de 11 a 15 hs.
`;

console.log("=== PRUEBA DE PARSEO DE FAQS ===");
console.log("\nPrueba 2: Con el formato que el código exige ('Pregunta: x', 'Respuesta: y')");
const result2 = checkCustomFAQ('cuales son los horarios de atención en la ene?', CorrectFAQText);
console.log("Resultado: ", result2 ? "✅ " + result2 : "❌ Falló (Null)");
