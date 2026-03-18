// Mock Deno for Node.js execution
globalThis.Deno = {
  env: {
    get: (key: string) => process.env[key]
  }
} as any;

import * as fs from 'fs';
import { generateAIResponse } from "../src/../supabase/functions/_shared/openai.ts";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("❌ ERROR: Necesitas proveer explícitamente OPENAI_API_KEY.");
  console.error("Abre una terminal normal (cmd / powershell) y corre:");
  console.error("$env:OPENAI_API_KEY=\"TU_LLAVE\"; npx tsx tmp/test_faq_ai.ts");
  process.exit(1);
}

const logFile = 'tmp/test_faq_results.txt';
// Clear file
fs.writeFileSync(logFile, '');

function log(text: string) {
  console.log(text);
  fs.appendFileSync(logFile, text + '\n', 'utf8');
}

// Emulando una configuración realista basada en la captura del usuario.
// Notar que el texto NO usa "Pregunta: " ni "Respuesta: ". Está relajado.
const mockConfig = {
  is_active: true,
  goals: "Brindar información precisa sobre la Escuela Nacional de Enfermería (ENE).",
  knowledge_base: "Ofrecemos cursos de enfermería altamente capacitados.",
  restrictions: "NUNCA inventes información. Si no sabes algo, pide que llamen al teléfono.",
  faq: `¿Cuáles son los horarios de atención en la ENE?
Los horarios de atención en la ENE son de lunes a viernes de 10 a 20 hs, y los sábados de 11 a 15 hs.

¿Cuál es la ubicación de la ENE?
Estamos en Colonia 1359, esq. Ejido

¿Cuáles son los medios de contacto?
Los medios de contacto de la ENE son: 0800-1818 (línea telefónica gratuita) y 096 421 123.

¿Me puedo anotar si soy del interior?
Sí, contamos con modalidades semi-presenciales ideales para gente del interior.`,
  response_time: 0,
};

const runTest = async (testName: string, userMessage: string) => {
  log(`\n======================================================`);
  log(`🧪 PRUEBA FAQ: ${testName}`);
  log(`👤 USUARIO: "${userMessage}"`);
  log(`⏳ Generando respuesta...`);
  
  const result = await generateAIResponse(userMessage, mockConfig as any, [], "user-test", "María");
  
  log(`🤖 IA: ${result.response}`);
  log(`======================================================`);
}

async function runAllTests() {
  log("Iniciando batería EXHAUSTIVA de pruebas locales para evaluar el Parser Semántico de FAQs del Agente AI...\n");
  
  await runTest(
    "1. Pregunta Literal Faltando Signos (Como un humano real)", 
    "cuales son los medios de contacto???"
  );

  await runTest(
    "2. Pregunta Parafraseada (Semántica total)", 
    "Hola mija, donde que da la eculela exactamente?"
  );

  await runTest(
    "3. Mezclando dos intenciones juntas", 
    "queria saber q dias abren y a q hora, y de paso si tienen algun telefono pa llamar gratis"
  );

    await runTest(
    "4. Prueba de error (Pregunta sobre la que no hay FAQ ni base de datos)", 
    "cuanto cuesta la inscripción a primer año de enfermería?"
  );
  
  log("\n✅ Pruebas finalizadas. Validar si la IA extrajo perfectamente la info de los FAQs sin importar la mala ortografía o parafraseo de María.");
}

runAllTests();
