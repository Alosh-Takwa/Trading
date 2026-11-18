import React from 'react';
import { useERP } from '../context/ERPContext';
import { Product } from '../types/erp';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Building2, 
  Tag, 
  CheckCircle, 
  MapPin, 
  Layers,
  Package 
} from 'lucide-react';
import { formatMoney, exportToWordDoc, exportToExcel } from '../utils/erpLogic';

interface ProductDataSheetModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDataSheetModal: React.FC<ProductDataSheetModalProps> = ({ product, onClose }) => {
  const { language, quotations, suppliers, settings } = useERP();

  if (!product) return null;

  // Find all quotations / suppliers offering this product
  const offeringQuotes = quotations.filter((q) => q.productId === product.id);

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    const html = `
      <div style="direction: rtl; font-family: Arial, sans-serif;">
        <h1 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px;">
          بطاقة المواصفات الفنية للمنتج (Product Technical Data Sheet)
        </h1>
        <p style="color: #64748b;">${settings.companyNameAr} | ${settings.companyNameEn}</p>
        
        <h2>${product.nameAr} (${product.nameEn})</h2>
        <p><strong>رقم الموديل (Model):</strong> ${product.modelNumber} | <strong>العلامة التجارية:</strong> ${product.brand} | <strong>بلد المنشأ:</strong> ${product.countryOfOrigin}</p>
        
        <p>${product.descriptionAr || product.descriptionEn || ''}</p>

        <h3>المواصفات الفنية القياسية:</h3>
        <table>
          <thead>
            <tr>
              <th>الخاصية الفنية</th>
              <th>القيمة المعتمدة</th>
              <th>وحدة القياس</th>
            </tr>
          </thead>
          <tbody>
            ${product.specifications
              .map(
                (sp) => `
              <tr>
                <td><strong>${sp.label}</strong></td>
                <td>${sp.value}</td>
                <td>${sp.unit || '-'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <h3>المصانع والموردون المعتمدون لتصنيع هذا الموديل:</h3>
        <table>
          <thead>
            <tr>
              <th>المورد / المصنع</th>
              <th>سعر الوحدة</th>
              <th>نوع السعر</th>
              <th>الحد الأدنى MOQ</th>
              <th>مدة التصنيع</th>
              <th>ميناء الشحن</th>
            </tr>
          </thead>
          <tbody>
            ${offeringQuotes
              .map(
                (q) => `
              <tr>
                <td>${q.supplierName}</td>
                <td><strong>$${q.unitPrice}</strong></td>
                <td>${q.priceType}</td>
                <td>${q.moq} وحدة</td>
                <td>${q.productionLeadDays} يوم</td>
                <td>${q.portOfOrigin}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
    exportToWordDoc(`DataSheet_${product.modelNumber}`, html, `DataSheet_${product.modelNumber}`);
  };

  const handleExportExcel = () => {
    const specsData = product.specifications.map((s) => ({
      Model: product.modelNumber,
      Attribute: s.label,
      Value: String(s.value),
      Unit: s.unit || '',
    }));
    exportToExcel('Specs', specsData, `Specs_${product.modelNumber}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div 
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6 print:m-0 print:border-none print:shadow-none print:w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Actions (Hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#1e1e1e] print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'ar' ? 'بطاقة المواصفات الفنية للمنتج (Product Data Sheet)' : 'Product Technical Data Sheet'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'طباعة / PDF' : 'Print / PDF'}</span>
            </button>
            <button
              onClick={handleExportWord}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Word .doc</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel .xlsx</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Data Sheet Body */}
        <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible">
          {/* Company Branding in Header */}
          <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <p className="text-xs uppercase font-extrabold text-blue-600 dark:text-blue-400 tracking-wider">
                {settings.companyNameEn}
              </p>
              <h1 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {language === 'ar' ? settings.companyNameAr : settings.companyNameEn}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                {settings.companyAddress} • Tax ID: {settings.taxRegistrationNumber}
              </p>
            </div>
            <div className="text-end">
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-md">
                {product.modelNumber}
              </span>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">ID: {product.id}</p>
            </div>
          </div>

          {/* Product Hero Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-800 aspect-square flex items-center justify-center">
                {product.images && product.images[0] ? (
                  <img
                    src={product.images[0].url}
                    alt={product.nameEn || product.nameAr}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-16 h-16 text-slate-300" />
                )}
              </div>
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {product.images.slice(1, 4).map((img) => (
                    <img
                      key={img.id}
                      src={img.url}
                      alt="angle"
                      className="rounded-lg object-cover h-14 w-full border border-slate-200 dark:border-slate-700"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-3">
              <div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {product.category} • {product.brand}
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {language === 'ar' ? product.nameAr : product.nameEn}
                </h2>
                {product.nameCn && (
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">{product.nameCn}</p>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {product.descriptionAr || product.descriptionEn}
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                  Origin: {product.countryOfOrigin}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                  Brand: {product.brand}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 font-semibold text-emerald-700 dark:text-emerald-300">
                  SASO Standard Compliant
                </span>
              </div>
            </div>
          </div>

          {/* Specifications Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>{language === 'ar' ? 'المواصفات الفنية الكاملة' : 'Full Technical Specifications'}</span>
            </h3>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-[#1e1e1e] text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 text-start">{language === 'ar' ? 'الخاصية الفنية' : 'Attribute'}</th>
                    <th className="p-3 text-start">{language === 'ar' ? 'القيمة' : 'Value'}</th>
                    <th className="p-3 text-start">{language === 'ar' ? 'الوحدة' : 'Unit'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {product.specifications.map((sp, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{sp.label}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">{String(sp.value)}</td>
                      <td className="p-3 font-mono text-slate-400">{sp.unit || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Available Chinese Suppliers & Pricing Matrix */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>
                {language === 'ar'
                  ? `المصانع الصينية المعتمدة لتوفير هذا الموديل (${offeringQuotes.length})`
                  : `Certified Suppliers Offering this Model (${offeringQuotes.length})`}
              </span>
            </h3>

            {offeringQuotes.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                {language === 'ar' ? 'لا توجد عروض أسعار مسجلة لهذا المنتج حالياً.' : 'No quotations registered yet for this product.'}
              </p>
            ) : (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-[#1e1e1e] text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3 text-start">{language === 'ar' ? 'المورد / المصنع' : 'Supplier'}</th>
                      <th className="p-3 text-start">{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</th>
                      <th className="p-3 text-start">{language === 'ar' ? 'نوع السعر' : 'Incoterm'}</th>
                      <th className="p-3 text-start">MOQ</th>
                      <th className="p-3 text-start">{language === 'ar' ? 'مدة التصنيع' : 'Lead Time'}</th>
                      <th className="p-3 text-start">{language === 'ar' ? 'ميناء الشحن' : 'Port'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {offeringQuotes.map((q) => (
                      <tr key={q.id}>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{q.supplierName}</td>
                        <td className="p-3 font-bold text-emerald-600 text-sm">
                          {formatMoney(q.unitPrice, q.currency, language)}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold">
                            {q.priceType}
                          </span>
                        </td>
                        <td className="p-3 font-medium">{q.moq} {language === 'ar' ? 'وحدة' : 'units'}</td>
                        <td className="p-3">{q.productionLeadDays} {language === 'ar' ? 'يوم' : 'days'}</td>
                        <td className="p-3 text-slate-500">{q.portOfOrigin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
