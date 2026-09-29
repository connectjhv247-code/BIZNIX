import { Router, Request, Response } from 'express';
import { db } from './db';
import { 
  generateLogoConcepts, 
  generateChatResponse, 
  generateAdvertisement, 
  generateGrowthToolOutput 
} from './gemini';
import { GeneratedLogo, GeneratedAdvertisement, ProjectItem, UserProfile } from '../src/types';
import { 
  verifyPaystackTransaction, 
  findLatestSuccessfulTransactionByEmail,
  verifyPaystackWebhookSignature, 
  getPaystackSecretKey,
  TARGET_PLAN_CODE,
  TARGET_PLAN_CODE_ALT
} from './paystack';
import { 
  verifyUserToken, 
  fulfillPaystackEntitlement, 
  revokeProEntitlement, 
  getAdminFirestore,
  getAdminAuth
} from './firebaseAdmin';

export const apiRouter = Router();

// Helper to extract authenticated user from Authorization header or body
async function getAuthenticatedUser(req: Request): Promise<{ uid: string; email?: string } | null> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      const decoded = await verifyUserToken(token);
      if (decoded?.uid) return decoded;
    }
  }

  // Fallback: check custom headers or body
  const customUid = (req.headers['x-user-id'] as string) || (req.body?.userId as string);
  const customEmail = (req.headers['x-user-email'] as string) || (req.body?.userEmail as string);
  if (customUid) {
    return { uid: customUid, email: customEmail };
  }

  return null;
}

// Health Check
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', app: 'BIZNIX', timestamp: new Date().toISOString() });
});

// ----------------------------------------------------
// USER ENDPOINTS
// ----------------------------------------------------
apiRouter.get('/user', (req: Request, res: Response) => {
  const user = db.getUser('user_default_1');
  res.json({ success: true, user });
});

