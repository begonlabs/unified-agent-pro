const apiKey = 'eYyxWqcFvMoYDiMIwdyLhQZRERseoYOs';
const secretKey = 'IZ5bAeH4XS2v3oNsC6pgBAvTjHngeOVdbGUk1MDP';
const authHeader = 'Basic ' + Buffer.from(`${apiKey}:${secretKey}`).toString('base64');

async function createPlan() {
  const payload = {
    name: "OndAI Básico (API)",
    description: "Suscripción Básico generada por API",
    amount: 1,
    currency: "USD",
    frequency_type: "MONTHLY",
    frequency_value: 1,
    notification_url: "https://supabase.ondai.ai/functions/v1/payment-webhook",
    success_url: "https://app.ondai.ai/dashboard?tab=profile&payment_success=true",
    back_url: "https://app.ondai.ai/dashboard?tab=profile&payment_success=true",
    return_url: "https://app.ondai.ai/dashboard?tab=profile&payment_success=true"
  };

  const response = await fetch('https://api.dlocalgo.com/v1/subscription/plan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  console.log('Response Status:', response.status);
  console.log(JSON.stringify(data, null, 2));
}

createPlan();
