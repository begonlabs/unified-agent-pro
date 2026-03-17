import crypto from 'crypto';

/**
 * Simulates the signature generation and verification logic
 */
function toHex(bytes) {
  return Array.from(new Uint8Array(bytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function testSignature(rawBody, secret, receivedSignature) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody);
  const digest = hmac.digest('hex');
  const expectedSignature = `sha256=${digest}`;

  console.log(`Checking against secret: ${secret}`);
  console.log(`Expected: ${expectedSignature}`);
  console.log(`Received: ${receivedSignature}`);
  
  const isValid = expectedSignature === receivedSignature;
  console.log(`Result: ${isValid ? '✅ VALID' : '❌ INVALID'}\n`);
  return isValid;
}

const FB_SECRET = 'cabebd2cf5d58cdccfce8f2dac43ae29';
const IG_SECRET = '65188c8504c5e0f3960919729919d91d';
const MOCK_BODY = JSON.stringify({ object: 'page', entry: [{ id: '123', messaging: [{ sender: { id: 'user_1' }, message: { text: 'hola' } }] }] });

async function runTests() {
  console.log('--- TEST 1: Facebook Message with FB Secret ---');
  // Generate a valid signature for FB
  const fbHmac = crypto.createHmac('sha256', FB_SECRET);
  fbHmac.update(MOCK_BODY);
  const fbSignature = `sha256=${fbHmac.digest('hex')}`;
  
  // Test both secrets
  await testSignature(MOCK_BODY, FB_SECRET, fbSignature);
  await testSignature(MOCK_BODY, IG_SECRET, fbSignature);

  console.log('--- TEST 2: Instagram Message with IG Secret ---');
  const IG_BODY = JSON.stringify({ object: 'instagram', entry: [] });
  const igHmac = crypto.createHmac('sha256', IG_SECRET);
  igHmac.update(IG_BODY);
  const igSignature = `sha256=${igHmac.digest('hex')}`;
  
  await testSignature(IG_BODY, FB_SECRET, igSignature);
  await testSignature(IG_BODY, IG_SECRET, igSignature);
}

runTests();