apiRouter.post('/user', (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const updated = db.updateUser('user_default_1', updates);
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// ----------------------------------------------------
// SUBSCRIPTION & GOOGLE PLAY BILLING ENDPOINTS
// ----------------------------------------------------
apiRouter.get('/subscription/plans', (req: Request, res: Response) => {
  const plans = [
    {
      productId: 'biznix_pro_monthly',
      title: 'BIZNIX PRO Monthly',
      formattedPrice: '$9.99',
      priceAmountMicros: 9990000,
      currencyCode: 'USD',
      billingPeriod: 'P1M',
      periodLabel: 'per month',
      description: 'Full monthly access to all BIZNIX Pro AI features, daily ads, and business growth tools.'
    },
    {
      productId: 'biznix_pro_yearly',
      title: 'BIZNIX PRO Yearly',
      formattedPrice: '$79.99',
      priceAmountMicros: 79990000,
      currencyCode: 'USD',
      billingPeriod: 'P1Y',
      periodLabel: 'per year',
      savingsBadge: 'SAVE 35%',
      description: 'Best Value! Full year of daily automatic ads, unlimited growth recommendations, and 500 projects storage.'
    }
  ];
  res.json({ success: true, plans });
});

apiRouter.get('/subscription/status', async (req: Request, res: Response) => {
  try {
    const userAuth = await getAuthenticatedUser(req);
    const targetUid = userAuth?.uid || 'user_default_1';
    
    // Check real Firestore user document for Pro status
    let isProUser = false;
    let subscriptionData = null;
    let userRecord = db.getUser(targetUid);

    try {
      const firestore = getAdminFirestore();
      const userDocSnap = await firestore.collection('users').doc(targetUid).get();
      if (userDocSnap.exists) {
        const firestoreData = userDocSnap.data();
        if (firestoreData?.is_pro) {
          isProUser = true;
          subscriptionData = firestoreData.subscription || {
            plan_id: 'biznix_pro_paystack',
            status: 'active',
            is_pro: true
          };
          // Sync with local memory
          if (userRecord) {
            userRecord.is_pro = true;
            userRecord.subscription = subscriptionData;
          }
        }
      }
    } catch (e) {
      // Fallback to local memory if Firestore network issue
      isProUser = !!userRecord?.is_pro;
      subscriptionData = userRecord?.subscription;
    }

    const quota = db.getUsageQuota(targetUid);
    
    // If user is Pro, get or generate today's Pro daily ad and growth recommendation
    let dailyAd = null;
    let dailyGrowth = null;

    if (isProUser) {
      dailyAd = await db.getDailyProAd(targetUid);
      dailyGrowth = await db.getDailyProGrowthRec(targetUid);
    }

    res.json({
      success: true,
      user: userRecord,
      is_pro: isProUser,
      subscription: subscriptionData,
      quota,
      dailyAd,
      dailyGrowth
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch subscription status.' });
  }
});

// ----------------------------------------------------
// REAL PAYSTACK PAYMENT ENDPOINTS
// ----------------------------------------------------

/**
 * Check if Paystack Secret Key is configured on the backend
 */
apiRouter.get('/paystack/config', (req: Request, res: Response) => {
  const isKeyConfigured = !!getPaystackSecretKey();
  res.json({
    configured: isKeyConfigured,
    paymentUrl: 'https://paystack.shop/pay/BIZNIX_pro',
    plan: TARGET_PLAN_CODE,
    channel: 'paystack_payment_page'
  });
});

/**
 * Creates/associates a Paystack checkout session for the authenticated user
 */
apiRouter.post('/paystack/create-session', async (req: Request, res: Response) => {
  try {
    const authUser = await getAuthenticatedUser(req);
    const userEmail = authUser?.email || req.body?.email || '';
    const paymentUrl = 'https://paystack.shop/pay/BIZNIX_pro';

    // Pre-fill user email in Paystack query params if available
    const checkoutUrl = userEmail
      ? `${paymentUrl}?email=${encodeURIComponent(userEmail.trim())}`
      : paymentUrl;

    res.json({
      success: true,
      paymentUrl,
      checkoutUrl,
      userId: authUser?.uid || null
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Could not initiate Paystack payment session.' });
  }
});

/**
 * Real Server-Side Paystack Transaction Verification
 * Verifies with Paystack official API, checks plan code PLN_lt9i01y8njw0316,
 * sets /users/{uid}/isPro = true and /users/{uid}/proActivatedAt = Date.now(),
 * and returns "Your BIZNIX features has successfully active".
 * Accessible via both /api/paystack/verify and /api/verifyPaystack.
 */
async function handlePaystackVerification(req: Request, res: Response) {
  try {
    const { reference, email, idToken, userId, userEmail } = req.body;
    const queryInput = (reference || email || '').trim();

    if (!queryInput) {
      return res.status(400).json({
        success: false,
        is_pro: false,
        isPro: false,
        message: 'A valid Paystack transaction reference or payment email is required.'
      });
    }

    // 1. Identify the authenticated Firebase user
    let user = await getAuthenticatedUser(req);
    if (!user && idToken) {
      user = await verifyUserToken(idToken);
    }
    if (!user && userId) {
      user = { uid: userId, email: userEmail || (queryInput.includes('@') ? queryInput : undefined) };
    }

    // 1b. If called from HTTPS bridge page (e.g. Netlify) with email, look up or attach user profile
    if (!user && (email || userEmail || (queryInput.includes('@') ? queryInput : ''))) {
      const targetEmail = (email || userEmail || (queryInput.includes('@') ? queryInput : '')).trim().toLowerCase();
      try {
        const adminAuth = getAdminAuth();
        const fbUser = await adminAuth.getUserByEmail(targetEmail);
        if (fbUser) {
          user = { uid: fbUser.uid, email: fbUser.email };
        }
      } catch (e) {}

      if (!user) {
        const localUsers = (db as any).getUsers?.() || [];
        const found = localUsers.find((u: any) => u.email?.toLowerCase() === targetEmail);
        if (found) {
          user = { uid: found.id, email: found.email };
        } else {
          user = { uid: `user_${targetEmail.replace(/[^a-zA-Z0-9]/g, '_')}`, email: targetEmail };
        }
      }
    }

    if (!user || !user.uid) {
      return res.status(401).json({
        success: false,
        is_pro: false,
        isPro: false,
        message: 'Authentication required. Please sign in with your BIZNIX account before verifying payment.'
      });
    }

    // 2. Verify the transaction server-side (by email or by reference)
    let verifyResult;
    if (queryInput.includes('@')) {
      verifyResult = await findLatestSuccessfulTransactionByEmail(queryInput);
    } else {
      verifyResult = await verifyPaystackTransaction(queryInput);
    }

    if (!verifyResult.verified || !verifyResult.data) {
      return res.status(400).json({
        success: false,
        is_pro: false,
        isPro: false,
        message: verifyResult.message || 'Payment verification failed with Paystack.',
        error: verifyResult.error
      });
    }

    const txData = verifyResult.data;

    // 3. Confirm transaction status is successful
    if (txData.status !== 'success') {
      return res.status(400).json({
        success: false,
        is_pro: false,
        isPro: false,
        message: `Transaction status is '${txData.status}'. Payment is incomplete or unverified.`,
        error: 'TRANSACTION_NOT_SUCCESS'
      });
    }

    // 4. Confirm plan matches PLN_lt9i01y8njw0316
    let txPlanCode: string | null = null;
    if (typeof txData.plan === 'string') {
      txPlanCode = txData.plan.trim();
    } else if (txData.plan && typeof txData.plan === 'object' && (txData.plan as any).plan_code) {
      txPlanCode = (txData.plan as any).plan_code.trim();
    } else if (txData.plan_object && txData.plan_object.plan_code) {
      txPlanCode = txData.plan_object.plan_code.trim();
    } else if ((txData as any).metadata?.plan) {
      txPlanCode = String((txData as any).metadata.plan).trim();
    } else if ((txData as any).metadata?.plan_code) {
      txPlanCode = String((txData as any).metadata.plan_code).trim();
    }

    if (txPlanCode) {
      const cleanPlan = txPlanCode.toLowerCase();
      const isTargetPlan = cleanPlan === TARGET_PLAN_CODE.toLowerCase() || 
                           cleanPlan === TARGET_PLAN_CODE_ALT.toLowerCase() ||
                           cleanPlan.includes('lt9i01y8njw0316') ||
                           cleanPlan.includes('lt9l0iy8mjw0316');
      if (!isTargetPlan) {
        return res.status(400).json({
          success: false,
          is_pro: false,
          isPro: false,
          message: `Plan mismatch: transaction plan '${txPlanCode}' does not match required plan ${TARGET_PLAN_CODE}.`,
          error: 'PLAN_MISMATCH'
        });
      }
    }

    // 5. Confirm transaction amount/currency are valid
    if (typeof txData.amount !== 'number' || txData.amount <= 0) {
      return res.status(400).json({
        success: false,
        is_pro: false,
        isPro: false,
        message: 'Invalid transaction amount detected.',
        error: 'INVALID_AMOUNT'
      });
    }

    // 6. Atomic fulfillment & Pro entitlement grant in Firestore
    // Sets /users/{uid}/isPro = true and /users/{uid}/proActivatedAt = Date.now()
    const fulfillment = await fulfillPaystackEntitlement(user.uid, txData);

    return res.json({
      success: true,
      is_pro: true,
      isPro: true,
      proActivatedAt: fulfillment.entitlement?.proActivatedAt,
      alreadyFulfilled: fulfillment.alreadyFulfilled,
      message: 'Your BIZNIX features has successfully active',
      subscription: fulfillment.entitlement?.subscription,
      paystack: {
        reference: txData.reference,
        amount: txData.amount,
        currency: txData.currency,
        paid_at: txData.paid_at
      }
    });
  } catch (err: any) {
    console.error('Paystack verification controller error:', err);
    return res.status(500).json({
      success: false,
      is_pro: false,
      isPro: false,
      message: err?.message || 'Server error while verifying Paystack transaction.'
    });
  }
}

apiRouter.post('/paystack/verify', handlePaystackVerification);
apiRouter.post('/verifyPaystack', handlePaystackVerification);

/**
 * Paystack Webhook Handler
 * Verifies HMAC-SHA512 signature and processes charge.success & subscription lifecycle events
 */
apiRouter.post('/paystack/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    if (!signature || !verifyPaystackWebhookSignature(rawBody, signature)) {
      console.warn('Paystack webhook signature verification failed.');
      return res.status(401).json({ message: 'Invalid webhook signature.' });
    }

    const event = req.body;
    console.log(`Paystack webhook event received: ${event?.event}`);

    if (event?.event === 'charge.success') {
      const data = event.data;
      const reference = data?.reference;
      const metadata = data?.metadata || {};
      const customerEmail = data?.customer?.email;

      let targetUserId = metadata?.userId || metadata?.user_id;

      if (!targetUserId && customerEmail) {
        try {
          const firestore = getAdminFirestore();
          const snap = await firestore.collection('users').where('email', '==', customerEmail).limit(1).get();
          if (!snap.empty) {
            targetUserId = snap.docs[0].id;
          }
        } catch (e) {}
      }

      if (targetUserId && reference) {
        await fulfillPaystackEntitlement(targetUserId, data);
        console.log(`Fulfilled Pro entitlement via webhook for user ${targetUserId}, ref ${reference}`);
      }
    } else if (
      event?.event === 'subscription.disable' ||
      event?.event === 'subscription.not_renew' ||
      event?.event === 'invoice.payment_failed'
    ) {
      const customerEmail = event.data?.customer?.email;
      if (customerEmail) {
        try {
          const firestore = getAdminFirestore();
          const snap = await firestore.collection('users').where('email', '==', customerEmail).limit(1).get();
          if (!snap.empty) {
            await revokeProEntitlement(snap.docs[0].id, event.event);
            console.log(`Revoked Pro entitlement via webhook for user ${snap.docs[0].id}`);
          }
        } catch (e) {}
      }
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Error handling Paystack webhook:', err);
    return res.status(500).json({ message: 'Webhook processing error.' });
  }
});

// Explicitly reject simulated Google Play purchases
apiRouter.post('/subscription/verify-purchase', (req: Request, res: Response) => {
  return res.status(400).json({
    success: false,
    message: 'Simulation disabled. Real BIZNIX Pro subscriptions are verified securely via Paystack (/api/paystack/verify).'
  });
});

apiRouter.post('/subscription/restore', async (req: Request, res: Response) => {
  try {
    const authUser = await getAuthenticatedUser(req);
    const targetUid = authUser?.uid || 'user_default_1';

    // Check Firestore for user's Pro status
    const firestore = getAdminFirestore();
    const userDocSnap = await firestore.collection('users').doc(targetUid).get();
    
    if (userDocSnap.exists && userDocSnap.data()?.is_pro) {
      const data = userDocSnap.data();
      return res.json({
        success: true,
        is_pro: true,
        subscription: data?.subscription,
        message: 'Your active BIZNIX Pro entitlement was confirmed from Firestore!'
      });
    }

    return res.status(404).json({
      success: false,
      is_pro: false,
      message: 'No active paid entitlement found for this account. Upgrade to BIZNIX Pro with Paystack to unlock.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to restore purchases.' });
  }
});

apiRouter.post('/subscription/cancel', async (req: Request, res: Response) => {
  try {
    const authUser = await getAuthenticatedUser(req);
    const targetUid = authUser?.uid || 'user_default_1';

    await revokeProEntitlement(targetUid, 'user_requested_cancel');
    res.json({
      success: true,
      message: 'Subscription auto-renew canceled. Pro features will remain until your current billing period ends.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to cancel subscription.' });
  }
});

// ----------------------------------------------------
// PRO AUTOMATIC DAILY FEATURES ENDPOINTS
// ----------------------------------------------------
apiRouter.get('/pro/daily-ad', async (req: Request, res: Response) => {
  try {
    const user = db.getUser('user_default_1');
    if (!user?.is_pro) {
      return res.status(403).json({ success: false, message: 'Daily Automatic Advertisement is a BIZNIX Pro feature.' });
    }

    const dailyAd = await db.getDailyProAd('user_default_1');
    res.json({ success: true, dailyAd });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not generate or retrieve today\'s daily ad.' });
  }
});

apiRouter.post('/pro/daily-ad/regenerate', async (req: Request, res: Response) => {
  try {
    const user = db.getUser('user_default_1');
    if (!user?.is_pro) {
      return res.status(403).json({ success: false, message: 'BIZNIX Pro is required to regenerate daily ads.' });
    }

    const dailyAd = await db.getDailyProAd('user_default_1', true);
    res.json({ success: true, dailyAd, message: 'Fresh daily advertisement generated!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not regenerate daily ad.' });
  }
});

apiRouter.get('/pro/daily-growth', async (req: Request, res: Response) => {
  try {
    const user = db.getUser('user_default_1');
    if (!user?.is_pro) {
      return res.status(403).json({ success: false, message: 'Daily AI Business Growth Recommendations are exclusive to BIZNIX Pro.' });
    }

    const dailyGrowth = await db.getDailyProGrowthRec('user_default_1');
    res.json({ success: true, dailyGrowth });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch today\'s growth recommendation.' });
  }
});

