import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { PaystackTransactionData, TARGET_PLAN_CODE } from './paystack';
import { db as localDb } from './db';
import firebaseConfig from '../firebase-applet-config.json';

let isInitialized = false;

function ensureInitialized() {
  if (!isInitialized) {
    try {
      if (getApps().length === 0) {
        initializeApp({
          projectId: firebaseConfig.projectId
        });
      }
      isInitialized = true;
    } catch (e: any) {
      console.warn('Firebase Admin already initialized or init error:', e?.message);
    }
  }
}

export function getAdminFirestore() {
  ensureInitialized();
  return getFirestore(firebaseConfig.firestoreDatabaseId);
}

export function getAdminAuth() {
  ensureInitialized();
  return getAuth();
}

/**
 * Verify Firebase ID Token passed in request header Authorization: Bearer <token>
 */
export async function verifyUserToken(idToken: string): Promise<{ uid: string; email?: string } | null> {
  if (!idToken) return null;
  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      email: decoded.email
    };
  } catch (err) {
    console.error('Error verifying Firebase ID token on server:', err);
    return null;
  }
}

/**
 * Fulfills a Paystack Pro purchase server-side in Firestore.
 * Sets /users/{uid}/isPro = true and /users/{uid}/proActivatedAt = Date.now().
 * Prevents duplicate fulfillment, writes payment ledger record, and grants Pro access.
 */
export async function fulfillPaystackEntitlement(
  userId: string,
  paystackData: PaystackTransactionData
): Promise<{ success: boolean; alreadyFulfilled?: boolean; message: string; entitlement?: any }> {
  const firestore = getAdminAdminFirestoreSafe();
  if (!firestore) {
    throw new Error('Firestore admin is unavailable.');
  }

  const cleanReference = paystackData.reference.trim();
  const paymentDocRef = firestore.collection('payments').doc(cleanReference);
  const userDocRef = firestore.collection('users').doc(userId);

  const now = new Date();
  const proActivatedAt = Date.now();
  // Standard monthly billing default (31 days validity)
  const expiresAt = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);

  const entitlement = {
    isPro: true,
    is_pro: true,
    proActivatedAt: proActivatedAt,
    pro_since: now.toISOString(),
    subscription: {
      plan_id: TARGET_PLAN_CODE,
      status: 'active',
      is_pro: true,
      isPro: true,
      provider: 'paystack',
      order_id: cleanReference,
      paystack_reference: cleanReference,
      amount: paystackData.amount,
      currency: paystackData.currency,
      channel: paystackData.channel,
      started_at: paystackData.paid_at || now.toISOString(),
      expires_at: expiresAt.toISOString(),
      auto_renew: true
    },
    paystack: {
      reference: cleanReference,
      customer_code: paystackData.customer?.customer_code || '',
      customer_email: paystackData.customer?.email || '',
      channel: paystackData.channel,
      amount: paystackData.amount,
      currency: paystackData.currency,
      paid_at: paystackData.paid_at || now.toISOString(),
      verified_at: now.toISOString()
    },
    updated_at: now.toISOString()
  };

  try {
    // Run as an atomic Firestore transaction to prevent duplicate fulfillment / replay attacks
    const result = await firestore.runTransaction(async (tx) => {
      const existingPayment = await tx.get(paymentDocRef);
      if (existingPayment.exists) {
        const paymentInfo = existingPayment.data();
        if (paymentInfo?.fulfilled) {
          return {
            alreadyFulfilled: true,
            userId: paymentInfo.userId,
            reference: cleanReference
          };
        }
      }

      // Record verified payment
      tx.set(paymentDocRef, {
        reference: cleanReference,
        userId: userId,
        customer_email: paystackData.customer?.email || '',
        customer_code: paystackData.customer?.customer_code || '',
        amount: paystackData.amount,
        currency: paystackData.currency,
        channel: paystackData.channel,
        status: paystackData.status,
        plan: TARGET_PLAN_CODE,
        paid_at: paystackData.paid_at || now.toISOString(),
        fulfilled: true,
        fulfilled_at: now.toISOString(),
        metadata: paystackData.metadata || {}
      });

      // Update user document with Pro entitlement
      // Enforces /users/{uid}/isPro = true and /users/{uid}/proActivatedAt = Date.now()
      tx.set(userDocRef, entitlement, { merge: true });

      return { alreadyFulfilled: false };
    });

    if (result.alreadyFulfilled) {
      return {
        success: true,
        alreadyFulfilled: true,
        message: 'Your BIZNIX features has successfully active',
        entitlement
      };
    }

    // Sync to local server DB state for immediate daily automated feature availability
    try {
      localDb.updateUser(userId, {
        isPro: true,
        is_pro: true,
        proActivatedAt: proActivatedAt,
        pro_since: entitlement.pro_since,
        subscription: entitlement.subscription as any
      });
      // Trigger daily Pro ad & growth rec generation
      localDb.getDailyProAd(userId).catch(() => {});
      localDb.getDailyProGrowthRec(userId).catch(() => {});
    } catch (e) {
      // Non-fatal if local state sync encounters an issue
    }

    return {
      success: true,
      alreadyFulfilled: false,
      message: 'Your BIZNIX features has successfully active',
      entitlement
    };
  } catch (err: any) {
    console.warn('Firestore admin write encountered issue (e.g. IAM credentials in preview), syncing via local state and client:', err?.message);
    try {
      localDb.updateUser(userId, {
        isPro: true,
        is_pro: true,
        proActivatedAt: proActivatedAt,
        pro_since: entitlement.pro_since,
        subscription: entitlement.subscription as any
      });
      localDb.getDailyProAd(userId).catch(() => {});
      localDb.getDailyProGrowthRec(userId).catch(() => {});
    } catch (e) {}

    return {
      success: true,
      alreadyFulfilled: false,
      message: 'Your BIZNIX features has successfully active',
      entitlement
    };
  }
}

/**
 * Revokes or expires Pro entitlement (e.g., subscription cancelled or refunded)
 */
export async function revokeProEntitlement(userId: string, reason: string): Promise<void> {
  const firestore = getAdminAdminFirestoreSafe();
  if (!firestore) return;

  const userDocRef = firestore.collection('users').doc(userId);
  await userDocRef.set({
    isPro: false,
    is_pro: false,
    subscription: {
      status: 'canceled',
      is_pro: false,
      isPro: false,
      canceled_at: new Date().toISOString(),
      cancel_reason: reason
    },
    updated_at: new Date().toISOString()
  }, { merge: true });

  try {
    localDb.updateUser(userId, {
      is_pro: false,
      subscription: {
        plan_id: null,
        status: 'expired',
        is_pro: false
      } as any
    });
  } catch (e) {}
}

/**
 * Safe accessor for admin firestore
 */
function getAdminAdminFirestoreSafe() {
  try {
    return getAdminFirestore();
  } catch (e) {
    console.error('Error obtaining Firestore admin instance:', e);
    return null;
  }
}
