import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  FileSpreadsheet,
  Plus,
  ArrowUpDown,
  TrendingDown,
  TrendingUp,
  Building2,
  Calendar,
  Check,
  Star,
  Layers,
  X,
  FileDown,
  Edit2,
  SlidersHorizontal,
  Clock,
  Sparkles,
  Zap,
  Tag,
  CheckCircle2,
  Filter,
  Trash2,
  HelpCircle,
  Activity,
  ShoppingBag,
  Package,
  Award,
} from 'lucide-react';
import { Quotation, Incoterm, CurrencyCode, Product, ProductCategoryType } from '../../types/erp';
import {
  formatMoney,
  exportToExcel,
  parseSpecNumericValue,
  calculateSpecCostRatio,
  matchesSpecCriterion,
  normalizeSpecValue,
} from '../../utils/erpLogic';

const CATEGORY_CONFIG: Record<
  ProductCategoryType,
  { labelAr: string; labelEn: string; icon: string; defaultSpecKeyword: string }
> = {
  air_conditioners: {
    labelAr: 'مكيفات هواء',
    labelEn: 'Air Conditioners',
    icon: '❄️',
    defaultSpecKeyword: 'تبريد',
  },
  washing_machines: {
    labelAr: 'غسالات ومجففات',
    labelEn: 'Washing Machines',
    icon: '🧺',
    defaultSpecKeyword: 'سعة',
  },
  refrigerators: {
    labelAr: 'ثلاجات ومبردات',
    labelEn: 'Refrigerators',
    icon: '🧊',
    defaultSpecKeyword: 'سعة',
  },
  ovens_stoves: {
    labelAr: 'أفران ومواقد',
    labelEn: 'Ovens & Stoves',
    icon: '🍳',
    defaultSpecKeyword: 'عرض',
  },
  small_kitchen: {
    labelAr: 'أجهزة مطبخ صغيرة',
    labelEn: 'Small Kitchen',
    icon: '☕',
    defaultSpecKeyword: 'قدرة',
  },
  water_heaters: {
    labelAr: 'سخانات مياه',
    labelEn: 'Water Heaters',
    icon: '🚿',
    defaultSpecKeyword: 'سعة',
  },
  other: {
    labelAr: 'أجهزة أخرى',
    labelEn: 'Other Appliances',
    icon: '📦',
    defaultSpecKeyword: '',
  },
};

