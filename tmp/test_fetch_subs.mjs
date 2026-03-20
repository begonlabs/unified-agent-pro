const DLOCALGO_API_KEY = 'eYyxWqcFvMoYDiMIwdyLhQZRERseoYOs';
const DLOCALGO_SECRET_KEY = 'IZ5bAeH4XS2v3oNsC6pgBAvTjHngeOVdbGUk1MDP';
const DLOCALGO_API_URL = 'https://api.dlocalgo.com';

const authString = Buffer.from(`${DLOCALGO_API_KEY}:${DLOCALGO_SECRET_KEY}`).toString('base64');
const authHeader = `Basic ${authString}`;

async function main() {
  const planId = 18861; // Básico (API)
  const url = `${DLOCALGO_API_URL}/v1/subscription/plan/${planId}/subscription/all`;
  console.log(`Fetching subscriptions for plan ${planId}...`);
  try {
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
        console.log(JSON.stringify(data, null, 2));
    } else {
        console.error(await res.text());
    }
  } catch (e) {
      console.error(e.message);
  }
}

main();
