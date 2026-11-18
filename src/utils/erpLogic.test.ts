import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePOTotals,
  calculateInvoiceBalance,
  calculateLandedCost,
  calculateSupplierRating,
  convertCurrency,
  calculatePriceDiffPercent,
} from './erpLogic';
import { POItem, CostDistributionMethod } from '../types/erp';

test('PO financial calculations: correctly computes subtotals, negotiation savings, taxes and grand total', () => {
  const items: POItem[] = [
    {
      id: 'item-1',
      productId: 'prod-1',
      productName: 'Double Door Refrigerator 450L',
      modelNumber: 'HR-450F',
      specsSummary: 'No Frost, Inverter, R600a',
      quantity: 50,
      originalQuotedPrice: 220, // Quoted was $220
      negotiatedUnitPrice: 200, // Negotiated down to $200
      currency: 'USD',
      discountPercentage: 5, // 5% discount on line
      totalItemAmount: 9500,
    },
    {
      id: 'item-2',
      productId: 'prod-2',
      productName: 'Front Load Washing Machine 8KG',
      modelNumber: 'WM-800BL',
      specsSummary: '1400 RPM, Direct Drive BLDC',
      quantity: 100,
      originalQuotedPrice: 150,
      negotiatedUnitPrice: 140, // $10 saved per unit = $1000
      currency: 'USD',
      totalItemAmount: 14000,
    },
  ];

  // item-1 subtotal: 50 * 200 = 10,000. 5% discount = 500. net = 9,500.
  // item-2 subtotal: 100 * 140 = 14,000. net = 14,000.
  // raw subtotal = 24,000. item discounts = 500.
  // savings vs quote: (220-200)*50 + (150-140)*100 = 1000 + 1000 = $2000.
  const additional = {
    packagingCost: 300,
    moldCost: 500,
    sampleCost: 200,
    freightLocalCost: 400,
    otherCost: 100,
  };
  // total additional = 1,500.
  // taxableAmount = 24000 - 500 + 1500 = 25,000.
  // tax 5% = 1,250.
  // grandTotal = 26,250.

  const result = calculatePOTotals(items, additional, 0, 5);

  assert.equal(result.subtotal, 24000);
  assert.equal(result.totalDiscount, 500);
  assert.equal(result.totalAdditionalCosts, 1500);
  assert.equal(result.totalTax, 1250);
  assert.equal(result.grandTotal, 26250);
  assert.equal(result.totalSavingsVsOriginalQuote, 2000);
});

test('Invoice balance calculation: correctly updates paid amount, balance due, and status', () => {
  // Invoice of $10,000 with $0 discount, payments: $3,000 then $4,000
  const payments1 = [{ amount: 3000 }];
  const r1 = calculateInvoiceBalance(10000, 0, payments1);
  assert.equal(r1.paidAmount, 3000);
  assert.equal(r1.balanceDue, 7000);
  assert.equal(r1.status, 'partially_paid');

  // Second payment made
  const payments2 = [{ amount: 3000 }, { amount: 7000 }];
  const r2 = calculateInvoiceBalance(10000, 0, payments2);
  assert.equal(r2.paidAmount, 10000);
  assert.equal(r2.balanceDue, 0);
  assert.equal(r2.status, 'paid');

  // No payments
  const r3 = calculateInvoiceBalance(10000, 0, []);
  assert.equal(r3.paidAmount, 0);
  assert.equal(r3.balanceDue, 10000);
  assert.equal(r3.status, 'unpaid');
});

test('Landed Cost (التكلفة الفعلية للاستيراد): accurately distributes import costs across products', () => {
  const items = [
    {
      productId: 'p1',
      productName: 'Refrigerator',
      modelNumber: 'R-1',
      quantity: 100,
      fobUnitPrice: 200, // Total FOB: 20,000 (66.67% of value)
      weightKg: 50,
      volumeCbm: 0.8,
    },
    {
      productId: 'p2',
      productName: 'Microwave',
      modelNumber: 'M-1',
      quantity: 200,
      fobUnitPrice: 50, // Total FOB: 10,000 (33.33% of value)
      weightKg: 10,
      volumeCbm: 0.1,
    },
  ];

  const costs = {
    seaFreightCost: 3000,
    insuranceCost: 300,
    customsDutyCost: 1500,
    portClearanceCost: 600,
    internalTruckingCost: 500,
    miscInspectionCost: 100,
  };
  // Total extra import costs = 3000 + 300 + 1500 + 600 + 500 + 100 = 6,000 USD
  // Total FOB = 30,000 USD

  // By Value:
  // Item 1 gets 20,000/30,000 = 2/3 of 6,000 = $4,000 total import cost
  // per unit extra = 4000 / 100 = $40. Final Landed Unit Cost = 200 + 40 = $240. Markup = 20%
  // Item 2 gets 10,000/30,000 = 1/3 of 6,000 = $2,000 total import cost
  // per unit extra = 2000 / 200 = $10. Final Landed Unit Cost = 50 + 10 = $60. Markup = 20%

  const resultByValue = calculateLandedCost(items, costs, 'by_value');
  assert.equal(resultByValue.totalFobGoodsCost, 30000);
  assert.equal(resultByValue.totalImportCosts, 6000);
  assert.equal(resultByValue.grandTotalLandedCost, 36000);

  const rItem1 = resultByValue.items[0];
  assert.equal(rItem1.totalImportCosts, 4000);
  assert.equal(rItem1.finalLandedUnitCost, 240);
  assert.equal(rItem1.landedMarkupPercent, 20);

  const rItem2 = resultByValue.items[1];
  assert.equal(rItem2.totalImportCosts, 2000);
  assert.equal(rItem2.finalLandedUnitCost, 60);
  assert.equal(rItem2.landedMarkupPercent, 20);
});

test('Supplier rating: computes weighted average correctly across 10 evaluation criteria', () => {
  const scores = {
    productQuality: 5,
    priceCompetitiveness: 4,
    responseTime: 5,
    deliveryTimeliness: 4,
    packagingQuality: 5,
    specAccuracy: 4,
    negotiationFlexibility: 3,
    communicationQuality: 5,
    punctuality: 4,
    problemSolving: 5,
  };
  // sum = 5+4+5+4+5+4+3+5+4+5 = 44 / 10 = 4.4
  const rating = calculateSupplierRating(scores);
  assert.equal(rating, 4.4);
});

test('Currency conversion and price differential calculation', () => {
  const rates = {
    USD: 1,
    CNY: 7.25,
    SAR: 3.75,
    EUR: 0.92,
    AED: 3.67,
  };

  // Convert $1000 USD to SAR -> 3750
  const inSAR = convertCurrency(1000, 'USD', 'SAR', rates);
  assert.equal(inSAR, 3750);

  // Convert ¥7250 CNY to USD -> 1000
  const inUSD = convertCurrency(7250, 'CNY', 'USD', rates);
  assert.equal(inUSD, 1000);

  // Price Diff: Old $100, New $115 -> +15%
  assert.equal(calculatePriceDiffPercent(100, 115), 15);
  // Price Diff: Old $200, New $180 -> -10%
  assert.equal(calculatePriceDiffPercent(200, 180), -10);
});
