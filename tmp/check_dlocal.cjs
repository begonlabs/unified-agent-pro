const apiKey = 'eYyxWqcFvMoYDiMIwdyLhQZRERseoYOs';
const secretKey = 'IZ5bAeH4XS2v3oNsC6pgBAvTjHngeOVdbGUk1MDP';
const authHeader = 'Basic ' + Buffer.from(`${apiKey}:${secretKey}`).toString('base64');

async function checkDLocal() {
  console.log('Fetching recent payments from dLocal Go...');
  let res = await fetch('https://api.dlocalgo.com/v1/payments', {
    headers: { 'Authorization': authHeader }
  });
  let json = await res.json();
  console.log('Recent Payments:');
  console.log(JSON.stringify(json, null, 2).substring(0, 1500));

  console.log('\nFetching subscriptions for Plan 18861...');
  let res2 = await fetch('https://api.dlocalgo.com/v1/subscription/plan/18861/subscription/all', {
    headers: { 'Authorization': authHeader }
  });
  let json2 = await res2.json();
  console.log('Subscriptions for API Plan:');
  console.log(JSON.stringify(json2, null, 2).substring(0, 1500));
}

checkDLocal();
