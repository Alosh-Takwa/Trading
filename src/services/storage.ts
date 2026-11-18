/**
 * Persistent Storage Layer for SinoTrack ERP
 * Handles localStorage persistence, data integrity, relational references, 
 * initial realistic Chinese home appliances sourcing seeding, and database backup/restore.
 */

import {
  Supplier,
  SupplierContact,
  CommunicationLog,
  Product,
  Quotation,
  PriceHistoryRecord,
  PurchaseOrder,
  Invoice,
  Payment,
  Shipment,
  SampleRequest,
  QualityInspection,
  TaskItem,
  AuditLog,
  SystemSettings,
  User,
  SupplierCatalog,
} from '../types/erp';

export interface DatabaseState {
  version: number;
  lastModified?: number;
  lastSavedAt?: string;
  currentUser: User;
  users: User[];
  suppliers: Supplier[];
  catalogs?: SupplierCatalog[];
  contacts: SupplierContact[];
  communicationLogs: CommunicationLog[];
  products: Product[];
  quotations: Quotation[];
  priceHistory: PriceHistoryRecord[];
  orders: PurchaseOrder[];
  invoices: Invoice[];
  payments: Payment[];
  shipments: Shipment[];
  samples: SampleRequest[];
  inspections: QualityInspection[];
  tasks: TaskItem[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}

const STORAGE_KEY = 'sinotrack_erp_database_v1';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-001',
    name: 'Alosh Takwa',
    email: 'alosh.takwa@gmail.com',
    role: 'super_admin',
    department: 'Executive Procurement',
    jobTitle: 'المدير العام ومؤسس المنظومة (CEO & General Manager)',
    phone: '+966 50 889 1234',
    status: 'active',
    password: 'admin123',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-10T08:00:00Z',
    lastLogin: '2026-11-01T06:30:00Z',
    notes: 'حساب المدير العام الأساسي - صلاحيات كاملة غير محدودة.',
    customPermissions: ['all'],
  },
  {
    id: 'usr-002',
    name: 'كريم المنصور',
    email: 'k.mansour@orientappliances.com',
    role: 'procurement_manager',
    department: 'إدارة المشتريات والتعاقدات',
    jobTitle: 'مدير المشتريات الأول (Senior Procurement Manager)',
    phone: '+966 50 123 4567',
    status: 'active',
    password: 'procure123',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-02-15T09:30:00Z',
    lastLogin: '2026-10-31T15:20:00Z',
    notes: 'مسؤول التفاوض مع مصانع نينغبو وفوشان وإصدار أوامر الشراء.',
    customPermissions: ['suppliers_manage', 'quotes_manage', 'orders_manage', 'samples_qc', 'export_reports'],
  },
  {
    id: 'usr-003',
    name: 'سارة السعيد',
    email: 's.saeed@orientappliances.com',
    role: 'finance',
    department: 'الإدارة المالية والاعتمادات',
    jobTitle: 'المدير المالي التنفيذي (Finance & Treasury Lead)',
    phone: '+966 55 987 6543',
    status: 'active',
    password: 'finance123',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-03-01T10:00:00Z',
    lastLogin: '2026-10-30T11:45:00Z',
    notes: 'مسؤولة اعتمادات التحويلات البنكية الخارجية T/T وتدقيق الفواتير وحساب التكلفة الفعلية.',
    customPermissions: ['invoices_manage', 'payments_manage', 'landed_cost', 'export_reports'],
  },
  {
    id: 'usr-004',
    name: 'طارق بن فيصل',
    email: 't.faisal@orientappliances.com',
    role: 'shipping_manager',
    department: 'الشحن واللوجستيات والتخليص',
    jobTitle: 'مدير العمليات اللوجستية (Logistics & Customs Manager)',
    phone: '+966 54 332 1100',
    status: 'active',
    password: 'ship123',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-03-12T08:15:00Z',
    lastLogin: '2026-10-29T16:00:00Z',
    notes: 'متابعة بوالص الشحن BL مع كوانزو وشنجن وميناء جدة الإسلامي.',
    customPermissions: ['shipments_manage', 'landed_cost', 'export_reports'],
  },
  {
    id: 'usr-005',
    name: 'نورة العتيبي',
    email: 'n.otaibi@orientappliances.com',
    role: 'viewer',
    department: 'التدقيق والحوكمة',
    jobTitle: 'مراقب حسابات ومراجع حوكمة (Internal Auditor & Compliance)',
    phone: '+966 56 445 7788',
    status: 'active',
    password: 'view123',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-04-05T12:00:00Z',
    lastLogin: '2026-10-28T09:10:00Z',
    notes: 'صلاحية استعراض وتدقيق عامة بدون صلاحيات تعديل أو حذف.',
    customPermissions: ['view_only'],
  },
];

