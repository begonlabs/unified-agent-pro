const DLOCALGO_API_KEY = 'eYyxWqcFvMoYDiMIwdyLhQZRERseoYOs';
const DLOCALGO_SECRET_KEY = 'IZ5bAeH4XS2v3oNsC6pgBAvTjHngeOVdbGUk1MDP';
const DLOCALGO_API_URL = 'https://api.dlocalgo.com';

const authString = Buffer.from(`${DLOCALGO_API_KEY}:${DLOCALGO_SECRET_KEY}`).toString('base64');
const authHeader = `Basic ${authString}`;

async function main() {
  console.log('Fetching plans...');
  // Valid endpoints for plans? Usually /v1/subscription/plan/all or /v1/plans or /v1/subscription/plan
  const endpoints = [
    '/v1/subscription/plan/all',
    '/v1/subscription/plan',
    '/v1/plans',
    '/v1/subscriptions/plans'
  ];

  for (const endpoint of endpoints) {
    try {
      const url = `${DLOCALGO_API_URL}${endpoint}`;
      console.log(`Trying ${url}...`);
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`Success on ${endpoint}:`, JSON.stringify(data, null, 2));
        break; // Stop on first success
      }
    } catch (e) {
      console.error(e.message);
    }
  }
}

main();
