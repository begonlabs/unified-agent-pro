const fs = require('fs');
const apiKey = 'eYyxWqcFvMoYDiMIwdyLhQZRERseoYOs';
const secretKey = 'IZ5bAeH4XS2v3oNsC6pgBAvTjHngeOVdbGUk1MDP';
const authHeader = 'Basic ' + Buffer.from(`${apiKey}:${secretKey}`).toString('base64');

const plans = [
    { id: 'avanzado', name: 'OndAI Avanzado (API Test)' },
    { id: 'pro', name: 'OndAI Pro (API Test)' },
    { id: 'empresarial', name: 'OndAI Empresarial (API Test)' }
];

async function createPlans() {
  const result = {};
  for (const plan of plans) {
      const payload = {
        name: plan.name,
        description: `Suscripción ${plan.id} generada por API para pruebas a 1 USD`,
        amount: 1,
        currency: "USD",
        frequency_type: "MONTHLY",
        frequency_value: 1,
        notification_url: "https://supabase.ondai.ai/functions/v1/payment-webhook",
        success_url: "https://app.ondai.ai/dashboard?tab=profile&payment_success=true",
        back_url: "https://app.ondai.ai/dashboard?tab=profile&payment_success=true",
        return_url: "https://app.ondai.ai/dashboard?tab=profile&payment_success=true"
      };

      try {
          const response = await fetch('https://api.dlocalgo.com/v1/subscription/plan', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader
            },
            body: JSON.stringify(payload)
          });
          const data = await response.json();
          result[plan.id] = data;
      } catch (e) {
          result[plan.id] = { error: String(e) };
      }
  }
  fs.writeFileSync('tmp/clean_dump.json', JSON.stringify(result, null, 2));
}

createPlans();
