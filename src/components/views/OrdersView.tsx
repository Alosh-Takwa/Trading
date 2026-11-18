import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  ShoppingCart,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  Building2,
  DollarSign,
  TrendingUp,
  X,
  Layers,
  Printer,
  Trash2,
  Edit2,
  Receipt,
  ExternalLink,
} from 'lucide-react';
import { PurchaseOrder, POStatus, POItem, Incoterm, CurrencyCode } from '../../types/erp';
import { calculatePOTotals, formatMoney, exportToExcel, exportToWordDoc } from '../../utils/erpLogic';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

export const OrdersView: React.FC = () => {
  const {
    orders,
    suppliers,
    products,
    quotations,
    invoices,
    createOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    createInvoiceForOrder,
    setActiveView,
    language,
    showToast,
  } = useERP();

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<PurchaseOrder | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<PurchaseOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<PurchaseOrder | null>(null);

  // Edit PO State
  const [editSupplierId, setEditSupplierId] = useState('');
  const [editOrderItems, setEditOrderItems] = useState<POItem[]>([]);
  const [editAdditionalCosts, setEditAdditionalCosts] = useState({
    packagingCost: 0,
    moldCost: 0,
    sampleCost: 0,
    freightLocalCost: 0,
    otherCost: 0,
  });
  const [editDeliveryTerms, setEditDeliveryTerms] = useState<Incoterm>('FOB');
  const [editPaymentTerms, setEditPaymentTerms] = useState('');
  const [editExpectedProductionEnd, setEditExpectedProductionEnd] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCurrency, setEditCurrency] = useState<CurrencyCode>('USD');

  // New PO State
  const [newOrderSupplierId, setNewOrderSupplierId] = useState(suppliers[0]?.id || '');
  const [orderItems, setOrderItems] = useState<POItem[]>([
    {
      id: 'poi-1',
      productId: products[0]?.id || '',
      productName: products[0]?.nameAr || '',
      modelNumber: products[0]?.modelNumber || '',
      specsSummary: 'No Frost, R600a',
      quantity: 100,
      originalQuotedPrice: 220,
      negotiatedUnitPrice: 200, // $20 saved per unit!
      currency: 'USD',
      discountPercentage: 0,
      totalItemAmount: 20000,
    },
  ]);

  const [additionalCosts, setAdditionalCosts] = useState({
    packagingCost: 400,
    moldCost: 0,
    sampleCost: 0,
    freightLocalCost: 350,
    otherCost: 0,
  });

  const [deliveryTerms, setDeliveryTerms] = useState<Incoterm>('FOB');
  const [paymentTerms, setPaymentTerms] = useState('30% T/T Deposit, 70% against B/L copy');
  const [expectedProductionEnd, setExpectedProductionEnd] = useState(
    new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('تغليف 5 طبقات مع كتيب الإرشادات بالعربية والإنجليزية.');

  const poTotals = calculatePOTotals(orderItems, additionalCosts, 0, 0);

  const handleAddItem = () => {
    const defaultProduct = products[0];
    if (!defaultProduct) return;
    setOrderItems((prev) => [
      ...prev,
      {
        id: `poi-${Date.now()}`,
        productId: defaultProduct.id,
        productName: defaultProduct.nameAr,
        modelNumber: defaultProduct.modelNumber,
        specsSummary: '',
        quantity: 50,
        originalQuotedPrice: 150,
        negotiatedUnitPrice: 140,
        currency: 'USD',
        discountPercentage: 0,
        totalItemAmount: 7000,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductSelect = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    // Find if there is an existing quote for this supplier & product
    const existingQuote = quotations.find(
      (q) => q.supplierId === newOrderSupplierId && q.productId === prod.id
    );

    const quoted = existingQuote ? existingQuote.unitPrice : 150;

    const updated = [...orderItems];
    updated[index] = {
      ...updated[index],
      productId: prod.id,
      productName: prod.nameAr,
      modelNumber: prod.modelNumber,
      originalQuotedPrice: quoted,
      negotiatedUnitPrice: quoted, // can be negotiated down!
      totalItemAmount: updated[index].quantity * quoted,
    };
    setOrderItems(updated);
  };

  const handleItemPriceChange = (index: number, field: 'quantity' | 'negotiatedUnitPrice' | 'originalQuotedPrice', value: number) => {
    const updated = [...orderItems];
    (updated[index] as any)[field] = value;
    updated[index].totalItemAmount = updated[index].quantity * updated[index].negotiatedUnitPrice;
    setOrderItems(updated);
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === newOrderSupplierId);
    if (!sup) return;

    const orderId = createOrder({
      supplierId: sup.id,
      supplierName: sup.nameEn,
      factoryName: sup.factoryName,
      assignedManager: 'Alosh Takwa',
      orderDate: new Date().toISOString().split('T')[0],
      paymentTerms,
      deliveryTerms,
      currency: 'USD',
      items: orderItems,
      subtotal: poTotals.subtotal,
      totalDiscount: poTotals.totalDiscount,
      additionalCosts,
      totalTax: poTotals.totalTax,
      grandTotal: poTotals.grandTotal,
      totalPaid: 0,
      balanceDue: poTotals.grandTotal,
      status: 'draft',
      expectedProductionEnd,
      notes,
    });

    setIsCreateModalOpen(false);
  };

  const editPoTotals = calculatePOTotals(editOrderItems, editAdditionalCosts, 0, 0);

  const handleOpenEditOrder = (order: PurchaseOrder) => {
    setOrderToEdit(order);
    setEditSupplierId(order.supplierId);
    setEditOrderItems(order.items.map((it) => ({ ...it })));
    setEditAdditionalCosts({ ...order.additionalCosts });
    setEditDeliveryTerms(order.deliveryTerms);
    setEditPaymentTerms(order.paymentTerms);
    setEditExpectedProductionEnd(order.expectedProductionEnd || '');
    setEditNotes(order.notes || '');
    setEditCurrency(order.currency || 'USD');
  };

  const handleAddEditItem = () => {
    const defaultProduct = products[0];
    if (!defaultProduct) return;
    setEditOrderItems((prev) => [
      ...prev,
      {
        id: `poi-${Date.now()}`,
        productId: defaultProduct.id,
        productName: defaultProduct.nameAr,
        modelNumber: defaultProduct.modelNumber,
        specsSummary: '',
        quantity: 50,
        originalQuotedPrice: 150,
        negotiatedUnitPrice: 140,
        currency: editCurrency,
        discountPercentage: 0,
        totalItemAmount: 7000,
      },
    ]);
  };

  const handleRemoveEditItem = (index: number) => {
    setEditOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditProductSelect = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const existingQuote = quotations.find(
      (q) => q.supplierId === editSupplierId && q.productId === prod.id
    );

    const quoted = existingQuote ? existingQuote.unitPrice : 150;

    const updated = [...editOrderItems];
    updated[index] = {
      ...updated[index],
      productId: prod.id,
      productName: prod.nameAr,
      modelNumber: prod.modelNumber,
      originalQuotedPrice: quoted,
      negotiatedUnitPrice: quoted,
      totalItemAmount: updated[index].quantity * quoted,
    };
    setEditOrderItems(updated);
  };

  const handleEditItemPriceChange = (
    index: number,
    field: 'quantity' | 'negotiatedUnitPrice' | 'originalQuotedPrice',
    value: number
  ) => {
    const updated = [...editOrderItems];
    (updated[index] as any)[field] = value;
    updated[index].totalItemAmount = updated[index].quantity * updated[index].negotiatedUnitPrice;
    setEditOrderItems(updated);
  };

  const handleSaveEditPO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToEdit) return;
    const sup = suppliers.find((s) => s.id === editSupplierId);
    if (!sup) return;

    if (editOrderItems.length === 0) {
      showToast(language === 'ar' ? 'يجب إضافة بند واحد على الأقل للطلبية' : 'At least one item required', '', 'error');
      return;
    }

    updateOrder(orderToEdit.id, {
      supplierId: sup.id,
      supplierName: sup.nameEn,
      factoryName: sup.factoryName,
      paymentTerms: editPaymentTerms,
      deliveryTerms: editDeliveryTerms,
      currency: editCurrency,
      items: editOrderItems,
      subtotal: editPoTotals.subtotal,
      totalDiscount: editPoTotals.totalDiscount,
      additionalCosts: editAdditionalCosts,
      totalTax: editPoTotals.totalTax,
      grandTotal: editPoTotals.grandTotal,
      balanceDue: Math.max(0, editPoTotals.grandTotal - (orderToEdit.totalPaid || 0)),
      expectedProductionEnd: editExpectedProductionEnd,
      notes: editNotes,
    });

    setOrderToEdit(null);
  };

  const filteredOrders = orders.filter((o) => {
    if (selectedStatus === 'all') return true;
    return o.status === selectedStatus;
  });

  const exportOrderToWord = (order: PurchaseOrder) => {
    const html = `
      <div style="direction: rtl; font-family: Arial, sans-serif;">
        <h1 style="color: #1e3a8a;">أمر شراء رسمي (Purchase Order) - ${order.id}</h1>
        <p><strong>المورد:</strong> ${order.supplierName} | <strong>المصنع:</strong> ${order.factoryName || '-'}</p>
        <p><strong>تاريخ الطلب:</strong> ${order.orderDate} | <strong>شروط التسليم:</strong> ${order.deliveryTerms} | <strong>شروط الدفع:</strong> ${order.paymentTerms}</p>
        
        <h3>بنود أمر الشراء:</h3>
        <table>
          <thead>
            <tr>
              <th>المنتج</th>
              <th>الموديل</th>
              <th>الكمية</th>
              <th>السعر المعروض</th>
              <th>السعر المتفق عليه</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${order.items
              .map(
                (item) => `
              <tr>
                <td>${item.productName}</td>
                <td>${item.modelNumber}</td>
                <td>${item.quantity}</td>
                <td>$${item.originalQuotedPrice}</td>
                <td><strong>$${item.negotiatedUnitPrice}</strong></td>
                <td>$${item.totalItemAmount}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <h3>الإجماليات المالية:</h3>
        <p>مجموع البنود: $${order.subtotal}</p>
        <p>تكاليف إضافية (تغليف وشحن محلي): $${Object.values(order.additionalCosts).reduce((a, b) => a + b, 0)}</p>
        <h2>الإجمالي النهائي: $${order.grandTotal}</h2>
      </div>
    `;
    exportToWordDoc(order.id, html, `PurchaseOrder_${order.id}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-purple-600" />
            <span>{language === 'ar' ? 'إدارة طلبيات الشراء (Purchase Orders)' : 'Purchase Orders & Production'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'إصدار أوامر الشراء، تعديل الأسعار التفاوضية، وتتبع مراحل التصنيع والجودة حتى الشحن'
              : 'Issue orders with independent negotiated pricing and follow live production stages'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ar' ? 'إنشاء أمر شراء جديد' : 'New Purchase Order'}</span>
          </button>
        </div>
      </div>

      {/* Filter by Status Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'all', ar: 'الكل', en: 'All' },
          { key: 'draft', ar: 'مسودة', en: 'Draft' },
          { key: 'confirmed', ar: 'مؤكدة', en: 'Confirmed' },
          { key: 'in_production', ar: 'قيد التصنيع', en: 'In Production' },
          { key: 'ready_to_ship', ar: 'جاهزة للشحن', en: 'Ready to Ship' },
          { key: 'shipped', ar: 'تم الشحن', en: 'Shipped' },
        ].map((st) => (
          <button
            key={st.key}
            onClick={() => setSelectedStatus(st.key)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              selectedStatus === st.key
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {language === 'ar' ? st.ar : st.en}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          // Calculate negotiation savings for this order
          const orderSavings = order.items.reduce((acc, it) => {
            if (it.originalQuotedPrice > it.negotiatedUnitPrice) {
              return acc + (it.originalQuotedPrice - it.negotiatedUnitPrice) * it.quantity;
            }
            return acc;
          }, 0);

          return (
            <div
              key={order.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-purple-300 dark:hover:border-purple-700 transition-all space-y-4"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2.5 py-1 rounded-lg">
                    {order.id}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {order.supplierName}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {language === 'ar' ? 'تاريخ الإصدار:' : 'Order Date:'} {order.orderDate} • {order.deliveryTerms}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Dropdown */}
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value as POStatus)}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-purple-700 dark:text-purple-300"
                  >
                    <option value="draft">Draft (مسودة)</option>
                    <option value="pending_confirmation">Pending Confirmation</option>
                    <option value="confirmed">Confirmed (تم التأكيد)</option>
                    <option value="in_production">In Production (قيد التصنيع)</option>
                    <option value="production_completed">Production Completed</option>
                    <option value="ready_to_ship">Ready to Ship (جاهز للشحن)</option>
                    <option value="shipped">Shipped (تم الشحن)</option>
                    <option value="completed">Completed (مكتمل)</option>
                  </select>

                  {/* Edit PO Button */}
                  <button
                    onClick={() => handleOpenEditOrder(order)}
                    className="px-2.5 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors flex items-center gap-1.5 text-xs font-bold"
                    title={language === 'ar' ? 'تعديل أمر الشراء' : 'Edit Order'}
                  >
                    <Edit2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>{language === 'ar' ? 'تعديل الطلبية' : 'Edit Order'}</span>
                  </button>

                  {/* Commercial Invoice & Payments Button */}
                  <button
                    onClick={() => {
                      const existingInv = invoices.find(
                        (inv) => inv.purchaseOrderId === order.id || inv.poNumber === order.id
                      );
                      if (!existingInv) {
                        createInvoiceForOrder(order.id);
                      }
                      setActiveView('invoices');
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center gap-1.5 text-xs font-bold"
                    title={language === 'ar' ? 'الانتقال إلى الفاتورة التجارية والمدفوعات' : 'Go to Invoice & Payments'}
                  >
                    <Receipt className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{language === 'ar' ? 'الفاتورة والمدفوعات' : 'Invoice'}</span>
                  </button>

                  <button
                    onClick={() => exportOrderToWord(order)}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                    title={language === 'ar' ? 'تصدير Word' : 'Export Word'}
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setOrderToDelete(order)}
                    className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    title={language === 'ar' ? 'حذف أمر الشراء' : 'Delete Order'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-[#1e1e1e] text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="p-2.5 text-start">{language === 'ar' ? 'البند / الموديل' : 'Item / Model'}</th>
                      <th className="p-2.5 text-start">{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                      <th className="p-2.5 text-start">{language === 'ar' ? 'السعر الأصلي المعروض' : 'Quoted Price'}</th>
                      <th className="p-2.5 text-start">{language === 'ar' ? 'السعر المتفق عليه (PO)' : 'Agreed Unit Price'}</th>
                      <th className="p-2.5 text-start">{language === 'ar' ? 'التوفير التفاوضي' : 'Savings'}</th>
                      <th className="p-2.5 text-start">{language === 'ar' ? 'إجمالي البند' : 'Total'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {order.items.map((it) => {
                      const itemSaving = (it.originalQuotedPrice - it.negotiatedUnitPrice) * it.quantity;
                      return (
                        <tr key={it.id}>
                          <td className="p-2.5">
                            <span className="font-bold text-slate-900 dark:text-white block">{it.productName}</span>
                            <span className="font-mono text-[11px] text-slate-400">[{it.modelNumber}]</span>
                          </td>
                          <td className="p-2.5 font-bold">{it.quantity}</td>
                          <td className="p-2.5 text-slate-400 line-through">${it.originalQuotedPrice}</td>
                          <td className="p-2.5 font-black text-purple-600 dark:text-purple-400 text-sm">
                            ${it.negotiatedUnitPrice}
                          </td>
                          <td className="p-2.5">
                            {itemSaving > 0 ? (
                              <span className="font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                                +${itemSaving}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono">-</span>
                            )}
                          </td>
                          <td className="p-2.5 font-black text-slate-900 dark:text-white">
                            {formatMoney(it.totalItemAmount, order.currency, language)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Status Timeline */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  {language === 'ar' ? 'سجل مراحل الطلبية (Status History):' : 'Order Timeline:'}
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {order.statusHistory.map((sh, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">{sh.status}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({sh.date})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Bottom Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500">
                    {language === 'ar' ? 'المسدد:' : 'Paid:'}{' '}
                    <strong className="text-emerald-600">{formatMoney(order.totalPaid, order.currency, language)}</strong>
                  </span>
                  <span className="text-slate-500">
                    {language === 'ar' ? 'المتبقي:' : 'Balance:'}{' '}
                    <strong className="text-amber-600">{formatMoney(order.balanceDue, order.currency, language)}</strong>
                  </span>
                  {orderSavings > 0 && (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {language === 'ar' ? `وفرت ${formatMoney(orderSavings, order.currency, language)} في هذه الطلبية!` : `Saved ${formatMoney(orderSavings, order.currency, language)}!`}
                    </span>
                  )}
                </div>

                <div className="text-end">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    {language === 'ar' ? 'الإجمالي النهائي للطلبية' : 'Grand Total PO Amount'}
                  </span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">
                    {formatMoney(order.grandTotal, order.currency, language)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create PO Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-3xl my-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1e1e1e]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
                <span>{language === 'ar' ? 'إنشاء أمر شراء رسمي (PO) جديد' : 'Issue New Purchase Order'}</span>
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Supplier Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'المورد والمصنع الصيني *' : 'Target Chinese Manufacturer *'}
                  </label>
                  <select
                    value={newOrderSupplierId}
                    onChange={(e) => setNewOrderSupplierId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} - {s.nameEn} ({s.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'شروط التسليم (Incoterms)' : 'Delivery Terms'}
                  </label>
                  <select
                    value={deliveryTerms}
                    onChange={(e) => setDeliveryTerms(e.target.value as Incoterm)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="FOB">FOB (شحن ميناء صيني)</option>
                    <option value="EXW">EXW (أرض المصنع)</option>
                    <option value="CIF">CIF (شامل الشحن)</option>
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {language === 'ar' ? 'بنود الطلبية والأسعار التفاوضية' : 'Order Line Items & Negotiated Pricing'}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'إضافة بند' : 'Add Item'}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {orderItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.modelNumber} - {p.nameAr}
                            </option>
                          ))}
                        </select>
                        {orderItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block">{language === 'ar' ? 'الكمية' : 'Qty'}</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemPriceChange(idx, 'quantity', Number(e.target.value))}
                            className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-center"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block">{language === 'ar' ? 'السعر الأصلي' : 'Quoted $'}</label>
                          <input
                            type="number"
                            value={item.originalQuotedPrice}
                            onChange={(e) => handleItemPriceChange(idx, 'originalQuotedPrice', Number(e.target.value))}
                            className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 text-center font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-purple-600 font-bold block">{language === 'ar' ? 'السعر المتفق عليه' : 'Agreed $'}</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.negotiatedUnitPrice}
                            onChange={(e) => handleItemPriceChange(idx, 'negotiatedUnitPrice', Number(e.target.value))}
                            className="w-full p-1.5 rounded-lg border border-purple-300 dark:border-purple-600 font-black text-center text-purple-600 dark:text-purple-400"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block">{language === 'ar' ? 'إجمالي البند' : 'Item Total'}</label>
                          <div className="p-1.5 font-black text-center text-slate-900 dark:text-white">
                            ${item.totalItemAmount}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Costs Section */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#1e1e1e]">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">{language === 'ar' ? 'تكلفة التغليف $' : 'Packaging Cost $'}</label>
                  <input
                    type="number"
                    value={additionalCosts.packagingCost}
                    onChange={(e) => setAdditionalCosts({ ...additionalCosts, packagingCost: Number(e.target.value) })}
                    className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">{language === 'ar' ? 'تكلفة القالب $' : 'Mold Cost $'}</label>
                  <input
                    type="number"
                    value={additionalCosts.moldCost}
                    onChange={(e) => setAdditionalCosts({ ...additionalCosts, moldCost: Number(e.target.value) })}
                    className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">{language === 'ar' ? 'نقل محلي صيني $' : 'Local Freight $'}</label>
                  <input
                    type="number"
                    value={additionalCosts.freightLocalCost}
                    onChange={(e) => setAdditionalCosts({ ...additionalCosts, freightLocalCost: Number(e.target.value) })}
                    className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">{language === 'ar' ? 'مصاريف أخرى $' : 'Other Cost $'}</label>
                  <input
                    type="number"
                    value={additionalCosts.otherCost}
                    onChange={(e) => setAdditionalCosts({ ...additionalCosts, otherCost: Number(e.target.value) })}
                    className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Totals Summary in Modal */}
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-purple-700 dark:text-purple-300 font-bold block">
                    {language === 'ar' ? 'إجمالي أمر الشراء بعد التفاوض:' : 'Total Purchase Order Amount:'}
                  </span>
                  {poTotals.totalSavingsVsOriginalQuote > 0 && (
                    <span className="text-xs text-emerald-600 font-bold">
                      🎉 {language === 'ar' ? `وفرت ${formatMoney(poTotals.totalSavingsVsOriginalQuote, 'USD', language)} مقارنة بعرض السعر الأصلي!` : `Saved $${poTotals.totalSavingsVsOriginalQuote} vs quote!`}
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black text-purple-700 dark:text-purple-300">
                  ${poTotals.grandTotal}
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl"
                >
                  {language === 'ar' ? 'إصدار أمر الشراء PO' : 'Issue Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit PO Modal */}
      {orderToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-3xl my-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-purple-50/50 dark:bg-purple-950/20">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-purple-600" />
                <span>
                  {language === 'ar'
                    ? `تعديل أمر الشراء (${orderToEdit.id})`
                    : `Edit Purchase Order (${orderToEdit.id})`}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setOrderToEdit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPO} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Supplier and Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'المورد والمصنع الصيني *' : 'Target Manufacturer *'}
                  </label>
                  <select
                    value={editSupplierId}
                    onChange={(e) => setEditSupplierId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} - {s.nameEn} ({s.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'العملة' : 'Currency'}
                  </label>
                  <select
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value as CurrencyCode)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="CNY">CNY (¥)</option>
                    <option value="SAR">SAR (ر.س)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="SYP">SYP (ل.س)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'شروط التسليم (Incoterms)' : 'Delivery Terms'}
                  </label>
                  <select
                    value={editDeliveryTerms}
                    onChange={(e) => setEditDeliveryTerms(e.target.value as Incoterm)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="FOB">FOB (شحن ميناء صيني)</option>
                    <option value="EXW">EXW (أرض المصنع)</option>
                    <option value="CIF">CIF (شامل الشحن والتأمين)</option>
                    <option value="CFR">CFR (أجرة الشحن مدفوعة)</option>
                    <option value="DDP">DDP (تسليم خالص الجمارك)</option>
                  </select>
                </div>
              </div>

              {/* Payment Terms and Production End */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'شروط الدفع المتفق عليها' : 'Payment Terms'}
                  </label>
                  <input
                    type="text"
                    value={editPaymentTerms}
                    onChange={(e) => setEditPaymentTerms(e.target.value)}
                    placeholder="e.g. 30% T/T Deposit, 70% Before Shipment"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'تاريخ انتهاء الإنتاج المتوقع' : 'Expected Production Completion'}
                  </label>
                  <input
                    type="date"
                    value={editExpectedProductionEnd}
                    onChange={(e) => setEditExpectedProductionEnd(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {language === 'ar' ? 'بنود الطلبية والأسعار التفاوضية' : 'Order Line Items & Pricing'}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddEditItem}
                    className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'إضافة بند آخر' : 'Add Item'}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {editOrderItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={item.productId}
                          onChange={(e) => handleEditProductSelect(idx, e.target.value)}
                          className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.modelNumber} - {p.nameAr}
                            </option>
                          ))}
                        </select>
                        {editOrderItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEditItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                            title={language === 'ar' ? 'حذف البند' : 'Remove Item'}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">{language === 'ar' ? 'الكمية' : 'Qty'}</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleEditItemPriceChange(idx, 'quantity', Number(e.target.value))}
                            className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-center"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">{language === 'ar' ? 'السعر الأصلي' : 'Quoted'}</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.originalQuotedPrice}
                            onChange={(e) => handleEditItemPriceChange(idx, 'originalQuotedPrice', Number(e.target.value))}
                            className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 text-center font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-purple-600 font-bold block mb-0.5">{language === 'ar' ? 'السعر المتفق عليه' : 'Agreed Price'}</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.negotiatedUnitPrice}
                            onChange={(e) => handleEditItemPriceChange(idx, 'negotiatedUnitPrice', Number(e.target.value))}
                            className="w-full p-1.5 rounded-lg border border-purple-300 dark:border-purple-600 font-black text-center text-purple-600 dark:text-purple-400"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">{language === 'ar' ? 'إجمالي البند' : 'Item Total'}</label>
                          <div className="p-1.5 font-black text-center text-slate-900 dark:text-white">
                            {formatMoney(item.totalItemAmount, editCurrency, language)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Costs Section */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#1e1e1e]">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">{language === 'ar' ? 'تكلفة التغليف' : 'Packaging'}</label>
                  <input
                    type="number"
                    value={editAdditionalCosts.packagingCost}
                    onChange={(e) => setEditAdditionalCosts({ ...editAdditionalCosts, packagingCost: Number(e.target.value) })}
                    className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">{language === 'ar' ? 'تكلفة القالب' : 'Mold Cost'}</label>
                  <input
                    type="number"
                    value={editAdditionalCosts.moldCost}
                    onChange={(e) => setEditAdditionalCosts({ ...editAdditionalCosts, moldCost: Number(e.target.value) })}
                    className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">{language === 'ar' ? 'نقل محلي صيني' : 'Local Freight'}</label>
                  <input
                    type="number"
                    value={editAdditionalCosts.freightLocalCost}
                    onChange={(e) => setEditAdditionalCosts({ ...editAdditionalCosts, freightLocalCost: Number(e.target.value) })}
                    className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">{language === 'ar' ? 'مصاريف أخرى' : 'Other Cost'}</label>
                  <input
                    type="number"
                    value={editAdditionalCosts.otherCost}
                    onChange={(e) => setEditAdditionalCosts({ ...editAdditionalCosts, otherCost: Number(e.target.value) })}
                    className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'ملاحظات أو شروط خاصة' : 'Notes & Remarks'}
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  placeholder={language === 'ar' ? 'أي ملاحظات خاصة بالتصنيع أو الفحص...' : 'Manufacturing or inspection notes...'}
                />
              </div>

              {/* Totals Summary */}
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-purple-700 dark:text-purple-300 font-bold block">
                    {language === 'ar' ? 'إجمالي أمر الشراء بعد التعديل والتفاوض:' : 'Total Purchase Order Amount:'}
                  </span>
                  {editPoTotals.totalSavingsVsOriginalQuote > 0 && (
                    <span className="text-xs text-emerald-600 font-bold">
                      🎉 {language === 'ar'
                        ? `وفرت ${formatMoney(editPoTotals.totalSavingsVsOriginalQuote, editCurrency, language)} مقارنة بعرض السعر الأصلي!`
                        : `Saved ${formatMoney(editPoTotals.totalSavingsVsOriginalQuote, editCurrency, language)} vs quote!`}
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black text-purple-700 dark:text-purple-300">
                  {formatMoney(editPoTotals.grandTotal, editCurrency, language)}
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOrderToEdit(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors"
                >
                  {language === 'ar' ? 'حفظ تعديلات الطلبية' : 'Save Order Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Order Modal */}
      <ConfirmDeleteModal
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={() => {
          if (orderToDelete) {
            deleteOrder(orderToDelete.id);
            setOrderToDelete(null);
          }
        }}
        title={language === 'ar' ? 'تأكيد حذف أمر الشراء' : 'Confirm Delete Order'}
        message={
          language === 'ar'
            ? `هل أنت متأكد من رغبتك في حذف أمر الشراء (${orderToDelete?.id}) للمورد (${orderToDelete?.supplierName}) نهائياً؟`
            : `Are you sure you want to permanently delete order (${orderToDelete?.id}) for (${orderToDelete?.supplierName})?`
        }
        confirmText={language === 'ar' ? 'نعم، حذف أمر الشراء' : 'Delete Order'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
      />
    </div>
  );
};
