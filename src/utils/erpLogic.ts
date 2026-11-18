/**
 * Pure calculation logic for SinoTrack ERP
 * Decoupled for unit testing and deterministic verification
 */

import * as XLSX from 'xlsx';
import { 
  POItem, 
  CurrencyCode, 
  LandedCostItem, 
  CostDistributionMethod, 
  SupplierRating 
} from '../types/erp';

export interface POTotalsResult {
  subtotal: number;
  totalDiscount: number;
  totalAdditionalCosts: number;
  totalTax: number;
  grandTotal: number;
  totalSavingsVsOriginalQuote: number;
}

/**
 * Calculates PO financial totals, preserving original quoted prices and tracking negotiation savings
 */
export function calculatePOTotals(
  items: POItem[],
  additionalCosts: {
    packagingCost?: number;
    moldCost?: number;
    sampleCost?: number;
    freightLocalCost?: number;
    otherCost?: number;
  } = {},
  manualDiscount: number = 0,
  taxRatePercent: number = 0
): POTotalsResult {
  let subtotal = 0;
  let itemDiscounts = 0;
  let totalSavingsVsOriginalQuote = 0;

  for (const item of items) {
    const itemSubtotal = item.quantity * item.negotiatedUnitPrice;
    const discount = item.discountPercentage ? (itemSubtotal * item.discountPercentage) / 100 : 0;
    const itemTotal = itemSubtotal - discount;

    subtotal += itemSubtotal;
    itemDiscounts += discount;

    if (item.originalQuotedPrice > 0 && item.originalQuotedPrice > item.negotiatedUnitPrice) {
      totalSavingsVsOriginalQuote += (item.originalQuotedPrice - item.negotiatedUnitPrice) * item.quantity;
    }
  }

  const packaging = Number(additionalCosts.packagingCost || 0);
  const mold = Number(additionalCosts.moldCost || 0);
  const sample = Number(additionalCosts.sampleCost || 0);
  const freightLocal = Number(additionalCosts.freightLocalCost || 0);
  const other = Number(additionalCosts.otherCost || 0);
  const totalAdditionalCosts = packaging + mold + sample + freightLocal + other;

  const totalDiscount = itemDiscounts + Number(manualDiscount || 0);
  const taxableAmount = Math.max(0, subtotal - totalDiscount + totalAdditionalCosts);
  const totalTax = (taxableAmount * Number(taxRatePercent || 0)) / 100;
  const grandTotal = Math.max(0, taxableAmount + totalTax);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    totalAdditionalCosts: Math.round(totalAdditionalCosts * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    totalSavingsVsOriginalQuote: Math.round(totalSavingsVsOriginalQuote * 100) / 100,
  };
}

/**
 * Calculates remaining balance and invoice status
 */
export function calculateInvoiceBalance(
  totalAmount: number,
  discount: number,
  payments: { amount: number }[]
): { paidAmount: number; balanceDue: number; status: 'unpaid' | 'partially_paid' | 'paid' } {
  const netDue = Math.max(0, totalAmount - (discount || 0));
  const paidAmount = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const balanceDue = Math.max(0, Math.round((netDue - paidAmount) * 100) / 100);

  let status: 'unpaid' | 'partially_paid' | 'paid' = 'unpaid';
  if (paidAmount >= netDue && netDue > 0) {
    status = 'paid';
  } else if (paidAmount > 0) {
    status = 'partially_paid';
  }

  return {
    paidAmount: Math.round(paidAmount * 100) / 100,
    balanceDue,
    status,
  };
}

/**
 * Calculates Landed Cost (التكلفة الفعلية للاستيراد) by distributing extra import costs
 * across items using either value, volume (CBM), gross weight, or quantity.
 */
export interface ExtraImportCosts {
  seaFreightCost: number;
  insuranceCost: number;
  customsDutyCost: number;
  portClearanceCost: number;
  internalTruckingCost: number;
  miscInspectionCost: number;
}