export const QuotationsView: React.FC = () => {
  const {
    quotations,
    products,
    suppliers,
    priceHistory,
    addQuotation,
    updateQuotation,
    deleteQuotation,
    language,
    showToast,
    setActiveView,
  } = useERP();

  const [activeSubTab, setActiveSubTab] = useState<'compare_matrix' | 'quotes_list' | 'price_history'>('compare_matrix');

  // Comparison Mode: Category & Spec Benchmark (Default & requested) vs Single Product Focus
  const [comparisonMode, setComparisonMode] = useState<'category_spec' | 'single_product'>('category_spec');

  // Category & Spec Benchmark State
  const [selectedCategory, setSelectedCategory] = useState<ProductCategoryType | 'all'>(() => {
    // Default to category with most quotations or air_conditioners
    const acQuotes = quotations.filter((q) => {
      const prod = products.find((p) => p.id === q.productId);
      return prod?.category === 'air_conditioners';
    });
    return acQuotes.length > 0 ? 'air_conditioners' : (products[0]?.category || 'air_conditioners');
  });

  const [selectedSpecLabel, setSelectedSpecLabel] = useState<string>('');
  const [selectedSpecValue, setSelectedSpecValue] = useState<string>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [compareSortBy, setCompareSortBy] = useState<'price_asc' | 'price_desc' | 'date_desc'>('price_asc');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);

  // Add Quote Form State
  const [formData, setFormData] = useState({
    supplierId: suppliers[0]?.id || '',
    productId: products[0]?.id || '',
    unitPrice: 200,
    currency: 'USD' as CurrencyCode,
    moq: 100,
    priceType: 'FOB' as Incoterm,
    fobPrice: 200,
    exwPrice: 190,
    cifPrice: 225,
    paymentTerms: '30% T/T Deposit, 70% against B/L copy',
    productionLeadDays: 35,
    portOfOrigin: 'Ningbo',
    date: new Date().toISOString().split('T')[0],
    validUntil: '2026-12-31',
    notes: 'كرتون 5 طبقات مقوى مع حماية رغوية داخلية.',
  });

  // Edit Quote Form State
  const [editFormData, setEditFormData] = useState({
    supplierId: '',
    productId: '',
    unitPrice: 200,
    currency: 'USD' as CurrencyCode,
    moq: 100,
    priceType: 'FOB' as Incoterm,
    fobPrice: 200,
    exwPrice: 190,
    cifPrice: 225,
    paymentTerms: '',
    productionLeadDays: 35,
    portOfOrigin: 'Ningbo',
    date: new Date().toISOString().split('T')[0],
    validUntil: '2026-12-31',
    notes: '',
  });

  // Products in current category
  const categoryProducts = useMemo(() => {
    if (selectedCategory === 'all') return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  // Unique specifications present across products in current category
  const categorySpecsList = useMemo(() => {
    const map = new Map<string, { key: string; label: string; unit?: string }>();
    for (const prod of categoryProducts) {
      for (const spec of prod.specifications || []) {
        const normKey = spec.label.trim().toLowerCase();
        if (!map.has(normKey)) {
          map.set(normKey, { key: spec.key || normKey, label: spec.label, unit: spec.unit });
        }
      }
    }
    return Array.from(map.values());
  }, [categoryProducts]);

  // Active benchmark specification label
  const activeBenchmarkSpec = useMemo(() => {
    if (categorySpecsList.length === 0) return null;
    if (selectedSpecLabel) {
      const found = categorySpecsList.find((s) => s.label === selectedSpecLabel);
      if (found) return found;
    }
    // Auto-select preferred spec (e.g. cooling capacity for AC, capacity for washer)
    const preferred = categorySpecsList.find((s) => {
      const lower = s.label.toLowerCase();
      return lower.includes('تبريد') || lower.includes('cooling') || lower.includes('btu') || lower.includes('سعة') || lower.includes('capacity');
    });
    return preferred || categorySpecsList[0];
  }, [categorySpecsList, selectedSpecLabel]);

  // Distinct values for active benchmark spec across products in this category
  const distinctSpecValues = useMemo(() => {
    if (!activeBenchmarkSpec) return [];
    const set = new Set<string>();
    for (const prod of categoryProducts) {
      const matched = prod.specifications?.find((s) => s.label === activeBenchmarkSpec.label || s.key === activeBenchmarkSpec.key);
      if (matched && matched.value !== undefined && matched.value !== null && String(matched.value).trim() !== '') {
        set.add(String(matched.value).trim());
      }
    }
    return Array.from(set).sort((a, b) => {
      const numA = parseSpecNumericValue(a);
      const numB = parseSpecNumericValue(b);
      if (numA !== null && numB !== null) return numA - numB;
      return a.localeCompare(b);
    });
  }, [categoryProducts, activeBenchmarkSpec]);

  // Comparison Quotes: Filtered and sorted
  const comparisonQuotes = useMemo(() => {
    if (comparisonMode === 'single_product') {
      const raw = quotations.filter((q) => q.productId === selectedProductId);
      return [...raw].sort((a, b) => a.unitPrice - b.unitPrice);
    }

    // Category & Spec Benchmark Mode (User's primary request)
    return quotations
      .filter((quote) => {
        const prod = products.find((p) => p.id === quote.productId);
        if (!prod) return false;
        if (selectedCategory !== 'all' && prod.category !== selectedCategory) return false;

        // If a benchmark spec is active, check matching
        if (activeBenchmarkSpec) {
          if (selectedSpecValue && selectedSpecValue !== 'all' && selectedSpecValue.trim() !== '') {
            const isMatch = matchesSpecCriterion(
              prod.specifications,
              activeBenchmarkSpec.label,
              selectedSpecValue
            );
            if (!isMatch) return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (compareSortBy === 'price_desc') return b.unitPrice - a.unitPrice;
        if (compareSortBy === 'date_desc') {
          const tA = new Date(a.date || a.createdAt).getTime();
          const tB = new Date(b.date || b.createdAt).getTime();
          return tB - tA;
        }
        // Default: price_asc (Lowest Price first)
        return a.unitPrice - b.unitPrice;
      });
  }, [quotations, products, comparisonMode, selectedProductId, selectedCategory, activeBenchmarkSpec, selectedSpecValue, compareSortBy]);

  // Lowest price in the current comparison set
  const cheapestQuote = useMemo(() => {
    if (comparisonQuotes.length === 0) return null;
    return [...comparisonQuotes].sort((a, b) => a.unitPrice - b.unitPrice)[0];
  }, [comparisonQuotes]);

  const highestQuote = useMemo(() => {
    if (comparisonQuotes.length === 0) return null;
    return [...comparisonQuotes].sort((a, b) => b.unitPrice - a.unitPrice)[0];
  }, [comparisonQuotes]);

  const maxSavings = useMemo(() => {
    if (!cheapestQuote || !highestQuote) return 0;
    return Math.max(0, highestQuote.unitPrice - cheapestQuote.unitPrice);
  }, [cheapestQuote, highestQuote]);

  // Handlers
  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === formData.supplierId);
    const prod = products.find((p) => p.id === formData.productId);
    if (!sup || !prod) return;

    addQuotation({
      supplierId: sup.id,
      supplierName: sup.nameEn,
      productId: prod.id,
      productName: prod.nameAr,
      modelNumber: prod.modelNumber,
      date: formData.date,
      validUntil: formData.validUntil,
      unitPrice: Number(formData.unitPrice),
      currency: formData.currency,
      moq: Number(formData.moq),
      priceType: formData.priceType,
      fobPrice: Number(formData.fobPrice || formData.unitPrice),
      exwPrice: Number(formData.exwPrice || 0),
      cifPrice: Number(formData.cifPrice || 0),
      paymentTerms: formData.paymentTerms,
      productionLeadDays: Number(formData.productionLeadDays),
      portOfOrigin: formData.portOfOrigin,
      notes: formData.notes,
    });

    setIsAddModalOpen(false);
  };

  const handleOpenEditModal = (quote: Quotation) => {
    setEditingQuotation(quote);
    setEditFormData({
      supplierId: quote.supplierId,
      productId: quote.productId,
      unitPrice: quote.unitPrice,
      currency: quote.currency,
      moq: quote.moq,
      priceType: quote.priceType,
      fobPrice: quote.fobPrice || quote.unitPrice,
      exwPrice: quote.exwPrice || 0,
      cifPrice: quote.cifPrice || 0,
      paymentTerms: quote.paymentTerms || '',
      productionLeadDays: quote.productionLeadDays || 30,
      portOfOrigin: quote.portOfOrigin || 'Ningbo',
      date: quote.date || quote.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
      validUntil: quote.validUntil || '2026-12-31',
      notes: quote.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuotation) return;
    const sup = suppliers.find((s) => s.id === editFormData.supplierId);
    const prod = products.find((p) => p.id === editFormData.productId);

    updateQuotation(editingQuotation.id, {
      supplierId: sup ? sup.id : editingQuotation.supplierId,
      supplierName: sup ? sup.nameEn : editingQuotation.supplierName,
      productId: prod ? prod.id : editingQuotation.productId,
      productName: prod ? prod.nameAr : editingQuotation.productName,
      modelNumber: prod ? prod.modelNumber : editingQuotation.modelNumber,
      date: editFormData.date,
      validUntil: editFormData.validUntil,
      unitPrice: Number(editFormData.unitPrice),
      currency: editFormData.currency,
      moq: Number(editFormData.moq),
      priceType: editFormData.priceType,
      fobPrice: Number(editFormData.fobPrice || editFormData.unitPrice),
      exwPrice: Number(editFormData.exwPrice || 0),
      cifPrice: Number(editFormData.cifPrice || 0),
      paymentTerms: editFormData.paymentTerms,
      productionLeadDays: Number(editFormData.productionLeadDays),
      portOfOrigin: editFormData.portOfOrigin,
      notes: editFormData.notes,
    });

    setIsEditModalOpen(false);
    setEditingQuotation(null);
  };

  const exportComparisonExcel = () => {
    const data = comparisonQuotes.map((q) => {
      const prod = products.find((p) => p.id === q.productId);
      const matchedSpec = prod?.specifications?.find(
        (s) => s.label === activeBenchmarkSpec?.label || s.key === activeBenchmarkSpec?.key
      );
      const isWinner = cheapestQuote && q.id === cheapestQuote.id;
      const diffVsCheapest = cheapestQuote ? q.unitPrice - cheapestQuote.unitPrice : 0;

      return {
        'Quote #': q.id,
        'Quote Date': q.date,
        'Supplier Name': q.supplierName,
        'Model Number': q.modelNumber,
        Category: prod?.category || '-',
        'Benchmark Spec': activeBenchmarkSpec?.label || '-',
        'Spec Value': matchedSpec ? `${matchedSpec.value} ${matchedSpec.unit || ''}` : '-',
        'Unit Price': q.unitPrice,
        Currency: q.currency,
        'Price Type': q.priceType,
        'Status vs Lowest': isWinner ? 'CHEAPEST (Best Price)' : `+$${diffVsCheapest.toFixed(2)}`,
        MOQ: q.moq,
        'Lead Time (Days)': q.productionLeadDays,
        'Port of Origin': q.portOfOrigin,
        'Payment Terms': q.paymentTerms,
        'Valid Until': q.validUntil,
      };
    });

    const filename = `Comparison_${selectedCategory}_${selectedSpecValue || 'all'}`;
    exportToExcel(filename, data, `Quotations_${selectedCategory}`);
    showToast(language === 'ar' ? 'تم تصدير المقارنة إلى Excel' : 'Exported comparison to Excel');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            <span>{language === 'ar' ? 'مقارنة عروض الأسعار حسب الفئة وبنود المواصفات' : 'Specification Benchmark Quotations Comparison'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'مقارنة شاملة لجميع عروض المصانع لنفس السعة أو قوة التبريد أو الوزن، وتحديد أرخص سعر بالأخضر تلقائياً'
              : 'Cross-supplier benchmark comparison by capacity, cooling power, or weight with instant lowest-price highlighting'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportComparisonExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs"
          >
            <FileDown className="w-4 h-4 text-blue-600" />
            <span>{language === 'ar' ? 'تصدير المقارنة' : 'Export Matrix'}</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ar' ? 'تسجيل عرض سعر جديد' : 'New Quotation'}</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('compare_matrix')}
          className={`px-3 py-2 rounded-xl transition-all ${
            activeSubTab === 'compare_matrix'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {language === 'ar' ? 'مصفوفة المقارنة الفنية (BTU / السعة / الوزن)' : 'Benchmark Spec Comparison Matrix'}
        </button>
        <button
          onClick={() => setActiveSubTab('price_history')}
          className={`px-3 py-2 rounded-xl transition-all ${
            activeSubTab === 'price_history'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {language === 'ar' ? 'سجل تغير الأسعار التاريخي (Price Trends)' : 'Price History Timeline'}
        </button>
        <button
          onClick={() => setActiveSubTab('quotes_list')}
          className={`px-3 py-2 rounded-xl transition-all ${
            activeSubTab === 'quotes_list'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {language === 'ar' ? `جميع العروض المسجلة (${quotations.length})` : `All Quotations (${quotations.length})`}
        </button>
      </div>

      {/* SUB-TAB 1: COMPARISON MATRIX */}
      {activeSubTab === 'compare_matrix' && (
        <div className="space-y-4">
          {/* Mode Switcher: Category Spec Benchmark vs Single Product */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{language === 'ar' ? 'نمط المقارنة المفضل:' : 'Comparison Mode:'}</span>
            </span>

            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setComparisonMode('category_spec')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  comparisonMode === 'category_spec'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'ar' ? 'مقارنة فئة كاملة بحسب بند المواصفة (BTU / السعة / الوزن)' : 'Category & Spec Benchmark'}</span>
              </button>

              <button
                onClick={() => setComparisonMode('single_product')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  comparisonMode === 'single_product'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{language === 'ar' ? 'مقارنة موديل محدد' : 'Single Model Matrix'}</span>
              </button>
            </div>
          </div>

          {/* MAIN CATEGORY SPEC BENCHMARK SELECTOR (User's primary requested feature) */}
          {comparisonMode === 'category_spec' ? (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              {/* Category Selection Tabs */}
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
                  {language === 'ar' ? '1. اختر فئة الأجهزة المنزلية للمقارنة:' : '1. Select Appliance Category to Compare:'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(CATEGORY_CONFIG) as ProductCategoryType[]).map((cat) => {
                    const cfg = CATEGORY_CONFIG[cat];
                    const count = quotations.filter((q) => {
                      const prod = products.find((p) => p.id === q.productId);
                      return prod?.category === cat;
                    }).length;
                    const isSelected = selectedCategory === cat;

                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setSelectedSpecLabel('');
                          setSelectedSpecValue('all');
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-102'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span className="text-sm">{cfg.icon}</span>
                        <span>{language === 'ar' ? cfg.labelAr : cfg.labelEn}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Spec & Value Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                {/* Benchmark Specification Item */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                    <span>
                      {language === 'ar'
                        ? '2. بند المواصفة المعتمد للمقارنة (مثلاً القدرة التبريدية BTU أو السعة/الوزن):'
                        : '2. Benchmark Specification Item (e.g. BTU, Capacity, Weight):'}
                    </span>
                  </label>
                  <select
                    value={activeBenchmarkSpec?.label || ''}
                    onChange={(e) => {
                      setSelectedSpecLabel(e.target.value);
                      setSelectedSpecValue('all');
                    }}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/30 text-slate-900 dark:text-white"
                  >
                    {categorySpecsList.length > 0 ? (
                      categorySpecsList.map((spec) => (
                        <option key={spec.key} value={spec.label}>
                          {spec.label} {spec.unit ? `(${spec.unit})` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="">{language === 'ar' ? 'لا توجد مواصفات مسجلة لهذه الفئة بعد' : 'No specs found'}</option>
                    )}
                  </select>
                </div>

                {/* Specific Capacity/Power Value Input (User enters the value directly; NO hardcoded standard values) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-blue-600" />
                      <span>
                        {language === 'ar'
                          ? `3. أدخل القيمة المطلوبة للمقارنة (${activeBenchmarkSpec?.label || 'بند المواصفة'}):`
                          : `3. Enter Target Spec Value (${activeBenchmarkSpec?.label || 'Spec'}):`}
                      </span>
                    </label>

                    {selectedSpecValue && selectedSpecValue !== 'all' && (
                      <button
                        onClick={() => setSelectedSpecValue('all')}
                        className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        <span>{language === 'ar' ? 'عرض كل القيم (إلغاء الفلترة)' : 'Show All Values'}</span>
                      </button>
                    )}
                  </div>

                  {/* Direct Input Field */}
                  <div className="relative">
                    <input
                      type="text"
                      value={selectedSpecValue === 'all' ? '' : selectedSpecValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedSpecValue(val.trim() === '' ? 'all' : val);
                      }}
                      placeholder={
                        language === 'ar'
                          ? 'أدخل القيمة يدوياً للفلترة بدقة (مثلاً: 24000، 18000، 12000، 10kg)...'
                          : 'Type any spec value to filter (e.g. 24000, 18000, 12000, 10kg)...'
                      }
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                    {activeBenchmarkSpec?.unit && (
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          {activeBenchmarkSpec.unit}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dynamically Extracted Values from Database Products in this Category */}
                  {distinctSpecValues.length > 0 && (
                    <div className="pt-0.5">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1.5">
                        <Filter className="w-3 h-3 text-slate-400" />
                        <span>
                          {language === 'ar'
                            ? 'قيم مسجلة فعلياً في منتجات هذه الفئة (انقر للتعيين السريع):'
                            : 'Existing values found in this category (click to auto-fill):'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => setSelectedSpecValue('all')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                            selectedSpecValue === 'all'
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {language === 'ar' ? 'عرض الكل' : 'All'}
                        </button>

                        {distinctSpecValues.map((val) => {
                          const isSelected = selectedSpecValue === val;
                          const countForVal = quotations.filter((q) => {
                            const prod = products.find((p) => p.id === q.productId);
                            if (!prod) return false;
                            if (selectedCategory !== 'all' && prod.category !== selectedCategory) return false;
                            return matchesSpecCriterion(prod.specifications, activeBenchmarkSpec?.label || '', val);
                          }).length;

                          return (
                            <button
                              key={val}
                              onClick={() => setSelectedSpecValue(val)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                              }`}
                            >
                              <span>{val}</span>
                              {activeBenchmarkSpec?.unit && !val.includes(activeBenchmarkSpec.unit) && (
                                <span className="text-[10px] opacity-80">{activeBenchmarkSpec.unit}</span>
                              )}
                              <span
                                className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                                }`}
                              >
                                {countForVal}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Criteria Banner with Price Summary */}
              {comparisonQuotes.length > 0 && cheapestQuote && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 dark:border-emerald-500/20 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {language === 'ar' ? 'أفضل وأرخص سعر تم العثور عليه لهذا المعيار:' : 'Lowest Verified Price Found:'}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {cheapestQuote.supplierName}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                          {formatMoney(cheapestQuote.unitPrice, cheapestQuote.currency, language)}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">
                          ({cheapestQuote.priceType}) • {cheapestQuote.modelNumber}
                        </span>
                        {maxSavings > 0 && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                            {language === 'ar' ? `توفير حتى $${maxSavings.toFixed(2)} بالجهاز الواحد!` : `Save up to $${maxSavings.toFixed(2)}/unit!`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Sorting */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{language === 'ar' ? 'الترتيب:' : 'Sort:'}</span>
                    <select
                      value={compareSortBy}
                      onChange={(e) => setCompareSortBy(e.target.value as any)}
                      className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                      <option value="price_asc">{language === 'ar' ? 'الأقل سعراً أولاً (الأرخص)' : 'Lowest Price First'}</option>
                      <option value="price_desc">{language === 'ar' ? 'الأعلى سعراً أولاً' : 'Highest Price First'}</option>
                      <option value="date_desc">{language === 'ar' ? 'أحدث تاريخ عرض' : 'Newest Date'}</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* SINGLE PRODUCT SELECTION (Optional alternative) */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {language === 'ar' ? 'اختر المنتج للمقارنة بين المصانع:' : 'Select Product to Compare Across Factories:'}
                </label>
              </div>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white sm:min-w-[320px]"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.modelNumber} - {p.nameAr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* COMPARISON CARDS MATRIX */}
          {comparisonQuotes.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {selectedSpecValue && selectedSpecValue !== 'all'
                  ? language === 'ar'
                    ? `لا توجد عروض أسعار مطابقة للقيمة "${selectedSpecValue}" في فئة ${CATEGORY_CONFIG[selectedCategory as ProductCategoryType]?.labelAr || ''}`
                    : `No quotations found matching value "${selectedSpecValue}" in this category`
                  : language === 'ar'
                  ? 'لا توجد عروض أسعار مسجلة لهذا المعيار بعد'
                  : 'No quotations found for this criterion'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {selectedSpecValue && selectedSpecValue !== 'all'
                  ? language === 'ar'
                    ? 'يمكنك مسح قيمة الفلترة لعرض كافة العروض المتوفرة في الفئة، أو تسجيل عرض سعر جديد لهذه المواصفة.'
                    : 'Clear the filter to view all quotations, or log a new quotation matching this specification.'
                  : language === 'ar'
                  ? 'يمكنك تسجيل عرض سعر جديد من أي مصنع صيني مع تحديد الموديل والقدرة/السعة وتاريخ استلام العرض.'
                  : 'Log a new supplier quotation with its model, capacity/BTU, and quote date.'}
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                {selectedSpecValue && selectedSpecValue !== 'all' && (
                  <button
                    onClick={() => setSelectedSpecValue('all')}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700"
                  >
                    {language === 'ar' ? 'مسح الفلترة وعرض كافة العروض' : 'Clear Filter & Show All'}
                  </button>
                )}
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  {language === 'ar' ? '+ تسجيل عرض سعر جديد' : '+ Log New Quotation'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {comparisonQuotes.map((quote, index) => {
                const sup = suppliers.find((s) => s.id === quote.supplierId);
                const prod = products.find((p) => p.id === quote.productId);
                const matchedSpec = prod?.specifications?.find(
                  (s) => s.label === activeBenchmarkSpec?.label || s.key === activeBenchmarkSpec?.key
                );

                // Check if this card is the absolute cheapest price
                const isCheapest = cheapestQuote && quote.unitPrice === cheapestQuote.unitPrice;
                const priceDiff = cheapestQuote ? quote.unitPrice - cheapestQuote.unitPrice : 0;
                const percentMoreExpensive = cheapestQuote && cheapestQuote.unitPrice > 0
                  ? Math.round((priceDiff / cheapestQuote.unitPrice) * 100)
                  : 0;

                return (
                  <div
                    key={quote.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between relative ${
                      isCheapest
                        ? 'border-2 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/30 shadow-lg ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Top Bar with Lowest Price Champion Ribbon or Rank */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                          {quote.id}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {isCheapest ? (
                            <span className="text-[11px] font-black px-3 py-1 rounded-full bg-emerald-500 text-white uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{language === 'ar' ? 'أرخص وأفضل سعر' : 'Lowest Price Champion'}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                              {language === 'ar' ? `+${priceDiff.toFixed(2)}$ (${percentMoreExpensive}% أغلى)` : `+$${priceDiff.toFixed(2)} (+${percentMoreExpensive}%)`}
                            </span>
                          )}

                          <button
                            onClick={() => handleOpenEditModal(quote)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-400 transition-colors"
                            title={language === 'ar' ? 'تعديل عرض السعر وتاريخه' : 'Edit Quotation & Date'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => deleteQuotation(quote.id)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:border-rose-400 transition-colors"
                            title={language === 'ar' ? 'حذف عرض السعر' : 'Delete Quotation'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Supplier & Factory Name */}
                      <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                        {quote.supplierName}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        <span>{sup?.city || quote.portOfOrigin}</span>
                        {sup?.factoryName && <span className="opacity-75">({sup.factoryName})</span>}
                        {sup && (
                          <span className="text-amber-500 font-bold ms-1 flex items-center gap-0.5">
                            ★ {sup.rating?.overallScore || 4.5}
                          </span>
                        )}
                      </p>

                      {/* Product Model & Category Tag */}
                      <div className="mt-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[11px]">{language === 'ar' ? 'الموديل المطابق:' : 'Matching Model:'}</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{quote.modelNumber}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                          {prod?.nameAr || quote.productName}
                        </div>
                      </div>

                      {/* Target Spec Highlight Box (e.g. 24000 BTU, 10kg, etc.) */}
                      {matchedSpec && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{matchedSpec.label}:</span>
                          </span>
                          <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-emerald-600 text-white">
                            {matchedSpec.value} {matchedSpec.unit || ''}
                          </span>
                        </div>
                      )}

                      {/* Prominent Quote Date Display */}
                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-blue-700 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-950/40 p-1.5 px-2 rounded-lg border border-blue-100 dark:border-blue-900/60 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>{language === 'ar' ? 'تاريخ استلام العرض:' : 'Quote Date:'}</span>
                        </span>
                        <strong className="font-mono font-bold">{quote.date || quote.createdAt?.split('T')[0]}</strong>
                      </div>

                      {/* Price Hero Section */}
                      <div
                        className={`mt-3 p-3.5 rounded-xl border ${
                          isCheapest
                            ? 'bg-emerald-500/15 border-emerald-500/40 shadow-xs'
                            : 'bg-white dark:bg-[#1e1e1e] border-slate-100 dark:border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            {quote.priceType} Unit Price
                          </span>
                          {isCheapest && (
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                              Rank #1
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span
                            className={`text-2xl font-black font-mono ${
                              isCheapest ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {formatMoney(quote.unitPrice, quote.currency, language)}
                          </span>
                        </div>
                        {quote.exwPrice && quote.priceType === 'FOB' && (
                          <span className="text-[11px] text-slate-400 block mt-1">
                            EXW: ${quote.exwPrice} • CIF: ${quote.cifPrice || '-'}
                          </span>
                        )}
                      </div>

                      {/* Terms Breakdown */}
                      <div className="mt-3 space-y-1.5 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-slate-500">{language === 'ar' ? 'الحد الأدنى للطلب MOQ' : 'Minimum Order Qty'}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{quote.moq} {language === 'ar' ? 'وحدة' : 'units'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-slate-500">{language === 'ar' ? 'مدة التصنيع' : 'Production Lead Time'}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{quote.productionLeadDays} {language === 'ar' ? 'يوم' : 'days'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-slate-500">{language === 'ar' ? 'ميناء الشحن الصيني' : 'Port of Origin'}</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{quote.portOfOrigin}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-slate-500">{language === 'ar' ? 'شروط الدفع' : 'Payment Terms'}</span>
                          <span className="text-slate-700 dark:text-slate-300 truncate max-w-[170px]" title={quote.paymentTerms}>
                            {quote.paymentTerms}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-slate-500">{language === 'ar' ? 'صلاحية العرض' : 'Valid Until'}</span>
                          <span className="font-mono text-slate-600 dark:text-slate-400">{quote.validUntil}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions and Notes */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      {quote.notes && (
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#1e1e1e] text-[11px] text-slate-500">
                          {quote.notes}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(quote)}
                          className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>{language === 'ar' ? 'تعديل السعر والتاريخ' : 'Edit Quote'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SIDE-BY-SIDE COMPETITOR COMPARISON TABLE */}
          {comparisonQuotes.length > 0 && (
            <div className="mt-8 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>
                      {language === 'ar'
                        ? `جدول المفاضلة المباشرة بين المصانع المتنافسة على ${activeBenchmarkSpec?.label || 'المواصفة'}`
                        : 'Head-to-Head Competing Factories Comparison Table'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {language === 'ar'
                      ? 'مرتبة من الأرخص إلى الأعلى سعراً مع احتساب الفارق المالي عن السعر الفائز'
                      : 'Sorted from lowest to highest price with financial difference against winning quote'}
                  </p>
                </div>

                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {comparisonQuotes.length} {language === 'ar' ? 'عروض أسعار متنافسة' : 'Competing Quotes'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-[#1e1e1e] text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3 text-center">{language === 'ar' ? 'الترتيب' : 'Rank'}</th>
                      <th className="p-3 text-start">{language === 'ar' ? 'المصنع الصيني' : 'Factory / Supplier'}</th>
                      <th className="p-3 text-start">{language === 'ar' ? 'الموديل' : 'Model #'}</th>
                      <th className="p-3 text-start">
                        {activeBenchmarkSpec?.label || (language === 'ar' ? 'المواصفة' : 'Spec')}
                      </th>
                      <th className="p-3 text-start">{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</th>
                      <th className="p-3 text-start">{language === 'ar' ? 'الفرق عن أرخص سعر' : 'Diff vs Lowest'}</th>
                      <th className="p-3 text-start">MOQ</th>
                      <th className="p-3 text-start">{language === 'ar' ? 'التصنيع' : 'Lead Time'}</th>
                      <th className="p-3 text-start">{language === 'ar' ? 'ميناء الشحن' : 'Port'}</th>
                      <th className="p-3 text-start">{language === 'ar' ? 'تاريخ العرض' : 'Quote Date'}</th>
                      <th className="p-3 text-center">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {comparisonQuotes.map((q, idx) => {
                      const prod = products.find((p) => p.id === q.productId);
                      const spec = prod?.specifications?.find(
                        (s) => s.label === activeBenchmarkSpec?.label || s.key === activeBenchmarkSpec?.key
                      );
                      const isWinner = cheapestQuote && q.unitPrice === cheapestQuote.unitPrice;
                      const diff = cheapestQuote ? q.unitPrice - cheapestQuote.unitPrice : 0;

                      return (
                        <tr
                          key={q.id}
                          className={`transition-colors ${
                            isWinner
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 font-bold'
                              : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <td className="p-3 text-center">
                            {isWinner ? (
                              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-black inline-flex items-center justify-center text-[11px] shadow-xs">
                                1
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-[11px]">#{idx + 1}</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 dark:text-white block">{q.supplierName}</span>
                            <span className="text-[10px] text-slate-400">{q.id}</span>
                          </td>
                          <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {q.modelNumber}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-[11px]">
                              {spec?.value || '-'} {spec?.unit || ''}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`text-sm font-black font-mono ${
                                isWinner ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {formatMoney(q.unitPrice, q.currency, language)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">{q.priceType}</span>
                          </td>
                          <td className="p-3">
                            {isWinner ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-1 text-[11px]">
                                <Check className="w-3.5 h-3.5" />
                                <span>{language === 'ar' ? 'الأرخص (الفائز)' : 'Best Price'}</span>
                              </span>
                            ) : (
                              <span className="text-rose-600 dark:text-rose-400 font-mono font-bold text-[11px]">
                                +${diff.toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-medium">{q.moq}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{q.productionLeadDays}d</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{q.portOfOrigin}</td>
                          <td className="p-3 font-mono text-slate-500">{q.date || q.createdAt?.split('T')[0]}</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEditModal(q)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                title={language === 'ar' ? 'تعديل عرض السعر' : 'Edit'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteQuotation(q.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                title={language === 'ar' ? 'حذف' : 'Delete'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: PRICE HISTORY */}
      {activeSubTab === 'price_history' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
              {language === 'ar' ? 'سجل تتبع تقلبات الأسعار وتواريخ الفواتير والعروض' : 'Historical Price Fluctuation & Quote Dates Log'}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-[#1e1e1e] text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 text-start">{language === 'ar' ? 'تاريخ العرض / الفاتورة' : 'Quote Date'}</th>
                    <th className="p-3 text-start">{language === 'ar' ? 'الموديل' : 'Model'}</th>
                    <th className="p-3 text-start">{language === 'ar' ? 'المصنع' : 'Supplier'}</th>
                    <th className="p-3 text-start">{language === 'ar' ? 'السعر' : 'Price'}</th>
                    <th className="p-3 text-start">{language === 'ar' ? 'نوع السعر' : 'Terms'}</th>
                    <th className="p-3 text-start">MOQ</th>
                    <th className="p-3 text-start">{language === 'ar' ? 'نسبة التغير %' : 'Change %'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {priceHistory.map((ph) => {
                    const prod = products.find((p) => p.id === ph.productId);
                    const isDecrease = ph.percentageChange && ph.percentageChange < 0;
                    const isIncrease = ph.percentageChange && ph.percentageChange > 0;

                    return (
                      <tr key={ph.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{ph.date}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white font-mono">
                          {prod?.modelNumber || ph.productId}
                        </td>
                        <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{ph.supplierName}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {formatMoney(ph.price, ph.currency, language)}
                        </td>
                        <td className="p-3 font-mono">{ph.priceType}</td>
                        <td className="p-3">{ph.moq}</td>
                        <td className="p-3">
                          {isDecrease ? (
                            <span className="font-bold text-emerald-600 flex items-center gap-1">
                              <TrendingDown className="w-3.5 h-3.5" />
                              <span>{ph.percentageChange}% (تخفيض)</span>
                            </span>
                          ) : isIncrease ? (
                            <span className="font-bold text-rose-600 flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span>+{ph.percentageChange}% (زيادة)</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ALL QUOTATIONS TABLE */}
      {activeSubTab === 'quotes_list' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-[#1e1e1e] text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 text-start">{language === 'ar' ? 'رقم العرض' : 'Quote #'}</th>
                <th className="p-3 text-start">{language === 'ar' ? 'تاريخ العرض' : 'Quote Date'}</th>
                <th className="p-3 text-start">{language === 'ar' ? 'الموديل والمنتج' : 'Model & Product'}</th>
                <th className="p-3 text-start">{language === 'ar' ? 'المورد الصيني' : 'Supplier'}</th>
                <th className="p-3 text-start">{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</th>
                <th className="p-3 text-start">{language === 'ar' ? 'الشروط' : 'Terms'}</th>
                <th className="p-3 text-start">MOQ</th>
                <th className="p-3 text-start">{language === 'ar' ? 'مدة التصنيع' : 'Lead Time'}</th>
                <th className="p-3 text-start">{language === 'ar' ? 'الصلاحية' : 'Valid Until'}</th>
                <th className="p-3 text-center">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {quotations.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{q.id}</td>
                  <td className="p-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {q.date || q.createdAt?.split('T')[0]}
                  </td>
                  <td className="p-3">
                    <span className="font-mono font-bold text-slate-900 dark:text-white block">{q.modelNumber}</span>
                    <span className="text-[11px] text-slate-400">{q.productName}</span>
                  </td>
                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{q.supplierName}</td>
                  <td className="p-3 font-black text-emerald-600 text-sm">
                    {formatMoney(q.unitPrice, q.currency, language)}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-[11px]">
                      {q.priceType} ({q.portOfOrigin})
                    </span>
                  </td>
                  <td className="p-3 font-medium">{q.moq}</td>
                  <td className="p-3 text-slate-500">{q.productionLeadDays} {language === 'ar' ? 'يوم' : 'days'}</td>
                  <td className="p-3 font-mono text-slate-500">{q.validUntil}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(q)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title={language === 'ar' ? 'تعديل عرض السعر' : 'Edit Quotation'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteQuotation(q.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        title={language === 'ar' ? 'حذف عرض السعر' : 'Delete Quotation'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Quotation Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-2xl my-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1e1e1e]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <span>{language === 'ar' ? 'تسجيل عرض سعر جديد للمنتج' : 'Log New Supplier Quotation'}</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'المنتج والموديل المطلوب تسعيره *' : 'Product & Model *'}
                  </label>
                  <select
                    value={formData.productId}
                    onChange={(e) => {
                      const newProdId = e.target.value;
                      const prod = products.find((p) => p.id === newProdId);
                      setFormData((prev) => ({
                        ...prev,
                        productId: newProdId,
                        supplierId: (prod as any)?.supplierId || prev.supplierId,
                      }));
                    }}
                    className="w-full p-2.5 rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-800 font-semibold"
                  >
                    {products.map((p) => {
                      const linkedSup = suppliers.find((s) => s.id === (p as any).supplierId);
                      return (
                        <option key={p.id} value={p.id}>
                          {p.modelNumber} - {p.nameAr} [{linkedSup ? linkedSup.nameEn : (p.supplierName || 'بدون مورد')}]
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'المورد / المصنع المعتمد *' : 'Supplier / Manufacturer *'}
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} - {s.nameEn} ({s.factoryName || s.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Linked Manufacturer Confirmation Ribbon */}
              {(() => {
                const selProd = products.find((p) => p.id === formData.productId);
                const selSup = suppliers.find((s) => s.id === formData.supplierId);
                const ownerSup = suppliers.find((s) => s.id === (selProd as any)?.supplierId);
                return (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>{language === 'ar' ? 'المصنع المعتمد لهذا الموديل:' : 'Certified manufacturer:'}</span>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {ownerSup ? `${ownerSup.nameEn} (${ownerSup.city})` : selSup?.nameEn || 'مورد عام'}
                    </span>
                  </div>
                );
              })()}

              {/* Quotation Date & Validity Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/60">
                <div>
                  <label className="font-bold text-blue-900 dark:text-blue-300 block mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>{language === 'ar' ? 'تاريخ الحصول على العرض *' : 'Quotation Date *'}</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 font-mono font-bold text-xs"
                  />
                  <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-1 block">
                    {language === 'ar' ? 'لتوثيق عروض الأسعار وتغيراتها بحسب تاريخ كل فاتورة' : 'Tracks price changes by invoice/quote date'}
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{language === 'ar' ? 'تاريخ انتهاء صلاحية العرض' : 'Valid Until'}</span>
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'سعر الوحدة *' : 'Unit Price *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value), fobPrice: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'العملة' : 'Currency'}
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value as CurrencyCode })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="CNY">CNY (¥)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="SAR">SAR (ر.س)</option>
                    <option value="SYP">SYP (ل.س)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'شروط السعر (Incoterms)' : 'Price Terms'}
                  </label>
                  <select
                    value={formData.priceType}
                    onChange={(e) => setFormData({ ...formData, priceType: e.target.value as Incoterm })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    <option value="FOB">FOB (على ظهر السفينة)</option>
                    <option value="EXW">EXW (أرض المصنع)</option>
                    <option value="CIF">CIF (شامل الشحن والتأمين)</option>
                    <option value="DDP">DDP (واصل مع الجمارك)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'الحد الأدنى للطلب MOQ' : 'MOQ'}
                  </label>
                  <input
                    type="number"
                    value={formData.moq}
                    onChange={(e) => setFormData({ ...formData, moq: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'مدة التصنيع (أيام)' : 'Lead Time (Days)'}
                  </label>
                  <input
                    type="number"
                    value={formData.productionLeadDays}
                    onChange={(e) => setFormData({ ...formData, productionLeadDays: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'ميناء الشحن الصيني' : 'Port of Origin'}
                  </label>
                  <input
                    type="text"
                    value={formData.portOfOrigin}
                    onChange={(e) => setFormData({ ...formData, portOfOrigin: e.target.value })}
                    placeholder="Ningbo or Shenzhen"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'شروط الدفع المتفق عليها' : 'Payment Terms'}
                </label>
                <input
                  type="text"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  placeholder="30% T/T Deposit, 70% against B/L copy"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'ملاحظات إضافية' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
                >
                  {language === 'ar' ? 'حفظ عرض السعر' : 'Save Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Quotation Modal */}
      {isEditModalOpen && editingQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-2xl my-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1e1e1e]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <span>
                  {language === 'ar'
                    ? `تعديل عرض السعر (${editingQuotation.id})`
                    : `Edit Quotation (${editingQuotation.id})`}
                </span>
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingQuotation(null);
                }}
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleUpdateQuotation} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'المنتج والموديل *' : 'Product & Model *'}
                  </label>
                  <select
                    value={editFormData.productId}
                    onChange={(e) => {
                      const newProdId = e.target.value;
                      const prod = products.find((p) => p.id === newProdId);
                      setEditFormData((prev) => ({
                        ...prev,
                        productId: newProdId,
                        supplierId: (prod as any)?.supplierId || prev.supplierId,
                      }));
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    {products.map((p) => {
                      const linkedSup = suppliers.find((s) => s.id === (p as any).supplierId);
                      return (
                        <option key={p.id} value={p.id}>
                          {p.modelNumber} - {p.nameAr} [{linkedSup ? linkedSup.nameEn : (p.supplierName || 'بدون مورد')}]
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'المورد / المصنع *' : 'Supplier *'}
                  </label>
                  <select
                    value={editFormData.supplierId}
                    onChange={(e) => setEditFormData({ ...editFormData, supplierId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} - {s.nameEn} ({s.factoryName || s.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Editable Date & Validity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/60">
                <div>
                  <label className="font-bold text-blue-900 dark:text-blue-300 block mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>{language === 'ar' ? 'تاريخ الحصول على العرض *' : 'Quotation Date *'}</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 font-mono font-bold text-xs"
                  />
                  <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-1 block">
                    {language === 'ar' ? 'يمكن تعديل التاريخ وفق تاريخ الفاتورة أو استلام السعر' : 'Change date to match invoice or quote receipt'}
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{language === 'ar' ? 'تاريخ انتهاء صلاحية العرض' : 'Valid Until'}</span>
                  </label>
                  <input
                    type="date"
                    value={editFormData.validUntil}
                    onChange={(e) => setEditFormData({ ...editFormData, validUntil: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'سعر الوحدة *' : 'Unit Price *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editFormData.unitPrice}
                    onChange={(e) => setEditFormData({ ...editFormData, unitPrice: Number(e.target.value), fobPrice: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'العملة' : 'Currency'}
                  </label>
                  <select
                    value={editFormData.currency}
                    onChange={(e) => setEditFormData({ ...editFormData, currency: e.target.value as CurrencyCode })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="CNY">CNY (¥)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="SAR">SAR (ر.س)</option>
                    <option value="SYP">SYP (ل.س)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'شروط السعر (Incoterms)' : 'Price Terms'}
                  </label>
                  <select
                    value={editFormData.priceType}
                    onChange={(e) => setEditFormData({ ...editFormData, priceType: e.target.value as Incoterm })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    <option value="FOB">FOB (على ظهر السفينة)</option>
                    <option value="EXW">EXW (أرض المصنع)</option>
                    <option value="CIF">CIF (شامل الشحن والتأمين)</option>
                    <option value="DDP">DDP (واصل مع الجمارك)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'الحد الأدنى للطلب MOQ' : 'MOQ'}
                  </label>
                  <input
                    type="number"
                    value={editFormData.moq}
                    onChange={(e) => setEditFormData({ ...editFormData, moq: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'مدة التصنيع (أيام)' : 'Lead Time (Days)'}
                  </label>
                  <input
                    type="number"
                    value={editFormData.productionLeadDays}
                    onChange={(e) => setEditFormData({ ...editFormData, productionLeadDays: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'ميناء الشحن الصيني' : 'Port of Origin'}
                  </label>
                  <input
                    type="text"
                    value={editFormData.portOfOrigin}
                    onChange={(e) => setEditFormData({ ...editFormData, portOfOrigin: e.target.value })}
                    placeholder="Ningbo or Shenzhen"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'شروط الدفع المتفق عليها' : 'Payment Terms'}
                </label>
                <input
                  type="text"
                  value={editFormData.paymentTerms}
                  onChange={(e) => setEditFormData({ ...editFormData, paymentTerms: e.target.value })}
                  placeholder="30% T/T Deposit, 70% against B/L copy"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'ملاحظات إضافية' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingQuotation(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
                >
                  {language === 'ar' ? 'تحديث عرض السعر' : 'Update Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
