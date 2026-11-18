import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  PieChart,
  Ship,
  CheckCircle2
} from 'lucide-react';
import { CostDistributionMethod } from '../../types/erp';
import { calculateLandedCost, formatMoney, exportToExcel } from '../../utils/erpLogic';

export const LandedCostCalculatorView: React.FC = () => {
  const { products, shipments, orders, language, showToast } = useERP();

  const [distributionMethod, setDistributionMethod] = useState<CostDistributionMethod>('by_value');

  // Input Items
  const [items, setItems] = useState([
    {
      productId: 'PRD-001',
      productName: 'ثلاجة منزلية بابين 450 لتر إنفيرتر (HR-450F)',
      modelNumber: 'HR-450F-INV',
      quantity: 120,
      fobUnitPrice: 200, // $200 FOB
      weightKg: 72,
      volumeCbm: 0.85,
    },
    {
      productId: 'PRD-003',
      productName: 'مكيف سبلت 24,000 وحدة T3 إنفيرتر (AC-24000)',
      modelNumber: 'AC-24000-T3',
      quantity: 80,
      fobUnitPrice: 275, // $275 FOB
      weightKg: 45,
      volumeCbm: 0.45,
    },
  ]);

  // Import Expenses Input
  const [costs, setCosts] = useState({
    seaFreightCost: 3200, // Ocean freight
    insuranceCost: 350,   // Marine cargo insurance
    customsDutyCost: 2250, // 5% customs duty
    portClearanceCost: 750, // Port THC & storage
    internalTruckingCost: 600, // Delivery to local warehouse
    miscInspectionCost: 250, // SASO inspection / saber fees
  });

  const calculation = calculateLandedCost(items, costs, distributionMethod);

  const handleUpdateItem = (index: number, field: string, val: number) => {
    const updated = [...items];
    (updated[index] as any)[field] = val;
    setItems(updated);
  };

  const exportLandedCostExcel = () => {
    const data = calculation.items.map((it) => ({
      Model: it.modelNumber,
      ProductName: it.productName,
      Quantity: it.quantity,
      'FOB Unit Price ($)': it.fobUnitPrice,
      'Total FOB ($)': it.totalFobCost,
      'Import Extra Cost ($)': it.totalImportCosts,
      'Final Landed Unit Cost ($)': it.finalLandedUnitCost,
      'Landed Markup %': `${it.landedMarkupPercent}%`,
    }));
    exportToExcel('Landed_Costs', data, 'SinoTrack_Landed_Cost_Report');
    showToast(language === 'ar' ? 'تم تصدير تقرير التكلفة الفعلية' : 'Exported Landed Cost Report');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-6 h-6 text-indigo-600" />
            <span>{language === 'ar' ? 'حاسبة التكلفة الفعلية للاستيراد (Landed Cost)' : 'Actual Landed Cost Calculator'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'توزيع تكاليف الشحن البحري، الجمارك، التأمين، والنقل الداخلي لحساب تكلفة كل وحدة بدقة فائقة'
              : 'Apportion ocean freight, customs duty, insurance, and clearance fees to determine exact unit landed costs'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportLandedCostExcel}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{language === 'ar' ? 'تصدير جدول التكلفة Excel' : 'Export Landed Cost'}</span>
          </button>
        </div>
      </div>

      {/* Distribution Method Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {language === 'ar' ? 'طريقة توزيع التكاليف الإضافية على المنتجات:' : 'Cost Allocation Method:'}
        </span>

        <div className="flex items-center gap-2">
          {[
            { id: 'by_value', ar: 'حسب القيمة (Value %)', en: 'By Value' },
            { id: 'by_cbm', ar: 'حسب الحجم (CBM)', en: 'By Volume (CBM)' },
            { id: 'by_weight', ar: 'حسب الوزن (Weight)', en: 'By Weight' },
            { id: 'by_quantity', ar: 'حسب الكمية (Quantity)', en: 'By Quantity' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setDistributionMethod(m.id as CostDistributionMethod)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                distributionMethod === m.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {language === 'ar' ? m.ar : m.en}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Import Expenses + Products Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expenses Form */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 lg:col-span-1">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-indigo-600" />
            <span>{language === 'ar' ? 'مصاريف الشحن والاستيراد ($)' : 'Import & Freight Expenses ($)'}</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">
                {language === 'ar' ? 'نولون الشحن البحري (Sea Freight)' : 'Ocean Freight'}
              </label>
              <input
                type="number"
                value={costs.seaFreightCost}
                onChange={(e) => setCosts({ ...costs, seaFreightCost: Number(e.target.value) })}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-500 block mb-1">
                {language === 'ar' ? 'التأمين البحري على البضاعة' : 'Cargo Insurance'}
              </label>
              <input
                type="number"
                value={costs.insuranceCost}
                onChange={(e) => setCosts({ ...costs, insuranceCost: Number(e.target.value) })}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-500 block mb-1">
                {language === 'ar' ? 'الرسوم الجمركية (Customs Duty)' : 'Customs Duty'}
              </label>
              <input
                type="number"
                value={costs.customsDutyCost}
                onChange={(e) => setCosts({ ...costs, customsDutyCost: Number(e.target.value) })}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-500 block mb-1">
                {language === 'ar' ? 'مصاريف الميناء ورسوم الإنزال THC' : 'Port Clearance & THC'}
              </label>
              <input
                type="number"
                value={costs.portClearanceCost}
                onChange={(e) => setCosts({ ...costs, portClearanceCost: Number(e.target.value) })}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-500 block mb-1">
                {language === 'ar' ? 'النقل الداخلي للمستودعات' : 'Internal Trucking'}
              </label>
              <input
                type="number"
                value={costs.internalTruckingCost}
                onChange={(e) => setCosts({ ...costs, internalTruckingCost: Number(e.target.value) })}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-500 block mb-1">
                {language === 'ar' ? 'فحص سابر ومطابقة الجودة' : 'Inspection & Saber Fees'}
              </label>
              <input
                type="number"
                value={costs.miscInspectionCost}
                onChange={(e) => setCosts({ ...costs, miscInspectionCost: Number(e.target.value) })}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {language === 'ar' ? 'مجموع مصاريف الاستيراد:' : 'Total Extra Costs:'}
            </span>
            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
              ${calculation.totalImportCosts}
            </span>
          </div>
        </div>

        {/* Calculated Results Table */}
        <div className="space-y-4 lg:col-span-2">
          {/* Summary KPI Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold">
                {language === 'ar' ? 'سعر شراء البضاعة FOB' : 'Total FOB Goods'}
              </span>
              <span className="text-base font-black text-slate-900 dark:text-white">
                ${calculation.totalFobGoodsCost}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold">
                {language === 'ar' ? 'مصاريف الشحن والتخليص' : 'Total Logistics Costs'}
              </span>
              <span className="text-base font-black text-indigo-600">
                +${calculation.totalImportCosts}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
              <span className="text-[10px] text-indigo-600 dark:text-indigo-300 block font-bold">
                {language === 'ar' ? 'التكلفة الإجمالية الواصلة' : 'Grand Total Landed Cost'}
              </span>
              <span className="text-base font-black text-indigo-700 dark:text-indigo-200">
                ${calculation.grandTotalLandedCost}
              </span>
            </div>
          </div>

          {/* Detailed Itemized Landed Costs */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {language === 'ar' ? 'التكلفة الفعلية للوحدة الواحدة (Unit Landed Cost)' : 'Itemized Unit Landed Cost Calculation'}
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-[#1e1e1e] text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-2.5 text-start">{language === 'ar' ? 'الموديل' : 'Model'}</th>
                    <th className="p-2.5 text-start">{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                    <th className="p-2.5 text-start">{language === 'ar' ? 'سعر المصنع FOB' : 'FOB Price'}</th>
                    <th className="p-2.5 text-start">{language === 'ar' ? 'حصة الشحن والمصاريف' : 'Allocated Exp'}</th>
                    <th className="p-2.5 text-start">{language === 'ar' ? 'التكلفة الفعلية للوحدة' : 'Final Landed Cost'}</th>
                    <th className="p-2.5 text-start">{language === 'ar' ? 'نسبة الزيادة' : 'Markup %'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {calculation.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white font-mono">
                        {item.modelNumber}
                      </td>
                      <td className="p-2.5 font-bold">{item.quantity}</td>
                      <td className="p-2.5 font-semibold text-slate-600 dark:text-slate-400 font-mono">
                        ${item.fobUnitPrice}
                      </td>
                      <td className="p-2.5 text-indigo-600 font-bold">
                        +${Math.round((item.totalImportCosts / item.quantity) * 100) / 100} / وحدة
                      </td>
                      <td className="p-2.5 font-black text-slate-900 dark:text-white text-sm bg-indigo-50/50 dark:bg-indigo-950/40">
                        ${item.finalLandedUnitCost}
                      </td>
                      <td className="p-2.5">
                        <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">
                          +{item.landedMarkupPercent}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Explanation card */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-100 dark:border-slate-800 text-xs text-slate-500 leading-relaxed">
              💡 {language === 'ar'
                ? `طريقة التوزيع المطبقة هي (${distributionMethod}). كل وحدة من الثلاجات تحملت إضافياً حوالي $${Math.round((calculation.items[0]?.totalImportCosts / (calculation.items[0]?.quantity || 1)) * 100) / 100} تشمل الشحن والجمارك ومصاريف الميناء.`
                : `Using ${distributionMethod} allocation method, each unit landed cost reflects exact freight, duty, port THC and local transport.`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
