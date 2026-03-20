const apiKey = 'eYyxWqcFvMoYDiMIwdyLhQZRERseoYOs';
const secretKey = 'IZ5bAeH4XS2v3oNsC6pgBAvTjHngeOVdbGUk1MDP';
const authHeader = 'Basic ' + Buffer.from(`${apiKey}:${secretKey}`).toString('base64');

async function checkSubs() {
  try {
    let res = await fetch('https://api.dlocalgo.com/v1/subscription/plan/18861/subscription/all', {
      headers: { 'Authorization': authHeader }
    });
    let json = await res.json();
    console.log(JSON.stringify(json, null, 2));
  } catch(e) { console.error(e) }
}
checkSubs();
