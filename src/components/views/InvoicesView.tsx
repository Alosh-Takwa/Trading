import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Receipt,
  Plus,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  FileSpreadsheet,
  X,
  CreditCard,
  Trash2,
} from 'lucide-react';
import { Invoice, Payment, PaymentMethod, CurrencyCode } from '../../types/erp';
import { formatMoney, exportToExcel } from '../../utils/erpLogic';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

export const InvoicesView: React.FC = () => {
  const {
    invoices,
    payments,
    orders,
    suppliers,
    createInvoice,
    addPayment,
    deleteInvoice,
    language,
    showToast,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(invoices[0]?.id || '');
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  // Sync selected invoice if current selection is invalid
  const currentInvoice = invoices.find((i) => i.id === selectedInvoiceId) || invoices[0] || null;

  // Add Payment Form State
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    currency: 'USD' as CurrencyCode,
    paymentMethod: 'bank_wire_tt' as PaymentMethod,
    bankAccountUsed: 'Al Rajhi Corporate Bank - USD (...8831)',
    transactionReference: `SWIFT-TT-${Math.floor(100000000 + Math.random() * 900000000)}`,
    executedBy: 'Finance Dept (Alosh Takwa)',
    notes: 'سداد دفعة مالية وفق شروط التعاقد التجاري.',
  });

  const totalInvoiced = invoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalPaid = invoices.reduce((acc, i) => acc + i.paidAmount, 0);
  const totalBalanceDue = invoices.reduce((acc, i) => acc + i.balanceDue, 0);

  const openPaymentModal = (invoice?: Invoice) => {
    if (invoice) {
      setSelectedInvoiceId(invoice.id);
      setPaymentData((prev) => ({
        ...prev,
        amount: invoice.balanceDue > 0 ? invoice.balanceDue : 0,
        currency: invoice.currency || 'USD',
        transactionReference: `SWIFT-TT-${Math.floor(100000000 + Math.random() * 900000000)}`,
      }));
    } else if (invoices.length > 0) {
      const firstInv = invoices.find((i) => i.balanceDue > 0) || invoices[0];
      setSelectedInvoiceId(firstInv.id);
      setPaymentData((prev) => ({
        ...prev,
        amount: firstInv.balanceDue > 0 ? firstInv.balanceDue : 0,
        currency: firstInv.currency || 'USD',
        transactionReference: `SWIFT-TT-${Math.floor(100000000 + Math.random() * 900000000)}`,
      }));
    }
    setIsAddPaymentModalOpen(true);
  };

  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const inv = invoices.find((i) => i.id === (selectedInvoiceId || currentInvoice?.id));
    if (!inv) {
      showToast(language === 'ar' ? 'يرجى تحديد فاتورة صالحة' : 'Please select a valid invoice', '', 'error');
      return;
    }

    const payAmount = Number(paymentData.amount);

    if (payAmount <= 0) {
      showToast(language === 'ar' ? 'المبلغ يجب أن يكون أكبر من صفر' : 'Amount must be greater than zero', '', 'error');
      return;
    }

    if (payAmount > inv.balanceDue + 0.001) {
      showToast(
        language === 'ar'
          ? `لا يمكن سداد مبلغ ($${payAmount.toLocaleString()}) أكبر من الرصيد المتبقي للفاتورة ($${inv.balanceDue.toLocaleString()})`
          : `Payment amount ($${payAmount}) cannot exceed invoice balance due ($${inv.balanceDue})`,
        '',
        'error'
      );
      return;
    }

    const success = addPayment({
      invoiceId: inv.id,
      purchaseOrderId: inv.purchaseOrderId,
      supplierId: inv.supplierId,
      supplierName: inv.supplierName,
      paymentDate: new Date().toISOString().split('T')[0],
      amount: payAmount,
      currency: paymentData.currency,
      paymentMethod: paymentData.paymentMethod,
      bankAccountUsed: paymentData.bankAccountUsed,
      transactionReference: paymentData.transactionReference,
      executedBy: paymentData.executedBy,
      notes: paymentData.notes,
    });

    if (success) {
      setIsAddPaymentModalOpen(false);
    }
  };

  const exportInvoicesToExcel = () => {
    const data = invoices.map((inv) => ({
      InvoiceNumber: inv.invoiceNumber,
      PO: inv.poNumber,
      Supplier: inv.supplierName,
      IssueDate: inv.issueDate,
      DueDate: inv.dueDate,
      TotalAmount: inv.totalAmount,
      PaidAmount: inv.paidAmount,
      BalanceDue: inv.balanceDue,
      Status: inv.status,
    }));
    exportToExcel('Invoices', data, 'SinoTrack_Invoices_Financial_Report');
    showToast(language === 'ar' ? 'تم تصدير الفواتير إلى Excel' : 'Exported Invoices to Excel');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            <span>{language === 'ar' ? 'الفواتير والمدفوعات والأرصدة المستحقة' : 'Invoices & Factory Payments'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'تتبع الفواتير التجارية، سداد الدفعات المقدمة والمرحلية، وحساب الأرصدة التلقائي'
              : 'Commercial invoices, wire transfers (T/T), SWIFT refs, and real-time balances'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportInvoicesToExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{language === 'ar' ? 'تصدير Excel' : 'Export Excel'}</span>
          </button>
          <button
            onClick={() => openPaymentModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <CreditCard className="w-4 h-4" />
            <span>{language === 'ar' ? 'تسجيل دفعة مالية جديدة' : 'Record Payment'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">{language === 'ar' ? 'إجمالي الفواتير' : 'Total Invoiced'}</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {formatMoney(totalInvoiced, 'USD', language)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {invoices.length} {language === 'ar' ? 'فواتير صادرة' : 'invoices'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">{language === 'ar' ? 'إجمالي المسدد' : 'Total Paid'}</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatMoney(totalPaid, 'USD', language)}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0}% {language === 'ar' ? 'نسبة السداد الكلية' : 'settled'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">{language === 'ar' ? 'الأرصدة المستحقة' : 'Outstanding Balance'}</span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {formatMoney(totalBalanceDue, 'USD', language)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {language === 'ar' ? 'مستحقة عند استلام B/L' : 'Payable on B/L copy'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-3 py-2 rounded-xl transition-all ${
            activeTab === 'invoices'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {language === 'ar' ? `الفواتير التجارية (${invoices.length})` : `Invoices (${invoices.length})`}
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-3 py-2 rounded-xl transition-all ${
            activeTab === 'payments'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {language === 'ar' ? `سجل الدفعات والتحويلات (${payments.length})` : `Payment Transactions (${payments.length})`}
        </button>
      </div>

      {/* INVOICES LIST */}
      {activeTab === 'invoices' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-[#1e1e1e] text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 text-start">{language === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}</th>
                <th className="p-3 text-start">{language === 'ar' ? 'أمر الشراء' : 'PO #'}</th>
                <th className="p-3 text-start">{language === 'ar' ? 'المورد / المصنع' : 'Supplier'}</th>
                <th className="p-3 text-start">{language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                <th className="p-3 text-start">{language === 'ar' ? 'القيمة الإجمالية' : 'Total'}</th>
                <th className="p-3 text-start">{language === 'ar' ? 'المسدد' : 'Paid'}</th>
                <th className="p-3 text-start">{language === 'ar' ? 'المتبقي' : 'Balance'}</th>
                <th className="p-3 text-start">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="p-3 text-center">{language === 'ar' ? 'إجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    <Receipt className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-semibold text-sm">
                      {language === 'ar' ? 'لا توجد أي فواتير تجارية مسجلة حالياً' : 'No commercial invoices recorded yet'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {language === 'ar'
                        ? 'يمكنك إنشاء طلبية شراء من قسم الطلبيات وسيتم توليد الفاتورة ومتابعة دفعاتها هنا تلقائياً'
                        : 'Create a purchase order from Orders section to track invoices and payments here'}
                    </p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="p-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {inv.poNumber}
                    </td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                      {inv.supplierName}
                    </td>
                    <td className="p-3 font-mono text-slate-500">{inv.dueDate}</td>
                    <td className="p-3 font-black text-slate-900 dark:text-white">
                      {formatMoney(inv.totalAmount, inv.currency, language)}
                    </td>
                    <td className="p-3 font-bold text-emerald-600">
                      {formatMoney(inv.paidAmount, inv.currency, language)}
                    </td>
                    <td className="p-3 font-bold text-amber-600">
                      {formatMoney(inv.balanceDue, inv.currency, language)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : inv.status === 'partially_paid'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {inv.balanceDue > 0 && (
                          <button
                            onClick={() => openPaymentModal(inv)}
                            className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg transition-colors"
                          >
                            {language === 'ar' ? 'سداد' : 'Pay'}
                          </button>
                        )}
                        <button
                          onClick={() => setInvoiceToDelete(inv)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                          title={language === 'ar' ? 'حذف الفاتورة' : 'Delete Invoice'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PAYMENTS LIST */}
      {activeTab === 'payments' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-[#1e1e1e] text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 text-start">{language === 'ar' ? 'رقم الدفعة' : 'Payment #'}</th>
                <th className="p-3 text-start">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                <th className="p-3 text-start">{language === 'ar' ? 'المورد' : 'Supplier'}</th>
                <th className="p-3 text-start">{language === 'ar' ? 'المبلغ المسدد' : 'Amount'}</th>
                <th className="p-3 text-start">{language === 'ar' ? 'طريقة الدفع' : 'Method'}</th>
                <th className="p-3 text-start">{language === 'ar' ? 'رقم الحوالة (SWIFT Ref)' : 'Transaction Ref'}</th>
                <th className="p-3 text-start">{language === 'ar' ? 'الحساب البنكي' : 'Bank Account'}</th>
                <th className="p-3 text-start">{language === 'ar' ? 'المنفذ' : 'Executed By'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <CreditCard className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-semibold text-sm">
                      {language === 'ar' ? 'لا توجد دفعات مالية مسجلة بعد' : 'No payment transactions recorded yet'}
                    </p>
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{p.id}</td>
                    <td className="p-3 font-mono text-slate-500">{p.paymentDate}</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{p.supplierName}</td>
                    <td className="p-3 font-black text-emerald-600 text-sm">
                      {formatMoney(p.amount, p.currency, language)}
                    </td>
                    <td className="p-3 font-medium uppercase font-mono">{p.paymentMethod}</td>
                    <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{p.transactionReference}</td>
                    <td className="p-3 text-slate-500">{p.bankAccountUsed}</td>
                    <td className="p-3 text-slate-500">{p.executedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Payment Modal */}
      {isAddPaymentModalOpen && (() => {
        const activeInvoice = invoices.find((i) => i.id === selectedInvoiceId) || invoices[0] || null;
        const enteredAmount = Number(paymentData.amount) || 0;
        const isOverpaying = activeInvoice ? enteredAmount > activeInvoice.balanceDue + 0.001 : false;
        const isAmountValid = activeInvoice && enteredAmount > 0 && !isOverpaying;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1e1e1e]">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <span>{language === 'ar' ? 'تسجيل دفعة مالية للمورد' : 'Record Factory Wire Transfer'}</span>
                </h3>
                <button onClick={() => setIsAddPaymentModalOpen(false)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {invoices.length === 0 ? (
                <div className="p-8 text-center space-y-4">
                  <Receipt className="w-12 h-12 mx-auto text-amber-500" />
                  <h4 className="text-base font-bold text-slate-800 dark:text-white">
                    {language === 'ar' ? 'لا توجد أي فواتير تجارية متاحة للسداد' : 'No Invoices Available for Payment'}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {language === 'ar'
                      ? 'المنصة خالية حالياً من أي فواتير. يرجى إنشاء طلبية شراء أو فاتورة أولاً للتمكن من قيد الدفعات.'
                      : 'Please create a purchase order or invoice first before recording wire transfers.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddPaymentModalOpen(false)}
                    className="px-5 py-2 text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl"
                  >
                    {language === 'ar' ? 'إغلاق' : 'Close'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterPayment} className="p-6 space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'ar' ? 'الفاتورة التجارية المرتبطة *' : 'Target Invoice *'}
                    </label>
                    <select
                      value={selectedInvoiceId || activeInvoice?.id || ''}
                      onChange={(e) => {
                        const newId = e.target.value;
                        setSelectedInvoiceId(newId);
                        const inv = invoices.find((i) => i.id === newId);
                        if (inv) {
                          setPaymentData((prev) => ({
                            ...prev,
                            amount: inv.balanceDue > 0 ? inv.balanceDue : 0,
                            currency: inv.currency,
                          }));
                        }
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    >
                      {invoices.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoiceNumber} - {inv.supplierName} (المتبقي: ${inv.balanceDue.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Financial Summary Card for Selected Invoice */}
                  {activeInvoice && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold border-b border-slate-200 dark:border-slate-700 pb-2">
                        <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <Receipt className="w-4 h-4 text-emerald-600" />
                          <span>{activeInvoice.invoiceNumber}</span>
                          <span className="text-slate-400 font-normal">({activeInvoice.supplierName})</span>
                        </span>
                        <span className="font-mono text-slate-500 text-[11px]">
                          {activeInvoice.poNumber ? `PO: ${activeInvoice.poNumber}` : ''}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs">
                          <span className="text-[10px] text-slate-500 block">{language === 'ar' ? 'إجمالي الفاتورة' : 'Total Invoice'}</span>
                          <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">
                            {formatMoney(activeInvoice.totalAmount, activeInvoice.currency, language)}
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs">
                          <span className="text-[10px] text-slate-500 block">{language === 'ar' ? 'المسدد سابقاً' : 'Paid'}</span>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                            {formatMoney(activeInvoice.paidAmount, activeInvoice.currency, language)}
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs">
                          <span className="text-[10px] text-slate-500 block">{language === 'ar' ? 'الرصيد المتبقي' : 'Balance Due'}</span>
                          <span className="text-xs font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
                            {formatMoney(activeInvoice.balanceDue, activeInvoice.currency, language)}
                          </span>
                        </div>
                      </div>

                      {activeInvoice.balanceDue > 0 ? (
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-slate-500">
                            {language === 'ar' ? 'المبلغ المطلوب لإغلاق الفاتورة بالكامل:' : 'Full settlement balance:'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPaymentData((prev) => ({ ...prev, amount: activeInvoice.balanceDue }))}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200 transition-colors"
                          >
                            {language === 'ar'
                              ? `سداد المتبقي بالكامل (${formatMoney(activeInvoice.balanceDue, activeInvoice.currency, language)})`
                              : `Pay Balance (${activeInvoice.balanceDue})`}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{language === 'ar' ? 'هذه الفاتورة مسددة بالكامل ولا يوجد أي رصيد متبقي.' : 'Invoice is fully paid.'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment Amount & Method */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">
                          {language === 'ar' ? 'قيمة الدفعة *' : 'Payment Amount *'}
                        </label>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={activeInvoice ? activeInvoice.balanceDue : undefined}
                        required
                        value={paymentData.amount === 0 ? '' : paymentData.amount}
                        onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className={`w-full p-2.5 rounded-xl border font-black text-sm transition-colors ${
                          isOverpaying
                            ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 focus:ring-rose-500'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-600'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {language === 'ar' ? 'طريقة التحويل' : 'Payment Method'}
                      </label>
                      <select
                        value={paymentData.paymentMethod}
                        onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value as PaymentMethod })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                      >
                        <option value="bank_wire_tt">حوالة بنكية سويفت T/T</option>
                        <option value="letter_of_credit_lc">اعتماد مستندي L/C</option>
                        <option value="cash">نقداً Cash</option>
                        <option value="escrow">ضمان Escrow</option>
                      </select>
                    </div>
                  </div>

                  {/* Overpayment Warning Banner */}
                  {isOverpaying && activeInvoice && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <div>
                        <p className="font-bold">
                          {language === 'ar'
                            ? `تنبيه مالي: المبلغ المدخل ($${enteredAmount.toLocaleString()}) أكبر من الرصيد المتبقي للفاتورة ($${activeInvoice.balanceDue.toLocaleString()})!`
                            : `Amount ($${enteredAmount}) exceeds remaining balance ($${activeInvoice.balanceDue})!`}
                        </p>
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                          {language === 'ar'
                            ? 'النظام يمنع دفع مبالغ أكبر من قيمة الفاتورة المتبقية تجنباً للأخطاء المالية والمحاسبية.'
                            : 'Payments exceeding invoice balance are strictly blocked.'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'ar' ? 'رقم الحوالة البنكية / مرجع SWIFT Ref *' : 'SWIFT / Transaction Reference *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={paymentData.transactionReference}
                      onChange={(e) => setPaymentData({ ...paymentData, transactionReference: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'ar' ? 'الحساب البنكي المستخدم' : 'Bank Account Used'}
                    </label>
                    <input
                      type="text"
                      value={paymentData.bankAccountUsed}
                      onChange={(e) => setPaymentData({ ...paymentData, bankAccountUsed: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'ar' ? 'ملاحظات الدفعة' : 'Notes'}
                    </label>
                    <input
                      type="text"
                      value={paymentData.notes}
                      onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddPaymentModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-semibold"
                    >
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={!isAmountValid}
                      className={`px-5 py-2 font-bold text-white rounded-xl transition-all ${
                        isAmountValid
                          ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer shadow-sm'
                          : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60'
                      }`}
                    >
                      {language === 'ar' ? 'تأكيد وقيد الدفعة' : 'Confirm Payment'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        );
      })()}

      {/* Confirm Delete Invoice Modal */}
      <ConfirmDeleteModal
        isOpen={!!invoiceToDelete}
        onClose={() => setInvoiceToDelete(null)}
        onConfirm={() => {
          if (invoiceToDelete) {
            deleteInvoice(invoiceToDelete.id);
            setInvoiceToDelete(null);
          }
        }}
        title={language === 'ar' ? 'تأكيد حذف الفاتورة التجارية' : 'Confirm Delete Invoice'}
        message={
          language === 'ar'
            ? `هل أنت متأكد من رغبتك في حذف الفاتورة (${invoiceToDelete?.invoiceNumber}) للمورد (${invoiceToDelete?.supplierName}) نهائياً؟`
            : `Are you sure you want to permanently delete invoice (${invoiceToDelete?.invoiceNumber})?`
        }
        confirmText={language === 'ar' ? 'نعم، حذف الفاتورة' : 'Delete Invoice'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
      />
    </div>
  );
};