apiRouter.post('/pro/daily-growth/dismiss', (req: Request, res: Response) => {
  try {
    const success = db.dismissDailyGrowthRec('user_default_1', req.body.date);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ----------------------------------------------------
// 1. LOGO GENERATION & MANAGEMENT
// ----------------------------------------------------
apiRouter.post('/logo/generate', async (req: Request, res: Response) => {
  try {
    const { businessName, category, description, style, colors, slogan, isPro } = req.body;
    if (!businessName) {
      return res.status(400).json({ success: false, message: 'Business name is required.' });
    }

    // Check quota server-side
    const check = db.canGenerateLogo('user_default_1');
    if (!check.allowed) {
      return res.status(403).json({ success: false, message: check.message, quotaExceeded: true });
    }

    const concepts = await generateLogoConcepts({
      businessName,
      category: category || 'Business',
      description,
      style: style || 'Modern',
      colors: colors || [],
      slogan,
      isPro: !!isPro
    });

    // Record usage count
    db.recordUsage('user_default_1', 'logo');
    const updatedQuota = db.getUsageQuota('user_default_1');

    res.json({ success: true, concepts, quota: updatedQuota });
  } catch (err) {
    console.error('Logo generation error:', err);
    res.status(500).json({ success: false, message: 'Unable to generate your logo. Please try again.' });
  }
});

apiRouter.get('/logos', (req: Request, res: Response) => {
  const logos = db.getLogos('user_default_1');
  res.json({ success: true, logos });
});

apiRouter.post('/logos/save', (req: Request, res: Response) => {
  try {
    const logoData: GeneratedLogo = {
      id: req.body.id || `logo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      user_id: 'user_default_1',
      business_name: req.body.business_name || 'My Business',
      slogan: req.body.slogan || '',
      category: req.body.category || 'General',
      style: req.body.style || 'Modern',
      colors: req.body.colors || ['#6366f1'],
      svg_code: req.body.svg_code,
      description: req.body.description || '',
      font_style: req.body.font_style || 'Space Grotesk',
      icon_name: req.body.icon_name || 'sparkles',
      created_at: req.body.created_at || new Date().toISOString(),
      is_favorite: !!req.body.is_favorite
    };

    const saved = db.saveLogo(logoData);
    res.json({ success: true, logo: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Unable to save logo. Please try again.' });
  }
});

apiRouter.delete('/logos/:id', (req: Request, res: Response) => {
  const success = db.deleteLogo(req.params.id);
  res.json({ success });
});

// ----------------------------------------------------
// 2. BIZNIX AI ASSISTANT CHAT
// ----------------------------------------------------
apiRouter.post('/chat/message', async (req: Request, res: Response) => {
  try {
    const { messages, conversationId, userContext } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'Messages array is required.' });
    }

    // Check quota server-side
    const check = db.canSendChatMessage('user_default_1');
    if (!check.allowed) {
      return res.status(403).json({ success: false, message: check.message, quotaExceeded: true });
    }

    const aiReply = await generateChatResponse({
      messages,
      userContext
    });

    // Record usage
    db.recordUsage('user_default_1', 'chat');
    const updatedQuota = db.getUsageQuota('user_default_1');

    // Save message to conversation history
    const convId = conversationId || 'conv_default';
    const lastUserMsg = messages[messages.length - 1];

    if (lastUserMsg && lastUserMsg.role === 'user') {
      db.saveMessage({
        id: `msg_u_${Date.now()}`,
        conversation_id: convId,
        role: 'user',
        message: lastUserMsg.content,
        created_at: new Date().toISOString()
      });
    }

    db.saveMessage({
      id: `msg_m_${Date.now()}`,
      conversation_id: convId,
      role: 'model',
      message: aiReply,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, reply: aiReply, quota: updatedQuota });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ success: false, message: 'AI Assistant is temporarily unavailable.' });
  }
});

apiRouter.get('/chat/conversations', (req: Request, res: Response) => {
  const convs = db.getConversations('user_default_1');
  res.json({ success: true, conversations: convs });
});

apiRouter.get('/chat/messages/:convId', (req: Request, res: Response) => {
  const msgs = db.getMessages(req.params.convId);
  res.json({ success: true, messages: msgs });
});

apiRouter.post('/chat/clear', (req: Request, res: Response) => {
  const { conversationId } = req.body;
  db.clearConversation(conversationId || 'conv_default');
  res.json({ success: true });
});

// ----------------------------------------------------
// 3. ADVERTISEMENT STUDIO
// ----------------------------------------------------
apiRouter.post('/ad/generate', async (req: Request, res: Response) => {
  try {
    const { 
      type, 
      businessName, 
      productService, 
      description, 
      targetAudience, 
      location, 
      price, 
      specialOffer, 
      contactInfo, 
      style, 
      platform 
    } = req.body;

    if (!businessName || !productService) {
      return res.status(400).json({ success: false, message: 'Business name and product/service are required.' });
    }

    // Check quota server-side
    const check = db.canGenerateAd('user_default_1');
    if (!check.allowed) {
      return res.status(403).json({ success: false, message: check.message, quotaExceeded: true });
    }

    const adResult = await generateAdvertisement({
      type: type || 'Business Advertisement',
      businessName,
      productService,
      description,
      targetAudience,
      location,
      price,
      specialOffer,
      contactInfo,
      style: style || 'Modern',
      platform
    });

    // Record usage
    db.recordUsage('user_default_1', 'ad');
    const updatedQuota = db.getUsageQuota('user_default_1');

    res.json({ success: true, advertisement: adResult, quota: updatedQuota });
  } catch (err) {
    console.error('Ad generation error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

apiRouter.get('/ads', (req: Request, res: Response) => {
  const ads = db.getAds('user_default_1');
  res.json({ success: true, advertisements: ads });
});

apiRouter.post('/ads/save', (req: Request, res: Response) => {
  try {
    const ad: GeneratedAdvertisement = {
      id: req.body.id || `ad_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      user_id: 'user_default_1',
      type: req.body.type || 'Business Advertisement',
      platform: req.body.platform,
      title: req.body.title || req.body.headline || 'Advertisement Project',
      headline: req.body.headline || '',
      body_text: req.body.body_text || req.body.bodyText || '',
      call_to_action: req.body.call_to_action || req.body.callToAction || '',
      hashtags: req.body.hashtags || [],
      special_offer: req.body.special_offer || req.body.specialOfferText,
      price: req.body.price,
      contact_info: req.body.contact_info,
      style: req.body.style || 'Modern',
      image_prompt: req.body.image_prompt || req.body.imagePrompt,
      flyer_layout: req.body.flyer_layout || req.body.flyerLayout,
      created_at: req.body.created_at || new Date().toISOString()
    };

    const saved = db.saveAd(ad);
    res.json({ success: true, advertisement: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Unable to save advertisement. Please try again.' });
  }
});

// ----------------------------------------------------
// 4. BUSINESS GROWTH TOOLS
// ----------------------------------------------------
apiRouter.post('/growth/generate', async (req: Request, res: Response) => {
  try {
    const { toolType, inputs, businessName } = req.body;
    if (!toolType) {
      return res.status(400).json({ success: false, message: 'Tool type is required.' });
    }

    const output = await generateGrowthToolOutput({
      toolType,
      inputs: inputs || {},
      businessName: businessName || 'My Business'
    });

    res.json({ success: true, output });
  } catch (err) {
    console.error('Growth tool generation error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// ----------------------------------------------------
// PROJECTS LIBRARY
// ----------------------------------------------------
apiRouter.get('/projects', (req: Request, res: Response) => {
  const projects = db.getProjects('user_default_1');
  res.json({ success: true, projects });
});

apiRouter.post('/projects/save', (req: Request, res: Response) => {
  try {
    const project: ProjectItem = {
      id: req.body.id || `proj_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      user_id: 'user_default_1',
      project_type: req.body.project_type || 'growth_doc',
      title: req.body.title || 'Untitled Business Project',
      content: typeof req.body.content === 'string' ? req.body.content : JSON.stringify(req.body.content),
      meta: req.body.meta || {},
      created_at: req.body.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const saved = db.saveProject(project);
    res.json({ success: true, project: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Unable to save project.' });
  }
});

apiRouter.delete('/projects/:id', (req: Request, res: Response) => {
  const success = db.deleteProject(req.params.id);
  res.json({ success });
});
