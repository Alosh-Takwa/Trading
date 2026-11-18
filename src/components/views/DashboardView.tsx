import React from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Building2,
  Package,
  ShoppingCart,
  Ship,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle,
  FileSpreadsheet,
  Activity,
  Plus
} from 'lucide-react';
import { formatMoney } from '../../utils/erpLogic';

export const DashboardView: React.FC = () => {
  const {
    suppliers,
    products,
    orders,
    quotations,
    shipments,
    invoices,
    tasks,
    language,
    setActiveView,
    setSelectedSupplierId,
    setSelectedProductId,
  } = useERP();

  // Metrics computation
  const activeSuppliers = suppliers.filter((s) => s.status === 'active');
  const directManufacturers = suppliers.filter((s) => s.type === 'manufacturer');

  const ordersInProduction = orders.filter((o) => o.status === 'in_production');
  const ordersReadyToShip = orders.filter((o) => o.status === 'ready_to_ship');

  const shipmentsInTransit = shipments.filter((s) => ['in_transit', 'departed_origin'].includes(s.status));
  const shipmentsArrived = shipments.filter((s) => ['arrived_destination', 'customs_cleared', 'delivered', 'completed'].includes(s.status));

  const totalProcurementSpend = orders.reduce((acc, o) => acc + (o.grandTotal || 0), 0);
  const totalPaid = orders.reduce((acc, o) => acc + (o.totalPaid || 0), 0);
  const totalBalanceDue = orders.reduce((acc, o) => acc + (o.balanceDue || 0), 0);

  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');

  // Savings computation
  const totalSavings = orders.reduce((acc, o) => {
    const orderSavings = o.items.reduce((sAcc, item) => {
      if (item.originalQuotedPrice > item.negotiatedUnitPrice) {
        return sAcc + (item.originalQuotedPrice - item.negotiatedUnitPrice) * item.quantity;
      }
      return sAcc;
    }, 0);
    return acc + orderSavings;
  }, 0);

  // Category distribution
  const categoryCounts = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryLabels: Record<string, { ar: string; en: string }> = {
    refrigerators: { ar: 'ثلاجات ومبردات', en: 'Refrigerators' },
    washing_machines: { ar: 'غسالات ومجففات', en: 'Washing Machines' },
    air_conditioners: { ar: 'مكيفات هواء', en: 'Air Conditioners' },
    ovens_stoves: { ar: 'أفران ومواقد', en: 'Ovens & Stoves' },
    small_kitchen: { ar: 'أجهزة مطبخ صغيرة', en: 'Small Kitchen' },
    water_heaters: { ar: 'سخانات مياه', en: 'Water Heaters' },
    other: { ar: 'أخرى', en: 'Other' },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-slate-900 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/30">
              China Sourcing Executive Hub
            </span>
            <span className="text-xs text-slate-300 font-mono">
              {new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'long' })}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            {language === 'ar'
              ? 'متابعة المشتريات والتصنيع والشحن من الصين'
              : 'Chinese Sourcing, Manufacturing & Shipping Hub'}
          </h2>
          <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
            {language === 'ar'
              ? `تدير المنصة حالياً ${suppliers.length} موردين ومصانع، و${orders.length} طلبية شراء بقيمة ${formatMoney(totalProcurementSpend, 'USD', language)}، مع توفير تفاوضي محقق بقيمة ${formatMoney(totalSavings, 'USD', language)}.`
              : `Managing ${suppliers.length} Chinese suppliers, ${orders.length} active POs totaling ${formatMoney(totalProcurementSpend, 'USD', language)}, with verified negotiation savings of ${formatMoney(totalSavings, 'USD', language)}.`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveView('orders')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ar' ? 'إنشاء طلبية شراء' : 'New Order (PO)'}</span>
          </button>
          <button
            onClick={() => setActiveView('suppliers')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 transition-all"
          >
            <Building2 className="w-4 h-4" />
            <span>{language === 'ar' ? 'إضافة مورد صيني' : 'Add Supplier'}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Suppliers */}
        <div
          onClick={() => setActiveView('suppliers')}
          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {language === 'ar' ? 'الموردون والمصانع' : 'Suppliers & Factories'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{suppliers.length}</span>
            <span className="text-xs text-emerald-600 font-semibold">
              {activeSuppliers.length} {language === 'ar' ? 'نشط' : 'active'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {directManufacturers.length} {language === 'ar' ? 'مصنع مباشر (Manufacturers)' : 'direct factories'}
          </p>
        </div>

        {/* KPI 2: Products & Quotes */}
        <div
          onClick={() => setActiveView('products')}
          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {language === 'ar' ? 'المنتجات المسجلة' : 'Registered Products'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{products.length}</span>
            <span className="text-xs text-blue-600 font-semibold">
              {quotations.length} {language === 'ar' ? 'عرض سعر' : 'quotes'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {Object.keys(categoryCounts).length} {language === 'ar' ? 'تصنيفات أجهزة منزلية' : 'appliance categories'}
          </p>
        </div>

        {/* KPI 3: Orders & Production */}
        <div
          onClick={() => setActiveView('orders')}
          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-purple-400 dark:hover:border-purple-600 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {language === 'ar' ? 'طلبيات الشراء' : 'Purchase Orders'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{orders.length}</span>
            <span className="text-xs text-amber-600 font-semibold">
              {ordersInProduction.length} {language === 'ar' ? 'قيد التصنيع' : 'in prod'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {ordersReadyToShip.length} {language === 'ar' ? 'جاهزة للشحن' : 'ready to ship'}
          </p>
        </div>

        {/* KPI 4: Shipments in Transit */}
        <div
          onClick={() => setActiveView('shipments')}
          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-cyan-400 dark:hover:border-cyan-600 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {language === 'ar' ? 'الشحنات البحرية والجوية' : 'Logistics & Transit'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Ship className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{shipments.length}</span>
            <span className="text-xs text-cyan-600 font-semibold">
              {shipmentsInTransit.length} {language === 'ar' ? 'في البحر' : 'in transit'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {shipmentsArrived.length} {language === 'ar' ? 'وصلت الميناء' : 'arrived'}
          </p>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Spend */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{language === 'ar' ? 'إجمالي قيمة المشتريات' : 'Total Procurement Value'}</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {formatMoney(totalProcurementSpend, 'USD', language)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              {language === 'ar' ? 'توفير تفاوضي:' : 'Saved:'} {formatMoney(totalSavings, 'USD', language)}
            </span>
            <span className="text-slate-400">FOB & EXW</span>
          </div>
        </div>

        {/* Total Paid */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{language === 'ar' ? 'إجمالي المبالغ المسددة' : 'Total Amount Paid (T/T)'}</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatMoney(totalPaid, 'USD', language)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              {totalProcurementSpend > 0 ? Math.round((totalPaid / totalProcurementSpend) * 100) : 0}% {language === 'ar' ? 'من الإجمالي' : 'of total'}
            </span>
            <span>{language === 'ar' ? 'دفعات مقدمة ومرحلية' : 'Advance & installments'}</span>
          </div>
        </div>

        {/* Balance Due */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{language === 'ar' ? 'الأرصدة المستحقة للمصانع' : 'Outstanding Balances Due'}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {formatMoney(totalBalanceDue, 'USD', language)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            {overdueInvoices.length > 0 ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {overdueInvoices.length} {language === 'ar' ? 'فواتير متأخرة' : 'overdue invoices'}
              </span>
            ) : (
              <span className="text-emerald-600 font-medium">
                {language === 'ar' ? 'جميع الفواتير ضمن فترة السماح' : 'All invoices within terms'}
              </span>
            )}
            <button
              onClick={() => setActiveView('invoices')}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {language === 'ar' ? 'سجل الفواتير ➔' : 'View Invoices ➔'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Breakdown Section: Active Shipments + Orders in Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Shipments Radar */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Ship className="w-4 h-4 text-blue-600" />
                {language === 'ar' ? 'تتبع الحاويات والشحنات البحرية' : 'Live Shipments & Container Tracking'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'ar' ? 'متابعة بوالص الشحن ومواعيد الوصول المتوقعة ETA' : 'Container milestones & estimated arrivals'}
              </p>
            </div>
            <button
              onClick={() => setActiveView('shipments')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>{language === 'ar' ? 'عرض الكل' : 'View all'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {shipments.map((sh) => (
              <div
                key={sh.id}
                onClick={() => setActiveView('shipments')}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#1e1e1e] hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                      {sh.containerNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {sh.containerType} ({sh.shippingLine})
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {sh.status}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    🚢 {sh.portOfLoading} ➔ {sh.portOfDischarge}
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    ETA: {sh.eta}
                  </span>
                </div>

                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>B/L: {sh.billOfLadingNumber}</span>
                  <span>{sh.grossWeightKg} kg • {sh.totalVolumeCbm} CBM</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders in Production & Progress */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" />
                {language === 'ar' ? 'الطلبيات النشطة في خطوط الإنتاج' : 'Active POs on Factory Production Lines'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'ar' ? 'متابعة التصنيع، الفحص، وجاهزية الشحن' : 'Manufacturing stage & inspection status'}
              </p>
            </div>
            <button
              onClick={() => setActiveView('orders')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>{language === 'ar' ? 'عرض الكل' : 'View all'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => setActiveView('orders')}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#1e1e1e] hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono">
                      {order.id}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                      {order.supplierName}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    {order.status}
                  </span>
                </div>

                <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                  {order.items.map((it) => (
                    <div key={it.id} className="flex justify-between items-center py-0.5">
                      <span>• {it.quantity}x {it.modelNumber}</span>
                      <span className="font-medium">{formatMoney(it.totalItemAmount, order.currency, language)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    {language === 'ar' ? 'انتهاء التصنيع:' : 'Est. Completion:'} {order.expectedProductionEnd || '-'}
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {formatMoney(order.grandTotal, order.currency, language)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Distribution & Pending Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs lg:col-span-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-emerald-600" />
            {language === 'ar' ? 'توزيع الأجهزة حسب التصنيف' : 'Appliance Categories'}
          </h3>
          <div className="space-y-2.5">
            {Object.entries(categoryCounts).map(([catKey, count]) => {
              const label = categoryLabels[catKey]?.[language] || catKey;
              const percent = Math.round((count / products.length) * 100);
              return (
                <div key={catKey} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
                    <span className="text-slate-500 font-semibold">{count} ({percent}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actionable Follow-up Tasks */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              {language === 'ar' ? 'المهام والمتابعات المستعجلة' : 'Actionable Reminders & Tasks'}
            </h3>
            <button
              onClick={() => setActiveView('tasks')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {language === 'ar' ? 'عرض قائمة المهام' : 'View Tasks'}
            </button>
          </div>

          <div className="space-y-2">
            {tasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                onClick={() => setActiveView('tasks')}
                className="flex items-start justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-[#1e1e1e] hover:bg-slate-100/60 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      task.priority === 'urgent' || task.priority === 'high'
                        ? 'bg-rose-500'
                        : task.priority === 'medium'
                        ? 'bg-amber-500'
                        : 'bg-blue-400'
                    }`}
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">
                      {task.title}
                    </p>
                    {task.relatedEntityTitle && (
                      <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
                        🔗 {task.relatedEntityTitle}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-end shrink-0 ms-2">
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {task.dueDate}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    {task.assignedTo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
