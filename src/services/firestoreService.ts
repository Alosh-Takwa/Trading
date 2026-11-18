/**
 * Firebase Firestore Integration Service for SinoTrack ERP
 * Handles cloud persistence for suppliers, products, orders, invoices, and catalog files.
 * Adheres strictly to the firebase-integration-rpc architectural pattern.
 */

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  collection,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import { app, auth } from './authService';
import firebaseConfig from '../../firebase-applet-config.json';
import { DatabaseState } from './storage';
import { Supplier, SupplierCatalog, Product } from '../types/erp';
import { sanitizeForFirestore, buildMasterStateFirestorePayload } from '../utils/firestoreSanitizer';

// Initialize Firestore with the exact database ID from config
export const db: Firestore = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Quota and error tracking
let isFirestoreQuotaExhausted = false;
let lastFirestoreError: string | null = null;

export function isCloudQuotaExhausted(): boolean {
  return isFirestoreQuotaExhausted;
}

export function getLastFirestoreError(): string | null {
  return lastFirestoreError;
}

function isQuotaError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('resource-exhausted') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Free daily write units') ||
    msg.includes('quota')
  );
}

function isPermissionError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions');
}

/**
 * Validates connection to Firestore at app initialization
 */
export async function testConnection(): Promise<boolean> {
  if (isFirestoreQuotaExhausted) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firestore] Live connection verified successfully.');
    return true;
  } catch (error) {
    if (isQuotaError(error)) {
      isFirestoreQuotaExhausted = true;
      console.warn('[Firestore] Free daily write quota reached. Local persistence and server DB active.');
      return false;
    }
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firestore] Client is offline. Using local persistence cache.');
    } else {
      console.warn('[Firestore] testConnection note:', error);
    }
    return false;
  }
}

// Initial connection verification
if (typeof window !== 'undefined') {
  testConnection().catch(() => {});
}

/**
 * Saves full ERP master state snapshot to Firestore
 */
export async function saveMasterStateToFirestore(data: DatabaseState): Promise<boolean> {
  if (isFirestoreQuotaExhausted) {
    lastFirestoreError = 'Firestore daily write quota exceeded';
    return false;
  }

  const path = 'system/master_state';
  try {
    const payload = buildMasterStateFirestorePayload(data);
    await setDoc(doc(db, 'system', 'master_state'), payload, { merge: true });
    lastFirestoreError = null;
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    lastFirestoreError = msg;
    if (isQuotaError(error)) {
      if (!isFirestoreQuotaExhausted) {
        isFirestoreQuotaExhausted = true;
        console.warn('[Firestore] Free daily write quota reached. Seamlessly relying on server file database & local storage.');
      }
      return false;
    }
    if (isPermissionError(error)) {
      try {
        handleFirestoreError(error, OperationType.WRITE, path);
      } catch {
        // Logged structured FirestoreErrorInfo
      }
      return false;
    }
    console.warn('[Firestore] Failed to save master state to cloud:', error);
    return false;
  }
}

/**
 * Fetches ERP master state snapshot from Firestore
 */
export async function fetchMasterStateFromFirestore(): Promise<Partial<DatabaseState> | null> {
  const path = 'system/master_state';
  try {
    const docRef = doc(db, 'system', 'master_state');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Partial<DatabaseState>;
    }
    return null;
  } catch (error) {
    if (isQuotaError(error)) {
      isFirestoreQuotaExhausted = true;
      return null;
    }
    console.warn('[Firestore] Failed to fetch master state from cloud:', error);
    return null;
  }
}

/**
 * Saves or updates a single supplier in Firestore
 */
export async function saveSupplierToFirestore(supplier: Supplier): Promise<boolean> {
  if (isFirestoreQuotaExhausted) return false;
  const path = `suppliers/${supplier.id}`;
  try {
    const cleanSupplier = sanitizeForFirestore(supplier);
    await setDoc(doc(db, 'suppliers', supplier.id), cleanSupplier, { merge: true });
    return true;
  } catch (error) {
    if (isQuotaError(error)) {
      isFirestoreQuotaExhausted = true;
      return false;
    }
    if (isPermissionError(error)) {
      try {
        handleFirestoreError(error, OperationType.WRITE, path);
      } catch {
        // Logged structured FirestoreErrorInfo
      }
      return false;
    }
    console.warn(`[Firestore] Failed to save supplier ${supplier.id}:`, error);
    return false;
  }
}

/**
 * Saves or updates a single product in Firestore
 */
export async function saveProductToFirestore(product: Product): Promise<boolean> {
  if (isFirestoreQuotaExhausted) return false;
  const path = `products/${product.id}`;
  try {
    const cleanProduct = sanitizeForFirestore(product);
    await setDoc(doc(db, 'products', product.id), cleanProduct, { merge: true });
    return true;
  } catch (error) {
    if (isQuotaError(error)) {
      isFirestoreQuotaExhausted = true;
      return false;
    }
    if (isPermissionError(error)) {
      try {
        handleFirestoreError(error, OperationType.WRITE, path);
      } catch {
        // Logged structured FirestoreErrorInfo
      }
      return false;
    }
    console.warn(`[Firestore] Failed to save product ${product.id}:`, error);
    return false;
  }
}

/**
 * Saves a product catalog record to Firestore
 * Links Google Drive file URL and metadata to Firestore database
 */
export async function saveCatalogToFirestore(catalog: SupplierCatalog): Promise<boolean> {
  if (isFirestoreQuotaExhausted) return false;
  const path = `catalogs/${catalog.id}`;
  try {
    const cleanCatalog = sanitizeForFirestore(catalog);
    await setDoc(doc(db, 'catalogs', catalog.id), cleanCatalog, { merge: true });
    return true;
  } catch (error) {
    if (isQuotaError(error)) {
      isFirestoreQuotaExhausted = true;
      return false;
    }
    if (isPermissionError(error)) {
      try {
        handleFirestoreError(error, OperationType.WRITE, path);
      } catch {
        // Logged structured FirestoreErrorInfo
      }
      return false;
    }
    console.warn(`[Firestore] Failed to save catalog ${catalog.id}:`, error);
    return false;
  }
}

/**
 * Subscribes to real-time changes of the master state in Firestore
 */
export function subscribeToMasterFirestore(
  onUpdate: (data: Partial<DatabaseState>) => void
): () => void {
  const path = 'system/master_state';
  try {
    const docRef = doc(db, 'system', 'master_state');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data() as Partial<DatabaseState>);
        }
      },
      (error) => {
        if (isQuotaError(error)) {
          isFirestoreQuotaExhausted = true;
          return;
        }
        console.warn('[Firestore] Real-time subscription error:', error);
      }
    );
  } catch (err) {
    if (isQuotaError(err)) {
      isFirestoreQuotaExhausted = true;
      return () => {};
    }
    console.warn('[Firestore] Subscription init error:', err);
    return () => {};
  }
}
