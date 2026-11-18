import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  ClipboardCheck,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Package,
  Calendar,
  Camera,
  X,
  Trash2,
} from 'lucide-react';
import { SampleRequest, QualityInspection, SampleStatus } from '../../types/erp';
import { formatMoney } from '../../utils/erpLogic';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

export const SamplesAndQCView: React.FC = () => {
  const {
    samples,
    inspections,
    suppliers,
    products,
    orders,
    addSample,
    addInspection,
    updateSample,
    deleteSample,
    deleteInspection,
    language,
    showToast,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'samples' | 'inspections'>('samples');
  const [isAddSampleModalOpen, setIsAddSampleModalOpen] = useState(false);
  const [isAddQCModalOpen, setIsAddQCModalOpen] = useState(false);
  const [sampleToDelete, setSampleToDelete] = useState<SampleRequest | null>(null);
  const [inspectionToDelete, setInspectionToDelete] = useState<QualityInspection | null>(null);

  // Add Sample Form State
  const [sampleForm, setSampleForm] = useState({
    supplierId: suppliers[0]?.id || '',
    productId: products[0]?.id || '',
    requestDate: new Date().toISOString().split('T')[0],
    sampleCost: 60,
    shippingCost: 80,
    status: 'testing' as SampleStatus,
    testResult: 'جاري فحص العينة ومطابقة القابس ومواصفات الكفاءة.',
    inspectorName: 'Eng. Tariq Mansour',
    notes: 'عينات مخصصة مع تغليف OEM.',
  });

  // Add QC Form State
  const [qcForm, setQcForm] = useState({
    purchaseOrderId: orders[0]?.id || 'PO-2026-001',
    supplierId: suppliers[0]?.id || '',
    productName: products[0]?.nameAr || 'ثلاجة 450 لتر',
    inspectorName: 'CCIC / SGS Guangdong Inspection Team',
    inspectionDate: new Date().toISOString().split('T')[0],
    quantityInspected: 30,
    passedQuantity: 30,
    defectiveQuantity: 0,
    inspectionPassed: true,
    notes: 'اجتياز كامل لاختبارات التسريب الكهربائي، العزل الحراري، والتغليف في كراتين 5 طبقات.',
  });

  const handleCreateSample = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === sampleForm.supplierId);
    const prod = products.find((p) => p.id === sampleForm.productId);
    if (!sup || !prod) return;

    addSample({
      supplierId: sup.id,
      supplierName: sup.nameEn,
      productId: prod.id,
      productName: prod.nameAr,
      modelNumber: prod.modelNumber,
      requestDate: sampleForm.requestDate,
      sampleCost: Number(sampleForm.sampleCost),
      shippingCost: Number(sampleForm.shippingCost),
      currency: 'USD',
      status: sampleForm.status,
      testResult: sampleForm.testResult,
      inspectorName: sampleForm.inspectorName,
      notes: sampleForm.notes,
    });

    setIsAddSampleModalOpen(false);
  };

  const handleCreateQC = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === qcForm.supplierId);
    if (!sup) return;

    const inspected = Number(qcForm.quantityInspected);
    const defective = Number(qcForm.defectiveQuantity);
    const passed = Number(qcForm.passedQuantity);
    const defectRate = inspected > 0 ? Math.round((defective / inspected) * 1000) / 10 : 0;

    addInspection({
      purchaseOrderId: qcForm.purchaseOrderId,
      supplierId: sup.id,
      supplierName: sup.nameEn,
      productName: qcForm.productName,
      inspectorName: qcForm.inspectorName,
      inspectionDate: qcForm.inspectionDate,
      quantityInspected: inspected,
      passedQuantity: passed,
      defectiveQuantity: defective,
      defectRatePercent: defectRate,
      inspectionPassed: qcForm.inspectionPassed,
      notes: qcForm.notes,
      photos: [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
      ],
    });

    setIsAddQCModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-rose-600" />
            <span>{language === 'ar' ? 'العينات وفحص الجودة قبل الشحن (QC)' : 'Samples & Quality Control'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'إدارة طلبات العينات، وتقارير الفحص الفني قبل شحن الحاويات من المصانع الصينية'
              : 'Sample request tracking and pre-shipment inspection (PSI) quality assurance reports'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'samples' ? (
            <button
              onClick={() => setIsAddSampleModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'ar' ? 'طلب عينة جديدة' : 'New Sample Request'}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAddQCModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'ar' ? 'تسجيل تقرير فحص جودة' : 'Log Inspection Report'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('samples')}
          className={`px-3 py-2 rounded-xl transition-all ${
            activeTab === 'samples'
              ? 'bg-rose-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {language === 'ar' ? `طلبات العينات (${samples.length})` : `Sample Requests (${samples.length})`}
        </button>
        <button
          onClick={() => setActiveTab('inspections')}
          className={`px-3 py-2 rounded-xl transition-all ${
            activeTab === 'inspections'
              ? 'bg-rose-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {language === 'ar' ? `تقارير فحص الجودة (${inspections.length})` : `Pre-shipment Inspections (${inspections.length})`}
        </button>
      </div>

      {/* SAMPLES TAB */}
      {activeTab === 'samples' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {samples.map((smp) => (
            <div
              key={smp.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded">
                  {smp.id}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {smp.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSampleToDelete(smp)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    title={language === 'ar' ? 'حذف طلب العينة' : 'Delete Sample'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {smp.productName}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{smp.modelNumber}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  🏭 {smp.supplierName}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p><strong>{language === 'ar' ? 'نتيجة الفحص:' : 'Test Result:'}</strong> {smp.testResult || '-'}</p>
                <p><strong>{language === 'ar' ? 'المسؤول عن الفحص:' : 'Tested By:'}</strong> {smp.inspectorName || '-'}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>{language === 'ar' ? 'تاريخ الطلب:' : 'Requested:'} {smp.requestDate}</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'ar' ? 'التكلفة:' : 'Cost:'} ${smp.sampleCost + smp.shippingCost}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* INSPECTIONS TAB */}
      {activeTab === 'inspections' && (
        <div className="space-y-4">
          {inspections.map((qc) => (
            <div
              key={qc.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded">
                    {qc.id}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">PO: {qc.purchaseOrderId}</span>
                </div>

                <div className="flex items-center gap-2">
                  {qc.inspectionPassed ? (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'فحص مطابق وناجح (Passed)' : 'Inspection Passed'}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'فحص غير مطابق (Rejected)' : 'Failed'}</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setInspectionToDelete(qc)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    title={language === 'ar' ? 'حذف تقرير فحص الجودة' : 'Delete Inspection'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {qc.productName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  🏭 {qc.supplierName} • {language === 'ar' ? 'فاحص معتمد:' : 'Inspector:'} {qc.inspectorName}
                </p>
              </div>

              {/* Counts & Defect Rate */}
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1e1e1e]">
                  <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'الكمية المفحوصة' : 'Sample Size'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{qc.quantityInspected} units</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30">
                  <span className="text-[10px] text-emerald-600 block">{language === 'ar' ? 'السليم المطابق' : 'Passed'}</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">{qc.passedQuantity}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/30">
                  <span className="text-[10px] text-rose-600 block">{language === 'ar' ? 'المعيب' : 'Defective'}</span>
                  <span className="font-bold text-rose-700 dark:text-rose-300">{qc.defectiveQuantity}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1e1e1e]">
                  <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'نسبة العيوب' : 'Defect Rate'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{qc.defectRatePercent}%</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] text-xs text-slate-600 dark:text-slate-300">
                <strong>{language === 'ar' ? 'ملاحظات الفاحص الفني:' : 'Inspector Remarks:'}</strong> {qc.notes}
              </div>

              {qc.photos.length > 0 && (
                <div className="flex gap-2">
                  {qc.photos.map((ph, idx) => (
                    <img
                      key={idx}
                      src={ph}
                      alt="QC Proof"
                      className="w-20 h-20 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Sample Modal */}
      {isAddSampleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1e1e1e]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'ar' ? 'تسجيل طلب عينة جديدة من المصنع' : 'Request Product Sample'}
              </h3>
              <button onClick={() => setIsAddSampleModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateSample} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'المصنع المورد' : 'Supplier'}
                </label>
                <select
                  value={sampleForm.supplierId}
                  onChange={(e) => setSampleForm({ ...sampleForm, supplierId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.nameEn}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'المنتج والموديل' : 'Product & Model'}
                </label>
                <select
                  value={sampleForm.productId}
                  onChange={(e) => setSampleForm({ ...sampleForm, productId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.modelNumber} - {p.nameAr}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'تكلفة العينة ($)' : 'Sample Cost ($)'}
                  </label>
                  <input
                    type="number"
                    value={sampleForm.sampleCost}
                    onChange={(e) => setSampleForm({ ...sampleForm, sampleCost: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'شحن العينة عبر السريع ($)' : 'Express Freight ($)'}
                  </label>
                  <input
                    type="number"
                    value={sampleForm.shippingCost}
                    onChange={(e) => setSampleForm({ ...sampleForm, shippingCost: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'مهندس الفحص الداخلي' : 'Inspector'}
                </label>
                <input
                  type="text"
                  value={sampleForm.inspectorName}
                  onChange={(e) => setSampleForm({ ...sampleForm, inspectorName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSampleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
                >
                  {language === 'ar' ? 'حفظ الطلب' : 'Save Sample'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add QC Modal */}
      {isAddQCModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1e1e1e]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'ar' ? 'تسجيل تقرير فحص جودة قبل الشحن' : 'Log Pre-Shipment Inspection (QC)'}
              </h3>
              <button onClick={() => setIsAddQCModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateQC} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'أمر الشراء المرتبط' : 'Purchase Order'}
                  </label>
                  <select
                    value={qcForm.purchaseOrderId}
                    onChange={(e) => setQcForm({ ...qcForm, purchaseOrderId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>{o.id} - {o.supplierName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'المصنع' : 'Supplier'}
                  </label>
                  <select
                    value={qcForm.supplierId}
                    onChange={(e) => setQcForm({ ...qcForm, supplierId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.nameEn}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'جهة الفحص المعتمدة' : 'Inspector Company'}
                </label>
                <input
                  type="text"
                  required
                  value={qcForm.inspectorName}
                  onChange={(e) => setQcForm({ ...qcForm, inspectorName: e.target.value })}
                  placeholder="CCIC, SGS, Bureau Veritas, In-house"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'المفحوص' : 'Inspected'}
                  </label>
                  <input
                    type="number"
                    value={qcForm.quantityInspected}
                    onChange={(e) => setQcForm({ ...qcForm, quantityInspected: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="font-bold text-emerald-600 block mb-1">
                    {language === 'ar' ? 'السليم' : 'Passed'}
                  </label>
                  <input
                    type="number"
                    value={qcForm.passedQuantity}
                    onChange={(e) => setQcForm({ ...qcForm, passedQuantity: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-emerald-300 dark:border-emerald-700 font-bold text-center text-emerald-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-rose-600 block mb-1">
                    {language === 'ar' ? 'المعيب' : 'Defects'}
                  </label>
                  <input
                    type="number"
                    value={qcForm.defectiveQuantity}
                    onChange={(e) => setQcForm({ ...qcForm, defectiveQuantity: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-rose-300 dark:border-rose-700 font-bold text-center text-rose-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'ملاحظات الفحص' : 'Remarks'}
                </label>
                <textarea
                  rows={2}
                  value={qcForm.notes}
                  onChange={(e) => setQcForm({ ...qcForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddQCModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
                >
                  {language === 'ar' ? 'حفظ التقرير' : 'Save Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Sample Modal */}
      <ConfirmDeleteModal
        isOpen={!!sampleToDelete}
        onClose={() => setSampleToDelete(null)}
        onConfirm={() => {
          if (sampleToDelete) {
            deleteSample(sampleToDelete.id);
            setSampleToDelete(null);
          }
        }}
        title={language === 'ar' ? 'تأكيد حذف طلب العينة' : 'Confirm Delete Sample'}
        message={
          language === 'ar'
            ? `هل أنت متأكد من رغبتك في حذف طلب العينة (${sampleToDelete?.id}) للمنتج (${sampleToDelete?.productName})؟`
            : `Are you sure you want to delete sample request (${sampleToDelete?.id})?`
        }
        confirmText={language === 'ar' ? 'نعم، حذف العينة' : 'Delete Sample'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
      />

      {/* Confirm Delete Inspection Modal */}
      <ConfirmDeleteModal
        isOpen={!!inspectionToDelete}
        onClose={() => setInspectionToDelete(null)}
        onConfirm={() => {
          if (inspectionToDelete) {
            deleteInspection(inspectionToDelete.id);
            setInspectionToDelete(null);
          }
        }}
        title={language === 'ar' ? 'تأكيد حذف تقرير فحص الجودة' : 'Confirm Delete Inspection'}
        message={
          language === 'ar'
            ? `هل أنت متأكد من رغبتك في حذف تقرير الفحص (${inspectionToDelete?.id}) للمنتج (${inspectionToDelete?.productName}) نهائياً؟`
            : `Are you sure you want to delete inspection report (${inspectionToDelete?.id})?`
        }
        confirmText={language === 'ar' ? 'نعم، حذف التقرير' : 'Delete Report'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
      />
    </div>
  );
};
