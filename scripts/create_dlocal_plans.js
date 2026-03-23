import https from 'https';

const API_KEY = 'TWknwsAtJgazlDsawRIrCYLFJpJNOYMR';
const SECRET_KEY = 'ApizLughS0RbihFquK651wpQoJmK9rJUpagMrUBg';
const API_URL = 'api-sbx.dlocalgo.com';
const authHeader = 'Basic ' + Buffer.from(API_KEY + ':' + SECRET_KEY).toString('base64');

const plansToCreate = [
    { name: 'Plan Básico OndAi', interval: 'MONTH', currency: 'USD', amount: 49 },
    { name: 'Plan Avanzado OndAi', interval: 'MONTH', currency: 'USD', amount: 139 },
    { name: 'Plan Pro OndAi', interval: 'MONTH', currency: 'USD', amount: 299 },
    { name: 'Plan Empresarial OndAi', interval: 'MONTH', currency: 'USD', amount: 399 }
];

async function createPlan(plan) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(plan);

        const options = {
            hostname: API_URL,
            path: '/v1/plans',
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => {
                responseBody += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseBody);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        // Fallback handling if Dlocal Go uses a different sub-endpoint
                        console.log('Error for ' + plan.name + ': HTTP ' + res.statusCode + ' -> ' + responseBody);
                        resolve(parsed);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

async function run() {
    console.log('--- Iniciando creación de Planes Oficiales en DLocal Go ---');
    for (const p of plansToCreate) {
        console.log('[+] Creando ' + p.name + ' ($ ' + p.amount + ' ' + p.currency + ')...');
        try {
            const result = await createPlan(p);
            // Dlocal Go usually returns the token inside .token or .id
            console.log('  -> Token generado correctamente: ' + (result.token || result.id || JSON.stringify(result)));
            console.log('---------------------------------');
        } catch (err) {
            console.error('[!] Exception: ' + err.message);
        }
    }
}

run();