export function calculateLandedCost(
  rawItems: {
    productId: string;
    productName: string;
    modelNumber: string;
    quantity: number;
    fobUnitPrice: number;
    weightKg?: number;
    volumeCbm?: number;
  }[],
  costs: ExtraImportCosts,
  method: CostDistributionMethod = 'by_value'
): { items: LandedCostItem[]; totalFobGoodsCost: number; totalImportCosts: number; grandTotalLandedCost: number } {
  const totalFobGoodsCost = rawItems.reduce((acc, i) => acc + i.quantity * i.fobUnitPrice, 0);
  const totalWeight = rawItems.reduce((acc, i) => acc + (i.weightKg || 1) * i.quantity, 0);
  const totalCbm = rawItems.reduce((acc, i) => acc + (i.volumeCbm || 0.1) * i.quantity, 0);
  const totalQty = rawItems.reduce((acc, i) => acc + i.quantity, 0);

  const totalOtherCosts = 
    costs.seaFreightCost + 
    costs.insuranceCost + 
    costs.customsDutyCost + 
    costs.portClearanceCost + 
    costs.internalTruckingCost + 
    costs.miscInspectionCost;

  const items: LandedCostItem[] = rawItems.map((item) => {
    const totalFobCost = item.quantity * item.fobUnitPrice;
    let ratio = 0;

    if (method === 'by_weight' && totalWeight > 0) {
      ratio = ((item.weightKg || 1) * item.quantity) / totalWeight;
    } else if (method === 'by_cbm' && totalCbm > 0) {
      ratio = ((item.volumeCbm || 0.1) * item.quantity) / totalCbm;
    } else if (method === 'by_quantity' && totalQty > 0) {
      ratio = item.quantity / totalQty;
    } else {
      // default: by_value
      ratio = totalFobGoodsCost > 0 ? totalFobCost / totalFobGoodsCost : 1 / (rawItems.length || 1);
    }

    const allocatedFreight = costs.seaFreightCost * ratio;
    const allocatedInsurance = costs.insuranceCost * ratio;
    const allocatedCustoms = costs.customsDutyCost * ratio;
    const allocatedPort = costs.portClearanceCost * ratio;
    const allocatedTrucking = costs.internalTruckingCost * ratio;
    const allocatedOther = costs.miscInspectionCost * ratio;

    const totalAllocatedImportCost = 
      allocatedFreight + 
      allocatedInsurance + 
      allocatedCustoms + 
      allocatedPort + 
      allocatedTrucking + 
      allocatedOther;

    const landedUnitCost = item.quantity > 0 
      ? item.fobUnitPrice + (totalAllocatedImportCost / item.quantity)
      : item.fobUnitPrice;

    const landedMarkupPercent = item.fobUnitPrice > 0
      ? ((landedUnitCost - item.fobUnitPrice) / item.fobUnitPrice) * 100
      : 0;

    return {
      productId: item.productId,
      productName: item.productName,
      modelNumber: item.modelNumber,
      quantity: item.quantity,
      fobUnitPrice: Math.round(item.fobUnitPrice * 100) / 100,
      totalFobCost: Math.round(totalFobCost * 100) / 100,
      weightKg: item.weightKg,
      volumeCbm: item.volumeCbm,
      allocatedFreightCost: Math.round(allocatedFreight * 100) / 100,
      allocatedInsuranceCost: Math.round(allocatedInsurance * 100) / 100,
      allocatedCustomsDuty: Math.round(allocatedCustoms * 100) / 100,
      allocatedPortFees: Math.round(allocatedPort * 100) / 100,
      allocatedInternalTransport: Math.round(allocatedTrucking * 100) / 100,
      allocatedOtherCost: Math.round(allocatedOther * 100) / 100,
      totalImportCosts: Math.round(totalAllocatedImportCost * 100) / 100,
      finalLandedUnitCost: Math.round(landedUnitCost * 100) / 100,
      landedMarkupPercent: Math.round(landedMarkupPercent * 10) / 10,
    };
  });

  return {
    items,
    totalFobGoodsCost: Math.round(totalFobGoodsCost * 100) / 100,
    totalImportCosts: Math.round(totalOtherCosts * 100) / 100,
    grandTotalLandedCost: Math.round((totalFobGoodsCost + totalOtherCosts) * 100) / 100,
  };
}

/**
 * Calculates supplier composite rating
 */
export function calculateSupplierRating(ratings: Omit<SupplierRating, 'overallScore'>): number {
  const keys: (keyof Omit<SupplierRating, 'overallScore' | 'notes' | 'evaluatedBy' | 'updatedAt'>)[] = [
    'productQuality',
    'priceCompetitiveness',
    'responseTime',
    'deliveryTimeliness',
    'packagingQuality',
    'specAccuracy',
    'negotiationFlexibility',
    'communicationQuality',
    'punctuality',
    'problemSolving',
  ];

  let sum = 0;
  for (const k of keys) {
    sum += Number(ratings[k] || 0);
  }

  const score = keys.length > 0 ? sum / keys.length : 0;
  return Math.round(score * 10) / 10;
}

/**
 * Converts currency using defined exchange rates against USD
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: { [key: string]: number }
): number {
  if (from === to) return amount;
  // Convert from origin to USD, then USD to destination
  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;
  const inUSD = amount / fromRate;
  const result = inUSD * toRate;
  return Math.round(result * 100) / 100;
}

/**
 * Formats monetary amounts with currency symbol and localization
 */
