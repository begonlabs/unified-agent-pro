async function test() {
  const payload = {
    id: "DP-6626949",
    amount: 1,
    currency: "USD",
    status: "PAID",
    order_id: "ST-Ds4msuXFuj4BTP4MB4N9uJJZmSEkrrU5-0",
    payer: {
      email: "test4sarkis@gmail.com"
    }
  };

  const res = await fetch('https://supabase.ondai.ai/functions/v1/payment-webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  console.log(res.status);
  console.log(await res.text());
}
test();
