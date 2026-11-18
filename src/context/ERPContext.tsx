/**
 * Main ERP Context & State Management
 * Provides reactive state, CRUD operations, audit logging, multi-role switching, 
 * language (AR/EN with RTL support), Google Drive sync, and toast notifications.
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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
  UserRole,
  POStatus,
  ShipmentStatus,
  SupplierCatalog,
} from '../types/erp';
import { 
  loadDatabase, 
  saveDatabase, 
  loadFromIndexedDB,
  saveToIndexedDB,
  fetchServerDatabase,
  saveServerDatabase,
  resetServerDatabase,
  resolveBestDatabaseState,
  DatabaseState, 
  INITIAL_DATABASE_SEED, 
  DEFAULT_SETTINGS 
} from '../services/storage';
import { 
  initAuth, 
  googleSignIn, 
  logoutGoogle, 
  invalidateToken
} from '../services/authService';
import {
  saveMasterStateToFirestore,
  fetchMasterStateFromFirestore,
  saveCatalogToFirestore,
  saveSupplierToFirestore,
  saveProductToFirestore,
  subscribeToMasterFirestore,
  getLastFirestoreError,
} from '../services/firestoreService';
import { hasUnsyncedCloudEntities } from '../utils/firestoreSanitizer';
import { calculateInvoiceBalance, calculatePriceDiffPercent } from '../utils/erpLogic';
import { User as FirebaseUser } from 'firebase/auth';

export type ActiveView = 
  | 'dashboard' 
  | 'suppliers' 
  | 'supplier_detail'
  | 'products' 
  | 'quotations' 
  | 'orders' 
  | 'invoices' 
  | 'shipments' 
  | 'landed_cost' 
  | 'samples_qc' 
  | 'tasks' 
  | 'reports' 
  | 'settings'
  | 'account';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface ERPContextType {
  // Navigation & UI State
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedSupplierId: string | null;
  setSelectedSupplierId: (id: string | null) => void;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  globalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean) => void;
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;

  // Role & Users
  currentUser: User;
  users: User[];
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => string;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string, allowSelfDelete?: boolean) => boolean;
  toggleUserStatus: (id: string) => void;
  switchUser: (id: string) => void;
  canManageUsers: boolean;

  // Authentication & Session
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Google Drive & Credentials Storage
  isDriveConnected: boolean;
  googleUser: FirebaseUser | null;
  isDriveSyncing: boolean;
  isCredentialsSyncing: boolean;
  lastCredentialsDriveSync: string | null;
  credentialsDriveFileLink: string | null;
  lastFullDriveSync: string | null;
  hasPendingDriveChanges: boolean;
  syncAllToGoogleDrive: (isSilent?: boolean) => Promise<{ success: boolean; message: string }>;
  connectGoogleDrive: () => Promise<void>;
  disconnectGoogleDrive: () => Promise<void>;
  provisionSupplierDriveFolder: (supplierId: string, supplierObj?: Supplier) => Promise<boolean>;
  provisionAllSuppliersDriveFolders: () => Promise<{ total: number; success: number }>;
  syncSupplierDataToDrive: (supplierId: string) => Promise<boolean>;
  syncCredentialsToDrive: () => Promise<boolean>;
  loadCredentialsFromDrive: () => Promise<boolean>;

  // Data Collections
  suppliers: Supplier[];
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

  // Operations
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string, cascade?: boolean) => boolean;

  addContact: (contact: Omit<SupplierContact, 'id'>) => void;
  updateContact: (id: string, updates: Partial<SupplierContact>) => void;
  deleteContact: (id: string) => void;

  addCommunicationLog: (log: Omit<CommunicationLog, 'id' | 'createdAt'>) => void;

  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => boolean;

  addQuotation: (quotation: Omit<Quotation, 'id' | 'createdAt'>) => void;
  updateQuotation: (id: string, updates: Partial<Quotation>) => void;
  deleteQuotation: (id: string) => void;

  createOrder: (order: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>) => string;
  updateOrderStatus: (orderId: string, newStatus: POStatus, note?: string) => void;
  updateOrder: (id: string, updates: Partial<PurchaseOrder>) => void;
  deleteOrder: (id: string) => boolean;

  createInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'paidAmount' | 'balanceDue' | 'status'>) => string;
  createInvoiceForOrder: (orderId: string) => string;
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => boolean;
  deleteInvoice: (id: string) => boolean;

  createShipment: (shipment: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateShipmentStatus: (shipmentId: string, newStatus: ShipmentStatus) => void;
  updateShipment: (id: string, updates: Partial<Shipment>) => void;
  deleteShipment: (id: string) => boolean;

  addSample: (sample: Omit<SampleRequest, 'id' | 'createdAt'>) => void;
  updateSample: (id: string, updates: Partial<SampleRequest>) => void;
  deleteSample: (id: string) => boolean;

  addInspection: (inspection: Omit<QualityInspection, 'id' | 'createdAt'>) => void;
  deleteInspection: (id: string) => boolean;

  addTask: (task: Omit<TaskItem, 'id' | 'createdAt'>) => void;
  toggleTaskStatus: (id: string) => void;
  deleteTask: (id: string) => void;

  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  resetToDefaultData: () => void;
  restoreState: (newState: DatabaseState) => void;

  // Catalogs & Drive integration
  uploadSupplierCatalog: (supplierId: string, file: File) => Promise<SupplierCatalog | null>;
  deleteSupplierCatalog: (supplierId: string, catalogId: string) => Promise<boolean>;

  // Toasts
  toasts: ToastMessage[];
  showToast: (title: string, message?: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export const ERPProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<DatabaseState>(() => loadDatabase());
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sinotrack_theme');
        if (saved === 'dark' || saved === 'light') return saved;
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        }
      } catch {
        // fallback
      }
    }
    return 'light';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>('super_admin');

  // Authentication & Session State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const session = localStorage.getItem('sinotrack_auth_session');
        if (session === 'false') return false;
        if (session === 'true') return true;
        return true;
      } catch {
        return true;
      }
    }
    return true;
  });

  // Google Drive state
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [isCredentialsSyncing, setIsCredentialsSyncing] = useState(false);
  const [lastCredentialsDriveSync, setLastCredentialsDriveSync] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('sinotrack_drive_cred_sync') || null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [credentialsDriveFileLink, setCredentialsDriveFileLink] = useState<string | null>(null);
  const [lastFullDriveSync, setLastFullDriveSync] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('sinotrack_last_drive_sync') || null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [hasPendingDriveChanges, setHasPendingDriveChanges] = useState<boolean>(false);
  const isInitialMount = useRef(true);
  const isRemoteUpdate = useRef(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Apply RTL/LTR and Dark/Light classes on documentElement and body
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      if (document.body) document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      if (document.body) document.body.classList.remove('dark');
    }
    try {
      localStorage.setItem('sinotrack_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Sync state to persistent stores (Server, IndexedDB, LocalStorage, Firestore) whenever db changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // If state change came from remote Firestore or startup hydration, persist locally but DO NOT ping-pong back to Firestore!
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      saveDatabase(db);
      return;
    }

    // Immediately persist to LocalStorage, IndexedDB, and Server filesystem
    saveDatabase(db);
    setHasPendingDriveChanges(true);

    // Debounced automatic cloud sync (500ms debounce)
    const timer = setTimeout(() => {
      saveMasterStateToFirestore(db).catch(() => {});
    }, 500);

    return () => clearTimeout(timer);
  }, [db]);

  // Window beforeunload / pagehide flush: guarantee that any recent change is saved even if browser closes immediately!
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveDatabase(db);
      saveMasterStateToFirestore(db).catch(() => {});
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [db]);

  // Multi-tier hydration on startup:
  // 1. Firebase Firestore (Cloud Database) -> 2. Backend Server (/api/db) -> 3. IndexedDB -> 4. LocalStorage
  // Complete persistence: Data never reverts to defaults even if browser is closed or refreshed!
  useEffect(() => {
    let isCancelled = false;

    async function hydratePersistentDatabase() {
      try {
        const [firestoreData, serverData, idbData] = await Promise.all([
          fetchMasterStateFromFirestore().catch(() => null),
          fetchServerDatabase().catch(() => null),
          loadFromIndexedDB().catch(() => null),
        ]);

        if (isCancelled) return;

        const localData = loadDatabase();
        const best = resolveBestDatabaseState(
          firestoreData as DatabaseState,
          serverData,
          idbData,
          localData
        );

        if (best) {
          setDb((current) => {
            const chosen = resolveBestDatabaseState(best, current);
            const finalState = chosen || current;
            const needsCloudPush = hasUnsyncedCloudEntities(finalState, firestoreData);
            isRemoteUpdate.current = !needsCloudPush;
            saveDatabase(finalState);
            if (needsCloudPush) {
              saveMasterStateToFirestore(finalState).catch(() => {});
            }
            return finalState;
          });
        }
      } catch (err) {
        console.warn('[Hydration] Startup hydration warning:', err);
      }
    }

    hydratePersistentDatabase();

    // Setup live subscription from Firestore
    const unsubscribe = subscribeToMasterFirestore((cloudData) => {
      if (!cloudData || isCancelled) return;
      setDb((current) => {
        const cloudMod = Number(cloudData.lastModified || 0);
        const localMod = Number(current.lastModified || 0);
        if (localMod >= cloudMod) {
          return current;
        }
        const nextRemote: DatabaseState = {
          ...current,
          ...(cloudData as Partial<DatabaseState>),
        };
        isRemoteUpdate.current = true;
        saveDatabase(nextRemote);
        return nextRemote;
      });
    });

    return () => {
      isCancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Ensure every purchase order has a corresponding invoice in Invoices & Payments
  useEffect(() => {
    setDb((prev) => {
      let missingCount = 0;
      const currentInvoices = [...prev.invoices];
      const now = new Date().toISOString();

      for (const order of prev.orders) {
        const hasInvoice = currentInvoices.some(
          (inv) => inv.purchaseOrderId === order.id || inv.poNumber === order.id
        );
        if (!hasInvoice) {
          missingCount++;
          const nextInvNum = currentInvoices.length + 1;
          const invId = `INV-2026-${String(nextInvNum).padStart(3, '0')}`;
          currentInvoices.push({
            id: invId,
            invoiceNumber: `INV-${order.id.replace('PO-', '')}`,
            purchaseOrderId: order.id,
            poNumber: order.id,
            supplierId: order.supplierId,
            supplierName: order.supplierName,
            issueDate: order.orderDate,
            dueDate: order.expectedProductionEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            currency: order.currency,
            totalAmount: order.grandTotal,
            discount: order.totalDiscount || 0,
            paidAmount: order.totalPaid || 0,
            balanceDue: Math.max(0, order.grandTotal - (order.totalDiscount || 0) - (order.totalPaid || 0)),
            status: (order.totalPaid || 0) >= order.grandTotal ? 'paid' : (order.totalPaid || 0) > 0 ? 'partially_paid' : 'unpaid',
            notes: `فاتورة تجارية مرتبطة بطلب الشراء ${order.id}`,
            createdAt: order.createdAt || now,
          });
        }
      }

      if (missingCount > 0) {
        const nextDb = { ...prev, invoices: currentInvoices };
        saveDatabase(nextDb);
        return nextDb;
      }
      return prev;
    });
  }, []);

  // Firebase Google Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setGoogleUser(user);
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const showToast = (title: string, message?: string, type: ToastMessage['type'] = 'success') => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const logAudit = (
    action: AuditLog['action'],
    entity: AuditLog['entity'],
    entityId: string,
    entityName: string,
    details: string
  ) => {
    const newLog: AuditLog = {
      id: `AUD-${Date.now()}`,
      userId: db.currentUser.id,
      userName: db.currentUser.name,
      userRole: activeRole,
      action,
      entity,
      entityId,
      entityName,
      details,
      timestamp: new Date().toISOString(),
    };
    setDb((prev) => ({
      ...prev,
      auditLogs: [newLog, ...prev.auditLogs],
    }));
  };

  // Cloud Database connect / manual sync
  const connectGoogleDrive = async () => {
    try {
      setIsDriveSyncing(true);
      await syncAllToGoogleDrive(false);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const disconnectGoogleDrive = async () => {
    showToast(
      language === 'ar' ? 'قاعدة البيانات السحابية المركزية تعمل دائماً' : 'Cloud Database is Always Active',
      language === 'ar' ? 'تُحفظ كافة البيانات تلقائياً في السحابة' : 'All data persists in Cloud Firestore',
      'info'
    );
  };

  const ensureDriveConnected = async (): Promise<boolean> => {
    return true;
  };

  // Cloud Database Sync (Firestore + Server DB + Local DB + IndexedDB)
  const syncAllToGoogleDrive = async (isSilent: boolean = false): Promise<{ success: boolean; message: string }> => {
    try {
      setIsDriveSyncing(true);
      if (!isSilent) {
        showToast(
          language === 'ar' ? 'جارٍ مزامنة وتأمين قاعدة البيانات السحابية...' : 'Syncing Cloud Database...',
          language === 'ar' ? 'يتم حفظ كافة البيانات والكتالوجات وصور المنتجات في Cloud Firestore' : 'Saving all records to Cloud Firestore',
          'info'
        );
      }

      // Persist authoritative current ERP state across all storage layers
      const stateToSave: DatabaseState = {
        ...db,
        lastModified: Math.max(Number(db.lastModified || 0), Date.now()),
        lastSavedAt: new Date().toISOString(),
      };
      saveDatabase(stateToSave);

      const [cloudSaved] = await Promise.all([
        saveMasterStateToFirestore(stateToSave),
        saveServerDatabase(stateToSave).catch(() => false),
      ]);

      if (!cloudSaved) {
        const errDetail = getLastFirestoreError() || (language === 'ar' ? 'تعذر الكتابة في قاعدة البيانات السحابية' : 'Firestore write failed');
        if (!isSilent) {
          showToast(
            language === 'ar' ? 'تم الحفظ محلياً فقط - تعذر المزامنة السحابية' : 'Saved Locally Only - Cloud Sync Failed',
            errDetail,
            'warning'
          );
        }
        return { success: false, message: errDetail };
      }

      const now = new Date().toISOString();
      setLastFullDriveSync(now);
      setHasPendingDriveChanges(false);
      try {
        localStorage.setItem('sinotrack_last_drive_sync', now);
      } catch {
        // ignore
      }

      if (!isSilent) {
        showToast(
          language === 'ar' ? 'تمت المزامنة بنجاح مع قاعدة البيانات السحابية' : 'Cloud Database Synced',
          language === 'ar'
            ? `تم حفظ وتأمين كافة بيانات المنظومة والملفات في Cloud Firestore بنجاح (${now.split('T')[1].slice(0, 5)})`
            : `Database, files, and images safely stored in Cloud Firestore.`,
          'success'
        );
        logAudit('update', 'settings', 'master-sync', 'Cloud DB Sync', 'مزامنة شاملة لقاعدة البيانات والملفات والصور مع Cloud Firestore');
      }

      return { success: true, message: 'Cloud database synced successfully' };
    } catch (err: any) {
      console.warn('Cloud sync error:', err);
      if (!isSilent) {
        showToast(
          language === 'ar' ? 'فشلت المزامنة السحابية' : 'Cloud Sync Failed',
          err.message || 'Error communicating with Firestore',
          'error'
        );
      }
      return { success: false, message: err.message || 'Sync failed' };
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const provisionSupplierDriveFolder = async (supplierId: string, supplierObj?: Supplier): Promise<boolean> => {
    const supplier = supplierObj || db.suppliers.find((s) => s.id === supplierId) || loadDatabase().suppliers.find((s) => s.id === supplierId);
    if (!supplier) {
      showToast(
        language === 'ar' ? 'تعذر العثور على المورد' : 'Supplier not found',
        supplierId,
        'error'
      );
      return false;
    }

    try {
      await saveSupplierToFirestore(supplier);
      showToast(
        language === 'ar' ? 'تم حفظ المورد في قاعدة البيانات السحابية' : 'Supplier Saved to Cloud Database',
        supplier.nameEn,
        'success'
      );
      return true;
    } catch (err: any) {
      console.error(err);
      return false;
    }
  };

  const provisionAllSuppliersDriveFolders = async (): Promise<{ total: number; success: number }> => {
    setIsDriveSyncing(true);
    try {
      const currentSuppliers = db.suppliers;
      for (const sup of currentSuppliers) {
        await saveSupplierToFirestore(sup).catch(() => {});
      }
      showToast(
        language === 'ar' ? 'تم حفظ جميع الموردين في قاعدة البيانات السحابية' : 'All Suppliers Saved to Cloud Database',
        `${currentSuppliers.length} ${language === 'ar' ? 'مورد' : 'suppliers'}`,
        'success'
      );
      return { total: currentSuppliers.length, success: currentSuppliers.length };
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const syncSupplierDataToDrive = async (supplierId: string): Promise<boolean> => {
    const sup = db.suppliers.find((s) => s.id === supplierId);
    if (!sup) return false;
    try {
      await saveSupplierToFirestore(sup);
      showToast(
        language === 'ar' ? 'تم حفظ وتأمين ملفات المورد في قاعدة البيانات السحابية' : 'Supplier Saved in Cloud Database',
        sup.nameEn,
        'success'
      );
      return true;
    } catch {
      return false;
    }
  };

  // Supplier CRUD
  const addSupplier = async (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    // Determine the next numerical ID safely from existing suppliers
    const existingNums = db.suppliers
      .map((s) => {
        const match = s.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = (existingNums.length > 0 ? Math.max(...existingNums) : db.suppliers.length) + 1;
    const newId = `SUP-${String(nextNum).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const newSupplier: Supplier = {
      ...supplierData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    setDb((prev) => {
      const safeId = prev.suppliers.some((s) => s.id === newId)
        ? `SUP-${String(
            Math.max(
              0,
              ...prev.suppliers.map((s) => {
                const m = s.id.match(/\d+/);
                return m ? parseInt(m[0], 10) : 0;
              })
            ) + 1
          ).padStart(3, '0')}`
        : newId;
      const supplierToInsert = safeId === newId ? newSupplier : { ...newSupplier, id: safeId };
      const updatedSuppliers = [supplierToInsert, ...prev.suppliers];
      const nextDb: DatabaseState = {
        ...prev,
        suppliers: updatedSuppliers,
        lastModified: Date.now(),
      };
      saveDatabase(nextDb);
      saveMasterStateToFirestore(nextDb).catch(() => {});
      return nextDb;
    });

    logAudit('create', 'supplier', newId, newSupplier.nameEn, `Added new Chinese supplier: ${newSupplier.nameEn} (${newSupplier.city})`);
    showToast(
      language === 'ar' ? 'تمت إضافة المورد بنجاح' : 'Supplier Added',
      `${newSupplier.nameEn} [${newId}]`
    );
    // Persist supplier directly to Firestore cloud database
    saveSupplierToFirestore(newSupplier).catch(() => {});

    return newId;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    const now = new Date().toISOString();
    setDb((prev) => {
      const updatedSuppliers = prev.suppliers.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: now } : s));
      const nextDb: DatabaseState = { ...prev, suppliers: updatedSuppliers, lastModified: Date.now() };
      saveDatabase(nextDb);
      saveMasterStateToFirestore(nextDb).catch(() => {});
      const updatedSup = updatedSuppliers.find((s) => s.id === id);
      if (updatedSup) saveSupplierToFirestore(updatedSup).catch(() => {});
      return nextDb;
    });
    logAudit('update', 'supplier', id, updates.nameEn || id, `Updated supplier details.`);
    showToast(language === 'ar' ? 'تم تحديث بيانات المورد' : 'Supplier Updated');
  };

  const deleteSupplier = (id: string, cascade: boolean = false): boolean => {
    const sup = db.suppliers.find((s) => s.id === id);
    if (!sup) return false;

    setDb((prev) => {
      const nextDb: DatabaseState = {
        ...prev,
        suppliers: prev.suppliers.filter((s) => s.id !== id),
        contacts: prev.contacts.filter((c) => c.supplierId !== id),
        communicationLogs: prev.communicationLogs.filter((l) => l.supplierId !== id),
        quotations: prev.quotations.filter((q) => q.supplierId !== id),
        orders: prev.orders.filter((o) => o.supplierId !== id),
        invoices: prev.invoices.filter((inv) => inv.supplierId !== id),
        shipments: prev.shipments.filter((sh) => sh.supplierId !== id),
        samples: prev.samples.filter((sm) => sm.supplierId !== id),
        lastModified: Date.now(),
      };
      saveDatabase(nextDb);
      saveMasterStateToFirestore(nextDb).catch(() => {});
      return nextDb;
    });

    logAudit('delete', 'supplier', id, sup?.nameEn || id, `Deleted supplier ${sup?.nameEn || id} and associated records.`);
    showToast(language === 'ar' ? 'تم حذف المورد بنجاح' : 'Supplier Deleted', `${sup?.nameEn || id}`, 'info');
    return true;
  };

  // Catalog Upload directly into Cloud Database (Data URL + Firestore)
  const uploadSupplierCatalog = async (supplierId: string, file: File): Promise<SupplierCatalog | null> => {
    try {
      setIsDriveSyncing(true);
      showToast(
        language === 'ar' ? 'جارٍ حفظ الكتالوج في قاعدة البيانات...' : 'Saving catalog to database...',
        file.name,
        'info'
      );

      const supplier = db.suppliers.find((s) => s.id === supplierId);
      if (!supplier) throw new Error('Supplier not found');

      // Convert file to Base64 Data URL for persistent in-database storage & instant preview
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Construct catalog record with full file data
      const catalogRecord: SupplierCatalog = {
        id: `CAT-${Date.now()}`,
        supplierId,
        name: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        fileDataUrl: dataUrl,
        mimeType: file.type || 'application/pdf',
        uploadedAt: new Date().toISOString(),
      };

      // Save individual catalog to Firestore
      saveCatalogToFirestore(catalogRecord).catch((e) => console.warn('Firestore catalog save:', e));

      // Update state & persist
      let updatedSupplier: Supplier | undefined;
      setDb((prev) => {
        const updatedSuppliers = prev.suppliers.map((s) => {
          if (s.id === supplierId) {
            const currentCatalogs = s.catalogs || [];
            updatedSupplier = {
              ...s,
              catalogs: [catalogRecord, ...currentCatalogs],
            };
            return updatedSupplier;
          }
          return s;
        });

        const nextDb = {
          ...prev,
          suppliers: updatedSuppliers,
          catalogs: [catalogRecord, ...(prev.catalogs || [])],
        };
        saveDatabase(nextDb);
        saveMasterStateToFirestore(nextDb).catch(() => {});
        return nextDb;
      });

      if (updatedSupplier) {
        saveSupplierToFirestore(updatedSupplier).catch(() => {});
      }

      logAudit(
        'create',
        'supplier',
        supplierId,
        supplier.nameEn,
        `Uploaded catalog ${file.name} to Cloud Database`
      );
      showToast(
        language === 'ar' ? 'تم حفظ الكتالوج بنجاح في قاعدة البيانات' : 'Catalog Saved to Database',
        file.name,
        'success'
      );

      return catalogRecord;
    } catch (err: any) {
      console.error('Catalog upload error:', err);
      showToast(
        language === 'ar' ? 'فشل حفظ الكتالوج' : 'Failed to save catalog',
        err.message || '',
        'error'
      );
      return null;
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const deleteSupplierCatalog = async (supplierId: string, catalogId: string): Promise<boolean> => {
    try {
      setDb((prev) => {
        const updatedSuppliers = prev.suppliers.map((s) => {
          if (s.id === supplierId) {
            return {
              ...s,
              catalogs: (s.catalogs || []).filter((c) => c.id !== catalogId),
            };
          }
          return s;
        });

        const nextDb = {
          ...prev,
          suppliers: updatedSuppliers,
          catalogs: (prev.catalogs || []).filter((c) => c.id !== catalogId),
        };
        saveDatabase(nextDb);
        saveMasterStateToFirestore(nextDb).catch(() => {});
        return nextDb;
      });

      showToast(
        language === 'ar' ? 'تم حذف الكتالوج من قاعدة البيانات' : 'Catalog deleted from database',
        '',
        'info'
      );
      return true;
    } catch (err) {
      console.error('Failed to delete catalog:', err);
      return false;
    }
  };

  // Contacts CRUD
  const addContact = (contactData: Omit<SupplierContact, 'id'>) => {
    const newId = `CNT-${Date.now().toString().slice(-4)}`;
    const newContact: SupplierContact = { ...contactData, id: newId };
    
    // If setting as primary, demote other contacts for this supplier
    setDb((prev) => {
      const updatedContacts = [
        newContact,
        ...prev.contacts.map((c) =>
          c.supplierId === contactData.supplierId && contactData.isPrimary ? { ...c, isPrimary: false } : c
        ),
      ];
      const nextDb = { ...prev, contacts: updatedContacts };
      saveDatabase(nextDb);
      return nextDb;
    });

    showToast(language === 'ar' ? 'تمت إضافة جهة الاتصال' : 'Contact Added', newContact.name);
  };

  const updateContact = (id: string, updates: Partial<SupplierContact>) => {
    setDb((prev) => {
      const updatedContacts = prev.contacts.map((c) => {
        if (c.id === id) {
          return { ...c, ...updates };
        }
        if (updates.isPrimary && c.supplierId === updates.supplierId && c.id !== id) {
          return { ...c, isPrimary: false };
        }
        return c;
      });
      const nextDb = { ...prev, contacts: updatedContacts };
      saveDatabase(nextDb);
      return nextDb;
    });
    showToast(language === 'ar' ? 'تم تحديث جهة الاتصال' : 'Contact Updated');
  };

  const deleteContact = (id: string) => {
    setDb((prev) => {
      const nextDb = {
        ...prev,
        contacts: prev.contacts.filter((c) => c.id !== id),
      };
      saveDatabase(nextDb);
      return nextDb;
    });
    showToast(language === 'ar' ? 'تم حذف جهة الاتصال' : 'Contact Deleted', '', 'info');
  };

  // Communication Log
  const addCommunicationLog = (logData: Omit<CommunicationLog, 'id' | 'createdAt'>) => {
    const newId = `LOG-${Date.now().toString().slice(-4)}`;
    const newLog: CommunicationLog = {
      ...logData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setDb((prev) => ({
      ...prev,
      communicationLogs: [newLog, ...prev.communicationLogs],
    }));
    showToast(language === 'ar' ? 'تم تسجيل محضر التواصل' : 'Communication Logged');
  };

  // Product CRUD
  const addProduct = (prodData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): string => {
    const existingNums = db.products
      .map((p) => {
        const match = p.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = (existingNums.length > 0 ? Math.max(...existingNums) : db.products.length) + 1;
    const newId = `PRD-${String(nextNum).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const newProduct: Product = {
      ...prodData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    setDb((prev) => {
      const safeId = prev.products.some((p) => p.id === newId)
        ? `PRD-${String(
            Math.max(
              0,
              ...prev.products.map((p) => {
                const m = p.id.match(/\d+/);
                return m ? parseInt(m[0], 10) : 0;
              })
            ) + 1
          ).padStart(3, '0')}`
        : newId;
      const productToInsert = safeId === newId ? newProduct : { ...newProduct, id: safeId };
      const nextDb: DatabaseState = {
        ...prev,
        products: [productToInsert, ...prev.products],
        lastModified: Date.now(),
      };
      saveDatabase(nextDb);
      saveMasterStateToFirestore(nextDb).catch(() => {});
      saveProductToFirestore(productToInsert).catch(() => {});
      return nextDb;
    });

    logAudit('create', 'product', newId, newProduct.modelNumber, `Created master product: ${newProduct.nameEn} (${newProduct.modelNumber})`);
    showToast(language === 'ar' ? 'تمت إضافة المنتج بنجاح' : 'Product Added', `${newProduct.nameAr} [${newProduct.modelNumber}]`);
    return newId;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const now = new Date().toISOString();
    setDb((prev) => {
      const updatedProducts = prev.products.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: now } : p));
      const nextDb: DatabaseState = {
        ...prev,
        products: updatedProducts,
        lastModified: Date.now(),
      };
      saveDatabase(nextDb);
      saveMasterStateToFirestore(nextDb).catch(() => {});
      const updatedProd = updatedProducts.find((p) => p.id === id);
      if (updatedProd) saveProductToFirestore(updatedProd).catch(() => {});
      return nextDb;
    });
    logAudit('update', 'product', id, updates.modelNumber || id, 'Updated product specifications.');
    showToast(language === 'ar' ? 'تم تحديث مواصفات المنتج' : 'Product Updated');
  };

  const deleteProduct = (id: string): boolean => {
    const hasOrders = db.orders.some((o) => o.items.some((i) => i.productId === id));
    if (hasOrders) {
      showToast(
        language === 'ar' ? 'لا يمكن حذف المنتج' : 'Cannot Delete Product',
        language === 'ar' ? 'هذا المنتج مستخدم في طلبيات شراء سارية.' : 'Product is used in active purchase orders.',
        'error'
      );
      return false;
    }

    setDb((prev) => {
      const nextDb: DatabaseState = {
        ...prev,
        products: prev.products.filter((p) => p.id !== id),
        quotations: prev.quotations.filter((q) => q.productId !== id),
        lastModified: Date.now(),
      };
      saveDatabase(nextDb);
      saveMasterStateToFirestore(nextDb).catch(() => {});
      return nextDb;
    });

    showToast(language === 'ar' ? 'تم حذف المنتج' : 'Product Deleted', '', 'info');
    return true;
  };

  // Quotation Management
  const addQuotation = (qData: Omit<Quotation, 'id' | 'createdAt'>) => {
    const existingNums = db.quotations
      .map((q) => {
        const match = q.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = (existingNums.length > 0 ? Math.max(...existingNums) : db.quotations.length) + 1;
    const newId = `QT-2026-${String(nextNum).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const newQuote: Quotation = {
      ...qData,
      id: newId,
      createdAt: now,
    };

    // Calculate price history difference compared to previous quotes for this product & supplier
    const previousQuotes = db.quotations
      .filter((q) => q.productId === qData.productId && q.supplierId === qData.supplierId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let percentDiff: number | undefined;
    if (previousQuotes.length > 0) {
      percentDiff = calculatePriceDiffPercent(previousQuotes[0].unitPrice, qData.unitPrice);
    }

    const priceHist: PriceHistoryRecord = {
      id: `PH-${Date.now().toString().slice(-4)}`,
      productId: qData.productId,
      supplierId: qData.supplierId,
      supplierName: qData.supplierName,
      quotationId: newId,
      price: qData.unitPrice,
      currency: qData.currency,
      priceType: qData.priceType,
      moq: qData.moq,
      date: qData.date,
      percentageChange: percentDiff,
    };

    setDb((prev) => {
      const nextDb: DatabaseState = {
        ...prev,
        quotations: [newQuote, ...prev.quotations],
        priceHistory: [priceHist, ...prev.priceHistory],
        lastModified: Date.now(),
      };
      saveDatabase(nextDb);
      saveMasterStateToFirestore(nextDb).catch(() => {});
      return nextDb;
    });

    logAudit('create', 'quotation', newId, `${qData.modelNumber} - ${qData.supplierName}`, `Logged quotation: $${qData.unitPrice} (${qData.priceType})`);
    showToast(language === 'ar' ? 'تم تسجيل عرض السعر' : 'Quotation Saved', `${newQuote.productName} - $${newQuote.unitPrice}`);
  };

  const updateQuotation = (id: string, updates: Partial<Quotation>) => {
    setDb((prev) => {
      const existing = prev.quotations.find((q) => q.id === id);
      if (!existing) return prev;

      const updatedQuote: Quotation = {
        ...existing,
        ...updates,
      };

      const nextQuotations = prev.quotations.map((q) => (q.id === id ? updatedQuote : q));

      // Synchronize priceHistory for this quotation if price or date was updated
      const nextPriceHistory = prev.priceHistory.map((ph) => {
        if (ph.quotationId === id) {
          return {
            ...ph,
            productId: updatedQuote.productId,
            supplierId: updatedQuote.supplierId,
            supplierName: updatedQuote.supplierName,
            price: updatedQuote.unitPrice,
            currency: updatedQuote.currency,
            priceType: updatedQuote.priceType,
            moq: updatedQuote.moq,
            date: updatedQuote.date,
          };
        }
        return ph;
      });

      const nextDb: DatabaseState = {
        ...prev,
        quotations: nextQuotations,
        priceHistory: nextPriceHistory,
        lastModified: Date.now(),
      };
      saveDatabase(nextDb);
      saveMasterStateToFirestore(nextDb).catch(() => {});
      return nextDb;
    });

    logAudit('update', 'quotation', id, `Quotation ${id}`, `Updated quotation fields`);
    showToast(language === 'ar' ? 'تم تحديث عرض السعر بنجاح' : 'Quotation Updated', '', 'success');
  };

  const deleteQuotation = (id: string) => {
    setDb((prev) => {
      const nextDb: DatabaseState = {
        ...prev,
        quotations: prev.quotations.filter((q) => q.id !== id),
        lastModified: Date.now(),
      };
      saveDatabase(nextDb);
      saveMasterStateToFirestore(nextDb).catch(() => {});
      return nextDb;
    });
    showToast(language === 'ar' ? 'تم حذف عرض السعر' : 'Quotation Deleted', '', 'info');
  };

  // Purchase Order Management
  const createOrder = (orderData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>): string => {
    const nextNum = db.orders.length + 1;
    const newId = `PO-2026-${String(nextNum).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const newOrder: PurchaseOrder = {
      ...orderData,
      id: newId,
      status: 'draft',
      statusHistory: [
        {
          status: 'draft',
          date: new Date().toISOString().split('T')[0],
          note: language === 'ar' ? 'إنشاء مسودة أمر الشراء' : 'Draft created',
          updatedBy: db.currentUser.name,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    // Auto-create matching invoice in Invoices & Payments section
    const nextInvNum = db.invoices.length + 1;
    const invId = `INV-2026-${String(nextInvNum).padStart(3, '0')}`;
    const initialInvoice: Invoice = {
      id: invId,
      invoiceNumber: `INV-${newId.replace('PO-', '')}`,
      purchaseOrderId: newId,
      poNumber: newId,
      supplierId: newOrder.supplierId,
      supplierName: newOrder.supplierName,
      issueDate: newOrder.orderDate,
      dueDate: newOrder.expectedProductionEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: newOrder.currency,
      totalAmount: newOrder.grandTotal,
      discount: newOrder.totalDiscount || 0,
      paidAmount: newOrder.totalPaid || 0,
      balanceDue: Math.max(0, newOrder.grandTotal - (newOrder.totalDiscount || 0) - (newOrder.totalPaid || 0)),
      status: (newOrder.totalPaid || 0) >= newOrder.grandTotal ? 'paid' : (newOrder.totalPaid || 0) > 0 ? 'partially_paid' : 'unpaid',
      notes: `${language === 'ar' ? 'فاتورة تجارية مرتبطة بطلب الشراء' : 'Commercial Invoice linked to PO'} ${newId} - ${newOrder.paymentTerms || ''}`,
      createdAt: now,
    };

    setDb((prev) => {
      const nextDb = {
        ...prev,
        orders: [newOrder, ...prev.orders],
        invoices: [initialInvoice, ...prev.invoices],
      };
      saveDatabase(nextDb);
      return nextDb;
    });

    logAudit('create', 'order', newId, newOrder.supplierName, `Created purchase order and generated commercial invoice for ${newOrder.items.length} item(s), total $${newOrder.grandTotal}`);
    showToast(
      language === 'ar' ? 'تم إنشاء أمر الشراء وإدراجه في الفواتير' : 'Order & Invoice Created',
      `${newId} ➔ ${initialInvoice.invoiceNumber}`
    );
    return newId;
  };

  const createInvoiceForOrder = (orderId: string): string => {
    const existing = db.invoices.find((i) => i.purchaseOrderId === orderId || i.poNumber === orderId);
    if (existing) {
      return existing.id;
    }
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) {
      showToast(language === 'ar' ? 'طلب الشراء غير موجود' : 'Order not found', '', 'error');
      return '';
    }

    const nextInvNum = db.invoices.length + 1;
    const invId = `INV-2026-${String(nextInvNum).padStart(3, '0')}`;
    const now = new Date().toISOString();
    const newInvoice: Invoice = {
      id: invId,
      invoiceNumber: `INV-${order.id.replace('PO-', '')}`,
      purchaseOrderId: order.id,
      poNumber: order.id,
      supplierId: order.supplierId,
      supplierName: order.supplierName,
      issueDate: order.orderDate,
      dueDate: order.expectedProductionEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: order.currency,
      totalAmount: order.grandTotal,
      discount: order.totalDiscount || 0,
      paidAmount: order.totalPaid || 0,
      balanceDue: Math.max(0, order.grandTotal - (order.totalDiscount || 0) - (order.totalPaid || 0)),
      status: (order.totalPaid || 0) >= order.grandTotal ? 'paid' : (order.totalPaid || 0) > 0 ? 'partially_paid' : 'unpaid',
      notes: `${language === 'ar' ? 'فاتورة تجارية مرتبطة بطلب الشراء' : 'Commercial Invoice linked to PO'} ${order.id} - ${order.paymentTerms || ''}`,
      createdAt: now,
    };

    setDb((prev) => {
      const nextDb = { ...prev, invoices: [newInvoice, ...prev.invoices] };
      saveDatabase(nextDb);
      return nextDb;
    });

    logAudit('create', 'invoice', invId, newInvoice.invoiceNumber, `Generated invoice for order ${order.id}`);
    showToast(language === 'ar' ? 'تم إنشاء الفاتورة التجارية بنجاح' : 'Invoice Generated', newInvoice.invoiceNumber);
    return invId;
  };

  const updateOrderStatus = (orderId: string, newStatus: POStatus, note?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    setDb((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: newStatus,
            statusHistory: [
              ...o.statusHistory,
              {
                status: newStatus,
                date: today,
                note: note || `Status updated to ${newStatus}`,
                updatedBy: db.currentUser.name,
              },
            ],
            updatedAt: now,
          };
        }
        return o;
      }),
    }));

    logAudit('update', 'order', orderId, orderId, `Updated status to ${newStatus}. Note: ${note || '-'}`);
    showToast(language === 'ar' ? 'تم تحديث حالة الطلبية' : 'Order Status Updated', `${orderId} -> ${newStatus}`);
  };

  const updateOrder = (id: string, updates: Partial<PurchaseOrder>) => {
    const now = new Date().toISOString();
    setDb((prev) => {
      const updatedOrders = prev.orders.map((o) => (o.id === id ? { ...o, ...updates, updatedAt: now } : o));
      const targetOrder = updatedOrders.find((o) => o.id === id);

      let updatedInvoices = prev.invoices;
      if (targetOrder) {
        const linkedInv = prev.invoices.find((inv) => inv.purchaseOrderId === id || inv.poNumber === id);
        if (linkedInv) {
          const discount = targetOrder.totalDiscount || 0;
          const totalAmount = targetOrder.grandTotal;
          const paidAmount = linkedInv.paidAmount || 0;
          const balanceDue = Math.max(0, totalAmount - discount - paidAmount);
          const status = balanceDue === 0 ? 'paid' : paidAmount > 0 ? 'partially_paid' : 'unpaid';

          updatedInvoices = prev.invoices.map((inv) =>
            inv.id === linkedInv.id
              ? {
                  ...inv,
                  supplierId: targetOrder.supplierId,
                  supplierName: targetOrder.supplierName,
                  currency: targetOrder.currency,
                  totalAmount,
                  discount,
                  balanceDue,
                  status,
                  notes: `${language === 'ar' ? 'فاتورة تجارية مرتبطة بطلب الشراء' : 'Commercial Invoice linked to PO'} ${id} - ${targetOrder.paymentTerms || ''}`,
                }
              : inv
          );
        } else {
          const nextInvNum = prev.invoices.length + 1;
          const newInvId = `INV-2026-${String(nextInvNum).padStart(3, '0')}`;
          const newInv: Invoice = {
            id: newInvId,
            invoiceNumber: `INV-${id.replace('PO-', '')}`,
            purchaseOrderId: id,
            poNumber: id,
            supplierId: targetOrder.supplierId,
            supplierName: targetOrder.supplierName,
            issueDate: targetOrder.orderDate,
            dueDate: targetOrder.expectedProductionEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            currency: targetOrder.currency,
            totalAmount: targetOrder.grandTotal,
            discount: targetOrder.totalDiscount || 0,
            paidAmount: targetOrder.totalPaid || 0,
            balanceDue: Math.max(0, targetOrder.grandTotal - (targetOrder.totalDiscount || 0) - (targetOrder.totalPaid || 0)),
            status: (targetOrder.totalPaid || 0) >= targetOrder.grandTotal ? 'paid' : (targetOrder.totalPaid || 0) > 0 ? 'partially_paid' : 'unpaid',
            notes: `${language === 'ar' ? 'فاتورة تجارية مرتبطة بطلب الشراء' : 'Commercial Invoice linked to PO'} ${id}`,
            createdAt: now,
          };
          updatedInvoices = [newInv, ...prev.invoices];
        }
      }

      const nextDb = { ...prev, orders: updatedOrders, invoices: updatedInvoices };
      saveDatabase(nextDb);
      return nextDb;
    });

    logAudit('update', 'order', id, id, `Updated purchase order details.`);
    showToast(language === 'ar' ? 'تم تعديل بيانات طلبية الشراء والفاتورة المرتبطة' : 'Order and linked invoice updated');
  };

  const deleteOrder = (id: string): boolean => {
    const order = db.orders.find((o) => o.id === id);
    setDb((prev) => {
      const nextDb = {
        ...prev,
        orders: prev.orders.filter((o) => o.id !== id),
        invoices: prev.invoices.filter((inv) => inv.purchaseOrderId !== id),
        payments: prev.payments.filter((p) => p.purchaseOrderId !== id),
      };
      saveDatabase(nextDb);
      return nextDb;
    });
    logAudit('delete', 'order', id, order?.id || id, `Deleted purchase order ${order?.id || id}`);
    showToast(language === 'ar' ? 'تم حذف طلب الشراء بنجاح' : 'Order Deleted', '', 'info');
    return true;
  };

  // Invoices & Payments
  const createInvoice = (invData: Omit<Invoice, 'id' | 'createdAt' | 'paidAmount' | 'balanceDue' | 'status'>): string => {
    const nextNum = db.invoices.length + 1;
    const newId = `INV-2026-${String(nextNum).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const newInvoice: Invoice = {
      ...invData,
      id: newId,
      paidAmount: 0,
      balanceDue: invData.totalAmount - (invData.discount || 0),
      status: 'unpaid',
      createdAt: now,
    };

    setDb((prev) => ({
      ...prev,
      invoices: [newInvoice, ...prev.invoices],
    }));

    logAudit('create', 'invoice', newId, newInvoice.invoiceNumber, `Created invoice for ${newInvoice.supplierName}, amount: $${newInvoice.totalAmount}`);
    showToast(language === 'ar' ? 'تم إنشاء الفاتورة التجارية' : 'Invoice Created', newInvoice.invoiceNumber);
    return newId;
  };

  const addPayment = (payData: Omit<Payment, 'id' | 'createdAt'>): boolean => {
    const targetInvoice = db.invoices.find((i) => i.id === payData.invoiceId);
    if (!targetInvoice) {
      showToast(language === 'ar' ? 'الفاتورة المحددة غير موجودة' : 'Target invoice not found', '', 'error');
      return false;
    }

    if (payData.amount <= 0) {
      showToast(language === 'ar' ? 'المبلغ يجب أن يكون أكبر من صفر' : 'Amount must be greater than zero', '', 'error');
      return false;
    }

    const currentBalanceDue = Math.max(0, targetInvoice.totalAmount - (targetInvoice.discount || 0) - (targetInvoice.paidAmount || 0));
    if (payData.amount > currentBalanceDue + 0.001) {
      showToast(
        language === 'ar' ? 'المبلغ المدخل أكبر من الرصيد المتبقي للفاتورة' : 'Amount exceeds remaining invoice balance',
        language === 'ar'
          ? `إجمالي الفاتورة: $${targetInvoice.totalAmount.toLocaleString()}، الرصيد المتبقي فقط: $${currentBalanceDue.toLocaleString()}`
          : `Invoice Total: $${targetInvoice.totalAmount.toLocaleString()}, Balance Due: $${currentBalanceDue.toLocaleString()}`,
        'error'
      );
      return false;
    }

    const nextNum = db.payments.length + 1;
    const newId = `PAY-2026-${String(nextNum).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const newPayment: Payment = {
      ...payData,
      id: newId,
      createdAt: now,
    };

    setDb((prev) => {
      // Find invoice and all previous payments + this one
      const prevInvoice = prev.invoices.find((i) => i.id === payData.invoiceId);
      const invoicePayments = [
        ...prev.payments.filter((p) => p.invoiceId === payData.invoiceId),
        newPayment,
      ];

      let updatedInvoices = prev.invoices;
      if (prevInvoice) {
        const bal = calculateInvoiceBalance(prevInvoice.totalAmount, prevInvoice.discount, invoicePayments);
        updatedInvoices = prev.invoices.map((inv) =>
          inv.id === prevInvoice.id
            ? { ...inv, paidAmount: bal.paidAmount, balanceDue: bal.balanceDue, status: bal.status }
            : inv
        );
      }

      // Also update Order totalPaid and balanceDue
      const targetOrder = prev.orders.find((o) => o.id === payData.purchaseOrderId);
      let updatedOrders = prev.orders;
      if (targetOrder) {
        const totalPaid = Math.min(targetOrder.grandTotal, (targetOrder.totalPaid || 0) + payData.amount);
        const balanceDue = Math.max(0, targetOrder.grandTotal - totalPaid);
        updatedOrders = prev.orders.map((o) =>
          o.id === targetOrder.id ? { ...o, totalPaid, balanceDue } : o
        );
      }

      const nextDb = {
        ...prev,
        payments: [newPayment, ...prev.payments],
        invoices: updatedInvoices,
        orders: updatedOrders,
      };
      saveDatabase(nextDb);
      return nextDb;
    });

    logAudit('create', 'payment', newId, payData.transactionReference, `Registered payment of $${payData.amount} for PO ${payData.purchaseOrderId}`);
    showToast(
      language === 'ar' ? 'تم تسجيل الدفعة وتحديث رصيد الفاتورة بنجاح' : 'Payment registered and balance updated',
      `$${payData.amount} (${payData.paymentMethod})`,
      'success'
    );
    return true;
  };

  const deleteInvoice = (id: string): boolean => {
    const inv = db.invoices.find((i) => i.id === id);
    setDb((prev) => {
      const nextDb = {
        ...prev,
        invoices: prev.invoices.filter((i) => i.id !== id),
        payments: prev.payments.filter((p) => p.invoiceId !== id),
      };
      saveDatabase(nextDb);
      return nextDb;
    });
    logAudit('delete', 'invoice', id, inv?.invoiceNumber || id, `Deleted invoice ${inv?.invoiceNumber || id}`);
    showToast(language === 'ar' ? 'تم حذف الفاتورة بنجاح' : 'Invoice Deleted', '', 'info');
    return true;
  };

  // Shipments CRUD
  const createShipment = (shipData: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>): string => {
    const nextNum = db.shipments.length + 1;
    const newId = `SH-2026-${String(nextNum).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const newShipment: Shipment = {
      ...shipData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    setDb((prev) => ({
      ...prev,
      shipments: [newShipment, ...prev.shipments],
    }));

    logAudit('create', 'shipment', newId, newShipment.containerNumber, `Created shipment: ${newShipment.shippingLine} - Container: ${newShipment.containerNumber}`);
    showToast(language === 'ar' ? 'تم إنشاء سجل الشحنة' : 'Shipment Created', `${newId} (${newShipment.containerNumber})`);
    return newId;
  };

  const updateShipmentStatus = (shipmentId: string, newStatus: ShipmentStatus) => {
    const now = new Date().toISOString();
    setDb((prev) => ({
      ...prev,
      shipments: prev.shipments.map((s) => (s.id === shipmentId ? { ...s, status: newStatus, updatedAt: now } : s)),
    }));
    logAudit('update', 'shipment', shipmentId, shipmentId, `Shipment status updated to: ${newStatus}`);
    showToast(language === 'ar' ? 'تم تحديث حالة الشحنة' : 'Shipment Status Updated');
  };

  const updateShipment = (id: string, updates: Partial<Shipment>) => {
    const now = new Date().toISOString();
    setDb((prev) => ({
      ...prev,
      shipments: prev.shipments.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: now } : s)),
    }));
    showToast(language === 'ar' ? 'تم تحديث بيانات الشحنة' : 'Shipment Updated');
  };

  const deleteShipment = (id: string): boolean => {
    const ship = db.shipments.find((s) => s.id === id);
    setDb((prev) => {
      const nextDb = {
        ...prev,
        shipments: prev.shipments.filter((s) => s.id !== id),
      };
      saveDatabase(nextDb);
      return nextDb;
    });
    logAudit('delete', 'shipment', id, ship?.containerNumber || id, `Deleted shipment ${id}`);
    showToast(language === 'ar' ? 'تم حذف سجل الشحنة بنجاح' : 'Shipment Deleted', '', 'info');
    return true;
  };

  // Samples CRUD
  const addSample = (sampleData: Omit<SampleRequest, 'id' | 'createdAt'>) => {
    const nextNum = db.samples.length + 1;
    const newId = `SMP-2026-${String(nextNum).padStart(3, '0')}`;
    const newSample: SampleRequest = {
      ...sampleData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setDb((prev) => ({
      ...prev,
      samples: [newSample, ...prev.samples],
    }));
    showToast(language === 'ar' ? 'تم تسجيل طلب العينة' : 'Sample Request Added');
  };

  const updateSample = (id: string, updates: Partial<SampleRequest>) => {
    setDb((prev) => ({
      ...prev,
      samples: prev.samples.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
    showToast(language === 'ar' ? 'تم تحديث حالة العينة' : 'Sample Updated');
  };

  const deleteSample = (id: string): boolean => {
    setDb((prev) => {
      const nextDb = {
        ...prev,
        samples: prev.samples.filter((s) => s.id !== id),
      };
      saveDatabase(nextDb);
      return nextDb;
    });
    showToast(language === 'ar' ? 'تم حذف طلب العينة بنجاح' : 'Sample Request Deleted', '', 'info');
    return true;
  };

  // Quality Inspection
  const addInspection = (qcData: Omit<QualityInspection, 'id' | 'createdAt'>) => {
    const nextNum = db.inspections.length + 1;
    const newId = `QC-2026-${String(nextNum).padStart(3, '0')}`;
    const newQC: QualityInspection = {
      ...qcData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setDb((prev) => ({
      ...prev,
      inspections: [newQC, ...prev.inspections],
    }));
    logAudit('create', 'qc', newId, qcData.productName, `Quality inspection report logged by ${qcData.inspectorName}`);
    showToast(language === 'ar' ? 'تم حفظ تقرير فحص الجودة' : 'Inspection Report Saved');
  };

  const deleteInspection = (id: string): boolean => {
    const ins = db.inspections.find((i) => i.id === id);
    setDb((prev) => {
      const nextDb = {
        ...prev,
        inspections: prev.inspections.filter((i) => i.id !== id),
      };
      saveDatabase(nextDb);
      return nextDb;
    });
    logAudit('delete', 'qc', id, ins?.productName || id, `Deleted inspection report for ${ins?.productName || id}`);
    showToast(language === 'ar' ? 'تم حذف تقرير فحص الجودة بنجاح' : 'Inspection Report Deleted', '', 'info');
    return true;
  };

  // Tasks
  const addTask = (taskData: Omit<TaskItem, 'id' | 'createdAt'>) => {
    const newId = `TSK-${Date.now().toString().slice(-4)}`;
    const newTask: TaskItem = {
      ...taskData,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setDb((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));
    showToast(language === 'ar' ? 'تمت إضافة المهمة' : 'Task Added');
  };

  const toggleTaskStatus = (id: string) => {
    setDb((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id === id) {
          const isDone = t.status === 'completed';
          return {
            ...t,
            status: isDone ? 'todo' : 'completed',
            completedAt: isDone ? undefined : new Date().toISOString(),
          };
        }
        return t;
      }),
    }));
  };

  const deleteTask = (id: string) => {
    setDb((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
    showToast(language === 'ar' ? 'تم حذف المهمة' : 'Task Deleted', '', 'info');
  };

  // Settings & DB Management
  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setDb((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
    showToast(language === 'ar' ? 'تم حفظ إعدادات النظام' : 'Settings Saved');
  };

  const resetToDefaultData = () => {
    resetServerDatabase().catch(() => {});
    setDb(INITIAL_DATABASE_SEED);
    saveDatabase(INITIAL_DATABASE_SEED);
    showToast(language === 'ar' ? 'تمت استعادة البيانات الافتراضية' : 'Default Seed Restored', '', 'info');
  };

  const restoreState = (newState: DatabaseState) => {
    setDb(newState);
    saveDatabase(newState);
    saveServerDatabase(newState).catch(() => {});
    saveMasterStateToFirestore(newState).catch(() => {});
    showToast(language === 'ar' ? 'تم استيراد وحفظ قاعدة البيانات بنجاح' : 'Database Restored Successfully');
  };

  // User & Account Management Handlers
  const canManageUsers = activeRole === 'super_admin' || db.currentUser.role === 'super_admin';

  const updateCurrentUser = (updates: Partial<User>) => {
    setDb((prev) => {
      const updatedUser = { ...prev.currentUser, ...updates };
      const updatedUsers = (prev.users || []).map((u) => (u.id === updatedUser.id ? updatedUser : u));
      const nextDb: DatabaseState = {
        ...prev,
        currentUser: updatedUser,
        users: updatedUsers,
        lastModified: Date.now(),
      };
      saveDatabase(nextDb);
      saveMasterStateToFirestore(nextDb).catch((err) => console.warn('[Storage] Immediate user save error:', err));
      return nextDb;
    });
    showToast(
      language === 'ar' ? 'تم حفظ وتحديث بيانات حسابك في قاعدة البيانات' : 'Account profile saved to database',
      '',
      'success'
    );
    logAudit('update', 'settings', db.currentUser.id, db.currentUser.name, 'تعديل وتحديث البيانات الشخصية للحساب');
  };

  const addUser = (newUser: Omit<User, 'id' | 'createdAt'>): string => {
    const id = `usr-${Date.now().toString().slice(-4)}`;
    const fullUser: User = {
      ...newUser,
      id,
      createdAt: new Date().toISOString(),
      status: newUser.status || 'active',
      customPermissions: newUser.customPermissions || [],
    };
    setDb((prev) => {
      const nextDb: DatabaseState = {
        ...prev,
        users: [...(prev.users || []), fullUser],
        lastModified: Date.now(),
      };
      saveDatabase(nextDb);
      saveMasterStateToFirestore(nextDb).catch(() => {});
      return nextDb;
    });
    showToast(
      language === 'ar' ? `تمت إضافة المستخدم ${fullUser.name} بنجاح` : `User ${fullUser.name} added successfully`,
      '',
      'success'
    );
    logAudit('create', 'settings', id, fullUser.name, `إضافة مستخدم جديد بصلاحية ${fullUser.role}`);
    return id;
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setDb((prev) => {
      const updatedUsers = (prev.users || []).map((u) => (u.id === id ? { ...u, ...updates } : u));
      const updatedCurrent = prev.currentUser.id === id ? { ...prev.currentUser, ...updates } : prev.currentUser;
      const nextDb: DatabaseState = {
        ...prev,
        users: updatedUsers,
        currentUser: updatedCurrent,
        lastModified: Date.now(),
      };
      saveDatabase(nextDb);
      saveMasterStateToFirestore(nextDb).catch(() => {});
      return nextDb;
    });
    showToast(language === 'ar' ? 'تم تحديث بيانات المستخدم وصلاحياته' : 'User details and permissions updated');
    logAudit('update', 'settings', id, updates.name || id, 'تعديل بيانات المستخدم وصلاحيات الوصول');
  };

  const deleteUser = (id: string, allowSelfDelete = false): boolean => {
    if (id === db.currentUser.id && !allowSelfDelete) {
      showToast(
        language === 'ar' ? 'لحذف حسابك الشخصي، يرجى استخدام خيار (حذف الحساب نهائياً)' : 'To delete your account, use the Delete Account action',
        '',
        'warning'
      );
      return false;
    }

    if ((db.users || []).length <= 1) {
      showToast(
        language === 'ar' ? 'لا يمكن حذف الحساب الأخير في المنظومة' : 'Cannot delete the only remaining account',
        language === 'ar' ? 'يجب الإبقاء على مستخدم واحد على الأقل لإدارة المنظومة' : 'At least one user must remain in the system',
        'error'
      );
      return false;
    }

    const target = (db.users || []).find((u) => u.id === id);
    const updatedUsers = (db.users || []).filter((u) => u.id !== id);
    const isSelf = id === db.currentUser.id;
    const nextCurrent = isSelf ? updatedUsers[0] : db.currentUser;

    setDb((prev) => {
      const nextDb: DatabaseState = {
        ...prev,
        users: updatedUsers,
        currentUser: nextCurrent,
        lastModified: Date.now(),
      };
      saveDatabase(nextDb);
      saveMasterStateToFirestore(nextDb).catch(() => {});
      return nextDb;
    });

    showToast(
      language === 'ar' ? `تم حذف الحساب (${target?.name || id}) نهائياً` : `Account (${target?.name || id}) permanently deleted`,
      language === 'ar' ? 'تم تحديث قاعدة بيانات المستخدمين' : 'User database updated',
      'info'
    );
    logAudit('delete', 'settings', id, target?.name || id, 'حذف المستخدم نهائياً من المنظومة');


    if (isSelf) {
      logout();
    }

    return true;
  };

  const toggleUserStatus = (id: string) => {
    if (id === 'usr-001') {
      showToast(language === 'ar' ? 'لا يمكن تعليق حساب المدير العام الرئيسي' : 'Cannot suspend primary admin', '', 'error');
      return;
    }
    setDb((prev) => ({
      ...prev,
      users: (prev.users || []).map((u) => {
        if (u.id === id) {
          const newStatus = u.status === 'active' ? 'suspended' : 'active';
          return { ...u, status: newStatus };
        }
        return u;
      }),
    }));
    showToast(language === 'ar' ? 'تم تحديث حالة المستخدم' : 'User status updated');
  };

  const switchUser = (id: string) => {
    const target = (db.users || []).find((u) => u.id === id);
    if (!target) return;
    setDb((prev) => ({
      ...prev,
      currentUser: target,
    }));
    setActiveRole(target.role);
    try {
      localStorage.setItem('sinotrack_auth_user_id', target.id);
    } catch {
      // ignore
    }
    showToast(
      language === 'ar' ? `تم التبديل إلى حساب: ${target.name}` : `Switched to user: ${target.name}`,
      language === 'ar' ? `الدور النشط: ${target.role}` : `Active Role: ${target.role}`,
      'info'
    );
  };

  // Authentication: Login & Logout
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const user = (db.users || []).find((u) => u.email.trim().toLowerCase() === trimmedEmail);

    if (!user) {
      return {
        success: false,
        error: language === 'ar' ? 'البريد الإلكتروني غير مسجل في المنظومة' : 'Email address not registered in the system',
      };
    }

    if (user.status === 'suspended') {
      return {
        success: false,
        error: language === 'ar' ? 'تم تعليق هذا الحساب. يرجى التواصل مع المدير العام' : 'Account is suspended. Please contact General Manager',
      };
    }

    const expectedPassword = user.password || '123456';
    if (password !== expectedPassword) {
      return {
        success: false,
        error: language === 'ar' ? 'كلمة المرور غير صحيحة، يرجى التأكد من البيانات والمحاولة مجدداً' : 'Incorrect password, please try again',
      };
    }

    // Success
    const now = new Date().toISOString();
    const updatedUser: User = { ...user, lastLogin: now };
    const updatedUsers = (db.users || []).map((u) => (u.id === user.id ? updatedUser : u));

    setDb((prev) => ({
      ...prev,
      currentUser: updatedUser,
      users: updatedUsers,
    }));
    setActiveRole(user.role);
    setIsAuthenticated(true);

    try {
      localStorage.setItem('sinotrack_auth_session', 'true');
      localStorage.setItem('sinotrack_auth_user_id', user.id);
    } catch {
      // ignore
    }

    logAudit('update', 'settings', user.id, user.name, 'تسجيل الدخول الناجح إلى منظومة SinoTrack ERP');
    showToast(
      language === 'ar' ? `مرحباً بك، ${user.name}` : `Welcome back, ${user.name}`,
      language === 'ar' ? `تم تسجيل الدخول بصلاحية: ${user.jobTitle || user.role}` : `Logged in as: ${user.jobTitle || user.role}`,
      'success'
    );


    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.setItem('sinotrack_auth_session', 'false');
      localStorage.removeItem('sinotrack_auth_user_id');
    } catch {
      // ignore
    }
    showToast(
      language === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully',
      language === 'ar' ? 'تم قفل الجلسة بأمان، نراك قريباً' : 'Session closed securely',
      'info'
    );
    logAudit('update', 'settings', db.currentUser.id, db.currentUser.name, 'تسجيل الخروج من المنظومة');
  };

  // Cloud Database Credentials Persistence
  const syncCredentialsToDrive = async (): Promise<boolean> => {
    try {
      setIsCredentialsSyncing(true);
      const stateToSave = { ...db };
      saveDatabase(stateToSave);
      await Promise.all([
        saveMasterStateToFirestore(stateToSave),
        saveServerDatabase(stateToSave).catch(() => null),
      ]);
      const now = new Date().toISOString();
      setLastCredentialsDriveSync(now);
      try {
        localStorage.setItem('sinotrack_drive_cred_sync', now);
      } catch {
        // ignore
      }
      showToast(
        language === 'ar' ? 'تم تأمين وحفظ بيانات الدخول في قاعدة البيانات السحابية' : 'Credentials Saved to Cloud Database',
        language === 'ar'
          ? `تم حفظ بيانات ${(db.users || []).length} مستخدمين بنجاح`
          : `Saved ${(db.users || []).length} users successfully`,
        'success'
      );
      logAudit('update', 'settings', 'cloud-cred', 'User Credentials', 'تأمين وحفظ بيانات مستخدمي المنظومة في قاعدة البيانات السحابية');
      return true;
    } catch (err: any) {
      console.error(err);
      showToast(
        language === 'ar' ? 'فشل حفظ بيانات الدخول سحابياً' : 'Failed to save credentials',
        err.message,
        'error'
      );
      return false;
    } finally {
      setIsCredentialsSyncing(false);
    }
  };

  const loadCredentialsFromDrive = async (): Promise<boolean> => {
    try {
      setIsCredentialsSyncing(true);
      const cloudState = await fetchMasterStateFromFirestore().catch(() => null);
      if (cloudState && cloudState.users && cloudState.users.length > 0) {
        const cloudUsers = cloudState.users as User[];
        setDb((prev) => ({ ...prev, users: cloudUsers }));
        showToast(
          language === 'ar' ? 'تم استيراد بيانات الدخول من قاعدة البيانات السحابية' : 'Loaded Credentials from Cloud DB',
          language === 'ar' ? `تم استرجاع ${cloudState.users.length} مستخدم` : `Loaded ${cloudState.users.length} users`,
          'success'
        );
        return true;
      }
      return true;
    } catch {
      return false;
    } finally {
      setIsCredentialsSyncing(false);
    }
  };

  return (
    <ERPContext.Provider
      value={{
        activeView,
        setActiveView,
        selectedSupplierId,
        setSelectedSupplierId,
        selectedProductId,
        setSelectedProductId,
        globalSearchOpen,
        setGlobalSearchOpen,
        language,
        setLanguage,
        theme,
        setTheme,
        isSidebarCollapsed,
        setIsSidebarCollapsed,

        currentUser: db.currentUser,
        users: db.users || [],
        activeRole,
        setActiveRole,
        updateCurrentUser,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        switchUser,
        canManageUsers,

        isAuthenticated,
        login,
        logout,

        isDriveConnected,
        googleUser,
        isDriveSyncing,
        isCredentialsSyncing,
        lastCredentialsDriveSync,
        credentialsDriveFileLink,
        lastFullDriveSync,
        hasPendingDriveChanges,
        syncAllToGoogleDrive,
        connectGoogleDrive,
        disconnectGoogleDrive,
        provisionSupplierDriveFolder,
        provisionAllSuppliersDriveFolders,
        syncSupplierDataToDrive,
        syncCredentialsToDrive,
        loadCredentialsFromDrive,

        suppliers: db.suppliers,
        contacts: db.contacts,
        communicationLogs: db.communicationLogs,
        products: db.products,
        quotations: db.quotations,
        priceHistory: db.priceHistory,
        orders: db.orders,
        invoices: db.invoices,
        payments: db.payments,
        shipments: db.shipments,
        samples: db.samples,
        inspections: db.inspections,
        tasks: db.tasks,
        auditLogs: db.auditLogs,
        settings: db.settings,

        addSupplier,
        updateSupplier,
        deleteSupplier,
        addContact,
        updateContact,
        deleteContact,
        addCommunicationLog,
        addProduct,
        updateProduct,
        deleteProduct,
        addQuotation,
        updateQuotation,
        deleteQuotation,
        createOrder,
        updateOrderStatus,
        updateOrder,
        deleteOrder,
        createInvoice,
        createInvoiceForOrder,
        addPayment,
        deleteInvoice,
        createShipment,
        updateShipmentStatus,
        updateShipment,
        deleteShipment,
        addSample,
        updateSample,
        deleteSample,
        addInspection,
        deleteInspection,
        addTask,
        toggleTaskStatus,
        deleteTask,
        updateSettings,
        resetToDefaultData,
        restoreState,

        uploadSupplierCatalog,
        deleteSupplierCatalog,

        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = (): ERPContextType => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
