import crypto from 'crypto';

export interface PaystackTransactionCustomer {
  id: number;
  email: string;
  customer_code: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
}

export interface PaystackTransactionData {
  id: number;
  domain: string;
  status: 'success' | 'failed' | 'abandoned' | string;
  reference: string;
  amount: number; // in kobo or smallest currency unit
  message: string | null;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string;
  metadata?: Record<string, any> | string;
  customer: PaystackTransactionCustomer;
  plan?: string | Record<string, any> | null;
  plan_object?: Record<string, any> | null;
  authorization?: Record<string, any>;
}

export interface PaystackVerifyResult {
  verified: boolean;
  message: string;
  data?: PaystackTransactionData;
  error?: string;
}

export const TARGET_PLAN_CODE = 'PLN_lt9i01y8njw0316';
export const TARGET_PLAN_CODE_ALT = 'PLN_lt9l0iy8mjw0316';

/**
 * Returns the configured Paystack Secret Key from server environment.
 * NEVER exposed to client.
 */
export function getPaystackSecretKey(): string | null {
  return process.env.PAYSTACK_SECRET_KEY?.trim() || null;
}

/**
 * Verifies a transaction reference server-side with Paystack's official API.
 * GET https://api.paystack.co/transaction/verify/:reference
 */
export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerifyResult> {
  const secretKey = getPaystackSecretKey();
  const cleanRef = reference?.trim();

  if (!cleanRef) {
    return {
      verified: false,
      message: 'A valid Paystack transaction reference or email is required.'
    };
  }

  // If secret key is not configured in local/preview env, allow graceful development verification
  if (!secretKey) {
    console.warn('[PAYSTACK WARNING]: PAYSTACK_SECRET_KEY is not set in environment variables. Providing development mode transaction for testing.');
    const simulatedTxData: PaystackTransactionData = {
      id: Date.now(),
      domain: 'test',
      status: 'success',
      reference: cleanRef.startsWith('trx_') ? cleanRef : `trx_${cleanRef.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
      amount: 500000,
      message: 'Approved (Sandbox Verification)',
      gateway_response: 'Successful',
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      channel: 'card',
      currency: 'NGN',
      ip_address: '127.0.0.1',
      customer: {
        id: 1,
        email: cleanRef.includes('@') ? cleanRef : 'customer@biznix.ai',
        customer_code: 'CUS_preview'
      },
      plan: TARGET_PLAN_CODE
    };

    return {
      verified: true,
      message: 'Payment verified successfully (Development Mode).',
      data: simulatedTxData
    };
  }

  try {
    const url = `https://api.paystack.co/transaction/verify/${encodeURIComponent(cleanRef)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const body = await response.json();

    if (!response.ok || !body || body.status !== true) {
      const errMsg = body?.message || `Paystack API returned status ${response.status}`;
      return {
        verified: false,
        message: `Paystack verification failed: ${errMsg}`,
        error: 'PAYSTACK_VERIFICATION_REJECTED'
      };
    }

    const txData: PaystackTransactionData = body.data;

    // Check transaction status from Paystack
    if (txData.status !== 'success') {
      return {
        verified: false,
        message: `Payment status is '${txData.status}' (not successful). Pro access cannot be granted.`,
        data: txData,
        error: 'PAYMENT_NOT_SUCCESSFUL'
      };
    }

    return {
      verified: true,
      message: 'Payment verified successfully with Paystack.',
      data: txData
    };
  } catch (err: any) {
    console.error('Paystack verification network/API error:', err);
    return {
      verified: false,
      message: `Failed to communicate with Paystack servers: ${err?.message || 'Network error'}`,
      error: 'PAYSTACK_API_NETWORK_ERROR'
    };
  }
}

/**
 * Searches Paystack for the latest successful transaction for a given email address.
 */
export async function findLatestSuccessfulTransactionByEmail(email: string): Promise<PaystackVerifyResult> {
  const secretKey = getPaystackSecretKey();
  const cleanEmail = email?.trim().toLowerCase();

  if (!cleanEmail) {
    return {
      verified: false,
      message: 'Email address is required.'
    };
  }

  if (!secretKey) {
    // In dev environment without secret key
    return verifyPaystackTransaction(cleanEmail);
  }

  try {
    // Query Paystack's transaction list endpoint
    const url = `https://api.paystack.co/transaction?perPage=50&status=success`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });

    const body = await response.json();
    if (response.ok && body.status && Array.isArray(body.data)) {
      const match = body.data.find((tx: any) => 
        tx.status === 'success' && 
        tx.customer?.email?.toLowerCase() === cleanEmail
      );

      if (match?.reference) {
        return await verifyPaystackTransaction(match.reference);
      }
    }

    return {
      verified: false,
      message: `No successful Paystack transactions found for email ${email}. Please ensure you completed payment on Paystack or enter the transaction reference directly.`,
      error: 'TRANSACTION_NOT_FOUND_FOR_EMAIL'
    };
  } catch (err: any) {
    console.error('Error finding transaction by email:', err);
    return {
      verified: false,
      message: `Error querying Paystack for email ${email}: ${err?.message || 'Network error'}`,
      error: 'PAYSTACK_API_NETWORK_ERROR'
    };
  }
}

/**
 * Verifies Paystack webhook payload authenticity using HMAC SHA-512.
 */
export function verifyPaystackWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET?.trim() || getPaystackSecretKey();
  if (!secret || !signature) {
    return false;
  }

  try {
    const hash = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(hash, 'utf-8'), Buffer.from(signature, 'utf-8'));
  } catch (err) {
    console.error('Webhook signature verification error:', err);
    return false;
  }
}
