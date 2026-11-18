import React, { useState, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Package,
  Plus,
  Search,
  Filter,
  FileText,
  FileSpreadsheet,
  Building2,
  Trash2,
  Eye,
  X,
  Layers,
  Image as ImageIcon,
  Edit2,
  UploadCloud,
  Check,
  RefreshCw,
  DollarSign,
} from 'lucide-react';
import { Product, ProductCategoryType, ProductAttributeValue, CurrencyCode, Incoterm } from '../../types/erp';
import { ProductDataSheetModal } from '../ProductDataSheetModal';
import { exportToExcel, mergeCategorySpecifications } from '../../utils/erpLogic';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import { compressImageFile } from '../../utils/imageCompressor';

export const ProductsView: React.FC = () => {
  const {
    products,
    quotations,
    suppliers,
    addProduct,
    updateProduct,
    deleteProduct,
    addQuotation,
    language,
    selectedProductId,
    setSelectedProductId,
    showToast,
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Dynamic Category spec templates
  const categoryTemplates: Record<ProductCategoryType, { label: string; unit?: string }[]> = {
    refrigerators: [
      { label: 'السعة باللتر (Total Liters)', unit: 'L' },
      { label: 'عدد الأبواب (Doors Count)' },
      { label: 'نوع التبريد (Cooling Type - No Frost)' },
      { label: 'نوع الغاز (Gas Type)' },
      { label: 'ضاغط إنفيرتر (Inverter Compressor)' },
      { label: 'كفاءة الطاقة (Energy Class)' },
      { label: 'الأبعاد (Dimensions WxDxH)', unit: 'mm' },
      { label: 'الوزن الصافي (Net Weight)', unit: 'kg' },
      { label: 'اللون والتشطيب (Color)' },
    ],
    washing_machines: [
      { label: 'سعة الغسيل (Wash Capacity)', unit: 'kg' },
      { label: 'سرعة الدوران (Spin Speed)', unit: 'RPM' },
      { label: 'نوع المحرك (Motor Type - BLDC / Direct Drive)' },
      { label: 'عدد البرامج (Programs Count)' },
      { label: 'نوع التحميل (Front / Top Loading)' },
      { label: 'استهلاك المياه (Water Consumption)', unit: 'L/cycle' },
      { label: 'استهلاك الطاقة (Power Rating)' },
      { label: 'الأبعاد (Dimensions WxDxH)', unit: 'mm' },
      { label: 'الوزن (Weight)', unit: 'kg' },
    ],
    air_conditioners: [
      { label: 'القدرة التبريدية (Cooling Capacity)', unit: 'BTU' },
      { label: 'نوع المكيف (Split / Window / Floor)' },
      { label: 'التبريد والتدفئة (Cool / Heat)' },
      { label: 'نوع الغاز (Refrigerant R410A / R32)' },
      { label: 'ضاغط إنفيرتر (Inverter)' },
      { label: 'مستوى الضجيج (Noise Level)', unit: 'dB' },
      { label: 'ريش ذهبية (Gold Fin Coating)' },
      { label: 'أبعاد الوحدة الداخلية (Dimensions)', unit: 'mm' },
    ],
    ovens_stoves: [
      { label: 'العرض القياسي (Width)', unit: 'cm' },
      { label: 'سعة الفرن (Oven Capacity)', unit: 'L' },
      { label: 'نوع الوقود (Gas LPG / Electric)' },
      { label: 'صمام الأمان (Full FFD Safety)' },
      { label: 'شواية دوارة (Rotisserie)' },
      { label: 'طبقات الزجاج (Door Glass Layers)' },
    ],
    small_kitchen: [
      { label: 'السعة (Capacity)', unit: 'L' },
      { label: 'القدرة الكهربائية (Power)', unit: 'W' },
      { label: 'نافذة زجاجية (View Window)' },
      { label: 'برامج الطهي المسبقة (Presets Count)' },
      { label: 'الوزن الصافي (Net Weight)', unit: 'kg' },
    ],
    water_heaters: [
      { label: 'السعة (Capacity)', unit: 'L' },
      { label: 'القدرة الكهربائية (Power)', unit: 'W' },
      { label: 'العزل الحراري (Thermal Insulation)' },
    ],
    other: [
      { label: 'المواصفة الرئيسية (Main Spec)' },
      { label: 'الأبعاد (Dimensions)', unit: 'mm' },
    ],
  };

  interface AddProductFormState {
    nameAr: string;
    nameEn: string;
    nameCn: string;
    modelNumber: string;
    brand: string;
    category: ProductCategoryType;
    subCategory: string;
    supplierId: string;
    descriptionAr: string;
    descriptionEn: string;
    countryOfOrigin: string;
    imageUrl: string;
    specifications: { key: string; label: string; value: string; unit?: string }[];
    hasInitialQuote: boolean;
    initialPrice: string;
    initialCurrency: CurrencyCode;
    initialMoq: number;
    initialPriceType: Incoterm;
    initialPort: string;
    initialDate: string;
    initialNotes: string;
  }

  // Helper to build default specs for category
  const buildDefaultSpecs = (cat: ProductCategoryType): { key: string; label: string; value: string; unit?: string }[] =>
    (categoryTemplates[cat] || []).map((tpl, i) => ({
      key: `spec_${i}`,
      label: tpl.label,
      value: '',
      unit: tpl.unit,
    }));

  const initialAddFormData: AddProductFormState = {
    nameAr: '',
    nameEn: '',
    nameCn: '',
    modelNumber: '',
    brand: 'Orient Elite',
    category: 'refrigerators',
    subCategory: '',
    supplierId: suppliers[0]?.id || '',
    descriptionAr: '',
    descriptionEn: '',
    countryOfOrigin: 'China',
    imageUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80',
    specifications: buildDefaultSpecs('refrigerators'),
    // Optional instant quotation directly linked to this supplier
    hasInitialQuote: true,
    initialPrice: '',
    initialCurrency: 'USD',
    initialMoq: 100,
    initialPriceType: 'FOB',
    initialPort: 'Ningbo',
    initialDate: new Date().toISOString().split('T')[0],
    initialNotes: '',
  };

  // Add Product Form State
  const [formData, setFormData] = useState<AddProductFormState>(initialAddFormData);

  const handleOpenAddModal = () => {
    setFormData({
      ...initialAddFormData,
      supplierId: suppliers[0]?.id || '',
      specifications: buildDefaultSpecs('refrigerators'),
      initialDate: new Date().toISOString().split('T')[0],
    });
    setIsAddModalOpen(true);
  };

  const handleCategoryChange = (cat: ProductCategoryType) => {
    const defaultSpecs = buildDefaultSpecs(cat);
    setFormData((prev) => ({
      ...prev,
      category: cat,
      // Merge entered values into the new category template without losing user inputs
      specifications: mergeCategorySpecifications(prev.specifications, defaultSpecs),
    }));
  };

  const handleAddCustomSpec = () => {
    setFormData((prev) => ({
      ...prev,
      specifications: [
        ...prev.specifications,
        {
          key: `custom_${Date.now()}`,
          label: language === 'ar' ? 'خاصية جديدة' : 'New Attribute',
          value: '',
          unit: '',
        },
      ],
    }));
  };

  const handleRemoveSpec = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  const addFileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleProductImageUpload = async (
    file: File | undefined,
    target: 'add' | 'edit'
  ) => {
    if (!file) return;
    if (!file.type || !file.type.startsWith('image/')) {
      showToast(
        language === 'ar' ? 'نوع الملف غير مدعوم' : 'Unsupported file type',
        language === 'ar' ? 'يرجى اختيار ملف صورة صالح (JPG, PNG, WEBP)' : 'Please select an image file',
        'error'
      );
      return;
    }

    try {
      setIsUploadingImage(true);
      const compressedDataUrl = await compressImageFile(file, 450, 450, 0.8);
      if (!compressedDataUrl) {
        throw new Error('Image compression failed');
      }

      if (target === 'add') {
        setFormData((prev) => ({ ...prev, imageUrl: compressedDataUrl }));
      } else {
        setEditFormData((prev) => ({ ...prev, imageUrl: compressedDataUrl }));
      }

      showToast(
        language === 'ar' ? 'تم رفع ومعالجة صورة المنتج' : 'Product image processed',
        language === 'ar' ? 'تم ضغط وحفظ صورة المنتج بجودة عالية وبشكل خفيف' : 'Image ready to save',
        'success'
      );
    } catch (err) {
      console.warn('Failed to compress product image:', err);
      showToast(
        language === 'ar' ? 'تعذر رفع الصورة' : 'Image upload failed',
        language === 'ar' ? 'يرجى اختيار صورة أخرى والمحاولة مجدداً' : 'Please select another image',
        'error'
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameAr.trim() || !formData.modelNumber.trim()) {
      showToast(language === 'ar' ? 'يرجى إدخال اسم المنتج ورقم الموديل' : 'Name and model number required', '', 'error');
      return;
    }

    // Check duplicate model number
    const duplicate = products.find(
      (p) => p.modelNumber.toLowerCase() === formData.modelNumber.trim().toLowerCase()
    );
    if (duplicate) {
      showToast(
        language === 'ar' ? 'رقم الموديل مسجل مسبقاً' : 'Duplicate Model Number',
        language === 'ar' ? `الموديل ${formData.modelNumber} موجود بالفعل في قاعدة البيانات.` : 'This model already exists.',
        'warning'
      );
    }

    const matchedSupplier = suppliers.find((s) => s.id === formData.supplierId);

    const newProdId = addProduct({
      nameAr: formData.nameAr.trim(),
      nameEn: formData.nameEn.trim() || formData.nameAr.trim(),
      nameCn: formData.nameCn.trim() || undefined,
      modelNumber: formData.modelNumber.trim(),
      brand: formData.brand.trim(),
      category: formData.category,
      subCategory: formData.subCategory.trim() || undefined,
      supplierId: formData.supplierId || undefined,
      supplierName: matchedSupplier ? matchedSupplier.nameEn : undefined,
      descriptionAr: formData.descriptionAr.trim() || undefined,
      descriptionEn: formData.descriptionEn.trim() || undefined,
      countryOfOrigin: formData.countryOfOrigin,
      specifications: formData.specifications.filter((s) => s.value !== ''),
      images: [
        {
          id: `IMG-${Date.now()}`,
          url: formData.imageUrl.trim(),
          caption: formData.modelNumber,
          type: 'primary',
        },
      ],
      documents: [],
    });

    // Directly create linked quotation for this supplier if price was entered
    const initPriceNum = parseFloat(String(formData.initialPrice));
    if (formData.hasInitialQuote && formData.supplierId && !isNaN(initPriceNum) && initPriceNum > 0) {
      const supName = matchedSupplier ? matchedSupplier.nameEn : 'Supplier';
      addQuotation({
        supplierId: formData.supplierId,
        supplierName: supName,
        productId: newProdId,
        productName: formData.nameAr.trim(),
        modelNumber: formData.modelNumber.trim(),
        date: formData.initialDate || new Date().toISOString().split('T')[0],
        validUntil: '2026-12-31',
        unitPrice: initPriceNum,
        currency: formData.initialCurrency,
        moq: Number(formData.initialMoq) || 100,
        priceType: formData.initialPriceType,
        fobPrice: initPriceNum,
        exwPrice: 0,
        cifPrice: 0,
        paymentTerms: '30% T/T Deposit, 70% against B/L copy',
        productionLeadDays: 35,
        portOfOrigin: formData.initialPort || (matchedSupplier?.city || 'Ningbo'),
        notes: formData.initialNotes || `عرض السعر الأولي المسجل لموديل ${formData.modelNumber.trim()}`,
      });
      showToast(
        language === 'ar' ? 'تم حفظ المنتج وربط عرض السعر بالمورد' : 'Product & initial quotation saved',
        language === 'ar' ? `تم ربط الموديل بالمورد ${supName} بنجاح` : `Linked to ${supName} successfully`,
        'success'
      );
    }

    setIsAddModalOpen(false);
  };

  // Edit Product Form State
  const [editFormData, setEditFormData] = useState({
    nameAr: '',
    nameEn: '',
    nameCn: '',
    modelNumber: '',
    brand: 'Orient Elite',
    category: 'refrigerators' as ProductCategoryType,
    subCategory: '',
    descriptionAr: '',
    descriptionEn: '',
    countryOfOrigin: 'China',
    supplierId: '',
    imageUrl: '',
    specifications: [] as { key: string; label: string; value: string; unit?: string }[],
  });

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setEditFormData({
      nameAr: prod.nameAr,
      nameEn: prod.nameEn || '',
      nameCn: prod.nameCn || '',
      modelNumber: prod.modelNumber,
      brand: prod.brand || 'Orient Elite',
      category: prod.category || 'refrigerators',
      subCategory: prod.subCategory || '',
      descriptionAr: prod.descriptionAr || '',
      descriptionEn: prod.descriptionEn || '',
      countryOfOrigin: prod.countryOfOrigin || 'China',
      supplierId: (prod as any).supplierId || '',
      imageUrl: prod.images?.[0]?.url || '',
      specifications: (prod.specifications || []).map((s, idx) => ({
        key: s.key || `spec_${idx}`,
        label: s.label,
        value: String(s.value ?? ''),
        unit: s.unit || '',
      })),
    });
  };

  const handleEditCategoryChange = (cat: ProductCategoryType) => {
    const defaultSpecs = buildDefaultSpecs(cat);
    setEditFormData((prev) => ({
      ...prev,
      category: cat,
      specifications: mergeCategorySpecifications(prev.specifications, defaultSpecs),
    }));
  };

  const handleAddCustomEditSpec = () => {
    setEditFormData((prev) => ({
      ...prev,
      specifications: [
        ...prev.specifications,
        {
          key: `custom_${Date.now()}`,
          label: language === 'ar' ? 'خاصية جديدة' : 'New Attribute',
          value: '',
          unit: '',
        },
      ],
    }));
  };

  const handleRemoveEditSpec = (index: number) => {
    setEditFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editFormData.nameAr.trim() || !editFormData.modelNumber.trim()) {
      showToast(
        language === 'ar' ? 'يرجى إدخال اسم المنتج ورقم الموديل' : 'Name and model number required',
        '',
        'error'
      );
      return;
    }

    const matchedSupplier = suppliers.find((s) => s.id === editFormData.supplierId);

    updateProduct(editingProduct.id, {
      nameAr: editFormData.nameAr.trim(),
      nameEn: editFormData.nameEn.trim() || editFormData.nameAr.trim(),
      nameCn: editFormData.nameCn.trim() || undefined,
      modelNumber: editFormData.modelNumber.trim(),
      brand: editFormData.brand.trim(),
      category: editFormData.category,
      subCategory: editFormData.subCategory.trim() || undefined,
      descriptionAr: editFormData.descriptionAr.trim() || undefined,
      descriptionEn: editFormData.descriptionEn.trim() || undefined,
      countryOfOrigin: editFormData.countryOfOrigin,
      supplierId: editFormData.supplierId || undefined,
      supplierName: matchedSupplier ? matchedSupplier.nameEn : undefined,
      specifications: editFormData.specifications.filter((s) => s.label.trim() !== ''),
      images: editFormData.imageUrl.trim()
        ? [
            {
              id: editingProduct.images?.[0]?.id || `IMG-${Date.now()}`,
              url: editFormData.imageUrl.trim(),
              caption: editFormData.modelNumber,
              type: 'primary',
            },
          ]
        : editingProduct.images,
    });

    setEditingProduct(null);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.modelNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const exportProductsToExcel = () => {
    const data = products.map((p) => ({
      ID: p.id,
      'Model Number': p.modelNumber,
      'Name (AR)': p.nameAr,
      'Name (EN)': p.nameEn,
      Category: p.category,
      Brand: p.brand,
      Origin: p.countryOfOrigin,
      'Specs Count': p.specifications.length,
    }));
    exportToExcel('Products', data, 'SinoTrack_Master_Products');
    showToast(language === 'ar' ? 'تم تصدير دليل المنتجات إلى Excel' : 'Exported Products to Excel');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            <span>{language === 'ar' ? 'قاعدة بيانات الأجهزة والمنتجات المركزية' : 'Central Appliances & Master Products'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'المنتجات الأساسية المستقلة، المواصفات الفنية الديناميكية، والمصانع المعتمدة لتوريد كل موديل'
              : 'Master products with dynamic specs and certified manufacturer offerings'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportProductsToExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{language === 'ar' ? 'تصدير Excel' : 'Export Excel'}</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ar' ? 'إضافة منتج أساسي جديد' : 'Add Master Product'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              language === 'ar'
                ? 'ابحث برقم الموديل (e.g. HR-450F)، اسم الجهاز، أو الماركة...'
                : 'Search model number, appliance name, or brand...'
            }
            className="w-full ps-9 pe-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 w-full sm:w-auto"
        >
          <option value="all">{language === 'ar' ? 'جميع التصنيفات' : 'All Categories'}</option>
          <option value="refrigerators">{language === 'ar' ? 'ثلاجات ومبردات' : 'Refrigerators'}</option>
          <option value="washing_machines">{language === 'ar' ? 'غسالات ومجففات' : 'Washing Machines'}</option>
          <option value="air_conditioners">{language === 'ar' ? 'مكيفات هواء' : 'Air Conditioners'}</option>
          <option value="ovens_stoves">{language === 'ar' ? 'أفران ومواقد' : 'Ovens & Stoves'}</option>
          <option value="small_kitchen">{language === 'ar' ? 'أجهزة مطبخ صغيرة' : 'Small Kitchen'}</option>
        </select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((product) => {
          const offeringQuotes = quotations.filter((q) => q.productId === product.id);
          const bestPrice = offeringQuotes.length > 0 ? Math.min(...offeringQuotes.map((q) => q.unitPrice)) : null;

          return (
            <div
              key={product.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Product Image & Badge */}
                <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-100 dark:bg-[#1e1e1e] flex items-center justify-center border border-slate-100 dark:border-slate-800">
                  {product.images && product.images[0] ? (
                    <img
                      src={product.images[0].url}
                      alt={product.nameEn || product.nameAr}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Package className="w-12 h-12 text-slate-300" />
                  )}
                  <span className="absolute top-2.5 start-2.5 font-mono text-xs font-bold bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-0.5 rounded-md shadow-xs">
                    {product.modelNumber}
                  </span>
                  <span className="absolute top-2.5 end-2.5 text-[10px] font-semibold bg-emerald-600/90 text-white px-2 py-0.5 rounded-md shadow-xs">
                    {product.category}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-3 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {language === 'ar' ? product.nameAr : product.nameEn}
                </h3>
                {product.nameCn && (
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{product.nameCn}</p>
                )}

                {/* Specs Snippet */}
                <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px] bg-slate-50 dark:bg-[#1e1e1e] p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  {(product.specifications || []).slice(0, 4).map((sp, idx) => (
                    <div key={idx} className="truncate">
                      <span className="text-slate-400">{sp.label.split('(')[0]}: </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {String(sp.value)} {sp.unit || ''}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Supplier Offerings Indicator */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {offeringQuotes.length} {language === 'ar' ? 'مصانع معتمدة' : 'suppliers'}
                    </span>
                  </span>

                  {bestPrice !== null ? (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {language === 'ar' ? 'يبدأ من:' : 'From:'} ${bestPrice}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">
                      {language === 'ar' ? 'بانتظار تسعيرة' : 'Awaiting quote'}
                    </span>
                  )}
                </div>
                {/* Linked Supplier Badge if available */}
                {(product.supplierName || (product as any).supplierId) && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-lg">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-medium truncate">
                      {language === 'ar' ? 'المورد:' : 'Supplier:'}{' '}
                      <strong className="font-bold">{product.supplierName || (product as any).supplierId}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setViewingProduct(product)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>{language === 'ar' ? 'بطاقة المنتج (Data Sheet)' : 'Data Sheet'}</span>
                </button>

                <button
                  onClick={() => handleOpenEditProduct(product)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors text-xs font-bold"
                  title={language === 'ar' ? 'تعديل بيانات ومواصفات المنتج' : 'Edit Product'}
                >
                  <Edit2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>{language === 'ar' ? 'تعديل' : 'Edit'}</span>
                </button>

                <button
                  onClick={() => setProductToDelete(product)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                  title={language === 'ar' ? 'حذف المنتج' : 'Delete'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Product Data Sheet Modal */}
      {viewingProduct && (
        <ProductDataSheetModal
          product={viewingProduct}
          onClose={() => setViewingProduct(null)}
        />
      )}

      {/* Add Master Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-3xl my-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1e1e1e]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <span>{language === 'ar' ? 'إضافة منتج أو جهاز منزلي رئيسي' : 'Add Master Home Appliance'}</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Category & Model */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'التصنيف الرئيسي *' : 'Category *'}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value as ProductCategoryType)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="refrigerators">{language === 'ar' ? 'ثلاجات ومبردات' : 'Refrigerators'}</option>
                    <option value="washing_machines">{language === 'ar' ? 'غسالات ومجففات' : 'Washing Machines'}</option>
                    <option value="air_conditioners">{language === 'ar' ? 'مكيفات هواء' : 'Air Conditioners'}</option>
                    <option value="ovens_stoves">{language === 'ar' ? 'أفران ومواقد' : 'Ovens & Stoves'}</option>
                    <option value="small_kitchen">{language === 'ar' ? 'أجهزة مطبخ صغيرة' : 'Small Kitchen'}</option>
                    <option value="water_heaters">{language === 'ar' ? 'سخانات مياه' : 'Water Heaters'}</option>
                    <option value="other">{language === 'ar' ? 'أخرى' : 'Other'}</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'رقم الموديل (Model Number) *' : 'Model Number *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.modelNumber}
                    onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
                    placeholder="e.g. HR-550F-INV"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'العلامة التجارية (Brand)' : 'Brand'}
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Orient Elite"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Supplier Linking & Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'المورد والمصنع الصيني المرتبط' : 'Linked Chinese Manufacturer'}
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  >
                    <option value="">{language === 'ar' ? '-- بدون ربط بمورد محدد --' : '-- No specific supplier --'}</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameEn} ({s.factoryName || s.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'التصنيف الفرعي (Sub-Category)' : 'Sub-Category'}
                  </label>
                  <input
                    type="text"
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    placeholder="e.g. Inverter Multi-Door"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Names in Arabic, English, Chinese */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'اسم المنتج بالعربية *' : 'Product Name (Arabic) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    placeholder="ثلاجة 550 لتر دولابي 4 أبواب إنفيرتر..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'اسم المنتج بالإنجليزية' : 'Product Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    placeholder="French Door Refrigerator 550L Inverter..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'اسم المنتج بالصينية (中文)' : 'Product Name (Chinese)'}
                  </label>
                  <input
                    type="text"
                    value={formData.nameCn}
                    onChange={(e) => setFormData({ ...formData, nameCn: e.target.value })}
                    placeholder="十字对开四门冰箱..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Product Image Selection (Device File Upload or URL) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'ar' ? 'صورة المنتج الرئيسية' : 'Primary Product Image'}</span>
                  </label>
                  {formData.imageUrl && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                      {formData.imageUrl.startsWith('data:') 
                        ? (language === 'ar' ? 'مرفوعة من الجهاز' : 'Uploaded from Device') 
                        : (language === 'ar' ? 'رابط خارجي' : 'External Link')}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Thumbnail Preview */}
                  <div className="relative w-24 h-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 shadow-sm group">
                    {formData.imageUrl ? (
                      <>
                        <img
                          src={formData.imageUrl}
                          alt="Product Preview"
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                          className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-bold"
                          title={language === 'ar' ? 'حذف الصورة' : 'Remove Image'}
                        >
                          <Trash2 className="w-4 h-4 mb-0.5 text-rose-300" />
                          <span>{language === 'ar' ? 'حذف' : 'Remove'}</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 stroke-1" />
                        <span className="text-[10px] block">{language === 'ar' ? 'لا توجد صورة' : 'No image'}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions: Upload from Device or Paste URL */}
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="file"
                      ref={addFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleProductImageUpload(file, 'add');
                        e.target.value = '';
                      }}
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => addFileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 disabled:opacity-50"
                      >
                        {isUploadingImage ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>{language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>{language === 'ar' ? 'رفع صورة من جهازي' : 'Upload from Device'}</span>
                          </>
                        )}
                      </button>

                      {formData.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:border-rose-300 transition-colors"
                          title={language === 'ar' ? 'إزالة الصورة' : 'Clear Image'}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder={language === 'ar' ? 'أو ألصق رابط صورة (URL) هنا...' : 'Or paste image URL here...'}
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px] text-slate-700 dark:text-slate-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Specifications Editor */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'ar' ? 'المواصفات الفنية المعتمدة لهذا الجهاز' : 'Dynamic Technical Specifications'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomSpec}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{language === 'ar' ? 'إضافة خاصية إضافية' : 'Add Property'}</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                  {formData.specifications.map((spec, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={spec.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            specifications: prev.specifications.map((s, i) =>
                              i === idx ? { ...s, label: val } : s
                            ),
                          }));
                        }}
                        className="w-1/2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                        placeholder="اسم الخاصية"
                      />
                      <input
                        type="text"
                        value={String(spec.value)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            specifications: prev.specifications.map((s, i) =>
                              i === idx ? { ...s, value: val } : s
                            ),
                          }));
                        }}
                        className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        placeholder="القيمة"
                      />
                      <input
                        type="text"
                        value={spec.unit || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            specifications: prev.specifications.map((s, i) =>
                              i === idx ? { ...s, unit: val } : s
                            ),
                          }));
                        }}
                        className="w-16 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-center font-mono"
                        placeholder="الوحدة"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(idx)}
                        className="p-1 text-slate-400 hover:text-rose-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Initial Quotation Entry Section (Guarantees correct supplier & price linking) */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {language === 'ar'
                        ? 'تسجيل عرض سعر فوري لهذا الموديل والمورد'
                        : 'Record Initial Price & Quotation for this Supplier'}
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <input
                      type="checkbox"
                      checked={formData.hasInitialQuote}
                      onChange={(e) => setFormData((prev) => ({ ...prev, hasInitialQuote: e.target.checked }))}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{language === 'ar' ? 'تفعيل التسعيرة' : 'Enable Quotation'}</span>
                  </label>
                </div>

                {formData.hasInitialQuote && (
                  <div className="space-y-3 pt-2 border-t border-emerald-100 dark:border-emerald-900/40 animate-in fade-in">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'ar'
                        ? formData.supplierId
                          ? `سيتم حفظ عرض السعر تحت اسم المورد (${suppliers.find((s) => s.id === formData.supplierId)?.nameEn || formData.supplierId}) تلقائياً بدون أي تداخل.`
                          : 'يرجى اختيار مورد أعلاه ليتم ربط عرض السعر به بشكل مباشر في جدول المقارنة.'
                        : 'Automatically establishes quotation under selected supplier without mix-ups.'}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          {language === 'ar' ? 'سعر الوحدة *' : 'Unit Price *'}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.initialPrice}
                          onChange={(e) => setFormData((prev) => ({ ...prev, initialPrice: e.target.value }))}
                          placeholder="e.g. 215.00"
                          className="w-full p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 font-black text-xs text-emerald-600 dark:text-emerald-400"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          {language === 'ar' ? 'العملة' : 'Currency'}
                        </label>
                        <select
                          value={formData.initialCurrency}
                          onChange={(e) => setFormData((prev) => ({ ...prev, initialCurrency: e.target.value as CurrencyCode }))}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-xs"
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
                          {language === 'ar' ? 'تاريخ العرض' : 'Quotation Date'}
                        </label>
                        <input
                          type="date"
                          value={formData.initialDate}
                          onChange={(e) => setFormData((prev) => ({ ...prev, initialDate: e.target.value }))}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          {language === 'ar' ? 'شرط التسليم' : 'Incoterm'}
                        </label>
                        <select
                          value={formData.initialPriceType}
                          onChange={(e) => setFormData((prev) => ({ ...prev, initialPriceType: e.target.value as Incoterm }))}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                        >
                          <option value="FOB">FOB (على ظهر السفينة)</option>
                          <option value="EXW">EXW (أرض المصنع)</option>
                          <option value="CIF">CIF (شامل الشحن والتأمين)</option>
                          <option value="DDP">DDP (واصل للمستودع)</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          {language === 'ar' ? 'الحد الأدنى MOQ' : 'MOQ'}
                        </label>
                        <input
                          type="number"
                          value={formData.initialMoq}
                          onChange={(e) => setFormData((prev) => ({ ...prev, initialMoq: Number(e.target.value) }))}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          {language === 'ar' ? 'ميناء الشحن الصيني' : 'Port of Origin'}
                        </label>
                        <input
                          type="text"
                          value={formData.initialPort}
                          onChange={(e) => setFormData((prev) => ({ ...prev, initialPort: e.target.value }))}
                          placeholder="Ningbo / Shanghai / Foshan"
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Buttons */}
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
                  className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  {language === 'ar' ? 'حفظ المنتج' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-3xl my-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-purple-50/50 dark:bg-purple-950/20">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-purple-600" />
                <span>
                  {language === 'ar'
                    ? `تعديل المنتج والمواصفات: ${editingProduct.nameAr} [${editingProduct.modelNumber}]`
                    : `Edit Product & Specifications: ${editingProduct.nameEn} [${editingProduct.modelNumber}]`}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Category, Model, Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'التصنيف الرئيسي *' : 'Category *'}
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => handleEditCategoryChange(e.target.value as ProductCategoryType)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="refrigerators">{language === 'ar' ? 'ثلاجات ومبردات' : 'Refrigerators'}</option>
                    <option value="washing_machines">{language === 'ar' ? 'غسالات ومجففات' : 'Washing Machines'}</option>
                    <option value="air_conditioners">{language === 'ar' ? 'مكيفات هواء' : 'Air Conditioners'}</option>
                    <option value="ovens_stoves">{language === 'ar' ? 'أفران ومواقد' : 'Ovens & Stoves'}</option>
                    <option value="small_kitchen">{language === 'ar' ? 'أجهزة مطبخ صغيرة' : 'Small Kitchen'}</option>
                    <option value="water_heaters">{language === 'ar' ? 'سخانات مياه' : 'Water Heaters'}</option>
                    <option value="other">{language === 'ar' ? 'أخرى' : 'Other'}</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'رقم الموديل (Model Number) *' : 'Model Number *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.modelNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, modelNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'العلامة التجارية (Brand)' : 'Brand'}
                  </label>
                  <input
                    type="text"
                    value={editFormData.brand}
                    onChange={(e) => setEditFormData({ ...editFormData, brand: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Supplier Linking, SubCategory, Origin */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'المورد المرتبط (المصنع الصيني)' : 'Linked Supplier'}
                  </label>
                  <select
                    value={editFormData.supplierId}
                    onChange={(e) => setEditFormData({ ...editFormData, supplierId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  >
                    <option value="">{language === 'ar' ? '-- بدون ربط بمورد محدد --' : '-- No specific supplier --'}</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameEn} ({s.factoryName || s.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'التصنيف الفرعي (Sub-Category)' : 'Sub-Category'}
                  </label>
                  <input
                    type="text"
                    value={editFormData.subCategory}
                    onChange={(e) => setEditFormData({ ...editFormData, subCategory: e.target.value })}
                    placeholder="e.g. Inverter Multi-Door"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'بلد المنشأ' : 'Country of Origin'}
                  </label>
                  <input
                    type="text"
                    value={editFormData.countryOfOrigin}
                    onChange={(e) => setEditFormData({ ...editFormData, countryOfOrigin: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Names in Arabic, English, Chinese */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'اسم المنتج بالعربية *' : 'Product Name (Arabic) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.nameAr}
                    onChange={(e) => setEditFormData({ ...editFormData, nameAr: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'اسم المنتج بالإنجليزية' : 'Product Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={editFormData.nameEn}
                    onChange={(e) => setEditFormData({ ...editFormData, nameEn: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'اسم المنتج بالصينية (中文)' : 'Product Name (Chinese)'}
                  </label>
                  <input
                    type="text"
                    value={editFormData.nameCn}
                    onChange={(e) => setEditFormData({ ...editFormData, nameCn: e.target.value })}
                    placeholder="十字对开四门冰箱..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Product Image Selection (Device File Upload or URL) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    <span>{language === 'ar' ? 'صورة المنتج الرئيسية' : 'Primary Product Image'}</span>
                  </label>
                  {editFormData.imageUrl && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 font-bold">
                      {editFormData.imageUrl.startsWith('data:') 
                        ? (language === 'ar' ? 'مرفوعة من الجهاز' : 'Uploaded from Device') 
                        : (language === 'ar' ? 'رابط خارجي' : 'External Link')}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Thumbnail Preview */}
                  <div className="relative w-24 h-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 shadow-sm group">
                    {editFormData.imageUrl ? (
                      <>
                        <img
                          src={editFormData.imageUrl}
                          alt="Product Preview"
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setEditFormData((prev) => ({ ...prev, imageUrl: '' }))}
                          className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-bold"
                          title={language === 'ar' ? 'حذف الصورة' : 'Remove Image'}
                        >
                          <Trash2 className="w-4 h-4 mb-0.5 text-rose-300" />
                          <span>{language === 'ar' ? 'حذف' : 'Remove'}</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 stroke-1" />
                        <span className="text-[10px] block">{language === 'ar' ? 'لا توجد صورة' : 'No image'}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions: Upload from Device or Paste URL */}
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="file"
                      ref={editFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleProductImageUpload(file, 'edit');
                        e.target.value = '';
                      }}
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 disabled:opacity-50"
                      >
                        {isUploadingImage ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>{language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>{language === 'ar' ? 'رفع صورة من جهازي' : 'Upload from Device'}</span>
                          </>
                        )}
                      </button>

                      {editFormData.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setEditFormData((prev) => ({ ...prev, imageUrl: '' }))}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:border-rose-300 transition-colors"
                          title={language === 'ar' ? 'إزالة الصورة' : 'Clear Image'}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={editFormData.imageUrl}
                        onChange={(e) => setEditFormData({ ...editFormData, imageUrl: e.target.value })}
                        placeholder={language === 'ar' ? 'أو ألصق رابط صورة (URL) هنا...' : 'Or paste image URL here...'}
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px] text-slate-700 dark:text-slate-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Specifications Editor */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <span>{language === 'ar' ? 'المواصفات الفنية المعتمدة لهذا الجهاز' : 'Technical Specifications'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomEditSpec}
                    className="flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{language === 'ar' ? 'إضافة خاصية إضافية' : 'Add Property'}</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                  {editFormData.specifications.map((spec, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={spec.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditFormData((prev) => ({
                            ...prev,
                            specifications: prev.specifications.map((s, i) =>
                              i === idx ? { ...s, label: val } : s
                            ),
                          }));
                        }}
                        className="w-1/2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                        placeholder="اسم الخاصية"
                      />
                      <input
                        type="text"
                        value={String(spec.value)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditFormData((prev) => ({
                            ...prev,
                            specifications: prev.specifications.map((s, i) =>
                              i === idx ? { ...s, value: val } : s
                            ),
                          }));
                        }}
                        className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        placeholder="القيمة"
                      />
                      <input
                        type="text"
                        value={spec.unit || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditFormData((prev) => ({
                            ...prev,
                            specifications: prev.specifications.map((s, i) =>
                              i === idx ? { ...s, unit: val } : s
                            ),
                          }));
                        }}
                        className="w-16 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-center font-mono"
                        placeholder="الوحدة"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveEditSpec(idx)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'الوصف بالعربية' : 'Description (Arabic)'}
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.descriptionAr}
                    onChange={(e) => setEditFormData({ ...editFormData, descriptionAr: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'الوصف بالإنجليزية' : 'Description (English)'}
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.descriptionEn}
                    onChange={(e) => setEditFormData({ ...editFormData, descriptionEn: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors"
                >
                  {language === 'ar' ? 'حفظ تعديلات المنتج' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Product Modal */}
      <ConfirmDeleteModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={() => {
          if (productToDelete) {
            deleteProduct(productToDelete.id);
            setProductToDelete(null);
          }
        }}
        title={language === 'ar' ? 'تأكيد حذف المنتج' : 'Confirm Delete Product'}
        message={
          language === 'ar'
            ? `هل أنت متأكد من حذف المنتج (${productToDelete?.nameAr || productToDelete?.nameEn}) [${productToDelete?.modelNumber}] نهائياً؟`
            : `Are you sure you want to permanently delete (${productToDelete?.nameEn}) [${productToDelete?.modelNumber}]?`
        }
        confirmText={language === 'ar' ? 'نعم، حذف المنتج' : 'Delete Product'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
      />
    </div>
  );
};
