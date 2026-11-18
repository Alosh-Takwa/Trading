import React, { useState, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Building2,
  Users,
  Package,
  FileSpreadsheet,
  ShoppingCart,
  Receipt,
  Ship,
  Folder,
  MessageSquare,
  Star,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Plus,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  FolderPlus,
  Trash2,
  X,
  FileText,
  Edit2,
  Upload,
  Camera,
  Check,
  RefreshCw,
  CloudUpload,
  FolderCheck,
} from 'lucide-react';
import { formatMoney } from '../../utils/erpLogic';
import { loadDatabase } from '../../services/storage';
import { CommunicationChannel, SupplierContact } from '../../types/erp';
import { compressImageFile } from '../../utils/imageCompressor';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

export const SupplierDetailView: React.FC = () => {
  const {
    selectedSupplierId,
    setSelectedSupplierId,
    setActiveView,
    suppliers,
    contacts,
    communicationLogs,
    quotations,
    orders,
    invoices,
    shipments,
    products,
    addProduct,
    language,
    addContact,
    updateContact,
    deleteContact,
    addCommunicationLog,
    updateSupplier,
    deleteSupplier,
    uploadSupplierCatalog,
    deleteSupplierCatalog,
    showToast,
  } = useERP();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'contacts' | 'products_quotes' | 'catalogs' | 'orders' | 'financials' | 'shipments' | 'communication' | 'rating'
  >('overview');

  // Modals inside detail view
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [isAddLogModalOpen, setIsAddLogModalOpen] = useState(false);
  const [isConfirmDeleteSupplierOpen, setIsConfirmDeleteSupplierOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<SupplierContact | null>(null);

  // Contact Form State (Add & Edit)
  const initialContactForm = {
    name: '',
    chineseName: '',
    position: 'Sales Manager',
    department: 'Overseas Export',
    phone: '',
    whatsapp: '',
    wechatId: '',
    email: '',
    language: 'English, Mandarin',
    internalOwner: 'Procurement Specialist',
    contactStartDate: new Date().toISOString().split('T')[0],
    notes: '',
    isPrimary: false,
    avatar: '',
  };

  const [contactForm, setContactForm] = useState(initialContactForm);

  // File Upload State for Contacts, Supplier Logo, and Catalogs
  const contactFileInputRef = useRef<HTMLInputElement>(null);
  const supplierLogoInputRef = useRef<HTMLInputElement>(null);
  const catalogFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingContactImage, setIsUploadingContactImage] = useState(false);
  const [isUploadingSupplierLogo, setIsUploadingSupplierLogo] = useState(false);
  const [isUploadingCatalog, setIsUploadingCatalog] = useState(false);

  // New Communication Log State
  const [newLog, setNewLog] = useState({
    contactId: '',
    contactName: '',
    date: new Date().toISOString().split('T')[0],
    channel: 'wechat' as CommunicationChannel,
    subject: '',
    summary: '',
    nextAction: '',
    nextFollowUpDate: '',
    assignedTo: 'Alosh Takwa',
  });

  // Supplier Product State
  const [isAddSupplierProductOpen, setIsAddSupplierProductOpen] = useState(false);
  const [supplierProductForm, setSupplierProductForm] = useState({
    nameAr: '',
    nameEn: '',
    nameCn: '',
    modelNumber: '',
    brand: 'Orient Elite',
    category: 'refrigerators' as any,
    subCategory: '',
    descriptionAr: '',
    imageUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80',
  });

  const supplier = suppliers.find((s) => s.id === selectedSupplierId) || loadDatabase().suppliers.find((s) => s.id === selectedSupplierId);

  // Open modal to add new contact
  const handleOpenAddContact = () => {
    setEditingContactId(null);
    setContactForm(initialContactForm);
    setIsContactModalOpen(true);
  };

  // Open modal to edit existing contact
  const handleOpenEditContact = (contact: SupplierContact) => {
    setEditingContactId(contact.id);
    setContactForm({
      name: contact.name,
      chineseName: contact.chineseName || '',
      position: contact.position || 'Sales Manager',
      department: contact.department || '',
      phone: contact.phone || '',
      whatsapp: contact.whatsapp || '',
      wechatId: contact.wechatId || '',
      email: contact.email || '',
      language: contact.language || 'English, Mandarin',
      internalOwner: contact.internalOwner || 'Procurement Specialist',
      contactStartDate: contact.contactStartDate || new Date().toISOString().split('T')[0],
      notes: contact.notes || '',
      isPrimary: !!contact.isPrimary,
      avatar: contact.avatar || '',
    });
    setIsContactModalOpen(true);
  };

  // Upload contact photo from device
  const handleContactFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingContactImage(true);
      const dataUrl = await compressImageFile(file, 360, 360);
      setContactForm((prev) => ({ ...prev, avatar: dataUrl }));
    } catch (err: any) {
      console.error('Failed to compress contact image', err);
    } finally {
      setIsUploadingContactImage(false);
      if (contactFileInputRef.current) contactFileInputRef.current.value = '';
    }
  };

  // Upload supplier logo from device directly from detail view
  const handleSupplierLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supplier) return;
    try {
      setIsUploadingSupplierLogo(true);
      const dataUrl = await compressImageFile(file, 360, 360);
      updateSupplier(supplier.id, { logo: dataUrl });
      showToast(language === 'ar' ? 'تم تحديث شعار المصنع بنجاح' : 'Supplier logo updated');
    } catch (err: any) {
      console.error('Failed to compress logo', err);
    } finally {
      setIsUploadingSupplierLogo(false);
      if (supplierLogoInputRef.current) supplierLogoInputRef.current.value = '';
    }
  };

  // Upload supplier catalog directly to Google Drive and store link in Firestore
  const handleCatalogUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supplier) return;
    try {
      setIsUploadingCatalog(true);
      await uploadSupplierCatalog(supplier.id, file);
    } catch (err: any) {
      console.error('Failed to upload catalog:', err);
    } finally {
      setIsUploadingCatalog(false);
      if (catalogFileInputRef.current) catalogFileInputRef.current.value = '';
    }
  };

  if (!supplier) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <p className="text-sm font-semibold text-slate-500">
          {language === 'ar' ? 'لم يتم العثور على المورد المحدد.' : 'Selected supplier not found.'}
        </p>
        <button
          onClick={() => setActiveView('suppliers')}
          className="mt-3 px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl"
        >
          {language === 'ar' ? 'العودة لدليل الموردين' : 'Back to Suppliers'}
        </button>
      </div>
    );
  }

  const supplierContacts = contacts.filter((c) => c.supplierId === supplier.id);
  const supplierLogs = communicationLogs
    .filter((l) => l.supplierId === supplier.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const supplierQuotes = quotations.filter((q) => q.supplierId === supplier.id);
  const supplierOrders = orders.filter((o) => o.supplierId === supplier.id);
  const supplierInvoices = invoices.filter((i) => i.supplierId === supplier.id);
  const supplierShipments = shipments.filter((s) => s.supplierId === supplier.id);

  const totalSpentWithSupplier = supplierOrders.reduce((acc, o) => acc + (o.grandTotal || 0), 0);
  const totalPaidToSupplier = supplierOrders.reduce((acc, o) => acc + (o.totalPaid || 0), 0);
  const totalBalanceDueSupplier = supplierOrders.reduce((acc, o) => acc + (o.balanceDue || 0), 0);

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim()) return;

    if (editingContactId) {
      updateContact(editingContactId, {
        supplierId: supplier.id,
        name: contactForm.name.trim(),
        chineseName: contactForm.chineseName.trim() || undefined,
        position: contactForm.position,
        department: contactForm.department,
        phone: contactForm.phone,
        whatsapp: contactForm.whatsapp || undefined,
        wechatId: contactForm.wechatId || undefined,
        email: contactForm.email.trim(),
        language: contactForm.language,
        internalOwner: contactForm.internalOwner,
        contactStartDate: contactForm.contactStartDate,
        notes: contactForm.notes || undefined,
        isPrimary: contactForm.isPrimary,
        avatar: contactForm.avatar || undefined,
      });
      showToast(language === 'ar' ? 'تم تحديث بيانات جهة الاتصال' : 'Contact updated', contactForm.name);
    } else {
      addContact({
        supplierId: supplier.id,
        name: contactForm.name.trim(),
        chineseName: contactForm.chineseName.trim() || undefined,
        position: contactForm.position,
        department: contactForm.department,
        phone: contactForm.phone,
        whatsapp: contactForm.whatsapp || undefined,
        wechatId: contactForm.wechatId || undefined,
        email: contactForm.email.trim(),
        language: contactForm.language,
        internalOwner: contactForm.internalOwner,
        contactStartDate: contactForm.contactStartDate,
        notes: contactForm.notes || undefined,
        isPrimary: contactForm.isPrimary,
        avatar: contactForm.avatar || undefined,
      });
    }

    setIsContactModalOpen(false);
    setContactForm(initialContactForm);
    setEditingContactId(null);
  };

  const handleCreateLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.subject.trim()) return;

    const matchedContact = supplierContacts.find((c) => c.id === newLog.contactId);

    addCommunicationLog({
      supplierId: supplier.id,
      contactId: newLog.contactId || undefined,
      contactName: matchedContact ? matchedContact.name : newLog.contactName || 'Primary Representative',
      date: newLog.date,
      channel: newLog.channel,
      subject: newLog.subject.trim(),
      summary: newLog.summary.trim(),
      nextAction: newLog.nextAction.trim() || undefined,
      nextFollowUpDate: newLog.nextFollowUpDate || undefined,
      assignedTo: newLog.assignedTo,
    });

    setIsAddLogModalOpen(false);
    setNewLog({
      contactId: '',
      contactName: '',
      date: new Date().toISOString().split('T')[0],
      channel: 'wechat',
      subject: '',
      summary: '',
      nextAction: '',
      nextFollowUpDate: '',
      assignedTo: 'Alosh Takwa',
    });
  };

  const supplierProducts = products.filter(
    (p) => (p as any).supplierId === supplier.id || p.supplierName === supplier.nameEn
  );

  const handleCreateSupplierProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;
    if (!supplierProductForm.nameAr.trim() || !supplierProductForm.modelNumber.trim()) {
      showToast(language === 'ar' ? 'يرجى إدخال اسم المنتج ورقم الموديل' : 'Name and model number required', '', 'error');
      return;
    }

    addProduct({
      nameAr: supplierProductForm.nameAr.trim(),
      nameEn: supplierProductForm.nameEn.trim() || supplierProductForm.nameAr.trim(),
      nameCn: supplierProductForm.nameCn.trim() || undefined,
      modelNumber: supplierProductForm.modelNumber.trim(),
      brand: supplierProductForm.brand.trim(),
      category: supplierProductForm.category,
      subCategory: supplierProductForm.subCategory.trim() || undefined,
      descriptionAr: supplierProductForm.descriptionAr.trim() || undefined,
      countryOfOrigin: 'China',
      supplierId: supplier.id,
      supplierName: supplier.nameEn,
      specifications: [],
      images: [
        {
          id: `IMG-${Date.now()}`,
          url: supplierProductForm.imageUrl.trim(),
          caption: supplierProductForm.modelNumber,
          type: 'primary',
        },
      ],
      documents: [],
    });

    setIsAddSupplierProductOpen(false);
    setSupplierProductForm({
      nameAr: '',
      nameEn: '',
      nameCn: '',
      modelNumber: '',
      brand: 'Orient Elite',
      category: 'refrigerators',
      subCategory: '',
      descriptionAr: '',
      imageUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80',
    });
  };

  const supplierCatalogs = supplier.catalogs || [];

  const tabs = [
    { id: 'overview', titleAr: 'نظرة عامة', titleEn: 'Overview', icon: <Building2 className="w-4 h-4" /> },
    { id: 'contacts', titleAr: `جهات الاتصال (${supplierContacts.length})`, titleEn: `Contacts (${supplierContacts.length})`, icon: <Users className="w-4 h-4" /> },
    { id: 'products_quotes', titleAr: `المنتجات والأسعار (${supplierProducts.length + supplierQuotes.length})`, titleEn: `Products & Quotes (${supplierProducts.length + supplierQuotes.length})`, icon: <Package className="w-4 h-4" /> },
    { id: 'catalogs', titleAr: `الكتالوجات (${supplierCatalogs.length})`, titleEn: `Catalogs (${supplierCatalogs.length})`, icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'orders', titleAr: `الطلبيات (${supplierOrders.length})`, titleEn: `Orders (${supplierOrders.length})`, icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'financials', titleAr: `الفواتير والمالية`, titleEn: `Financials`, icon: <Receipt className="w-4 h-4" /> },
    { id: 'shipments', titleAr: `الشحنات (${supplierShipments.length})`, titleEn: `Shipments (${supplierShipments.length})`, icon: <Ship className="w-4 h-4" /> },
    { id: 'communication', titleAr: `سجل التواصل (${supplierLogs.length})`, titleEn: `Timeline (${supplierLogs.length})`, icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'rating', titleAr: `التقييم (★ ${supplier.rating.overallScore})`, titleEn: `Rating (★ ${supplier.rating.overallScore})`, icon: <Star className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Navigation & Profile Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveView('suppliers')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{language === 'ar' ? 'العودة لقائمة الموردين' : 'Back to Suppliers'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsConfirmDeleteSupplierOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 transition-colors"
              title={language === 'ar' ? 'حذف هذا المورد' : 'Delete Supplier'}
            >
              <Trash2 className="w-4 h-4" />
              <span>{language === 'ar' ? 'حذف المورد' : 'Delete'}</span>
            </button>
          </div>
        </div>

        {/* Profile Bio */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-start sm:items-center gap-4">
            {/* Supplier Logo with direct upload from computer */}
            <div className="relative group w-16 h-16 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              {supplier.logo ? (
                <img src={supplier.logo} alt={supplier.nameEn} className="w-full h-full object-contain p-1" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-black text-lg">
                  {supplier.nameEn.slice(0, 2).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => supplierLogoInputRef.current?.click()}
                disabled={isUploadingSupplierLogo}
                className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-[10px] font-bold cursor-pointer"
                title={language === 'ar' ? 'رفع شعار جديد من الجهاز' : 'Upload logo from device'}
              >
                {isUploadingSupplierLogo ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <Camera className="w-4 h-4 mb-0.5" />
                    <span>{language === 'ar' ? 'تغيير' : 'Change'}</span>
                  </>
                )}
              </button>
              <input
                type="file"
                ref={supplierLogoInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleSupplierLogoUpload}
              />
              <input
                type="file"
                ref={catalogFileInputRef}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
                className="hidden"
                onChange={handleCatalogUpload}
              />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                  {supplier.id}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {supplier.status}
                </span>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {supplier.type}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5">
                {supplier.nameEn}
              </h1>
              {supplier.nameCn && (
                <p className="text-xs text-slate-400 font-medium">{supplier.nameCn}</p>
              )}
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{supplier.address || supplier.city}</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-3">
            <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] text-slate-400 font-medium">{language === 'ar' ? 'إجمالي المشتريات' : 'Total Spend'}</p>
              <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                {formatMoney(totalSpentWithSupplier, 'USD', language)}
              </p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] text-slate-400 font-medium">{language === 'ar' ? 'التقييم الإجمالي' : 'Rating Score'}</p>
              <p className="text-sm font-black text-amber-500 mt-0.5 flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{supplier.rating.overallScore}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-t border-slate-100 dark:border-slate-800 pt-3 overflow-x-auto text-xs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              <span>{language === 'ar' ? tab.titleAr : tab.titleEn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Areas */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>{language === 'ar' ? 'بيانات المصنع والشركة القانونية' : 'Factory & Company Details'}</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{language === 'ar' ? 'اسم المصنع' : 'Factory Name'}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{supplier.factoryName || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{language === 'ar' ? 'الاسم القانوني' : 'Legal Entity Name'}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{supplier.legalCompanyName || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{language === 'ar' ? 'السجل التجاري' : 'Registration No.'}</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{supplier.commercialRegNo || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{language === 'ar' ? 'أول تواصل' : 'First Contact Date'}</span>
                <span className="text-slate-800 dark:text-slate-200">{supplier.firstContactDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{language === 'ar' ? 'قناة التعرف' : 'Sourcing Channel'}</span>
                <span className="text-slate-800 dark:text-slate-200">{supplier.sourcingChannel}</span>
              </div>
              {supplier.website && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">{language === 'ar' ? 'الموقع الإلكتروني' : 'Website'}</span>
                  <a href={supplier.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                    <span>{supplier.website.replace('https://', '')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {supplier.alibabaUrl && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Alibaba Store</span>
                  <a href={supplier.alibabaUrl} target="_blank" rel="noreferrer" className="text-amber-600 hover:underline flex items-center gap-1">
                    <span>{language === 'ar' ? 'عرض متجر علي بابا' : 'View Alibaba Store'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>{language === 'ar' ? 'قنوات الاتصال المباشرة والملاحظات' : 'Contact Channels & Notes'}</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{language === 'ar' ? 'الهاتف' : 'Phone'}</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{supplier.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">WhatsApp</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{supplier.whatsapp || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">WeChat ID</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{supplier.wechat || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</span>
                <span className="text-slate-800 dark:text-slate-200">{supplier.email}</span>
              </div>
            </div>

            {supplier.internalNotes && (
              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'ملاحظات داخلية:' : 'Internal Notes:'}
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{supplier.internalNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CONTACTS */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'ar' ? 'جهات الاتصال والممثلون لدى المصنع' : 'Supplier Contact Persons'}
            </h3>
            <button
              onClick={handleOpenAddContact}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'إضافة شخص اتصال' : 'Add Contact Person'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supplierContacts.map((contact) => (
              <div
                key={contact.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-slate-200 dark:ring-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                        {contact.avatar ? (
                          <img
                            src={contact.avatar}
                            alt={contact.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-bold text-xs text-slate-500">
                            {contact.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{contact.name}</span>
                          {contact.isPrimary && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.2 rounded font-semibold">
                              Primary
                            </span>
                          )}
                        </h4>
                        {contact.chineseName && (
                          <p className="text-[11px] text-slate-400">{contact.chineseName}</p>
                        )}
                        <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                          {contact.position}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditContact(contact)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title={language === 'ar' ? 'تعديل جهة الاتصال' : 'Edit Contact'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setContactToDelete(contact)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                        title={language === 'ar' ? 'حذف جهة الاتصال' : 'Delete Contact'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{contact.phone}</span>
                  </div>
                  {contact.whatsapp && (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <span>WA: {contact.whatsapp}</span>
                    </div>
                  )}
                  {contact.wechatId && (
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <span>WeChat: {contact.wechatId}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                </div>

                {contact.notes && (
                  <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#1e1e1e] p-2 rounded-lg">
                    {contact.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTS & QUOTATIONS */}
      {activeTab === 'products_quotes' && (
        <div className="space-y-6">
          {/* Supplier Specific Products Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>
                    {language === 'ar'
                      ? `منتجات هذا المصنع المعتمدة (${supplierProducts.length})`
                      : `Products by this Manufacturer (${supplierProducts.length})`}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {language === 'ar'
                    ? 'المنتجات والأجهزة المنزلية المربوطة خصيصاً مع هذا المورد'
                    : 'Appliance models assigned specifically to this manufacturer'}
                </p>
              </div>

              <button
                onClick={() => setIsAddSupplierProductOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'إضافة منتج لهذا المورد' : 'Add Product for Supplier'}</span>
              </button>
            </div>

            {supplierProducts.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2 bg-slate-50/50 dark:bg-slate-900/40">
                <Package className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">
                  {language === 'ar'
                    ? 'لم يتم ربط أي منتجات بهذا المورد حتى الآن.'
                    : 'No products linked to this supplier yet.'}
                </p>
                <button
                  onClick={() => setIsAddSupplierProductOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  <span>{language === 'ar' ? 'أضف أول منتج خاص بهذا المصنع' : 'Add first product'}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {supplierProducts.map((sp) => (
                  <div
                    key={sp.id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-100 dark:border-slate-800 flex items-center justify-center">
                      {sp.images?.[0]?.url ? (
                        <img src={sp.images[0].url} alt={sp.nameEn} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-1.5 py-0.5 rounded">
                        {sp.modelNumber}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate mt-1">
                        {language === 'ar' ? sp.nameAr : sp.nameEn}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">{sp.category} • {sp.brand}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quotations Table */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'ar' ? 'عروض الأسعار المقدمة من هذا المصنع' : 'Quotations Provided by Supplier'}
              </h3>
            </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 dark:bg-[#1e1e1e] text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 text-start">{language === 'ar' ? 'كود العرض' : 'Quote ID'}</th>
                  <th className="p-3 text-start">{language === 'ar' ? 'المنتج والموديل' : 'Product & Model'}</th>
                  <th className="p-3 text-start">{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</th>
                  <th className="p-3 text-start">{language === 'ar' ? 'نوع السعر' : 'Price Type'}</th>
                  <th className="p-3 text-start">MOQ</th>
                  <th className="p-3 text-start">{language === 'ar' ? 'مدة التصنيع' : 'Lead Time'}</th>
                  <th className="p-3 text-start">{language === 'ar' ? 'تاريخ العرض' : 'Date'}</th>
                  <th className="p-3 text-start">{language === 'ar' ? 'الصلاحية' : 'Valid Until'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {supplierQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{q.id}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{q.productName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{q.modelNumber}</div>
                    </td>
                    <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatMoney(q.unitPrice, q.currency, language)}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-bold">
                        {q.priceType} ({q.portOfOrigin})
                      </span>
                    </td>
                    <td className="p-3 font-medium">{q.moq} {language === 'ar' ? 'وحدة' : 'units'}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{q.productionLeadDays} {language === 'ar' ? 'يوم' : 'days'}</td>
                    <td className="p-3 text-slate-500">{q.date}</td>
                    <td className="p-3 text-slate-500">{q.validUntil}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

      {/* TAB: CATALOGS (Cloud Database Persistence) */}
      {activeTab === 'catalogs' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>
                  {language === 'ar'
                    ? `كتالوجات ومستندات المصنع: ${supplier.nameEn}`
                    : `Product Catalogs & Docs: ${supplier.nameEn}`}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'ar'
                  ? 'رفع وحفظ ملفات الكتالوج مباشرة في قاعدة البيانات السحابية مع إمكانية المعاينة والتحميل الفوري'
                  : 'Upload files directly to Cloud Database with instant preview and download'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => catalogFileInputRef.current?.click()}
              disabled={isUploadingCatalog}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#4393ab] hover:bg-[#327a8f] rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isUploadingCatalog ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Upload className="w-4 h-4 text-white" />
              )}
              <span>
                {isUploadingCatalog
                  ? (language === 'ar' ? 'جاري الحفظ في قاعدة البيانات...' : 'Saving to Database...')
                  : (language === 'ar' ? 'رفع كتالوج جديد (PDF / Excel)' : 'Upload New Catalog')}
              </span>
            </button>
          </div>

          {/* Cloud Info Banner */}
          <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-900/60 text-xs text-teal-900 dark:text-teal-200 leading-relaxed flex items-start gap-3">
            <CloudUpload className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-0.5">
                {language === 'ar'
                  ? 'التخزين السحابي المركزي (Google Cloud Firestore)'
                  : 'Centralized Cloud Storage (Google Cloud Firestore)'}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                {language === 'ar'
                  ? 'يتم تخزين كافة الكتالوجات والمستندات الفنية وصور المنتجات مباشرة وبشكل دائم في قاعدة البيانات السحابية مع روابط فورية للعرض والتحميل دون وسائط خارجية.'
                  : 'All catalogs, spec sheets, and product media are stored directly in Cloud Firestore.'}
              </p>
            </div>
          </div>

          {/* Catalogs List / Grid */}
          {supplierCatalogs.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {language === 'ar' ? 'لا توجد كتالوجات مرفوعة لهذا المورد بعد' : 'No catalogs uploaded for this supplier yet'}
              </p>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                {language === 'ar'
                  ? 'يمكنك رفع كتالوجات المصنع بصيغ PDF أو صور أو جداول Excel ليتم حفظها سحابياً في قاعدة البيانات مباشرة.'
                  : 'You can upload PDF catalogs or Excel specification sheets to save them in the cloud database.'}
              </p>
              <button
                type="button"
                onClick={() => catalogFileInputRef.current?.click()}
                disabled={isUploadingCatalog}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'ar' ? 'رفع أول كتالوج' : 'Upload First Catalog'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supplierCatalogs.map((cat) => (
                <div
                  key={cat.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={cat.name}>
                        {cat.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        {cat.fileSize && <span>{cat.fileSize}</span>}
                        {cat.uploadedAt && <span>• {cat.uploadedAt.split('T')[0]}</span>}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                          <Check className="w-3 h-3" />
                          <span>{language === 'ar' ? 'محفوظ في قاعدة البيانات' : 'Stored in Cloud DB'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={cat.fileDataUrl || cat.driveViewLink || '#'}
                        target="_blank"
                        rel="noreferrer"
                        download={cat.name}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'معاينة / فتح' : 'Preview'}</span>
                      </a>
                      <a
                        href={cat.fileDataUrl || cat.driveDownloadLink || cat.driveViewLink || '#'}
                        download={cat.name}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                      >
                        <CloudUpload className="w-3.5 h-3.5 rotate-180" />
                        <span>{language === 'ar' ? 'تحميل' : 'Download'}</span>
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteSupplierCatalog(supplier.id, cat.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                      title={language === 'ar' ? 'حذف الكتالوج' : 'Delete Catalog'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'ar' ? 'أوامر الشراء المصدرة للمصنع' : 'Purchase Orders Placed with Supplier'}
            </h3>
          </div>

          <div className="space-y-3">
            {supplierOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                      {order.id}
                    </span>
                    <span className="text-xs text-slate-500">{order.orderDate}</span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    {order.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{item.productName}</span>
                        <span className="text-slate-400 ms-2 font-mono">[{item.modelNumber}]</span>
                      </div>
                      <div className="text-end">
                        <span className="font-semibold">{item.quantity}x @ ${item.negotiatedUnitPrice}</span>
                        <span className="ms-2 font-bold text-emerald-600">{formatMoney(item.totalItemAmount, order.currency, language)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 flex items-center justify-between text-xs">
                  <div className="text-slate-500">
                    <span>{language === 'ar' ? 'المدفوع:' : 'Paid:'} {formatMoney(order.totalPaid, order.currency, language)}</span>
                    <span className="ms-3 text-amber-600 font-semibold">{language === 'ar' ? 'المتبقي:' : 'Balance:'} {formatMoney(order.balanceDue, order.currency, language)}</span>
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    {formatMoney(order.grandTotal, order.currency, language)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: FINANCIALS */}
      {activeTab === 'financials' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">{language === 'ar' ? 'إجمالي المشتريات' : 'Total Invoiced'}</span>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {formatMoney(totalSpentWithSupplier, 'USD', language)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">{language === 'ar' ? 'المسدد فعلياً' : 'Total Paid'}</span>
              <p className="text-lg font-black text-emerald-600 mt-1">
                {formatMoney(totalPaidToSupplier, 'USD', language)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">{language === 'ar' ? 'الرصيد المستحق' : 'Balance Due'}</span>
              <p className="text-lg font-black text-amber-600 mt-1">
                {formatMoney(totalBalanceDueSupplier, 'USD', language)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-xs">
              {language === 'ar' ? 'سجل الفواتير التجارية' : 'Commercial Invoices'}
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {supplierInvoices.map((inv) => (
                <div key={inv.id} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{inv.invoiceNumber}</span>
                    <span className="ms-2 text-slate-500">PO: {inv.poNumber}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Due: {inv.dueDate}</p>
                  </div>
                  <div className="text-end">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {formatMoney(inv.totalAmount, inv.currency, language)}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SHIPMENTS */}
      {activeTab === 'shipments' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {language === 'ar' ? 'الشحنات والحاويات المرتبطة بهذا المورد' : 'Shipments Linked to Supplier'}
          </h3>

          <div className="space-y-3">
            {supplierShipments.map((sh) => (
              <div
                key={sh.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                    {sh.containerNumber} ({sh.containerType})
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                    {sh.status}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  <p>🚢 {sh.shippingLine} • {sh.portOfLoading} ➔ {sh.portOfDischarge}</p>
                  <p className="mt-0.5">B/L: {sh.billOfLadingNumber} • ETA: {sh.eta}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: COMMUNICATION TIMELINE */}
      {activeTab === 'communication' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'ar' ? 'سجل المحادثات والتواصل الزمني (Timeline)' : 'Communication History Timeline'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'ar' ? 'توثيق المكالمات، رسائل ويشات، واجتماعات التفاوض' : 'Track WeChat chats, calls, and negotiation meetings'}
              </p>
            </div>

            <button
              onClick={() => setIsAddLogModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'تسجيل محضر تواصل' : 'Log Communication'}</span>
            </button>
          </div>

          {/* Timeline Stack */}
          <div className="relative border-s-2 border-slate-200 dark:border-slate-800 ms-3 space-y-6 py-2">
            {supplierLogs.map((log) => (
              <div key={log.id} className="relative ps-6">
                {/* Dot */}
                <div className="absolute -start-[9px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900" />

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{log.subject}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {log.channel}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{log.date}</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {log.summary}
                  </p>

                  {(log.nextAction || log.nextFollowUpDate) && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] text-xs flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>🎯 {language === 'ar' ? 'الإجراء القادم:' : 'Next Action:'} {log.nextAction}</span>
                      {log.nextFollowUpDate && (
                        <span className="text-amber-600 font-medium">
                          📅 {language === 'ar' ? 'المتابعة القادمة:' : 'Follow-up:'} {log.nextFollowUpDate}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span>{language === 'ar' ? 'الشخص المستهدف:' : 'Contact:'} {log.contactName}</span>
                    <span>{language === 'ar' ? 'مسؤول المتابعة:' : 'Assigned:'} {log.assignedTo}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: RATING & SCORECARD */}
      {activeTab === 'rating' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{language === 'ar' ? 'بطاقة تقييم المورد المعتمدة (10 معايير)' : 'Supplier Scorecard (10 Criteria)'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'ar' ? 'تقييم شامل وموضوعي لجودة التصنيع والأسعار والالتزام' : 'Objective multi-factor evaluation'}
              </p>
            </div>

            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/60 px-4 py-2 rounded-2xl border border-amber-200 dark:border-amber-800">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{language === 'ar' ? 'المجموع الكلي:' : 'Overall:'}</span>
              <span className="text-lg font-black text-amber-600">★ {supplier.rating.overallScore} / 5.0</span>
            </div>
          </div>

          {/* 10 Criteria Sliders / Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'productQuality', ar: 'جودة المنتجات والمواد الخام', en: 'Product Quality' },
              { key: 'priceCompetitiveness', ar: 'تنافسية الأسعار والهوامش', en: 'Price Competitiveness' },
              { key: 'responseTime', ar: 'سرعة الاستجابة والرد', en: 'Response Speed' },
              { key: 'deliveryTimeliness', ar: 'الالتزام بمواعيد التصنيع', en: 'Delivery Timeliness' },
              { key: 'packagingQuality', ar: 'جودة التغليف وحماية الشحن', en: 'Packaging Quality' },
              { key: 'specAccuracy', ar: 'دقة المواصفات الفنية', en: 'Spec Accuracy' },
              { key: 'negotiationFlexibility', ar: 'مرونة التفاوض والحد الأدنى MOQ', en: 'Negotiation Flexibility' },
              { key: 'communicationQuality', ar: 'جودة التواصل واللغة', en: 'Communication Quality' },
              { key: 'punctuality', ar: 'الانضباط بالمواعيد', en: 'Punctuality' },
              { key: 'problemSolving', ar: 'سرعة معالجة المشكلات والعيوب', en: 'Problem Solving' },
            ].map((crit) => {
              const val = (supplier.rating as any)[crit.key] || 4;
              return (
                <div key={crit.key} className="p-3 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {language === 'ar' ? crit.ar : crit.en}
                    </span>
                    <span className="font-bold text-amber-500">★ {val} / 5</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${(val / 5) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {supplier.rating.notes && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {language === 'ar' ? 'ملاحظات وتجربة الفريق مع هذا المصنع:' : 'Team Evaluation Notes:'}
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{supplier.rating.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Modal: Add / Edit Contact Person */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1e1e1e] shrink-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>
                  {editingContactId
                    ? language === 'ar'
                      ? 'تعديل بيانات جهة الاتصال'
                      : 'Edit Contact Person'
                    : language === 'ar'
                    ? 'إضافة جهة اتصال جديدة للمصنع'
                    : 'Add New Contact Person'}
                </span>
              </h3>
              <button 
                onClick={() => setIsContactModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Photo Upload Section */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-blue-500/30 bg-slate-200 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                    {contactForm.avatar ? (
                      <img src={contactForm.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-7 h-7 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {language === 'ar' ? 'صورة الشخص' : 'Contact Photo'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {language === 'ar' ? 'ارفع صورة شخصية مباشرة من حاسوبك' : 'Upload portrait image directly from device'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => contactFileInputRef.current?.click()}
                    disabled={isUploadingContactImage}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 hover:border-blue-500 shadow-xs cursor-pointer"
                  >
                    {isUploadingContactImage ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{language === 'ar' ? 'رفع من الجهاز' : 'Upload Photo'}</span>
                  </button>
                  {contactForm.avatar && (
                    <button
                      type="button"
                      onClick={() => setContactForm((prev) => ({ ...prev, avatar: '' }))}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title={language === 'ar' ? 'حذف الصورة' : 'Remove Photo'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <input
                    type="file"
                    ref={contactFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleContactFileUpload}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'الاسم الكامل بالإنجليزية *' : 'Full Name (English) *'}
                </label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="e.g. Li Na (Lily Li)"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'الاسم بالصينية' : 'Chinese Name'}
                </label>
                <input
                  type="text"
                  value={contactForm.chineseName}
                  onChange={(e) => setContactForm({ ...contactForm, chineseName: e.target.value })}
                  placeholder="e.g. 李娜"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}
                  </label>
                  <input
                    type="text"
                    value={contactForm.position}
                    onChange={(e) => setContactForm({ ...contactForm, position: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'القسم' : 'Department'}
                  </label>
                  <input
                    type="text"
                    value={contactForm.department}
                    onChange={(e) => setContactForm({ ...contactForm, department: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'رقم الهاتف / واتساب *' : 'Phone / WhatsApp *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value, whatsapp: e.target.value })}
                    placeholder="+86 138..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">WeChat ID</label>
                  <input
                    type="text"
                    value={contactForm.wechatId}
                    onChange={(e) => setContactForm({ ...contactForm, wechatId: e.target.value })}
                    placeholder="wechat_id"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="lily@factory.com"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'ملاحظات إضافية' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  value={contactForm.notes}
                  onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                  placeholder="ملاحظات حول طريقة التواصل، ساعات العمل، مستوى الإنجليزية..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPrimaryContact"
                  checked={contactForm.isPrimary}
                  onChange={(e) => setContactForm({ ...contactForm, isPrimary: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <label htmlFor="isPrimaryContact" className="text-slate-700 dark:text-slate-300 font-medium">
                  {language === 'ar' ? 'تعيين كجهة اتصال رئيسية (Primary Contact)' : 'Set as primary contact person'}
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                >
                  {editingContactId
                    ? language === 'ar'
                      ? 'حفظ التعديلات'
                      : 'Update Contact'
                    : language === 'ar'
                    ? 'إضافة الشخص'
                    : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Communication Log */}
      {isAddLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1e1e1e]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'ar' ? 'تسجيل محضر محادثة أو تواصل' : 'Log Communication Entry'}
              </h3>
              <button onClick={() => setIsAddLogModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateLog} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'قناة التواصل' : 'Channel'}
                  </label>
                  <select
                    value={newLog.channel}
                    onChange={(e) => setNewLog({ ...newLog, channel: e.target.value as CommunicationChannel })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="wechat">WeChat</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="call">Phone Call</option>
                    <option value="meeting">Video Meeting</option>
                    <option value="factory_visit">Factory Visit</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'التاريخ' : 'Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={newLog.date}
                    onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'موضوع التواصل *' : 'Subject *'}
                </label>
                <input
                  type="text"
                  required
                  value={newLog.subject}
                  onChange={(e) => setNewLog({ ...newLog, subject: e.target.value })}
                  placeholder="مفاوضات تخفيض الأسعار، شروط الدفع، موعد الشحن..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'ملخص المحادثة والاتفاق' : 'Summary & Notes'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={newLog.summary}
                  onChange={(e) => setNewLog({ ...newLog, summary: e.target.value })}
                  placeholder="تم الاتفاق مع المورد على..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'الإجراء القادم (Next Action)' : 'Next Action'}
                  </label>
                  <input
                    type="text"
                    value={newLog.nextAction}
                    onChange={(e) => setNewLog({ ...newLog, nextAction: e.target.value })}
                    placeholder="تحويل الدفعة، إرسال العقد..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'تاريخ المتابعة القادمة' : 'Follow-up Date'}
                  </label>
                  <input
                    type="date"
                    value={newLog.nextFollowUpDate}
                    onChange={(e) => setNewLog({ ...newLog, nextFollowUpDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 rounded-xl"
                >
                  {language === 'ar' ? 'حفظ المحضر' : 'Save Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product For This Supplier Modal */}
      {isAddSupplierProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-2xl my-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <span>
                  {language === 'ar'
                    ? `إضافة منتج جديد للمورد (${supplier.nameEn})`
                    : `Add Product for Supplier (${supplier.nameEn})`}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSupplierProductOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplierProduct} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'التصنيف *' : 'Category *'}
                  </label>
                  <select
                    value={supplierProductForm.category}
                    onChange={(e) => setSupplierProductForm({ ...supplierProductForm, category: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
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
                    {language === 'ar' ? 'رقم الموديل *' : 'Model Number *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierProductForm.modelNumber}
                    onChange={(e) => setSupplierProductForm({ ...supplierProductForm, modelNumber: e.target.value })}
                    placeholder="e.g. ORI-880-PRO"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'العلامة التجارية' : 'Brand'}
                  </label>
                  <input
                    type="text"
                    value={supplierProductForm.brand}
                    onChange={(e) => setSupplierProductForm({ ...supplierProductForm, brand: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'اسم المنتج بالعربية *' : 'Product Name (Arabic) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierProductForm.nameAr}
                    onChange={(e) => setSupplierProductForm({ ...supplierProductForm, nameAr: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'اسم المنتج بالإنجليزية' : 'Product Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={supplierProductForm.nameEn}
                    onChange={(e) => setSupplierProductForm({ ...supplierProductForm, nameEn: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'اسم المنتج بالصينية (中文)' : 'Product Name (Chinese)'}
                  </label>
                  <input
                    type="text"
                    value={supplierProductForm.nameCn}
                    onChange={(e) => setSupplierProductForm({ ...supplierProductForm, nameCn: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'التصنيف الفرعي' : 'Sub-Category'}
                  </label>
                  <input
                    type="text"
                    value={supplierProductForm.subCategory}
                    onChange={(e) => setSupplierProductForm({ ...supplierProductForm, subCategory: e.target.value })}
                    placeholder="e.g. Side by Side Inverter"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'رابط الصورة' : 'Image URL'}
                  </label>
                  <input
                    type="text"
                    value={supplierProductForm.imageUrl}
                    onChange={(e) => setSupplierProductForm({ ...supplierProductForm, imageUrl: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'الوصف' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={supplierProductForm.descriptionAr}
                  onChange={(e) => setSupplierProductForm({ ...supplierProductForm, descriptionAr: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierProductOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                >
                  {language === 'ar' ? 'إضافة المنتج للمورد' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Supplier Modal */}
      <ConfirmDeleteModal
        isOpen={isConfirmDeleteSupplierOpen}
        onClose={() => setIsConfirmDeleteSupplierOpen(false)}
        onConfirm={() => {
          const deleted = deleteSupplier(supplier.id, true);
          if (deleted) {
            setIsConfirmDeleteSupplierOpen(false);
            setActiveView('suppliers');
          }
        }}
        title={language === 'ar' ? 'تأكيد حذف المورد' : 'Confirm Delete Supplier'}
        message={
          language === 'ar'
            ? `هل أنت متأكد من رغبتك في حذف المورد (${supplier.nameEn}) نهائياً؟\nسيتم إزالة بيانات المصنع، وجهات الاتصال، وسجلات المراسلات فوراً.`
            : `Are you sure you want to permanently delete (${supplier.nameEn})? All associated contacts and records will be deleted.`
        }
        confirmText={language === 'ar' ? 'نعم، احذف المورد' : 'Yes, Delete Supplier'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
      />

      {/* Delete Contact Modal */}
      <ConfirmDeleteModal
        isOpen={!!contactToDelete}
        onClose={() => setContactToDelete(null)}
        onConfirm={() => {
          if (contactToDelete) {
            deleteContact(contactToDelete.id);
            setContactToDelete(null);
          }
        }}
        title={language === 'ar' ? 'تأكيد حذف جهة الاتصال' : 'Confirm Delete Contact'}
        message={
          language === 'ar'
            ? `هل أنت متأكد من رغبتك في حذف جهة الاتصال (${contactToDelete?.name})؟`
            : `Are you sure you want to delete contact (${contactToDelete?.name})?`
        }
        confirmText={language === 'ar' ? 'نعم، حذف' : 'Delete'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
      />
    </div>
  );
};
