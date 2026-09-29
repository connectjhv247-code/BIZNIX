import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendEmailVerification as fbSendEmailVerification,
  sendPasswordResetEmail as fbSendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { 
  UserProfile, 
  GeneratedLogo, 
  GeneratedAdvertisement, 
  ProjectItem,
  UserSubscription
} from '../types';

export interface RegisterParams {
  name: string;
  email: string;
  password: string;
  phone?: string;
  business_name?: string;
  business_category?: string;
  profile_image?: string;
}

// ----------------------------------------------------
// AUTHENTICATION SERVICES
// ----------------------------------------------------

/**
 * Register a real user with Firebase Authentication and initialize their Firestore profile.
 * Automatically triggers a real Firebase email-verification message.
 */
export async function registerFirebaseUser(params: RegisterParams): Promise<{ firebaseUser: FirebaseUser; profile: UserProfile }> {
  const userCredential = await createUserWithEmailAndPassword(auth, params.email.trim(), params.password);
  const fbUser = userCredential.user;

  // Send real email verification
  try {
    await fbSendEmailVerification(fbUser);
  } catch (err) {
    console.warn('Could not send email verification immediately:', err);
  }

  const initialProfile: UserProfile = {
    id: fbUser.uid,
    name: params.name.trim(),
    email: params.email.trim(),
    phone: params.phone?.trim() || '+1 (555) 000-0000',
    business_name: params.business_name?.trim() || `${params.name.trim()}'s Business`,
    business_category: params.business_category?.trim() || 'Creative Design & Tech',
    profile_image: params.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    is_pro: false,
    created_at: new Date().toISOString(),
  };

  // Persist user document in Firestore: users/{uid}
  const userDocRef = doc(db, 'users', fbUser.uid);
  await setDoc(userDocRef, {
    ...initialProfile,
    authProvider: 'password',
    emailVerified: fbUser.emailVerified,
    updated_at: new Date().toISOString()
  });

  return { firebaseUser: fbUser, profile: initialProfile };
}

/**
 * Sign in with Firebase Authentication email and password.
 */
export async function loginFirebaseUser(email: string, password: string): Promise<{ firebaseUser: FirebaseUser; profile: UserProfile }> {
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const fbUser = userCredential.user;

  // Retrieve user document from Firestore
  const userDocRef = doc(db, 'users', fbUser.uid);
  const userDocSnap = await getDoc(userDocRef);

  let profile: UserProfile;
  if (userDocSnap.exists()) {
    profile = userDocSnap.data() as UserProfile;
    // ensure id matches uid
    profile.id = fbUser.uid;
  } else {
    // Fallback if profile document was missing
    const username = (fbUser.email || 'user').split('@')[0];
    profile = {
      id: fbUser.uid,
      name: fbUser.displayName || (username.charAt(0).toUpperCase() + username.slice(1)),
      email: fbUser.email || email.trim(),
      phone: '+1 (555) 000-0000',
      business_name: `${username}'s Business`,
      business_category: 'Creative Design & Tech',
      profile_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      is_pro: false,
      created_at: new Date().toISOString()
    };
    await setDoc(userDocRef, profile);
  }

  return { firebaseUser: fbUser, profile };
}

/**
 * Sign out of Firebase Authentication
 */
export async function logoutFirebaseUser(): Promise<void> {
  await fbSignOut(auth);
}

/**
 * Send real Firebase Password Reset Email
 */
export async function sendPasswordReset(email: string): Promise<void> {
  await fbSendPasswordResetEmail(auth, email.trim());
}

/**
 * Resend Email Verification to currently logged in Firebase user
 */
export async function resendEmailVerification(): Promise<void> {
  if (auth.currentUser) {
    await fbSendEmailVerification(auth.currentUser);
  } else {
    throw new Error('No user is currently signed in to resend verification.');
  }
}

/**
 * Reload current Firebase user to check verification status
 */
export async function checkEmailVerified(): Promise<boolean> {
  if (auth.currentUser) {
    await auth.currentUser.reload();
    return auth.currentUser.emailVerified;
  }
  return false;
}

// ----------------------------------------------------
// FIRESTORE USER DATA & PERSISTENCE SERVICES
// ----------------------------------------------------

/**
 * Fetch user profile from Firestore by UID
 */
export async function getFirestoreUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.error('Error getting user profile from Firestore:', err);
    return null;
  }
}

/**
 * Update user profile in Firestore
 */
export async function updateFirestoreUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  const userDocRef = doc(db, 'users', uid);
  await setDoc(userDocRef, {
    ...updates,
    id: uid,
    updated_at: new Date().toISOString()
  }, { merge: true });
}

// ----------------------------------------------------
// USER LOGOS (users/{uid}/logos/{logoId})
// ----------------------------------------------------