export const DEFAULT_CURRENT_USER: User = INITIAL_USERS[0];

export const DEFAULT_SETTINGS: SystemSettings = {
  companyNameAr: 'شركة الشرق للأجهزة المنزلية الحديثة',
  companyNameEn: 'Orient Modern Home Appliances Co.',
  companyAddress: 'الرياض - طريق الملك فهد - برج الأعمال 402',
  companyPhone: '+966 11 450 8899',
  companyEmail: 'procurement@orientappliances.com',
  taxRegistrationNumber: '310984726100003',
  baseCurrency: 'USD',
  exchangeRates: {
    USD: 1.0,
    CNY: 7.24,
    SAR: 3.75,
    EUR: 0.92,
    AED: 3.67,
    SYP: 15000,
  },
  customCurrencies: [
    { code: 'SYP', nameAr: 'ليرة سورية', nameEn: 'Syrian Pound', symbolAr: 'ل.س', symbolEn: 'SYP', rateToUSD: 15000 },
  ],
  chinesePorts: ['Ningbo (CN)', 'Shenzhen / Yantian (CN)', 'Shanghai (CN)', 'Guangzhou / Nansha (CN)', 'Qingdao (CN)', 'Foshan (CN)'],
  destinationPorts: ['Jeddah Islamic Port (SA)', 'King Abdulaziz Port Dammam (SA)', 'Jebel Ali (AE)', 'Alexandria (EG)', 'Aqaba (JO)', 'Latakia Port (SY) - ميناء اللاذقية', 'Tartus Port (SY) - ميناء طرطوس'],
  shippingLines: ['COSCO Shipping Lines', 'Maersk Line', 'MSC Mediterranean', 'CMA CGM', 'Evergreen Marine', 'Hapag-Lloyd', 'ONE Ocean Network'],
  driveRootFolderName: 'Supplier Management',
  platformName: 'SinoTrack ERP',
  platformSubtitleAr: 'إدارة الموردين والاستيراد من الصين',
  platformSubtitleEn: 'China Sourcing & Logistics ERP',
  platformLogoUrl: '',
};

import { BASELINE_SEED } from './baselineData';

export const INITIAL_DATABASE_SEED: DatabaseState = {
  ...BASELINE_SEED,
  version: 1,
  currentUser: DEFAULT_CURRENT_USER,
  users: INITIAL_USERS,
  settings: DEFAULT_SETTINGS,
};

const IDB_NAME = 'sinotrack_erp_idb';
const IDB_STORE = 'app_state';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveToIndexedDB(data: DatabaseState): Promise<void> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(data, 'main_db');
  } catch (e) {
    console.warn('[Storage] saveToIndexedDB error:', e);
  }
}

