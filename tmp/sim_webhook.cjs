const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if(key && val) acc[key.trim()] = val.join('=').trim();
    return acc;
}, {});

async function simulateWebhook() {
    console.log('Simulating DLocal Go Webhook for test.plan.gratis.sarkis...');
    
    // The exact payload that crashed at 22:05 UTC
    const payload = {
        invoiceId: "ST-XqGh57F1jpk0ooyTTxVZBZSDUTMSGyzG-0",
        mid: 193431,
        subscriptionId: 115965,
        externalId: "ff57b095-9c16-462d-973e-c9967a660ab3"
    };

    const res = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/payment-webhook`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    
    const text = await res.text();
    console.log('Response status:', res.status);
    console.log('Response body:', text);
}

simulateWebhook();
