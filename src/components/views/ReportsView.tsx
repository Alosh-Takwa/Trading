import React from 'react';
import { useERP } from '../../context/ERPContext';
import {
  FileBarChart2,
  FileSpreadsheet,
  Download,
  Building2,
  Package,
  ShoppingCart,
  Receipt,
  Ship,
  Calculator,
  Star,
  Printer
} from 'lucide-react';
import { exportToExcel, exportToCSV, exportToWordDoc, formatMoney } from '../../utils/erpLogic';

export const ReportsView: React.FC = () => {
  const {
    suppliers,
    products,
    quotations,
    orders,
    invoices,
    shipments,
    language,
    settings,
    showToast,
  } = useERP();

  // Export Handlers
  const exportSuppliersReport = (format: 'xlsx' | 'csv' | 'doc') => {
    const data = suppliers.map((s) => ({
      ID: s.id,
      NameEn: s.nameEn,
      NameCn: s.nameCn || '',
      Factory: s.factoryName || '',
      Type: s.type,
      City: s.city,
      Phone: s.phone,
      Email: s.email,
      Rating: s.rating.overallScore,
      Status: s.status,
    }));

    if (format === 'xlsx') {
      exportToExcel('Suppliers', data, 'SinoTrack_Suppliers_Report');
    } else if (format === 'csv') {
      exportToCSV(data, 'SinoTrack_Suppliers_Report');
    } else {
      const html = `
        <h1>دليل المصانع والموردين في الصين - SinoTrack ERP</h1>
        <table>
          <thead><tr><th>ID</th><th>اسم المصنع</th><th>المدينة</th><th>الهاتف</th><th>التقييم</th></tr></thead>
          <tbody>
            ${suppliers.map((s) => `<tr><td>${s.id}</td><td>${s.nameEn}</td><td>${s.city}</td><td>${s.phone}</td><td>★ ${s.rating.overallScore}</td></tr>`).join('')}
          </tbody>
        </table>
      `;
      exportToWordDoc('Suppliers_Report', html, 'SinoTrack_Suppliers_Report');
    }
    showToast(language === 'ar' ? 'تم تجهيز وتصدير التقرير' : 'Report Exported');
  };

  const exportOrdersReport = (format: 'xlsx' | 'csv') => {
    const data = orders.map((o) => ({
      PO_Number: o.id,
      Supplier: o.supplierName,
      OrderDate: o.orderDate,
      ItemsCount: o.items.length,
      Subtotal: o.subtotal,
      GrandTotal: o.grandTotal,
      TotalPaid: o.totalPaid,
      BalanceDue: o.balanceDue,
      Status: o.status,
    }));

    if (format === 'xlsx') {
      exportToExcel('Purchase_Orders', data, 'SinoTrack_Orders_Report');
    } else {
      exportToCSV(data, 'SinoTrack_Orders_Report');
    }
    showToast(language === 'ar' ? 'تم تصدير تقرير الطلبيات' : 'Orders Report Exported');
  };

  const exportFinancialsReport = (format: 'xlsx' | 'csv') => {
    const data = invoices.map((inv) => ({
      InvoiceNumber: inv.invoiceNumber,
      PO_Number: inv.poNumber,
      Supplier: inv.supplierName,
      DueDate: inv.dueDate,
      TotalAmount: inv.totalAmount,
      PaidAmount: inv.paidAmount,
      BalanceDue: inv.balanceDue,
      Status: inv.status,
    }));

    if (format === 'xlsx') {
      exportToExcel('Invoices', data, 'SinoTrack_Financial_Invoices_Report');
    } else {
      exportToCSV(data, 'SinoTrack_Financial_Invoices_Report');
    }
    showToast(language === 'ar' ? 'تم تصدير تقرير الفواتير والأرصدة' : 'Financials Report Exported');
  };

  const exportShipmentsReport = (format: 'xlsx' | 'csv') => {
    const data = shipments.map((sh) => ({
      ContainerNumber: sh.containerNumber,
      ShippingLine: sh.shippingLine,
      Supplier: sh.supplierName,
      BL: sh.billOfLadingNumber,
      PortOfLoading: sh.portOfLoading,
      PortOfDischarge: sh.portOfDischarge,
      ETD: sh.etd,
      ETA: sh.eta,
      Status: sh.status,
      ShippingCost: sh.shippingCost,
    }));

    if (format === 'xlsx') {
      exportToExcel('Shipments', data, 'SinoTrack_Maritime_Shipments_Report');
    } else {
      exportToCSV(data, 'SinoTrack_Maritime_Shipments_Report');
    }
    showToast(language === 'ar' ? 'تم تصدير تقرير الشحنات' : 'Shipments Report Exported');
  };

  const reportsList = [
    {
      id: 'suppliers',
      titleAr: 'تقرير شامل عن الموردين والمصانع',
      titleEn: 'Comprehensive Suppliers & Factories Directory',
      descAr: 'بيانات الاتصال، المدن، التصنيفات، التقييم، وتاريخ التعامل.',
      descEn: 'Contact info, cities, categories, ratings, and communication dates.',
      icon: <Building2 className="w-5 h-5 text-blue-600" />,
      action: exportSuppliersReport,
    },
    {
      id: 'orders',
      titleAr: 'تقرير طلبيات الشراء والتوفير التفاوضي',
      titleEn: 'Purchase Orders & Negotiation Savings Report',
      descAr: 'تفاصيل البنود، الأسعار المتفق عليها، إجمالي التوفير، ومراحل التصنيع.',
      descEn: 'Items breakdown, agreed unit prices, total savings, and production status.',
      icon: <ShoppingCart className="w-5 h-5 text-purple-600" />,
      action: exportOrdersReport,
    },
    {
      id: 'financials',
      titleAr: 'تقرير الفواتير والمدفوعات والأرصدة المستحقة',
      titleEn: 'Financial Invoices & Outstanding Balances Report',
      descAr: 'الفواتير الصادرة، الدفعات المسددة T/T، وتواريخ الاستحقاق.',
      descEn: 'Issued invoices, T/T wire transfers, and aging balance due.',
      icon: <Receipt className="w-5 h-5 text-emerald-600" />,
      action: exportFinancialsReport,
    },
    {
      id: 'shipments',
      titleAr: 'تقرير الشحنات البحرية وتتبع الحاويات',
      titleEn: 'Maritime Shipments & Container Tracking Report',
      descAr: 'الخطوط الملاحية، أرقام الحاويات، بوالص الشحن، ومواعيد الوصول ETA.',
      descEn: 'Shipping lines, container numbers, B/L refs, and ETA arrivals.',
      icon: <Ship className="w-5 h-5 text-cyan-600" />,
      action: exportShipmentsReport,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <FileBarChart2 className="w-6 h-6 text-blue-600" />
          <span>{language === 'ar' ? 'مركز التقارير والتصدير الشامل' : 'Reports & Export Center'}</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {language === 'ar'
            ? 'تصدير بيانات الاستيراد والعمليات إلى جداول Excel (.xlsx) و CSV ومستندات Word و PDF'
            : 'Export sourcing and import management records to Excel (.xlsx), CSV, Word, and print'}
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reportsList.map((rep) => (
          <div
            key={rep.id}
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shrink-0">
                {rep.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'ar' ? rep.titleAr : rep.titleEn}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {language === 'ar' ? rep.descAr : rep.descEn}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <button
                onClick={() => rep.action('xlsx')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel (.xlsx)</span>
              </button>

              <button
                onClick={() => rep.action('csv')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 text-xs font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              {rep.id === 'suppliers' && (
                <button
                  onClick={() => exportSuppliersReport('doc')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 text-xs font-bold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Word (.doc)</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
