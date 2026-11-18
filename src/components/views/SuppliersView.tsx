import React, { useState, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Building2,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Star,
  Users,
  FolderCheck,
  AlertTriangle,
  X,
  FileSpreadsheet,
  Upload,
  Camera,
  Trash2,
  RefreshCw,
  CloudUpload,
  Check,
} from 'lucide-react';
import { Supplier, SupplierType, SupplierStatus } from '../../types/erp';
import { exportToExcel } from '../../utils/erpLogic';
import { compressImageFile } from '../../utils/imageCompressor';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

export const SuppliersView: React.FC = () => {
  const {
    suppliers,
    contacts,
    addSupplier,
    deleteSupplier,
    setSelectedSupplierId,
    setActiveView,
    language,
    showToast,
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // Logo file upload state for add modal
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Form State for Add Supplier
  const [formData, setFormData] = useState({
    nameEn: '',
    nameCn: '',
    factoryName: '',
    type: 'manufacturer' as SupplierType,
    country: 'China',
    city: 'Foshan, Guangdong',
    address: '',
    website: '',
    alibabaUrl: '',
    phone: '',
    whatsapp: '',
    email: '',
    wechat: '',
    legalCompanyName: '',
    commercialRegNo: '',
    firstContactDate: new Date().toISOString().split('T')[0],
    sourcingChannel: 'Canton Fair',
    status: 'active' as SupplierStatus,
    internalNotes: '',
    logo: '',
    // Initial Ratings
    productQuality: 5,
    priceCompetitiveness: 4,
    responseTime: 5,
    deliveryTimeliness: 4,
    packagingQuality: 5,
    specAccuracy: 5,
    negotiationFlexibility: 4,
    communicationQuality: 5,
    punctuality: 4,
    problemSolving: 4,
    notes: 'مورد جديد قيد الفحص والمطابقة.',
  });

  // Duplicate warning detection
  const duplicateWarning = React.useMemo(() => {
    if (!formData.nameEn && !formData.email && !formData.phone) return null;
    const match = suppliers.find(
      (s) =>
        (formData.nameEn && s.nameEn.toLowerCase() === formData.nameEn.trim().toLowerCase()) ||
        (formData.email && s.email.toLowerCase() === formData.email.trim().toLowerCase()) ||
        (formData.phone && s.phone === formData.phone.trim())
    );
    return match ? match.nameEn : null;
  }, [formData.nameEn, formData.email, formData.phone, suppliers]);

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.nameCn && s.nameCn.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.factoryName && s.factoryName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'all' || s.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingLogo(true);
      const dataUrl = await compressImageFile(file, 360, 360);
      setFormData((prev) => ({ ...prev, logo: dataUrl }));
      showToast(language === 'ar' ? 'تم تجهيز الشعار بنجاح' : 'Logo attached successfully');
    } catch (err: any) {
      console.error('Failed to compress supplier logo:', err);
      showToast(language === 'ar' ? 'فشل معالجة صورة الشعار' : 'Failed to process logo image', '', 'error');
    } finally {
      setIsUploadingLogo(false);
      if (logoFileInputRef.current) logoFileInputRef.current.value = '';
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameEn.trim()) {
      showToast(language === 'ar' ? 'يرجى إدخال اسم الشركة بالإنجليزية' : 'Please enter Company English Name', '', 'error');
      return;
    }

    const overallScore = Math.round(
      ((formData.productQuality +
        formData.priceCompetitiveness +
        formData.responseTime +
        formData.deliveryTimeliness +
        formData.packagingQuality +
        formData.specAccuracy +
        formData.negotiationFlexibility +
        formData.communicationQuality +
        formData.punctuality +
        formData.problemSolving) /
        10) *
        10
    ) / 10;

    const supplierPayload: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'> = {
      nameEn: formData.nameEn.trim(),
      nameCn: formData.nameCn.trim() || undefined,
      factoryName: formData.factoryName.trim() || undefined,
      type: formData.type,
      country: formData.country,
      city: formData.city,
      address: formData.address,
      website: formData.website || undefined,
      alibabaUrl: formData.alibabaUrl || undefined,
      phone: formData.phone,
      whatsapp: formData.whatsapp || undefined,
      email: formData.email,
      wechat: formData.wechat || undefined,
      legalCompanyName: formData.legalCompanyName || undefined,
      commercialRegNo: formData.commercialRegNo || undefined,
      firstContactDate: formData.firstContactDate,
      sourcingChannel: formData.sourcingChannel,
      status: formData.status,
      internalNotes: formData.internalNotes || undefined,
      logo: formData.logo || undefined,
      rating: {
        productQuality: formData.productQuality,
        priceCompetitiveness: formData.priceCompetitiveness,
        responseTime: formData.responseTime,
        deliveryTimeliness: formData.deliveryTimeliness,
        packagingQuality: formData.packagingQuality,
        specAccuracy: formData.specAccuracy,
        negotiationFlexibility: formData.negotiationFlexibility,
        communicationQuality: formData.communicationQuality,
        punctuality: formData.punctuality,
        problemSolving: formData.problemSolving,
        overallScore,
        notes: formData.notes,
        evaluatedBy: 'Procurement Manager',
        updatedAt: new Date().toISOString().split('T')[0],
      },
    };

    const newId = await addSupplier(supplierPayload);
    setIsAddModalOpen(false);
    // Navigate directly into new supplier details
    setSelectedSupplierId(newId);
    setActiveView('supplier_detail');
  };

  const exportSuppliersToExcel = () => {
    const data = suppliers.map((s) => ({
      ID: s.id,
      'Name (EN)': s.nameEn,
      'Name (CN)': s.nameCn || '',
      Factory: s.factoryName || '',
      Type: s.type,
      City: s.city,
      Phone: s.phone,
      Email: s.email,
      WeChat: s.wechat || '',
      WhatsApp: s.whatsapp || '',
      Rating: s.rating.overallScore,
      Status: s.status,
      'First Contact': s.firstContactDate,
      Channel: s.sourcingChannel,
    }));
    exportToExcel('Suppliers', data, 'SinoTrack_Suppliers_Directory');
    showToast(language === 'ar' ? 'تم تصدير دليل الموردين إلى Excel' : 'Exported Suppliers to Excel');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            <span>{language === 'ar' ? 'دليل الموردين والمصانع الصينية' : 'Chinese Suppliers & Factories Directory'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'إدارة بيانات المصانع، جهات الاتصال، سجل التواصل، التقييم، وقاعدة البيانات السحابية'
              : 'Direct manufacturer profiles, key contacts, audit trails, and cloud database'}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={exportSuppliersToExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{language === 'ar' ? 'تصدير Excel' : 'Export Excel'}</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ar' ? 'إضافة مورد جديد' : 'Add New Supplier'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              language === 'ar'
                ? 'ابحث باسم الشركة، المدينة (Foshan, Ningbo...)، الموديل، أو الكود...'
                : 'Search supplier name, Chinese name, factory, city, ID...'
            }
            className="w-full ps-9 pe-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <option value="all">{language === 'ar' ? 'جميع الأنواع' : 'All Types'}</option>
            <option value="manufacturer">{language === 'ar' ? 'مصنع مباشر (Manufacturer)' : 'Manufacturer'}</option>
            <option value="trading_company">{language === 'ar' ? 'شركة تجارية (Trading Co.)' : 'Trading Co.'}</option>
            <option value="distributor">{language === 'ar' ? 'وكيل توزيع' : 'Distributor'}</option>
            <option value="components_supplier">{language === 'ar' ? 'مورد قطع ومكونات' : 'Components'}</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <option value="all">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
            <option value="active">{language === 'ar' ? 'نشط (Active)' : 'Active'}</option>
            <option value="potential">{language === 'ar' ? 'محتمل (Potential)' : 'Potential'}</option>
            <option value="negotiating">{language === 'ar' ? 'قيد التفاوض' : 'Negotiating'}</option>
            <option value="paused">{language === 'ar' ? 'متوقف' : 'Paused'}</option>
          </select>
        </div>
      </div>

      {/* Suppliers Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSuppliers.map((supplier) => {
          const supplierContacts = contacts.filter((c) => c.supplierId === supplier.id);
          const primaryContact = supplierContacts.find((c) => c.isPrimary) || supplierContacts[0];

          return (
            <div
              key={supplier.id}
              onClick={() => {
                setSelectedSupplierId(supplier.id);
                setActiveView('supplier_detail');
              }}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Header row with Logo */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                      {supplier.logo ? (
                        <img
                          src={supplier.logo}
                          alt={supplier.nameEn}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-lg">
                          {supplier.nameEn.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                          {supplier.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            supplier.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : supplier.status === 'negotiating'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {supplier.status}
                        </span>
                      </div>
                      <h3
                        dir="ltr"
                        className="text-sm font-bold text-slate-900 dark:text-white mt-1 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 text-start"
                      >
                        {supplier.nameEn}
                      </h3>
                      {supplier.nameCn && (
                        <p className="text-[11px] text-slate-400 font-normal line-clamp-1">{supplier.nameCn}</p>
                      )}
                    </div>
                  </div>

                  {/* Rating Badge & Delete Action */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{supplier.rating.overallScore}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSupplierToDelete(supplier);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title={language === 'ar' ? 'حذف المورد' : 'Delete Supplier'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Factory Name & City */}
                <div className="mt-2.5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{supplier.city}</span>
                  </div>
                  {supplier.factoryName && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{supplier.factoryName}</span>
                    </div>
                  )}
                </div>

                {/* Primary Contact Person Box */}
                {primaryContact && (
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200/80 dark:border-[#2a2a2a]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate" dir="ltr">
                        👤 {primaryContact.name}
                      </span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                        {primaryContact.position}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono" dir="ltr">
                      <span>WA: {primaryContact.whatsapp || primaryContact.phone}</span>
                      <span>WeChat: {primaryContact.wechatId || '-'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{supplierContacts.length} {language === 'ar' ? 'جهات اتصال' : 'contacts'}</span>
                </span>

                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'محفوظ بالسحابة' : 'Cloud Saved'}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Supplier Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-3xl my-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1a1a1a]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>{language === 'ar' ? 'إضافة مورد أو مصنع صيني جديد' : 'Register New Chinese Supplier'}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Duplicate alert if detected */}
              {duplicateWarning && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold">{language === 'ar' ? 'تنبيه تشابه مورد مسبق:' : 'Potential Duplicate Detected:'}</span>{' '}
                    {language === 'ar'
                      ? `تم العثور على مورد مسجل بالفعل بنفس الاسم أو الهاتف أو البريد: (${duplicateWarning}). يرجى التحقق لمنع الازدواجية.`
                      : `A supplier with matching details already exists: (${duplicateWarning}).`}
                  </div>
                </div>
              )}

              {/* Supplier Logo Upload Section */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 flex items-center justify-center overflow-hidden shrink-0">
                    {formData.logo ? (
                      <img src={formData.logo} alt="Logo Preview" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="w-7 h-7 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {language === 'ar' ? 'شعار المورد / المصنع' : 'Supplier / Factory Logo'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'ar'
                        ? 'أرفق صورة لشعار المصنع أو علامته التجارية مباشرة من الحاسب'
                        : 'Attach factory or brand logo image directly from your computer'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 hover:border-blue-500 shadow-xs cursor-pointer"
                  >
                    {isUploadingLogo ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{language === 'ar' ? 'اختيار صورة من الجهاز' : 'Choose Logo File'}</span>
                  </button>
                  {formData.logo && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, logo: '' }))}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title={language === 'ar' ? 'إزالة الشعار' : 'Remove Logo'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <input
                    type="file"
                    ref={logoFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>
              </div>

              {/* Basic Company Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'اسم الشركة بالإنجليزية *' : 'Company Name (English) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    placeholder="e.g. Foshan Shunde Galanz Microwave Co., Ltd."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'اسم الشركة بالصينية' : 'Company Name (Chinese)'}
                  </label>
                  <input
                    type="text"
                    value={formData.nameCn}
                    onChange={(e) => setFormData({ ...formData, nameCn: e.target.value })}
                    placeholder="e.g. 广东格兰仕微波生活电器制造有限公司"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'اسم المصنع / العلامة التجارية' : 'Factory / Brand Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.factoryName}
                    onChange={(e) => setFormData({ ...formData, factoryName: e.target.value })}
                    placeholder="e.g. Galanz Ronggui Smart Base"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'نوع المورد' : 'Supplier Type'}
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as SupplierType })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="manufacturer">{language === 'ar' ? 'مصنع مباشر (Manufacturer)' : 'Direct Manufacturer'}</option>
                    <option value="trading_company">{language === 'ar' ? 'شركة تجارية (Trading Company)' : 'Trading Company'}</option>
                    <option value="distributor">{language === 'ar' ? 'وكيل وموزع (Distributor)' : 'Distributor'}</option>
                    <option value="components_supplier">{language === 'ar' ? 'مورد قطع ومكونات' : 'Components Supplier'}</option>
                  </select>
                </div>
              </div>

              {/* Geographic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'المدينة والمقاطعة في الصين' : 'City & Province in China'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Foshan, Guangdong or Ningbo, Zhejiang"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'العنوان التفصيلي للمصنع' : 'Full Factory Address'}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="No. 25 Industrial Ave, Shunde District..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Contact Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'رقم الهاتف الرئيسي' : 'Main Phone'}
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+86 757 2888 9999"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'البريد الإلكتروني الرسمي' : 'Official Email'}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sales@factory.com"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'حساب WeChat' : 'WeChat ID'}
                  </label>
                  <input
                    type="text"
                    value={formData.wechat}
                    onChange={(e) => setFormData({ ...formData, wechat: e.target.value })}
                    placeholder="wechat_id"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Sourcing Channel and Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'مصدر التعرف على المورد' : 'Sourcing Channel'}
                  </label>
                  <input
                    type="text"
                    value={formData.sourcingChannel}
                    onChange={(e) => setFormData({ ...formData, sourcingChannel: e.target.value })}
                    placeholder="e.g. Canton Fair, Alibaba, Factory Visit"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'حالة المورد' : 'Supplier Status'}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as SupplierStatus })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="active">{language === 'ar' ? 'نشط (Active)' : 'Active'}</option>
                    <option value="potential">{language === 'ar' ? 'محتمل (Potential)' : 'Potential'}</option>
                    <option value="negotiating">{language === 'ar' ? 'قيد التفاوض (Negotiating)' : 'Negotiating'}</option>
                    <option value="paused">{language === 'ar' ? 'متوقف (Paused)' : 'Paused'}</option>
                  </select>
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'ملاحظات داخلية وتقييم أولي' : 'Internal Notes & Remarks'}
                </label>
                <textarea
                  rows={2}
                  value={formData.internalNotes}
                  onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                  placeholder="ملاحظات حول خطوط الإنتاج، شهادات الجودة SASO، والحد الأدنى للطلب MOQ..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  {language === 'ar' ? 'حفظ وتأكيد المورد' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Supplier Modal */}
      <ConfirmDeleteModal
        isOpen={!!supplierToDelete}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={() => {
          if (supplierToDelete) {
            deleteSupplier(supplierToDelete.id, true);
            setSupplierToDelete(null);
          }
        }}
        title={language === 'ar' ? 'تأكيد حذف المورد' : 'Confirm Delete Supplier'}
        message={
          language === 'ar'
            ? `هل أنت متأكد من رغبتك في حذف المورد (${supplierToDelete?.nameEn}) نهائياً؟\nسيتم حذف بيانات المورد وجهات الاتصال وسجلات المراسلات المرتبطة به فوراً من النظام.`
            : `Are you sure you want to delete (${supplierToDelete?.nameEn})? All associated contacts and logs will be removed.`
        }
        confirmText={language === 'ar' ? 'نعم، حذف المورد' : 'Yes, Delete Supplier'}
        cancelText={language === 'ar' ? 'تراجع' : 'Cancel'}
      />
    </div>
  );
};
