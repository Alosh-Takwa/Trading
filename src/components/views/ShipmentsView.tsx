import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Ship,
  Plus,
  Anchor,
  Clock,
  CheckCircle2,
  FileText,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  X,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react';
import { Shipment, ShipmentStatus, ShippingType, ContainerType, CurrencyCode } from '../../types/erp';
import { formatMoney, exportToExcel } from '../../utils/erpLogic';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

export const ShipmentsView: React.FC = () => {
  const {
    shipments,
    orders,
    suppliers,
    settings,
    createShipment,
    updateShipmentStatus,
    deleteShipment,
    language,
    showToast,
  } = useERP();

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [shipmentToDelete, setShipmentToDelete] = useState<Shipment | null>(null);

  // New Shipment Form State
  const [formData, setFormData] = useState({
    containerNumber: `MSCU${Math.floor(1000000 + Math.random() * 9000000)}`,
    supplierId: suppliers[0]?.id || '',
    linkedPoIds: [orders[0]?.id || 'PO-2026-001'],
    shippingCompany: 'Sinotrans South China Forwarding',
    shippingLine: 'COSCO Shipping Lines',
    shippingAgentName: 'Liu Bin (Sinotrans Freight)',
    shippingAgentContact: '+86 138 2211 4455 / agent@sinotrans.com',
    portOfLoading: 'Shenzhen / Yantian (CN)',
    portOfDischarge: 'Jeddah Islamic Port (SA)',
    originCountry: 'China',
    destinationCountry: 'Saudi Arabia',
    shippingType: 'sea' as ShippingType,
    containerType: '40HQ' as ContainerType,
    containerCount: 1,
    grossWeightKg: 8500,
    totalVolumeCbm: 68.0,
    cartonsCount: 120,
    shippingCost: 2900,
    currency: 'USD' as CurrencyCode,
    additionalCosts: 400,
    billOfLadingNumber: `COSU${Math.floor(100000000 + Math.random() * 900000000)}`,
    bookingNumber: `BKG-COS-${Math.floor(10000 + Math.random() * 90000)}`,
    etd: '2026-12-05',
    eta: '2026-12-28',
    status: 'in_transit' as ShipmentStatus,
    notes: 'حاوية محملة بثلاجات ومكيفات، الشحن بحري مباشر بدون توقف إضافي.',
  });

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === formData.supplierId);
    if (!sup) return;

    createShipment({
      containerNumber: formData.containerNumber.trim(),
      supplierId: sup.id,
      supplierName: sup.nameEn,
      linkedPoIds: formData.linkedPoIds,
      shippingCompany: formData.shippingCompany,
      shippingLine: formData.shippingLine,
      shippingAgentName: formData.shippingAgentName,
      shippingAgentContact: formData.shippingAgentContact,
      portOfLoading: formData.portOfLoading,
      portOfDischarge: formData.portOfDischarge,
      originCountry: formData.originCountry,
      destinationCountry: formData.destinationCountry,
      shippingType: formData.shippingType,
      containerType: formData.containerType,
      containerCount: Number(formData.containerCount),
      grossWeightKg: Number(formData.grossWeightKg),
      totalVolumeCbm: Number(formData.totalVolumeCbm),
      cartonsCount: Number(formData.cartonsCount),
      shippingCost: Number(formData.shippingCost),
      currency: formData.currency,
      additionalCosts: Number(formData.additionalCosts),
      billOfLadingNumber: formData.billOfLadingNumber.trim(),
      bookingNumber: formData.bookingNumber.trim(),
      etd: formData.etd,
      eta: formData.eta,
      status: formData.status,
      documents: [],
      notes: formData.notes,
    });

    setIsAddModalOpen(false);
  };

  const filteredShipments = shipments.filter((sh) => {
    if (selectedStatus === 'all') return true;
    return sh.status === selectedStatus;
  });

  const exportShipmentsExcel = () => {
    const data = shipments.map((sh) => ({
      ContainerNumber: sh.containerNumber,
      ShippingLine: sh.shippingLine,
      Supplier: sh.supplierName,
      BL: sh.billOfLadingNumber,
      LoadingPort: sh.portOfLoading,
      DischargePort: sh.portOfDischarge,
      ContainerType: sh.containerType,
      WeightKg: sh.grossWeightKg,
      VolumeCBM: sh.totalVolumeCbm,
      ETD: sh.etd,
      ETA: sh.eta,
      Status: sh.status,
      ShippingCostUSD: sh.shippingCost,
    }));
    exportToExcel('Shipments', data, 'SinoTrack_Containers_Shipments_Log');
    showToast(language === 'ar' ? 'تم تصدير سجل الشحنات إلى Excel' : 'Exported Shipments to Excel');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Ship className="w-6 h-6 text-cyan-600" />
            <span>{language === 'ar' ? 'إدارة الشحن وتتبع الحاويات القادمة من الصين' : 'China Shipping & Container Tracking'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'تتبع الخطوط الملاحية (COSCO, Maersk)، أرقام الحاويات، بوالص الشحن B/L، ومواعيد الإبحار والوصول'
              : 'Container milestones, ports of loading/discharge, B/L docs, and maritime transit status'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportShipmentsExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-cyan-600" />
            <span>{language === 'ar' ? 'تصدير Excel' : 'Export Excel'}</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ar' ? 'تسجيل شحنة / حاوية جديدة' : 'New Container Shipment'}</span>
          </button>
        </div>
      </div>

      {/* Filter Status Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'all', ar: 'الكل', en: 'All' },
          { key: 'in_transit', ar: 'في الطريق (In Transit)', en: 'In Transit' },
          { key: 'departed_origin', ar: 'غادرت الميناء', en: 'Departed' },
          { key: 'arrived_destination', ar: 'وصلت الميناء', en: 'Arrived Port' },
          { key: 'customs_clearance', ar: 'التخليص الجمركي', en: 'Customs' },
          { key: 'delivered', ar: 'تم التسليم والمستودع', en: 'Delivered' },
        ].map((st) => (
          <button
            key={st.key}
            onClick={() => setSelectedStatus(st.key)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              selectedStatus === st.key
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {language === 'ar' ? st.ar : st.en}
          </button>
        ))}
      </div>

      {/* Shipments Cards Grid */}
      <div className="space-y-4">
        {filteredShipments.map((sh) => (
          <div
            key={sh.id}
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-cyan-400 dark:hover:border-cyan-600 transition-all space-y-4"
          >
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-cyan-600 font-bold">
                  <Ship className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-cyan-600 dark:text-cyan-400">
                      {sh.containerNumber}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">
                      {sh.containerType} ({sh.shippingLine})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {sh.supplierName} • PO: {sh.linkedPoIds.join(', ')}
                  </p>
                </div>
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={sh.status}
                  onChange={(e) => updateShipmentStatus(sh.id, e.target.value as ShipmentStatus)}
                  className="text-xs font-bold px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300"
                >
                  <option value="pending_booking">Pending Booking</option>
                  <option value="booked">Booked (تم الحجز)</option>
                  <option value="cargo_ready">Cargo Ready (جاهزة)</option>
                  <option value="loaded">Loaded (تم التحميل)</option>
                  <option value="departed_origin">Departed Origin (غادرت)</option>
                  <option value="in_transit">In Transit (في الطريق)</option>
                  <option value="arrived_destination">Arrived Destination</option>
                  <option value="customs_clearance">Customs Clearance</option>
                  <option value="customs_cleared">Customs Cleared</option>
                  <option value="delivered">Delivered (تم التسليم)</option>
                  <option value="completed">Completed (مكتملة)</option>
                </select>

                <button
                  type="button"
                  onClick={() => setShipmentToDelete(sh)}
                  className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                  title={language === 'ar' ? 'حذف الشحنة' : 'Delete Shipment'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Maritime Route Visualizer */}
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#1e1e1e]/80 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    {language === 'ar' ? 'ميناء الإرسال (Port of Loading)' : 'Port of Loading'}
                  </span>
                  <span className="text-slate-900 dark:text-white flex items-center gap-1">
                    <Anchor className="w-3.5 h-3.5 text-blue-600" />
                    <span>{sh.portOfLoading}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">ETD: {sh.etd}</span>
                </div>

                <div className="flex flex-col items-center px-4">
                  <span className="text-[10px] font-bold text-cyan-600 animate-pulse">
                    {sh.shippingLine}
                  </span>
                  <div className="flex items-center gap-1 text-slate-300 dark:text-slate-600 my-1">
                    <div className="w-12 h-0.5 bg-cyan-500/40 rounded-full"></div>
                    <Ship className="w-4 h-4 text-cyan-600" />
                    <div className="w-12 h-0.5 bg-cyan-500/40 rounded-full"></div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">BL: {sh.billOfLadingNumber}</span>
                </div>

                <div className="space-y-0.5 text-end">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    {language === 'ar' ? 'ميناء الاستقبال (Discharge)' : 'Port of Discharge'}
                  </span>
                  <span className="text-slate-900 dark:text-white flex items-center justify-end gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{sh.portOfDischarge}</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold font-mono block">
                    ETA: {sh.eta}
                  </span>
                </div>
              </div>
            </div>

            {/* Container specs and costs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'الوزن الإجمالي' : 'Gross Weight'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{sh.grossWeightKg.toLocaleString()} kg</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'الحجم CBM' : 'Volume CBM'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{sh.totalVolumeCbm} CBM</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'عدد الكراتين' : 'Cartons Count'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{sh.cartonsCount} CTNS</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'نولون الشحن البحري' : 'Ocean Freight'}</span>
                <span className="font-black text-emerald-600">{formatMoney(sh.shippingCost, sh.currency, language)}</span>
              </div>
            </div>

            {/* Attached Shipping Docs */}
            {sh.documents.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  {language === 'ar' ? 'مستندات الشحن المرفقة:' : 'Attached Shipping Documents:'}
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {sh.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 flex items-center gap-1.5 text-[11px]"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      <span>{doc.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Shipment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-2xl my-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1e1e1e]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Ship className="w-5 h-5 text-cyan-600" />
                <span>{language === 'ar' ? 'تسجيل حاوية وشحنة بحرية جديدة' : 'Register New Container Shipment'}</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'رقم الحاوية (Container #) *' : 'Container Number *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.containerNumber}
                    onChange={(e) => setFormData({ ...formData, containerNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'المورد المرتبط *' : 'Supplier *'}
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'الخط الملاحي (Shipping Line)' : 'Shipping Line'}
                  </label>
                  <select
                    value={formData.shippingLine}
                    onChange={(e) => setFormData({ ...formData, shippingLine: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {settings.shippingLines.map((line) => (
                      <option key={line} value={line}>{line}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'نوع الحاوية' : 'Container Type'}
                  </label>
                  <select
                    value={formData.containerType}
                    onChange={(e) => setFormData({ ...formData, containerType: e.target.value as ContainerType })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="40HQ">40HQ High Cube</option>
                    <option value="40GP">40GP General Purpose</option>
                    <option value="20GP">20GP Standard</option>
                    <option value="LCL">LCL جزئي مجمع</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'رقم بوليصة الشحن (B/L) *' : 'Bill of Lading (B/L) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.billOfLadingNumber}
                    onChange={(e) => setFormData({ ...formData, billOfLadingNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Ports */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'ميناء الإرسال الصيني (Port of Loading)' : 'Port of Loading'}
                  </label>
                  <select
                    value={formData.portOfLoading}
                    onChange={(e) => setFormData({ ...formData, portOfLoading: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {settings.chinesePorts.map((port) => (
                      <option key={port} value={port}>{port}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'ميناء الاستقبال والوصول (Discharge)' : 'Port of Discharge'}
                  </label>
                  <select
                    value={formData.portOfDischarge}
                    onChange={(e) => setFormData({ ...formData, portOfDischarge: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {settings.destinationPorts.map((port) => (
                      <option key={port} value={port}>{port}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates & Logistics Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'تاريخ الإبحار ETD' : 'ETD Departure'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.etd}
                    onChange={(e) => setFormData({ ...formData, etd: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'تاريخ الوصول المتوقع ETA' : 'ETA Arrival'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.eta}
                    onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'الوزن (kg)' : 'Weight (kg)'}
                  </label>
                  <input
                    type="number"
                    value={formData.grossWeightKg}
                    onChange={(e) => setFormData({ ...formData, grossWeightKg: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'الحجم (CBM)' : 'Volume (CBM)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.totalVolumeCbm}
                    onChange={(e) => setFormData({ ...formData, totalVolumeCbm: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              {/* Freight Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'تكلفة الشحن البحري (Freight $)' : 'Freight Cost ($)'}
                  </label>
                  <input
                    type="number"
                    value={formData.shippingCost}
                    onChange={(e) => setFormData({ ...formData, shippingCost: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-black text-sm text-cyan-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'حالة الشحن' : 'Status'}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ShipmentStatus })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <option value="in_transit">In Transit (في الطريق)</option>
                    <option value="departed_origin">Departed Origin (غادرت الميناء)</option>
                    <option value="arrived_destination">Arrived Port (وصلت الميناء)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl"
                >
                  {language === 'ar' ? 'تأكيد وحفظ الشحنة' : 'Save Shipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Shipment Modal */}
      <ConfirmDeleteModal
        isOpen={!!shipmentToDelete}
        onClose={() => setShipmentToDelete(null)}
        onConfirm={() => {
          if (shipmentToDelete) {
            deleteShipment(shipmentToDelete.id);
            setShipmentToDelete(null);
          }
        }}
        title={language === 'ar' ? 'تأكيد حذف سجل الشحنة' : 'Confirm Delete Shipment'}
        message={
          language === 'ar'
            ? `هل أنت متأكد من رغبتك في حذف الشحنة (${shipmentToDelete?.id}) وحاوية رقم (${shipmentToDelete?.containerNumber}) نهائياً؟`
            : `Are you sure you want to permanently delete shipment (${shipmentToDelete?.id}) with container (${shipmentToDelete?.containerNumber})?`
        }
        confirmText={language === 'ar' ? 'نعم، حذف الشحنة' : 'Delete Shipment'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
      />
    </div>
  );
};