export function formatMoney(amount: number, currency: CurrencyCode = 'USD', lang: 'ar' | 'en' = 'ar'): string {
  const formatted = new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);

  const symbols: Record<string, { ar: string; en: string }> = {
    USD: { ar: '$ دولار', en: 'USD $' },
    CNY: { ar: '¥ يوان', en: 'CNY ¥' },
    SAR: { ar: 'ر.س', en: 'SAR' },
    EUR: { ar: '€ يورو', en: 'EUR €' },
    AED: { ar: 'د.إ', en: 'AED' },
    SYP: { ar: 'ل.س (سوري)', en: 'SYP' },
  };

  const symbol = symbols[currency]?.[lang] || currency;
  return lang === 'ar' ? `${formatted} ${symbol}` : `${symbol} ${formatted}`;
}

/**
 * Price History percentage diff
 */
export function calculatePriceDiffPercent(oldPrice: number, newPrice: number): number {
  if (!oldPrice || oldPrice === 0) return 0;
  const diff = ((newPrice - oldPrice) / oldPrice) * 100;
  return Math.round(diff * 10) / 10;
}

/**
 * Export data to Excel file (.xlsx)
 */
export function exportToExcel(sheetName: string, data: Record<string, any>[], filename: string): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Export data to CSV
 */
export function exportToCSV(data: Record<string, any>[], filename: string): void {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
  );
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export HTML / Rich Data Sheet to Word Document (.doc format compatible with MS Word)
 */
