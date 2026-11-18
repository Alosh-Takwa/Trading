import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculatePOTotals, calculateInvoiceBalance, calculatePriceDiffPercent, convertCurrency, formatMoney } from '../src/utils/erpLogic';
import { POItem, SupplierCatalog } from '../src/types/erp';

describe('ERP Logic Calculations', () => {
  test('calculatePOTotals calculates correct subtotal, savings and grand total', () => {
    const items: POItem[] = [
      {
        id: 'POI-1',
        productId: 'PRD-001',
        productName: 'طباخ حثي ذكي - Smart Induction Cooker',
        modelNumber: 'IC-9900',
        specsSummary: '2200W, Touch Control',
        quantity: 500,
        currency: 'USD',
        originalQuotedPrice: 28,
        negotiatedUnitPrice: 24, // $4 savings per unit = $2000 total savings
        totalItemAmount: 12000,
      },
    ];

    const result = calculatePOTotals(items, { packagingCost: 200, freightLocalCost: 300 }, 500, 0);

    assert.equal(result.subtotal, 12000);
    assert.equal(result.totalAdditionalCosts, 500);
    assert.equal(result.totalSavingsVsOriginalQuote, 2000);
    assert.equal(result.grandTotal, 12000);
  });

  test('calculateInvoiceBalance calculates remaining balance due and status', () => {
    const result = calculateInvoiceBalance(10000, 1000, [{ amount: 3000 }, { amount: 2000 }]);
    assert.equal(result.paidAmount, 5000);
    assert.equal(result.balanceDue, 4000); // 10000 - 1000 - 5000 = 4000
    assert.equal(result.status, 'partially_paid');
  });

  test('calculatePriceDiffPercent computes accurate difference percentage', () => {
    const diff = calculatePriceDiffPercent(20, 25); // (25-20)/20 = 25%
    assert.equal(diff, 25);
  });

  test('convertCurrency handles USD to Syrian Pound (SYP) and custom currencies', () => {
    const rates = {
      USD: 1,
      CNY: 7.23,
      SYP: 15000,
      TRY: 35,
    };

    // 100 USD to SYP at 15000 rate
    const sypAmount = convertCurrency(100, 'USD', 'SYP' as any, rates);
    assert.equal(sypAmount, 1500000);

    // 3,000,000 SYP to USD
    const usdFromSyp = convertCurrency(3000000, 'SYP' as any, 'USD', rates);
    assert.equal(usdFromSyp, 200);

    // Custom currency TRY to SYP (100 TRY = $2.857 USD = ~42857.14 SYP)
    const sypFromTry = convertCurrency(350, 'TRY' as any, 'SYP' as any, rates);
    assert.equal(sypFromTry, 150000);
  });

  test('formatMoney formats Syrian Pound with proper symbols', () => {
    const formattedAr = formatMoney(1500000, 'SYP' as any, 'ar');
    assert.match(formattedAr, /ل\.س/);

    const formattedEn = formatMoney(1500000, 'SYP' as any, 'en');
    assert.match(formattedEn, /SYP/);
  });

  test('calculatePOTotals handles editing items and recalculating totals correctly', () => {
    // Simulated edited PO items
    const editedItems: POItem[] = [
      {
        id: 'POI-1',
        productId: 'PRD-001',
        productName: 'ثلاجة 550 لتر',
        modelNumber: 'HR-550F',
        specsSummary: '',
        quantity: 100,
        currency: 'USD',
        originalQuotedPrice: 350,
        negotiatedUnitPrice: 320, // $30 savings x 100 = $3000 savings
        totalItemAmount: 32000,
      },
      {
        id: 'POI-2',
        productId: 'PRD-002',
        productName: 'غسالة 10 كغ',
        modelNumber: 'WM-1000',
        specsSummary: '',
        quantity: 50,
        currency: 'USD',
        originalQuotedPrice: 200,
        negotiatedUnitPrice: 180, // $20 savings x 50 = $1000 savings
        totalItemAmount: 9000,
      },
    ];

    const additionalCosts = {
      packagingCost: 500,
      moldCost: 0,
      sampleCost: 0,
      freightLocalCost: 800,
      otherCost: 200,
    };

    const totals = calculatePOTotals(editedItems, additionalCosts, 0, 0);

    assert.equal(totals.subtotal, 41000);
    assert.equal(totals.totalAdditionalCosts, 1500);
    assert.equal(totals.totalSavingsVsOriginalQuote, 4000); // 3000 + 1000
    assert.equal(totals.grandTotal, 42500); // 41000 + 1500
  });

  test('resolveBestDatabaseState accurately picks most recent or richer state', async () => {
    const { resolveBestDatabaseState, INITIAL_DATABASE_SEED } = await import('../src/services/storage');

    const emptySeed = { ...INITIAL_DATABASE_SEED, lastModified: 0 };
    const userModified = {
      ...INITIAL_DATABASE_SEED,
      lastModified: Date.now(),
      suppliers: [
        ...INITIAL_DATABASE_SEED.suppliers,
        {
          ...INITIAL_DATABASE_SEED.suppliers[0],
          id: 'sup-user-new',
          nameEn: 'User Added Factory',
          nameCn: '用户工厂',
        },
      ],
    };

    const best = resolveBestDatabaseState(emptySeed, userModified);
    assert.ok(best !== null);
    assert.equal(best.suppliers.length, INITIAL_DATABASE_SEED.suppliers.length + 1);
    assert.equal(best.lastModified, userModified.lastModified);
  });

  test('SupplierCatalog data model stores fileDataUrl and mimeType for direct database storage', () => {
    const catalog: SupplierCatalog = {
      id: 'CAT-12345',
      supplierId: 'SUP-001',
      name: 'Midea_Home_Appliances_Catalog_2026.pdf',
      fileSize: '4.82 MB',
      fileDataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr...',
      mimeType: 'application/pdf',
      uploadedAt: '2026-11-04T03:10:00.000Z',
    };

    assert.equal(catalog.supplierId, 'SUP-001');
    assert.equal(catalog.mimeType, 'application/pdf');
    assert.ok(catalog.fileDataUrl?.startsWith('data:application/pdf'));
    assert.equal(catalog.fileSize, '4.82 MB');
  });

  test('resolveBestDatabaseState preserves user custom profile avatar and customizations', async () => {
    const { resolveBestDatabaseState, INITIAL_DATABASE_SEED } = await import('../src/services/storage');

    const defaultSeed = { ...INITIAL_DATABASE_SEED, lastModified: 1000 };
    const customUserAvatar = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...customUserAvatarData';
    const stateWithCustomAvatar = {
      ...INITIAL_DATABASE_SEED,
      lastModified: 2000,
      currentUser: {
        ...INITIAL_DATABASE_SEED.currentUser,
        avatar: customUserAvatar,
      },
    };

    const chosen = resolveBestDatabaseState(defaultSeed, stateWithCustomAvatar);
    assert.ok(chosen !== null);
    assert.equal(chosen.currentUser.avatar, customUserAvatar);
  });

  test('products retain device-uploaded image Data URLs across state updates', async () => {
    const { resolveBestDatabaseState, INITIAL_DATABASE_SEED } = await import('../src/services/storage');

    const deviceImageDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD_PRODUCT_IMAGE_BASE64_DATA';
    const newProduct = {
      ...INITIAL_DATABASE_SEED.products[0],
      id: 'PRD-TEST-DEVICE-IMG',
      nameAr: 'غسالة ذكية بتحميل علوي',
      modelNumber: 'WM-ORIENT-2026',
      images: [
        {
          id: 'IMG-1',
          url: deviceImageDataUrl,
          caption: 'WM-ORIENT-2026',
          type: 'primary' as const,
        },
      ],
    };

    const stateWithDeviceImage = {
      ...INITIAL_DATABASE_SEED,
      lastModified: Date.now() + 5000,
      products: [newProduct, ...INITIAL_DATABASE_SEED.products],
    };

    const chosen = resolveBestDatabaseState(INITIAL_DATABASE_SEED, stateWithDeviceImage);
    assert.ok(chosen !== null);
    const found = chosen.products.find((p) => p.id === 'PRD-TEST-DEVICE-IMG');
    assert.ok(found);
    assert.equal(found.images[0].url, deviceImageDataUrl);
  });

  test('parseSpecNumericValue accurately extracts numbers from BTU, capacity, and wattage specs', async () => {
    const { parseSpecNumericValue, calculateSpecCostRatio } = await import('../src/utils/erpLogic');

    assert.equal(parseSpecNumericValue('18,000 BTU'), 18000);
    assert.equal(parseSpecNumericValue('24000 BTU/h'), 24000);
    assert.equal(parseSpecNumericValue('10.5 kg'), 10.5);
    assert.equal(parseSpecNumericValue('550 L'), 550);
    assert.equal(parseSpecNumericValue('2200 W'), 2200);
    assert.equal(parseSpecNumericValue('No Frost'), null);

    // Cost ratio calculation
    const acQuote = calculateSpecCostRatio(180, '18,000 BTU');
    assert.equal(acQuote.numericValue, 18000);
    assert.equal(acQuote.costPerUnit, 0.01);
    assert.equal(acQuote.formattedRatio, '$0.0100');

    const washerQuote = calculateSpecCostRatio(120, '10 kg');
    assert.equal(washerQuote.numericValue, 10);
    assert.equal(washerQuote.costPerUnit, 12);
    assert.equal(washerQuote.formattedRatio, '$12.0');
  });

  test('matchesSpecCriterion correctly matches category products by target specification and capacity/weight', async () => {
    const { matchesSpecCriterion } = await import('../src/utils/erpLogic');

    const acSpecs = [
      { key: 'cooling_capacity', label: 'القدرة التبريدية (Cooling Capacity)', value: '24000', unit: 'BTU' },
      { key: 'gas', label: 'نوع الغاز', value: 'R410A' },
    ];

    const washerSpecs = [
      { key: 'capacity', label: 'سعة الغسيل (Wash Capacity)', value: '10 kg', unit: 'kg' },
    ];

    assert.equal(matchesSpecCriterion(acSpecs, 'القدرة التبريدية', '24000'), true);
    assert.equal(matchesSpecCriterion(acSpecs, 'cooling_capacity', '24000'), true);
    assert.equal(matchesSpecCriterion(acSpecs, 'القدرة التبريدية', '24k'), true);
    assert.equal(matchesSpecCriterion(acSpecs, 'القدرة التبريدية', '18000'), false);
    assert.equal(matchesSpecCriterion(acSpecs, 'القدرة التبريدية', '12000'), false);
    assert.equal(matchesSpecCriterion(acSpecs, 'القدرة التبريدية', 'all'), true);
    assert.equal(matchesSpecCriterion(acSpecs, 'القدرة التبريدية', ''), true);

    const ac12kSpecs = [
      { key: 'cooling_capacity', label: 'القدرة التبريدية (Cooling Capacity)', value: '12000', unit: 'BTU' },
    ];
    assert.equal(matchesSpecCriterion(ac12kSpecs, 'القدرة التبريدية', '24000'), false);
    assert.equal(matchesSpecCriterion(ac12kSpecs, 'القدرة التبريدية', '18000'), false);
    assert.equal(matchesSpecCriterion(ac12kSpecs, 'القدرة التبريدية', '12000'), true);
    assert.equal(matchesSpecCriterion(ac12kSpecs, 'القدرة التبريدية', '12k'), true);

    assert.equal(matchesSpecCriterion(washerSpecs, 'سعة الغسيل', '10 kg'), true);
    assert.equal(matchesSpecCriterion(washerSpecs, 'سعة الغسيل', '10'), true);
    assert.equal(matchesSpecCriterion(washerSpecs, 'سعة الغسيل', '7 kg'), false);
    assert.equal(matchesSpecCriterion(washerSpecs, 'سعة الغسيل', '8'), false);
  });

  test('mergeCategorySpecifications preserves entered values and custom specs when category changes', async () => {
    const { mergeCategorySpecifications } = await import('../src/utils/erpLogic');

    const enteredSpecs = [
      { key: 'spec_0', label: 'القدرة التبريدية (Cooling Capacity)', value: '24000', unit: 'BTU' },
      { key: 'spec_1', label: 'نوع الغاز', value: 'R410A' },
      { key: 'custom_123', label: 'طول الأنبوب النحاسي', value: '4m' },
    ];

    const newCategoryTemplate = [
      { label: 'القدرة التبريدية (Cooling Capacity)', unit: 'BTU' },
      { label: 'ضاغط إنفيرتر (Inverter)' },
    ];

    const merged = mergeCategorySpecifications(enteredSpecs, newCategoryTemplate);
    const cooling = merged.find((s) => s.label.includes('Cooling Capacity'));
    assert.ok(cooling);
    assert.equal(cooling?.value, '24000');

    // Custom spec with value must be preserved!
    const custom = merged.find((s) => s.label === 'طول الأنبوب النحاسي');
    assert.ok(custom);
    assert.equal(custom?.value, '4m');
  });

  test('resolveQuotationSupplier aligns to product supplier and prevents supplier cross-talk', async () => {
    const { resolveQuotationSupplier } = await import('../src/utils/erpLogic');

    const suppliers = [
      { id: 'SUP-001', nameEn: 'MANJA TECHNOLOGIES CO., Ltd' },
      { id: 'SUP-002', nameEn: 'KEG Group Co. Ltd' },
    ];

    // Case 1: Product belongs to SUP-002 (KEG) and no explicit override -> must resolve to SUP-002!
    const res1 = resolveQuotationSupplier(undefined, 'SUP-002', suppliers);
    assert.equal(res1.supplierId, 'SUP-002');
    assert.equal(res1.supplierName, 'KEG Group Co. Ltd');

    // Case 2: Product belongs to SUP-001 (MANJA) -> must resolve to SUP-001!
    const res2 = resolveQuotationSupplier(undefined, 'SUP-001', suppliers);
    assert.equal(res2.supplierId, 'SUP-001');
    assert.equal(res2.supplierName, 'MANJA TECHNOLOGIES CO., Ltd');

    // Case 3: Explicit override by user -> must respect override
    const res3 = resolveQuotationSupplier('SUP-002', 'SUP-001', suppliers);
    assert.equal(res3.supplierId, 'SUP-002');
  });

  test('maskEmail obfuscates email domain while keeping prefix and extension readable', async () => {
    const { maskEmail } = await import('../src/utils/erpLogic');

    assert.equal(maskEmail('alosh.takwa@gmail.com'), 'alosh.takwa@g***.com');
    assert.equal(maskEmail('k.mansour@orientappliances.com'), 'k.mansour@o***.com');
    assert.equal(maskEmail('s.saeed@orientappliances.com'), 's.saeed@o***.com');
    assert.equal(maskEmail('t.faisal@orientappliances.com'), 't.faisal@o***.com');
    assert.equal(maskEmail('n.otaibi@orientappliances.com'), 'n.otaibi@o***.com');
    assert.equal(maskEmail('admin@corp.io'), 'admin@c***.io');
    assert.equal(maskEmail('invalid-email'), 'invalid-email');
  });

  test('INITIAL_USERS and resolveBestDatabaseState provides all 5 platform accounts', async () => {
    const { INITIAL_USERS, resolveBestDatabaseState } = await import('../src/services/storage');

    assert.equal(INITIAL_USERS.length, 5);
    const roles = INITIAL_USERS.map((u) => u.role);
    assert.ok(roles.includes('super_admin'));
    assert.ok(roles.includes('procurement_manager'));
    assert.ok(roles.includes('finance'));
    assert.ok(roles.includes('shipping_manager'));
    assert.ok(roles.includes('viewer'));

    // Test that when a single-user state is passed, resolveBestDatabaseState merges all 5 accounts
    const singleUserState: any = {
      suppliers: [{ id: 'SUP-NEW', nameEn: 'Test' }],
      users: [{ id: 'usr-001', name: 'Alosh Takwa', email: 'alosh.takwa@gmail.com' }],
      lastModified: 1000,
    };
    const resolved = resolveBestDatabaseState(singleUserState);
    assert.ok(resolved);
    assert.equal(resolved?.users?.length, 5);
  });

  test('resolveBestDatabaseState performs additive union merge: no product, supplier, or quotation is ever lost', async () => {
    const { resolveBestDatabaseState, INITIAL_DATABASE_SEED } = await import('../src/services/storage');

    // Candidate 1 (e.g. from Cloud): has Supplier A, Product 1, Quote 1
    const cand1: any = {
      ...INITIAL_DATABASE_SEED,
      lastModified: 1000,
      suppliers: [{ id: 'SUP-001', nameEn: 'Supplier Alpha' }],
      products: [{ id: 'PRD-001', nameAr: 'منتج 1', specifications: [{ label: 'سعة', value: '10' }] }],
      quotations: [{ id: 'QT-001', unitPrice: 100, date: '2026-08-01' }],
    };

    // Candidate 2 (e.g. from LocalStorage entered by user): has Supplier B, Product 2, Quote 2
    const cand2: any = {
      ...INITIAL_DATABASE_SEED,
      lastModified: 2000,
      suppliers: [{ id: 'SUP-002', nameEn: 'Supplier Beta' }],
      products: [{ id: 'PRD-002', nameAr: 'منتج 2', specifications: [{ label: 'سعة', value: '18' }] }],
      quotations: [{ id: 'QT-002', unitPrice: 200, date: '2026-08-02' }],
    };

    const merged = resolveBestDatabaseState(cand1, cand2);
    assert.ok(merged);
    // Both suppliers must be present!
    assert.equal(merged.suppliers.length, 2);
    assert.ok(merged.suppliers.some((s: any) => s.id === 'SUP-001'));
    assert.ok(merged.suppliers.some((s: any) => s.id === 'SUP-002'));

    // Both products must be present!
    assert.equal(merged.products.length, 2);
    assert.ok(merged.products.some((p: any) => p.id === 'PRD-001'));
    assert.ok(merged.products.some((p: any) => p.id === 'PRD-002'));

    // Both quotations must be present!
    assert.equal(merged.quotations.length, 2);
    assert.ok(merged.quotations.some((q: any) => q.id === 'QT-001'));
    assert.ok(merged.quotations.some((q: any) => q.id === 'QT-002'));
  });

  test('sanitizeForFirestore removes undefined fields across nested objects and arrays without altering valid falsy values', async () => {
    const { sanitizeForFirestore, buildMasterStateFirestorePayload, hasUnsyncedCloudEntities } = await import('../src/utils/firestoreSanitizer');

    const dirtySupplier = {
      id: 'SUP-003',
      nameEn: 'Chigo',
      nameCn: undefined,
      factoryName: undefined,
      website: undefined,
      phone: '',
      rating: {
        overallScore: 4.5,
        extraNote: undefined,
        zeroVal: 0,
        active: false,
      },
      catalogs: [
        { id: 'CAT-1', name: 'Catalog.pdf', fileDataUrl: 'data:application/pdf;base64,' + 'A'.repeat(40000), mimeType: undefined },
      ],
    };

    const cleaned = sanitizeForFirestore(dirtySupplier);
    assert.equal('nameCn' in cleaned, false);
    assert.equal('factoryName' in cleaned, false);
    assert.equal('website' in cleaned, false);
    assert.equal(cleaned.phone, '');
    assert.equal(cleaned.rating.zeroVal, 0);
    assert.equal(cleaned.rating.active, false);
    assert.equal('extraNote' in cleaned.rating, false);
    assert.equal('mimeType' in cleaned.catalogs[0], false);

    // Master state payload must strip oversized fileDataUrl and all undefined properties
    const payload = buildMasterStateFirestorePayload({
      version: 1,
      suppliers: [dirtySupplier],
      products: [{ id: 'PRD-011', nameAr: 'غسالة', nameCn: undefined, supplierId: 'SUP-001', images: [{ id: '1', url: '' }] }],
      catalogs: dirtySupplier.catalogs,
    });
    const serialized = JSON.stringify(payload);
    assert.equal(serialized.includes('undefined'), false);
    assert.equal((payload.catalogs as any[])[0].fileDataUrl, undefined);
    assert.equal((payload.suppliers as any[])[0].catalogs[0].fileDataUrl, undefined);

    // hasUnsyncedCloudEntities detects local supplier/product missing from cloud snapshot
    assert.equal(
      hasUnsyncedCloudEntities(
        { suppliers: [{ id: 'SUP-001' }, { id: 'SUP-002' }, { id: 'SUP-003' }], products: [] },
        { suppliers: [{ id: 'SUP-001' }, { id: 'SUP-002' }], products: [] }
      ),
      true
    );
    assert.equal(
      hasUnsyncedCloudEntities(
        { suppliers: [{ id: 'SUP-001' }, { id: 'SUP-002' }], products: [] },
        { suppliers: [{ id: 'SUP-001' }, { id: 'SUP-002' }], products: [] }
      ),
      false
    );
  });
});






