const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if(key && val) acc[key.trim()] = val.join('=').trim();
    return acc;
}, {});

async function checkDlocal() {
    const authString = `${env.DLOCALGO_API_KEY}:${env.DLOCALGO_SECRET_KEY}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;

    console.log('Fetching subscriptions...');
    const res = await fetch(`${env.DLOCALGO_API_URL}/v1/subscriptions`, {
        headers: { 'Authorization': authHeader }
    });
    
    if (res.ok) {
        const data = await res.json();
        console.log('Subscriptions:', JSON.stringify(data, null, 2));
    } else {
        console.log('Error fetching subscriptions:', await res.text());
    }
}

checkDlocal();