export async function loadFromIndexedDB(): Promise<DatabaseState | null> {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get('main_db');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Fetches database state stored permanently on the backend server filesystem
 */
export async function fetchServerDatabase(): Promise<DatabaseState | null> {
  try {
    const res = await fetch('/api/db', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data && Array.isArray(json.data.suppliers)) {
      return json.data as DatabaseState;
    }
    return null;
  } catch (err) {
    console.warn('[Storage] Server database fetch failed or running offline:', err);
    return null;
  }
}

/**
 * Saves database state permanently to the backend server filesystem
 */
export async function saveServerDatabase(data: DatabaseState): Promise<boolean> {
  try {
    const bodyStr = JSON.stringify({ data });
    // Browsers strictly limit keepalive requests to 64KB across all requests
    const useKeepalive = typeof window !== 'undefined' && bodyStr.length < 60000;
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      ...(useKeepalive ? { keepalive: true } : {}),
      body: bodyStr,
    });
    return res.ok;
  } catch {
    // Fallback cleanly to standard fetch without keepalive
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Resets database state on backend server
 */
export async function resetServerDatabase(): Promise<boolean> {
  try {
    const res = await fetch('/api/db/reset', { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
}

export function isOldMockSeedState(state: DatabaseState | null | undefined): boolean {
  if (!state || !state.suppliers) return false;
  return state.suppliers.some((s) => s.id === 'SUP-001' && (s.nameEn || '').includes('Midea'));
}

/**
 * Compares multiple database sources (Firestore, Server, IndexedDB, LocalStorage)
 * and determines the best and most up-to-date state containing user modifications.
 */
export function resolveBestDatabaseState(
  ...candidates: (DatabaseState | null | undefined)[]
): DatabaseState | null {
  // Purge any candidates containing the old mock seed data so user gets a completely clean slate
  const nonMock = candidates.filter((c): c is DatabaseState => !!c && Array.isArray(c.suppliers) && !isOldMockSeedState(c));
  const valid = nonMock.length > 0 ? nonMock : candidates.filter((c): c is DatabaseState => !!c && Array.isArray(c.suppliers));
  if (valid.length === 0) return INITIAL_DATABASE_SEED;

  // If the only candidates found are the old mock seeds, discard them for the clean initial seed
  if (nonMock.length === 0 && valid.some(isOldMockSeedState)) {
    return INITIAL_DATABASE_SEED;
  }

  let best = valid[0];
  let bestScore = -1;

  for (const item of valid) {
    // Scoring prioritizes user-created entities, profile custom avatars, and recent timestamps
    const countScore =
      (item.suppliers?.length || 0) * 10 +
      (item.products?.length || 0) * 10 +
      (item.orders?.length || 0) * 15 +
      (item.invoices?.length || 0) * 15 +
      (item.payments?.length || 0) * 10 +
      (item.contacts?.length || 0) * 5 +
      (item.tasks?.length || 0) * 5;

    // Bonus score if user has a custom avatar or custom platform name
    const hasCustomAvatar =
      item.currentUser?.avatar && !item.currentUser.avatar.includes('photo-1534528741775-53994a69daeb');
    const hasCustomBranding =
      item.settings?.platformLogoUrl || (item.settings?.platformName && item.settings.platformName !== 'SinoTrack ERP');

    const modifiedTime = item.lastModified || 0;
    const totalScore =
      countScore +
      (modifiedTime > 0 ? 50 : 0) +
      (hasCustomAvatar ? 30 : 0) +
      (hasCustomBranding ? 20 : 0);

    const isSignificantlyNewer = modifiedTime > (best.lastModified || 0) + 500;
    const hasMoreEntities = countScore > ((best.suppliers?.length || 0) * 10 + (best.products?.length || 0) * 10 + (best.orders?.length || 0) * 15);

    if (totalScore > bestScore || isSignificantlyNewer || (hasMoreEntities && modifiedTime >= (best.lastModified || 0))) {
      best = item;
      bestScore = Math.max(bestScore, totalScore);
    }
  }

  // Perform an additive union merge across ALL valid candidates so no entity is ever lost!
  const mergedSuppliers = new Map<string, any>();
  const mergedProducts = new Map<string, any>();
  const mergedQuotations = new Map<string, any>();
  const mergedOrders = new Map<string, any>();
  const mergedInvoices = new Map<string, any>();
  const mergedPayments = new Map<string, any>();
  const mergedShipments = new Map<string, any>();
  const mergedSamples = new Map<string, any>();
  const mergedInspections = new Map<string, any>();
  const mergedTasks = new Map<string, any>();
  const mergedContacts = new Map<string, any>();
  const mergedCatalogs = new Map<string, any>();
  const mergedCommLogs = new Map<string, any>();
  const mergedPriceHist = new Map<string, any>();
  const mergedAuditLogs = new Map<string, any>();

  // Iterate over all candidates from lowest priority to best (so best overrides fields on conflict)
  const orderedCandidates = [...valid.filter((c) => c !== best), best];

  for (const candidate of orderedCandidates) {
    (candidate.suppliers || []).forEach((s) => {
      const prev = mergedSuppliers.get(s.id);
      mergedSuppliers.set(s.id, prev ? { ...prev, ...s } : s);
    });
    (candidate.products || []).forEach((p) => {
      const prev = mergedProducts.get(p.id);
      if (!prev) {
        mergedProducts.set(p.id, p);
      } else {
        const prevSpecs = prev.specifications?.length || 0;
        const curSpecs = p.specifications?.length || 0;
        const specs = curSpecs >= prevSpecs ? p.specifications : prev.specifications;
        const images = (p.images && p.images.length > 0) ? p.images : prev.images;
        mergedProducts.set(p.id, { ...prev, ...p, specifications: specs, images });
      }
    });
    (candidate.quotations || []).forEach((q) => {
      const prev = mergedQuotations.get(q.id);
      mergedQuotations.set(q.id, prev ? { ...prev, ...q } : q);
    });
    (candidate.orders || []).forEach((o) => {
      const prev = mergedOrders.get(o.id);
      mergedOrders.set(o.id, prev ? { ...prev, ...o } : o);
    });
    (candidate.invoices || []).forEach((inv) => {
      const prev = mergedInvoices.get(inv.id);
      mergedInvoices.set(inv.id, prev ? { ...prev, ...inv } : inv);
    });
    (candidate.payments || []).forEach((pm) => {
      const prev = mergedPayments.get(pm.id);
      mergedPayments.set(pm.id, prev ? { ...prev, ...pm } : pm);
    });
    (candidate.shipments || []).forEach((sh) => {
      const prev = mergedShipments.get(sh.id);
      mergedShipments.set(sh.id, prev ? { ...prev, ...sh } : sh);
    });
    (candidate.samples || []).forEach((sm) => {
      const prev = mergedSamples.get(sm.id);
      mergedSamples.set(sm.id, prev ? { ...prev, ...sm } : sm);
    });
    (candidate.inspections || []).forEach((ins) => {
      const prev = mergedInspections.get(ins.id);
      mergedInspections.set(ins.id, prev ? { ...prev, ...ins } : ins);
    });
    (candidate.tasks || []).forEach((t) => {
      const prev = mergedTasks.get(t.id);
      mergedTasks.set(t.id, prev ? { ...prev, ...t } : t);
    });
    (candidate.contacts || []).forEach((c) => {
      const prev = mergedContacts.get(c.id);
      mergedContacts.set(c.id, prev ? { ...prev, ...c } : c);
    });
    (candidate.catalogs || []).forEach((cat) => {
      const prev = mergedCatalogs.get(cat.id);
      mergedCatalogs.set(cat.id, prev ? { ...prev, ...cat } : cat);
    });
    (candidate.communicationLogs || []).forEach((l) => {
      const prev = mergedCommLogs.get(l.id);
      mergedCommLogs.set(l.id, prev ? { ...prev, ...l } : l);
    });
    (candidate.priceHistory || []).forEach((ph) => {
      const prev = mergedPriceHist.get(ph.id);
      mergedPriceHist.set(ph.id, prev ? { ...prev, ...ph } : ph);
    });
    (candidate.auditLogs || []).forEach((a) => {
      mergedAuditLogs.set(a.id, a);
    });
  }

  best = {
    ...best,
    suppliers: Array.from(mergedSuppliers.values()),
    products: Array.from(mergedProducts.values()),
    quotations: Array.from(mergedQuotations.values()),
    orders: Array.from(mergedOrders.values()),
    invoices: Array.from(mergedInvoices.values()),
    payments: Array.from(mergedPayments.values()),
    shipments: Array.from(mergedShipments.values()),
    samples: Array.from(mergedSamples.values()),
    inspections: Array.from(mergedInspections.values()),
    tasks: Array.from(mergedTasks.values()),
    contacts: Array.from(mergedContacts.values()),
    catalogs: Array.from(mergedCatalogs.values()),
    communicationLogs: Array.from(mergedCommLogs.values()),
    priceHistory: Array.from(mergedPriceHist.values()),
    auditLogs: Array.from(mergedAuditLogs.values()).slice(0, 50),
    lastModified: Math.max(...valid.map((c) => c.lastModified || 0)) || Date.now(),
  };

  // Guarantee that if any candidate has a user-uploaded custom avatar, it is preserved!
  const candidateWithCustomAvatar = valid.find(
    (c) => c.currentUser?.avatar && !c.currentUser.avatar.includes('photo-1534528741775-53994a69daeb')
  );
  if (
    candidateWithCustomAvatar?.currentUser?.avatar &&
    (!best.currentUser?.avatar || best.currentUser.avatar.includes('photo-1534528741775-53994a69daeb'))
  ) {
    best = {
      ...best,
      currentUser: {
        ...best.currentUser,
        avatar: candidateWithCustomAvatar.currentUser.avatar,
      },
      users: (best.users || []).map((u) =>
        u.id === best.currentUser?.id
          ? { ...u, avatar: candidateWithCustomAvatar.currentUser!.avatar }
          : u
      ),
    };
  }

  // Ensure best state always includes all platform team accounts
  if (best && best.users && Array.isArray(best.users)) {
    const existingIds = new Set(best.users.map((u) => u.id));
    const existingEmails = new Set(best.users.map((u) => (u.email || '').toLowerCase().trim()));
    const missing = INITIAL_USERS.filter((u) => !existingIds.has(u.id) && !existingEmails.has(u.email.toLowerCase().trim()));
    if (missing.length > 0) {
      best = {
        ...best,
        users: [...best.users, ...missing],
      };
    }
  }

  return best;
}

/**
 * Loads current database state from localStorage, initializing with seed if empty.
 * CRITICAL FIX: Does NOT call saveDatabase on empty localStorage, preventing accidental
 * wiping of IndexedDB or Server storage prior to asynchronous hydration!
 */
export function loadDatabase(): DatabaseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Return initial seed in memory without overwriting IndexedDB or server storage!
      return {
        ...INITIAL_DATABASE_SEED,
        lastModified: 0,
      };
    }
    let parsed = JSON.parse(raw) as DatabaseState;
    if (isOldMockSeedState(parsed)) {
      saveDatabase(INITIAL_DATABASE_SEED);
      return INITIAL_DATABASE_SEED;
    }
    let needsSave = false;

    // Auto-recover baseline suppliers and products if localStorage state was empty
    if (
      ((!parsed.suppliers || parsed.suppliers.length === 0) ||
       (!parsed.products || parsed.products.length === 0)) &&
      INITIAL_DATABASE_SEED.suppliers.length > 0
    ) {
      const recovered = resolveBestDatabaseState(INITIAL_DATABASE_SEED, parsed);
      if (recovered) {
        parsed = recovered;
        needsSave = true;
      }
    }

    // Clean any fake mock folder IDs from initial seed so cards don't falsely show "Drive Synced"
    if (parsed.suppliers && Array.isArray(parsed.suppliers)) {
      parsed.suppliers = parsed.suppliers.map((s) => {
        if (s.driveFolderId && s.driveFolderId.startsWith('drive_folder_sup_')) {
          needsSave = true;
          const { driveFolderId: _id, driveFolderUrl: _url, subFolders: _sub, ...rest } = s;
          return rest;
        }
        return s;
      });
    }

    if (!parsed.users || !Array.isArray(parsed.users) || parsed.users.length === 0) {
      parsed.users = INITIAL_USERS;
      needsSave = true;
    } else {
      // Ensure all initial team accounts exist so all platform roles are available
      const existingIds = new Set(parsed.users.map((u) => u.id));
      const existingEmails = new Set(parsed.users.map((u) => (u.email || '').toLowerCase().trim()));
      for (const initUser of INITIAL_USERS) {
        if (!existingIds.has(initUser.id) && !existingEmails.has(initUser.email.toLowerCase().trim())) {
          parsed.users.push(initUser);
          needsSave = true;
        }
      }

      // Ensure all users have valid password and status
      parsed.users = parsed.users.map((u) => {
        let updated = false;
        const copy = { ...u };
        if (!copy.password) {
          const matchInitial = INITIAL_USERS.find((init) => init.id === copy.id || init.email === copy.email);
          copy.password = matchInitial?.password || '123456';
          updated = true;
        }
        if (!copy.status) {
          copy.status = 'active';
          updated = true;
        }
        if (updated) needsSave = true;
        return copy;
      });
    }

    if (!parsed.currentUser) {
      const match = (parsed.users && parsed.users[0]) || DEFAULT_CURRENT_USER;
      parsed.currentUser = match;
      needsSave = true;
    } else {
      // Retain user's custom avatar, email and customizations!
      if (!parsed.currentUser.password) {
        parsed.currentUser.password = 'admin123';
        needsSave = true;
      }
      if (!parsed.currentUser.role) {
        parsed.currentUser.role = 'super_admin';
        needsSave = true;
      }
    }

    if (!parsed.settings) {
      parsed.settings = DEFAULT_SETTINGS;
      needsSave = true;
    } else {
      if (!parsed.settings.exchangeRates) {
        parsed.settings.exchangeRates = DEFAULT_SETTINGS.exchangeRates;
        needsSave = true;
      } else if (!parsed.settings.exchangeRates.SYP) {
        parsed.settings.exchangeRates.SYP = 15000;
        needsSave = true;
      }
      if (!parsed.settings.chinesePorts || !Array.isArray(parsed.settings.chinesePorts)) {
        parsed.settings.chinesePorts = DEFAULT_SETTINGS.chinesePorts;
        needsSave = true;
      }
      if (!parsed.settings.destinationPorts || !Array.isArray(parsed.settings.destinationPorts)) {
        parsed.settings.destinationPorts = DEFAULT_SETTINGS.destinationPorts;
        needsSave = true;
      }
      if (!parsed.settings.customCurrencies) {
        parsed.settings.customCurrencies = DEFAULT_SETTINGS.customCurrencies;
        needsSave = true;
      }
    }

    if (needsSave) {
      saveDatabase(parsed);
    }

    return parsed;
  } catch (err) {
    console.error('Error loading database from localStorage:', err);
    return {
      ...INITIAL_DATABASE_SEED,
      lastModified: 0,
    };
  }
}

/**
 * Persists current database state to Server Filesystem, IndexedDB, and localStorage
 */
export function saveDatabase(data: DatabaseState): void {
  const stamped: DatabaseState = {
    ...data,
    lastModified: Date.now(),
    lastSavedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
  } catch (err) {
    console.warn('localStorage save warning, attempting compact save and fallback to IndexedDB:', err);
    try {
      // If quota exceeded, trim old audit logs and retry
      const compact = {
        ...stamped,
        auditLogs: (stamped.auditLogs || []).slice(0, 30),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
    } catch {
      // ignore
    }
  }

  // Always write to IndexedDB asynchronously
  saveToIndexedDB(stamped).catch(() => {});

  // Always persist to backend server filesystem asynchronously
  saveServerDatabase(stamped).catch(() => {});
}

/**
 * Exports complete database to a downloadable JSON file for backup
 */
export function exportDatabaseBackup(state: DatabaseState): void {
  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().split('T')[0];
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `SinoTrack_ERP_Backup_${dateStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Imports and restores database from a JSON file
 */
export async function importDatabaseBackup(file: File): Promise<DatabaseState> {
  const text = await file.text();
  const parsed = JSON.parse(text) as DatabaseState;
  if (!parsed.suppliers || !parsed.products || !parsed.orders) {
    throw new Error('Invalid backup file structure.');
  }
  saveDatabase(parsed);
  return parsed;
}
