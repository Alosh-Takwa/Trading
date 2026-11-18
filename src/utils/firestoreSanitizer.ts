/**
 * Pure sanitization helpers for Cloud Firestore persistence.
 * Firestore strictly rejects any `undefined` value anywhere inside nested objects or arrays.
 */

export function sanitizeForFirestore<T>(value: T): T {
  if (value === undefined) {
    return undefined as unknown as T;
  }
  if (value === null) {
    return value;
  }
  if (typeof value === 'number') {
    return (Number.isFinite(value) ? value : 0) as unknown as T;
  }
  if (typeof value !== 'object') {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString() as unknown as T;
  }
  if (Array.isArray(value)) {
    const cleaned = value
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item));
    return cleaned as unknown as T;
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (v === undefined) continue;
    const sanitizedVal = sanitizeForFirestore(v);
    if (sanitizedVal !== undefined) {
      out[k] = sanitizedVal;
    }
  }
  return out as T;
}

/**
 * Strips oversized inline binary data URLs from catalog metadata stored inside
 * the master state snapshot so `system/master_state` stays well below Firestore's 1 MiB document limit.
 */
export function stripHeavyCatalogPayloads(catalogs: any[] | undefined): any[] {
  if (!Array.isArray(catalogs)) return [];
  return catalogs.map((cat) => {
    if (!cat || typeof cat !== 'object') return cat;
    const copy = { ...cat };
    if (typeof copy.fileDataUrl === 'string' && copy.fileDataUrl.length > 32768) {
      delete copy.fileDataUrl;
    }
    return copy;
  });
}

export function buildMasterStateFirestorePayload(data: any): Record<string, unknown> {
  const cleanSuppliers = (data?.suppliers || []).map((s: any) => ({
    ...s,
    logo: s.logo || '',
    catalogs: stripHeavyCatalogPayloads(s.catalogs),
  }));

  const cleanProducts = (data?.products || []).map((p: any) => ({
    ...p,
    images: (p.images || []).map((img: any) => ({
      ...img,
      url: img.url || '',
    })),
  }));

  const cleanUsers = (data?.users || []).map((u: any) => ({
    ...u,
    avatar: u.avatar || '',
  }));

  const cleanCurrentUser = data?.currentUser
    ? {
        ...data.currentUser,
        avatar: data.currentUser.avatar || '',
      }
    : null;

  const rawPayload = {
    version: data?.version || 1,
    lastModified: data?.lastModified || Date.now(),
    lastSavedAt: new Date().toISOString(),
    currentUser: cleanCurrentUser,
    users: cleanUsers,
    suppliers: cleanSuppliers,
    products: cleanProducts,
    orders: data?.orders || [],
    invoices: data?.invoices || [],
    payments: data?.payments || [],
    quotations: data?.quotations || [],
    contacts: data?.contacts || [],
    communicationLogs: data?.communicationLogs || [],
    shipments: data?.shipments || [],
    samples: data?.samples || [],
    inspections: data?.inspections || [],
    tasks: data?.tasks || [],
    priceHistory: data?.priceHistory || [],
    settings: data?.settings || {},
    catalogs: stripHeavyCatalogPayloads(data?.catalogs),
    auditLogs: (data?.auditLogs || []).slice(0, 50),
  };

  return sanitizeForFirestore(rawPayload);
}

/**
 * Checks if `merged` contains entities missing from `cloud` so startup hydration
 * can push local/server recovery back up to Cloud Firestore.
 */
export function hasUnsyncedCloudEntities(merged: any, cloud: any): boolean {
  if (!merged) return false;
  if (!cloud) return true;

  const collections = [
    'suppliers',
    'products',
    'quotations',
    'orders',
    'invoices',
    'payments',
    'shipments',
    'samples',
    'inspections',
    'tasks',
    'contacts',
    'communicationLogs',
    'priceHistory',
  ];

  for (const col of collections) {
    const mergedItems: any[] = Array.isArray(merged[col]) ? merged[col] : [];
    const cloudItems: any[] = Array.isArray(cloud[col]) ? cloud[col] : [];
    if (mergedItems.length > cloudItems.length) return true;
    const cloudIds = new Set(cloudItems.map((x) => x?.id).filter(Boolean));
    for (const item of mergedItems) {
      if (item?.id && !cloudIds.has(item.id)) return true;
    }
  }

  return false;
}
