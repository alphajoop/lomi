/**
 * Local-only dev script to smoke-test a Wave charge.
 * Usage: LOMI_SECRET_KEY=lomi_sk_... API_URL=http://localhost:3000 pnpm ts-node scripts/verify-charge.ts
 */
import axios from 'axios';

const API_URL = process.env.API_URL ?? 'http://localhost:3000/charge/wave';
const API_KEY = process.env.LOMI_SECRET_KEY;

async function verifyCharge() {
  if (!API_KEY) {
    console.error('Set LOMI_SECRET_KEY in the environment');
    process.exit(1);
  }

  try {
    const payload = {
      amount: 100,
      currency: 'XOF',
      customer: {
        name: 'Test Customer',
        email: 'test@example.com',
        phoneNumber: '+2250160223401',
      },
      description: 'Test Charge via API',
      successUrl: 'https://google.com',
      errorUrl: 'https://google.com',
    };

    const response = await axios.post(API_URL, payload, {
      headers: {
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    console.log('Success:', response.status, response.data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error:', error.response.status, error.response.data);
    } else if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Error:', error);
    }
    process.exit(1);
  }
}

verifyCharge().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