export function exportToWordDoc(title: string, bodyHtml: string, filename: string): void {
  const content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1e293b; direction: rtl; }
        h1, h2, h3 { color: #0f172a; }
        table { border-collapse: collapse; width: 100%; margin: 16px 0; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: right; }
        th { background-color: #f1f5f9; font-weight: bold; }
        .badge { background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
      </style>
    </head>
    <body>
      ${bodyHtml}
    </body>
    </html>
  `;
  const blob = new Blob(['\uFEFF' + content], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.doc`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Extracts the first positive numeric value from a specification string
 * e.g. "18,000 BTU" -> 18000, "10 kg" -> 10, "550 L" -> 550, "2000 W" -> 2000
 */
export function parseSpecNumericValue(val: string | number | boolean | undefined | null): number | null {
  if (val === undefined || val === null || typeof val === 'boolean') return null;
  const str = String(val).replace(/,/g, '').trim();
  const match = str.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return isNaN(num) || num <= 0 ? null : num;
}

/**
 * Calculates cost-efficiency ratio for a specification (e.g. Unit Price per BTU or per kg/L)
 */
export function calculateSpecCostRatio(price: number, specValue: string | number | boolean | undefined | null): {
  numericValue: number | null;
  costPerUnit: number | null;
  formattedRatio: string;
} {
  const numericValue = parseSpecNumericValue(specValue);
  if (!numericValue || price <= 0) {
    return {
      numericValue: null,
      costPerUnit: null,
      formattedRatio: '-',
    };
  }

  const costPerUnit = price / numericValue;
  let formattedRatio = '';
  if (costPerUnit < 0.1) {
    formattedRatio = `$${costPerUnit.toFixed(4)}`;
  } else if (costPerUnit < 10) {
    formattedRatio = `$${costPerUnit.toFixed(2)}`;
  } else {
    formattedRatio = `$${costPerUnit.toFixed(1)}`;
  }

  return {
    numericValue,
    costPerUnit: Math.round(costPerUnit * 10000) / 10000,
    formattedRatio,
  };
}

/**
 * Normalizes spec value or label for robust comparison (e.g. "24,000 BTU" vs "24000" vs "24000 btu")
 */
export function normalizeSpecValue(val: string | number | boolean | undefined | null): string {
  if (val === undefined || val === null || typeof val === 'boolean') return '';
  return String(val).replace(/,/g, '').trim().toLowerCase();
}

/**
 * Checks if a product's specifications match a target spec label/key and value accurately
 * without mixing different capacities or products.
 */
export function matchesSpecCriterion(
  specs: { key?: string; label: string; value: string | number | boolean; unit?: string }[] | undefined,
  targetSpecLabel: string,
  targetSpecValue?: string
): boolean {
  if (!specs || !targetSpecLabel) return false;
  const normalizedTargetLabel = targetSpecLabel.trim().toLowerCase();

  const matchedSpec = specs.find((s) => {
    const sLabel = s.label.trim().toLowerCase();
    const sKey = (s.key || '').trim().toLowerCase();
    return sLabel === normalizedTargetLabel || sKey === normalizedTargetLabel || sLabel.includes(normalizedTargetLabel);
  });

  if (!matchedSpec) return false;
  if (!targetSpecValue || targetSpecValue.trim() === '' || targetSpecValue === 'all') return true;

  const rawTargetVal = targetSpecValue.trim();
  const rawProdVal = String(matchedSpec.value || '').trim();

  // 1. Numeric Comparison (e.g. BTU, Kg, Liters, Watts)
  const prodNum = parseSpecNumericValue(matchedSpec.value);
  const targetNum = parseSpecNumericValue(targetSpecValue);

  if (prodNum !== null && targetNum !== null) {
    // Exact numeric equality (e.g. 24000 === 24000, 18000 === 18000, 10 === 10, 8 === 8)
    if (prodNum === targetNum) return true;

    // Check shorthand K format: e.g. user typed "24k" or "24" for 24,000 BTU
    const isTargetShorthandK =
      rawTargetVal.toLowerCase().endsWith('k') ||
      (targetNum < 100 && prodNum >= 1000 && targetNum * 1000 === prodNum);
    if (isTargetShorthandK && targetNum * 1000 === prodNum) {
      return true;
    }

    // Numbers do NOT match! (e.g. 12000 != 24000, 18000 != 24000, 7 != 10)
    // Strictly return false to prevent mixing products!
    return false;
  }

  // 2. Text / Categorical Comparison (e.g. "Split", "Inverter", "R410A", "Cool&Heat")
  const normProd = normalizeSpecValue(rawProdVal);
  const normTarget = normalizeSpecValue(rawTargetVal);

  if (normProd === normTarget) return true;

  // If text contains target as a whole word or clean boundary
  // Only allow substring if target is at least 3 characters and neither is purely numeric
  if (normTarget.length >= 3 && !/^\d+$/.test(normTarget)) {
    return normProd.includes(normTarget);
  }

  return false;
}

/**
 * Safely merges existing entered specifications with a new category template
 * so user-entered values are NEVER lost when changing category or adding specs.
 */
export function mergeCategorySpecifications(
  existingSpecs: { key?: string; label: string; value: string | number | boolean; unit?: string }[],
  templateSpecs: { label: string; unit?: string }[]
): { key: string; label: string; value: string; unit?: string }[] {
  const result: { key: string; label: string; value: string; unit?: string }[] = [];
  const handledTemplateLabels = new Set<string>();

  // 1. Process template specs: if existing spec has matching label or key, keep user value!
  templateSpecs.forEach((tpl, i) => {
    const normTpl = tpl.label.trim().toLowerCase();
    handledTemplateLabels.add(normTpl);

    const existingMatch = existingSpecs.find((s) => {
      const normS = s.label.trim().toLowerCase();
      return normS === normTpl || normS.includes(normTpl) || normTpl.includes(normS);
    });

    result.push({
      key: existingMatch?.key || `spec_${i}`,
      label: tpl.label,
      value: existingMatch ? String(existingMatch.value) : '',
      unit: existingMatch?.unit || tpl.unit || '',
    });
  });

  // 2. Preserve any custom or non-template specs that the user already entered values for!
  existingSpecs.forEach((s, idx) => {
    const normS = s.label.trim().toLowerCase();
    const isHandled = Array.from(handledTemplateLabels).some(
      (tplLabel) => tplLabel === normS || tplLabel.includes(normS) || normS.includes(tplLabel)
    );
    // If it has a value and was not part of template, keep it!
    if (!isHandled && String(s.value || '').trim() !== '') {
      result.push({
        key: s.key || `custom_${Date.now()}_${idx}`,
        label: s.label,
        value: String(s.value),
        unit: s.unit || '',
      });
    }
  });

  return result;
}

/**
 * Resolves the correct supplier ID and name for a quotation based on product and user selection,
 * guaranteeing no unintended supplier mix-up occurs.
 */
export function resolveQuotationSupplier(
  selectedSupplierId: string | undefined,
  productSupplierId: string | undefined,
  suppliers: { id: string; nameEn: string; nameAr?: string }[]
): { supplierId: string; supplierName: string } {
  const targetId = selectedSupplierId || productSupplierId || suppliers[0]?.id || '';
  const sup = suppliers.find((s) => s.id === targetId) || suppliers[0];
  return {
    supplierId: sup ? sup.id : '',
    supplierName: sup ? sup.nameEn : '',
  };
}

/**
 * Masks the domain/ending portion of an email for privacy while keeping it recognizable.
 * E.g., "alosh.takwa@gmail.com" -> "alosh.takwa@g***.com"
 * or "k.mansour@orientappliances.com" -> "k.mansour@o***.com"
 */
export function maskEmail(emailStr: string): string {
  if (!emailStr || !emailStr.includes('@')) return emailStr || '';
  const [localPart, domainPart] = emailStr.split('@');
  if (!domainPart) return emailStr;

  const lastDot = domainPart.lastIndexOf('.');
  if (lastDot > 0) {
    const domainName = domainPart.slice(0, lastDot);
    const domainExt = domainPart.slice(lastDot);
    const maskedDomain = domainName.length > 1 ? `${domainName[0]}***` : '***';
    return `${localPart}@${maskedDomain}${domainExt}`;
  }
  return `${localPart}@***`;
}

