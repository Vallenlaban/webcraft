import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

// This Firebase config is only used to persist admin panel changes.
// It is NOT used for authentication/login/registration.
const firebaseConfig = {
  apiKey: "AIzaSyBElN5bsJV5-gwF2VR6HRUFFqt2yIFlOm0",
  authDomain: "evopixel-store.firebaseapp.com",
  projectId: "evopixel-store",
  storageBucket: "evopixel-store.firebasestorage.app",
  messagingSenderId: "845342254202",
  appId: "1:845342254202:web:f5819fb5dd6a9b5c0bc7c3",
  measurementId: "G-4C7CJY2240",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Top-level document to store admin-managed data.
const adminDocRef = doc(db, "admin", "store");

export type AdminStoreData = {
  categories?: { id: string; name: string }[];
  products?: any[];
  coupons?: any[];
  settings?: Record<string, string>;
};

export async function loadAdminStore(): Promise<AdminStoreData | null> {
  try {
    const snap = await getDoc(adminDocRef);
    if (!snap.exists()) return null;
    return snap.data() as AdminStoreData;
  } catch (err) {
    console.error("Failed to load admin store from Firebase:", err);
    return null;
  }
}

export async function saveAdminStore(
  data: Partial<AdminStoreData>,
): Promise<void> {
  try {
    // Use merge so we don't wipe other admin fields.
    await setDoc(adminDocRef, data, { merge: true });
  } catch (err) {
    console.error("Failed to save admin store to Firebase:", err);
    throw err;
  }
}

export async function updateAdminStoreField<K extends keyof AdminStoreData>(
  field: K,
  value: AdminStoreData[K],
): Promise<void> {
  try {
    await updateDoc(adminDocRef, { [field]: value });
  } catch (err) {
    // If the doc doesn't exist yet, set it.
    if ((err as any)?.code === "not-found") {
      await saveAdminStore({ [field]: value } as any);
      return;
    }
    console.error("Failed to update admin store field in Firebase:", err);
    throw err;
  }
}