export async function getFirestoreLogos(uid: string): Promise<GeneratedLogo[]> {
  try {
    const logosRef = collection(db, 'users', uid, 'logos');
    const q = query(logosRef, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      user_id: uid
    })) as GeneratedLogo[];
  } catch (err) {
    // If index isn't ready or order fails, fallback to simple getDocs
    try {
      const logosRef = collection(db, 'users', uid, 'logos');
      const snapshot = await getDocs(logosRef);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        user_id: uid
      })) as GeneratedLogo[];
    } catch {
      return [];
    }
  }
}

export async function saveFirestoreLogo(uid: string, logo: Partial<GeneratedLogo>): Promise<GeneratedLogo> {
  const logoId = logo.id || `logo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const logoDocRef = doc(db, 'users', uid, 'logos', logoId);
  
  const payload: GeneratedLogo = {
    id: logoId,
    user_id: uid,
    business_name: logo.business_name || 'Business',
    slogan: logo.slogan || '',
    category: logo.category || 'General',
    style: logo.style || 'Modern',
    colors: logo.colors || ['#F59E0B', '#0F172A'],
    svg_code: logo.svg_code || '',
    description: logo.description || '',
    font_style: logo.font_style || 'Sans-Serif Bold',
    icon_name: logo.icon_name || 'Brand Mark',
    created_at: logo.created_at || new Date().toISOString(),
    is_favorite: !!logo.is_favorite
  };

  await setDoc(logoDocRef, payload, { merge: true });
  return payload;
}

export async function deleteFirestoreLogo(uid: string, logoId: string): Promise<void> {
  const logoDocRef = doc(db, 'users', uid, 'logos', logoId);
  await deleteDoc(logoDocRef);
}

// ----------------------------------------------------
// USER ADVERTISEMENTS (users/{uid}/advertisements/{adId})
// ----------------------------------------------------

export async function getFirestoreAds(uid: string): Promise<GeneratedAdvertisement[]> {
  try {
    const adsRef = collection(db, 'users', uid, 'advertisements');
    const q = query(adsRef, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      user_id: uid
    })) as GeneratedAdvertisement[];
  } catch (err) {
    try {
      const adsRef = collection(db, 'users', uid, 'advertisements');
      const snapshot = await getDocs(adsRef);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        user_id: uid
      })) as GeneratedAdvertisement[];
    } catch {
      return [];
    }
  }
}

export async function saveFirestoreAd(uid: string, ad: Partial<GeneratedAdvertisement>): Promise<GeneratedAdvertisement> {
  const adId = ad.id || `ad_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const adDocRef = doc(db, 'users', uid, 'advertisements', adId);

  const payload: GeneratedAdvertisement = {
    id: adId,
    user_id: uid,
    type: ad.type || 'Business Advertisement',
    platform: ad.platform,
    title: ad.title || 'Campaign Ad',
    headline: ad.headline || '',
    body_text: ad.body_text || '',
    call_to_action: ad.call_to_action || 'Contact Us',
    hashtags: ad.hashtags || [],
    target_audience_tips: ad.target_audience_tips || '',
    special_offer: ad.special_offer || '',
    price: ad.price || '',
    contact_info: ad.contact_info || '',
    style: ad.style || 'Modern',
    image_prompt: ad.image_prompt || '',
    flyer_layout: ad.flyer_layout,
    created_at: ad.created_at || new Date().toISOString()
  };

  await setDoc(adDocRef, payload, { merge: true });
  return payload;
}

// ----------------------------------------------------
// USER PROJECTS & GROWTH DOCS (users/{uid}/projects/{projId})
// ----------------------------------------------------

export async function getFirestoreProjects(uid: string): Promise<ProjectItem[]> {
  try {
    const projRef = collection(db, 'users', uid, 'projects');
    const q = query(projRef, orderBy('updated_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      user_id: uid
    })) as ProjectItem[];
  } catch (err) {
    try {
      const projRef = collection(db, 'users', uid, 'projects');
      const snapshot = await getDocs(projRef);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        user_id: uid
      })) as ProjectItem[];
    } catch {
      return [];
    }
  }
}

export async function saveFirestoreProject(uid: string, proj: Partial<ProjectItem>): Promise<ProjectItem> {
  const projId = proj.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const projDocRef = doc(db, 'users', uid, 'projects', projId);

  const payload: ProjectItem = {
    id: projId,
    user_id: uid,
    project_type: proj.project_type || 'growth_doc',
    title: proj.title || 'Untitled Business Project',
    content: proj.content || '',
    meta: proj.meta || {},
    created_at: proj.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  await setDoc(projDocRef, payload, { merge: true });
  return payload;
}

export async function deleteFirestoreProject(uid: string, projId: string): Promise<void> {
  const projDocRef = doc(db, 'users', uid, 'projects', projId);
  await deleteDoc(projDocRef);
}
