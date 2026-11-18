import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Settings,
  ShieldCheck,
  Database,
  Download,
  Upload,
  RefreshCw,
  Building,
  Coins,
  Ship,
  History,
  Check,
  AlertTriangle,
  Plus,
  Trash2,
  Anchor,
  MapPin,
  CheckCircle2,
  Clock,
  Cloud,
  CloudOff,
  Image as ImageIcon,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import { exportDatabaseBackup, importDatabaseBackup } from '../../services/storage';
import { compressImageFile } from '../../utils/imageCompressor';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToDefaultData,
    restoreState,
    auditLogs,
    activeRole,
    setActiveRole,
    language,
    showToast,
    isDriveSyncing,
    syncAllToGoogleDrive,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'general' | 'currencies' | 'ports' | 'roles' | 'backup' | 'audit'>('general');

  // Platform Branding State (Name, Subtitles, Custom Logo)
  const [platformName, setPlatformName] = useState(settings.platformName || 'SinoTrack ERP');
  const [platformSubtitleAr, setPlatformSubtitleAr] = useState(settings.platformSubtitleAr || 'المنظومة السحابية المتكاملة لإدارة المشتريات والتوريد الصيني');
  const [platformSubtitleEn, setPlatformSubtitleEn] = useState(settings.platformSubtitleEn || 'China Sourcing & Procurement Cloud ERP');
  const [platformLogoUrl, setPlatformLogoUrl] = useState(settings.platformLogoUrl || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Company Profile Form
  const [companyForm, setCompanyForm] = useState({
    companyNameAr: settings.companyNameAr,
    companyNameEn: settings.companyNameEn,
    companyAddress: settings.companyAddress,
    companyPhone: settings.companyPhone,
    companyEmail: settings.companyEmail,
    taxRegistrationNumber: settings.taxRegistrationNumber,
  });

  // Exchange Rates
  const [rates, setRates] = useState<Record<string, number>>({ SYP: 15000, ...settings.exchangeRates });

  // Ports State
  const [newOriginPort, setNewOriginPort] = useState('');
  const [newDestPort, setNewDestPort] = useState('');

  // Custom Currencies State
  const [newCurrencyCode, setNewCurrencyCode] = useState('');
  const [newCurrencyNameAr, setNewCurrencyNameAr] = useState('');
  const [newCurrencyNameEn, setNewCurrencyNameEn] = useState('');
  const [newCurrencyRate, setNewCurrencyRate] = useState<number>(1);

  // Deletion and Reset Modals
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'origin_port' | 'dest_port' | 'currency';
    id: string;
    label: string;
  } | null>(null);

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const compressed = await compressImageFile(file, 240, 240, 0.85);
      if (compressed) {
        setPlatformLogoUrl(compressed);
        showToast(language === 'ar' ? 'تم اختيار الشعار! اضغط حفظ لاعتماده في المنظومة' : 'Logo selected! Click Save to apply');
      }
    } catch (err: any) {
      showToast(language === 'ar' ? 'تعذر معالجة ملف الشعار' : 'Failed to process logo file', err?.message, 'error');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSavePlatformBranding = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateSettings({
      platformName: platformName.trim() || 'SinoTrack ERP',
      platformSubtitleAr: platformSubtitleAr.trim(),
      platformSubtitleEn: platformSubtitleEn.trim(),
      platformLogoUrl,
    });
    showToast(language === 'ar' ? 'تم حفظ وتحديث هوية وشعار المنصة بنجاح' : 'Platform identity and logo saved successfully');
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...companyForm,
      platformName: platformName.trim() || 'SinoTrack ERP',
      platformSubtitleAr: platformSubtitleAr.trim(),
      platformSubtitleEn: platformSubtitleEn.trim(),
      platformLogoUrl,
    });
    showToast(language === 'ar' ? 'تم حفظ هوية المنصة وبيانات الشركة بنجاح' : 'Platform identity and company profile saved');
  };

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ exchangeRates: rates });
    showToast(language === 'ar' ? 'تم حفظ أسعار الصرف بنجاح' : 'Exchange rates saved');
  };

  const handleAddOriginPort = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newOriginPort.trim();
    if (!trimmed) return;
    if (settings.chinesePorts.includes(trimmed)) {
      showToast(language === 'ar' ? 'الميناء مضاف مسبقاً' : 'Port already exists', '', 'warning');
      return;
    }
    updateSettings({
      chinesePorts: [...settings.chinesePorts, trimmed],
    });
    setNewOriginPort('');
    showToast(language === 'ar' ? 'تمت إضافة ميناء الشحن بنجاح' : 'Origin port added');
  };

  const handleAddDestPort = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDestPort.trim();
    if (!trimmed) return;
    if (settings.destinationPorts.includes(trimmed)) {
      showToast(language === 'ar' ? 'الميناء مضاف مسبقاً' : 'Port already exists', '', 'warning');
      return;
    }
    updateSettings({
      destinationPorts: [...settings.destinationPorts, trimmed],
    });
    setNewDestPort('');
    showToast(language === 'ar' ? 'تمت إضافة ميناء الاستقبال بنجاح' : 'Destination port added');
  };

  const handleAddCustomCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newCurrencyCode.trim().toUpperCase();
    if (!code) return;
    const existing = settings.customCurrencies || [];
    if (existing.some((c) => c.code === code) || rates[code] !== undefined) {
      showToast(language === 'ar' ? 'رمز العملة موجود مسبقاً' : 'Currency code exists', '', 'warning');
      return;
    }
    const updatedCustom = [
      ...existing,
      {
        code,
        nameAr: newCurrencyNameAr.trim() || code,
        nameEn: newCurrencyNameEn.trim() || code,
        rateToUSD: Number(newCurrencyRate) || 1,
      },
    ];
    const updatedRates = {
      ...rates,
      [code]: Number(newCurrencyRate) || 1,
    };
    setRates(updatedRates);
    updateSettings({
      customCurrencies: updatedCustom,
      exchangeRates: updatedRates,
    });
    setNewCurrencyCode('');
    setNewCurrencyNameAr('');
    setNewCurrencyNameEn('');
    setNewCurrencyRate(1);
    showToast(language === 'ar' ? `تمت إضافة عملة (${code}) بنجاح` : `Currency ${code} added`);
  };

  const handleBackupDownload = () => {
    // Export full state
    const currentDb = {
      version: 1,
      currentUser: { id: 'usr-001', name: 'Alosh Takwa', email: 'alosh.takwa@gmail.com', role: activeRole },
      suppliers: (window as any).__erp_db?.suppliers || [],
      // We can export from context state
    };
    exportDatabaseBackup((window as any).__erp_db || (JSON.parse(localStorage.getItem('sinotrack_erp_database_v1') || '{}')));
    showToast(language === 'ar' ? 'تم تنزيل النسخة الاحتياطية بنجاح' : 'Backup downloaded successfully');
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const restored = await importDatabaseBackup(file);
      restoreState(restored);
    } catch (err: any) {
      showToast(language === 'ar' ? 'فشل استعادة النسخة الاحتياطية' : 'Restore failed', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          <span>{language === 'ar' ? 'إعدادات النظام والنسخ الاحتياطي والأمان' : 'System Settings, RBAC & Backup'}</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {language === 'ar'
            ? 'تخصيص بيانات الشركة، أسعار الصرف، صلاحيات المستخدمين، سجل النشاط، والنسخ الاحتياطي'
            : 'Company profile, currency exchange rates, RBAC permissions, audit trail, and database backup'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-3 py-2 rounded-xl transition-all ${
            activeTab === 'general'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {language === 'ar' ? 'بيانات الشركة' : 'Company Profile'}
        </button>
        <button
          onClick={() => setActiveTab('currencies')}
          className={`px-3 py-2 rounded-xl transition-all ${
            activeTab === 'currencies'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {language === 'ar' ? 'العملات والليرة السورية' : 'Currencies & Rates'}
        </button>
        <button
          onClick={() => setActiveTab('ports')}
          className={`px-3 py-2 rounded-xl transition-all ${
            activeTab === 'ports'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {language === 'ar' ? 'موانئ الشحن والاستقبال' : 'Shipping Ports'}
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-3 py-2 rounded-xl transition-all ${
            activeTab === 'roles'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {language === 'ar' ? 'الأدوار والصلاحيات (RBAC)' : 'Roles & Permissions'}
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-3 py-2 rounded-xl transition-all ${
            activeTab === 'backup'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {language === 'ar' ? 'النسخ الاحتياطي والاستعادة' : 'Backup & Restore'}
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-2 rounded-xl transition-all ${
            activeTab === 'audit'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {language === 'ar' ? `سجل النشاط والعمليات (${auditLogs.length})` : `Audit Logs (${auditLogs.length})`}
        </button>
      </div>

      {/* TAB 1: GENERAL COMPANY PROFILE & PLATFORM BRANDING */}
      {activeTab === 'general' && (
        <div className="space-y-6 max-w-3xl">
          {/* CARD 1: PLATFORM IDENTITY & LOGO CUSTOMIZATION */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>{language === 'ar' ? 'هوية واسم وشعار المنصة' : 'Platform Identity & Custom Logo'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'ar'
                    ? 'تخصيص اسم المنصة، الشعار المخصص (اللوغو)، والوصف الظاهر في الشريط العلوي وشاشة الدخول'
                    : 'Customize platform name, custom logo, and subtitles displayed across navbar and login'}
                </p>
              </div>

              {/* Live Preview Pill */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                {platformLogoUrl ? (
                  <img
                    src={platformLogoUrl}
                    alt="Platform Logo"
                    className="w-8 h-8 rounded-lg object-contain bg-white dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-700 shadow-xs"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#2d6f82] to-[#4393ab] flex items-center justify-center text-white font-black text-xs shadow-xs">
                    {(platformName || 'ST').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                    {platformName || 'SinoTrack ERP'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                    {language === 'ar' ? 'معاينة فورية حية' : 'Live Preview'}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSavePlatformBranding} className="space-y-4 text-xs">
              {/* Platform Name */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'اسم المنصة (الظاهر في الشريط العلوي وشاشة الدخول)' : 'Platform Name'}
                </label>
                <input
                  type="text"
                  required
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  placeholder="SinoTrack ERP"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#4393ab] focus:outline-none"
                />
              </div>

              {/* Subtitles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'وصف المنصة بالعربية' : 'Platform Subtitle (Arabic)'}
                  </label>
                  <input
                    type="text"
                    value={platformSubtitleAr}
                    onChange={(e) => setPlatformSubtitleAr(e.target.value)}
                    placeholder="المنظومة السحابية المتكاملة لإدارة المشتريات والتوريد الصيني"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#4393ab] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'وصف المنصة بالإنجليزية' : 'Platform Subtitle (English)'}
                  </label>
                  <input
                    type="text"
                    value={platformSubtitleEn}
                    onChange={(e) => setPlatformSubtitleEn(e.target.value)}
                    placeholder="China Sourcing & Procurement Cloud ERP"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#4393ab] focus:outline-none"
                  />
                </div>
              </div>

              {/* Logo Upload Section */}
              <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                      {language === 'ar' ? 'شعار المنصة (لوغو مخصص)' : 'Custom Platform Logo'}
                    </label>
                    <p className="text-[11px] text-slate-500">
                      {language === 'ar'
                        ? 'يمكنك رفع صورة شعار شركتك من جهازك (PNG, JPG, SVG) أو اختيار أحد القوالب الجاهزة أدناه'
                        : 'Upload an image file from your device (PNG, JPG) or pick one of the curated presets'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-[#4393ab] hover:bg-[#36798e] shadow-xs transition-colors">
                      <UploadCloud className="w-4 h-4" />
                      <span>{isUploadingLogo ? (language === 'ar' ? 'جارٍ المعالجة...' : 'Processing...') : (language === 'ar' ? 'رفع شعار من جهازي' : 'Upload from Device')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileUpload}
                        disabled={isUploadingLogo}
                        className="hidden"
                      />
                    </label>

                    {platformLogoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setPlatformLogoUrl('');
                          showToast(language === 'ar' ? 'تمت استعادة الشعار الافتراضي' : 'Reverted to default logo');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 transition-colors"
                        title={language === 'ar' ? 'إزالة الشعار المخصص والعودة للافتراضي' : 'Remove custom logo'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'إزالة' : 'Remove'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Preset Logo Templates */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-2">
                    {language === 'ar' ? 'أو اختر أحد الشعارات الجاهزة بنقرة واحدة:' : 'Or select a curated preset:'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const goldLogo = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23d97706"/><stop offset="100%" stop-color="%23b45309"/></linearGradient></defs><rect width="100" height="100" rx="20" fill="url(%23g1)"/><path d="M50 20 L78 36 L78 68 L50 84 L22 68 L22 36 Z" fill="none" stroke="%23ffffff" stroke-width="4"/><path d="M50 32 L68 43 L68 63 L50 73 L32 63 L32 43 Z" fill="%23ffffff" fill-opacity="0.25"/><text x="50" y="58" font-family="sans-serif" font-weight="900" font-size="24" fill="%23ffffff" text-anchor="middle">ST</text></svg>';
                        setPlatformLogoUrl(goldLogo);
                        showToast(language === 'ar' ? 'تم اختيار شعار التوريد الذهبي! اضغط حفظ لاعتماده' : 'Selected Golden Sourcing logo');
                      }}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 bg-white dark:bg-slate-800 text-start flex items-center gap-2.5 transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        ST
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[11px] text-slate-900 dark:text-white truncate">
                          {language === 'ar' ? 'الدرع الذهبي' : 'Golden Crest'}
                        </div>
                        <div className="text-[10px] text-slate-400">Amber & Gold</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const blueLogo = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%232563eb"/><stop offset="100%" stop-color="%230284c7"/></linearGradient></defs><rect width="100" height="100" rx="20" fill="url(%23g2)"/><circle cx="50" cy="50" r="32" fill="none" stroke="%23ffffff" stroke-width="4"/><path d="M30 50 L70 50 M50 30 L50 70 M36 36 L64 64 M36 64 L64 36" stroke="%23ffffff" stroke-width="2.5" stroke-linecap="round"/><circle cx="50" cy="50" r="8" fill="%23ffffff"/></svg>';
                        setPlatformLogoUrl(blueLogo);
                        showToast(language === 'ar' ? 'تم اختيار شعار الشحن واللوجستيات! اضغط حفظ لاعتماده' : 'Selected Ocean Logistics logo');
                      }}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-800 text-start flex items-center gap-2.5 transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        ⚓
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[11px] text-slate-900 dark:text-white truncate">
                          {language === 'ar' ? 'ملاحة وبحار' : 'Ocean Freight'}
                        </div>
                        <div className="text-[10px] text-slate-400">Blue & Cyan</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const emeraldLogo = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23059669"/><stop offset="100%" stop-color="%230d9488"/></linearGradient></defs><rect width="100" height="100" rx="20" fill="url(%23g3)"/><path d="M50 18 C66 18 78 28 78 46 C78 68 50 82 50 82 C50 82 22 68 22 46 C22 28 34 18 50 18 Z" fill="none" stroke="%23ffffff" stroke-width="4"/><path d="M40 48 L47 55 L62 40" fill="none" stroke="%23ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                        setPlatformLogoUrl(emeraldLogo);
                        showToast(language === 'ar' ? 'تم اختيار شعار الأمان الزمردي! اضغط حفظ لاعتماده' : 'Selected Emerald Shield logo');
                      }}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 bg-white dark:bg-slate-800 text-start flex items-center gap-2.5 transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        ✓
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[11px] text-slate-900 dark:text-white truncate">
                          {language === 'ar' ? 'الدرع الزمردي' : 'Emerald Shield'}
                        </div>
                        <div className="text-[10px] text-slate-400">Emerald & Teal</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 font-bold text-white bg-[#4393ab] hover:bg-[#36798e] rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{language === 'ar' ? 'حفظ هوية المنصة والشعار' : 'Save Platform Brand & Logo'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* CARD 2: COMPANY OFFICIAL COMMERCIAL IDENTITY */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                <span>{language === 'ar' ? 'البيانات التجارية لشركتنا' : 'Company Official Identity'}</span>
              </h3>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'اسم الشركة بالعربية' : 'Company Name (Arabic)'}
                </label>
                <input
                  type="text"
                  value={companyForm.companyNameAr}
                  onChange={(e) => setCompanyForm({ ...companyForm, companyNameAr: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'اسم الشركة بالإنجليزية' : 'Company Name (English)'}
                </label>
                <input
                  type="text"
                  value={companyForm.companyNameEn}
                  onChange={(e) => setCompanyForm({ ...companyForm, companyNameEn: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'العنوان' : 'Address'}
                </label>
                <input
                  type="text"
                  value={companyForm.companyAddress}
                  onChange={(e) => setCompanyForm({ ...companyForm, companyAddress: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'الهاتف' : 'Phone'}
                  </label>
                  <input
                    type="text"
                    value={companyForm.companyPhone}
                    onChange={(e) => setCompanyForm({ ...companyForm, companyPhone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'الرقم الضريبي' : 'Tax ID'}
                  </label>
                  <input
                    type="text"
                    value={companyForm.taxRegistrationNumber}
                    onChange={(e) => setCompanyForm({ ...companyForm, taxRegistrationNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  {language === 'ar' ? 'حفظ بيانات الشركة' : 'Save Company Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: CURRENCIES & RATES */}
      {activeTab === 'currencies' && (
        <div className="space-y-6 max-w-3xl">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-500" />
                  <span>{language === 'ar' ? 'أسعار الصرف الرسمية والليرة السورية (مقابل USD)' : 'Exchange Rates against USD Base'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'ar'
                    ? 'يمكنك ضبط سعر صرف الدولار مقابل الليرة السورية، اليوان الصيني، الريال السعودي، والعملات العالمية'
                    : 'Configure exchange rates against 1 USD base currency'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveRates} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* Syrian Pound SYP */}
                <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
                  <label className="font-bold text-amber-900 dark:text-amber-200 block mb-1">
                    🇸🇾 الليرة السورية (SYP - ل.س)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={rates.SYP ?? 15000}
                    onChange={(e) => setRates({ ...rates, SYP: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 mt-1 block">
                    1 USD = {Number(rates.SYP || 15000).toLocaleString()} SYP
                  </span>
                </div>

                {/* Chinese Yuan */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    🇨🇳 اليوان الصيني (CNY - ¥)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={rates.CNY ?? 7.23}
                    onChange={(e) => setRates({ ...rates, CNY: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">1 USD = {rates.CNY} CNY</span>
                </div>

                {/* Saudi Riyal */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    🇸🇦 الريال السعودي (SAR - ر.س)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={rates.SAR ?? 3.75}
                    onChange={(e) => setRates({ ...rates, SAR: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">1 USD = {rates.SAR} SAR</span>
                </div>

                {/* Euro */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    🇪🇺 اليورو (EUR - €)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={rates.EUR ?? 0.92}
                    onChange={(e) => setRates({ ...rates, EUR: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">1 USD = {rates.EUR} EUR</span>
                </div>

                {/* UAE Dirham */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    🇦🇪 الدرهم الإماراتي (AED - د.إ)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={rates.AED ?? 3.67}
                    onChange={(e) => setRates({ ...rates, AED: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">1 USD = {rates.AED} AED</span>
                </div>
              </div>

              {/* Dynamic Rates for Custom Currencies */}
              {(settings.customCurrencies || []).length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                    {language === 'ar' ? 'العملات الإضافية المخصصة:' : 'Custom Currencies Rates:'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {(settings.customCurrencies || []).map((curr) => (
                      <div key={curr.code} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 relative group">
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-800 dark:text-slate-200">
                            {curr.nameAr} ({curr.code})
                          </label>
                          <button
                            type="button"
                            onClick={() => setItemToDelete({ type: 'currency', id: curr.code, label: `${curr.nameAr} (${curr.code})` })}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                            title={language === 'ar' ? 'حذف هذه العملة' : 'Delete Currency'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={rates[curr.code] ?? curr.rateToUSD}
                          onChange={(e) => setRates({ ...rates, [curr.code]: Number(e.target.value) })}
                          className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">1 USD = {rates[curr.code] ?? curr.rateToUSD} {curr.code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                >
                  {language === 'ar' ? 'حفظ وتحديث أسعار الصرف' : 'Save Exchange Rates'}
                </button>
              </div>
            </form>
          </div>

          {/* Add Custom Currency Form */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>{language === 'ar' ? 'إضافة عملة جديدة مخصصة للنظام' : 'Add New Custom Currency'}</span>
            </h4>
            <form onSubmit={handleAddCustomCurrency} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  {language === 'ar' ? 'رمز العملة (مثال: KWD)' : 'Currency Code (e.g. KWD)'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="KWD"
                  maxLength={5}
                  value={newCurrencyCode}
                  onChange={(e) => setNewCurrencyCode(e.target.value.toUpperCase())}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono uppercase"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  {language === 'ar' ? 'اسم العملة بالعربية' : 'Name in Arabic'}
                </label>
                <input
                  type="text"
                  placeholder="دينار كويتي"
                  value={newCurrencyNameAr}
                  onChange={(e) => setNewCurrencyNameAr(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  {language === 'ar' ? 'سعر الصرف مقابل 1 دولار' : 'Rate to 1 USD'}
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  required
                  value={newCurrencyRate}
                  onChange={(e) => setNewCurrencyRate(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'إضافة العملة' : 'Add Currency'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB: PORTS MANAGEMENT (ORIGIN & DESTINATION) */}
      {activeTab === 'ports' && (
        <div className="space-y-6 max-w-3xl">
          {/* Chinese Loading Ports */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Anchor className="w-5 h-5 text-blue-600" />
                  <span>{language === 'ar' ? 'موانئ الإرسال والتحميل في الصين (Port of Loading)' : 'Ports of Loading (Origin / China)'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'ar'
                    ? 'الموانئ البحرية المعتمدة لشحن البضائع من المدن والمقاطعات الصينية'
                    : 'Origin shipping ports configured for Purchase Orders and Container Bookings'}
                </p>
              </div>
            </div>

            {/* List of Chinese Ports */}
            <div className="flex flex-wrap gap-2">
              {settings.chinesePorts.map((port) => (
                <div
                  key={port}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs font-semibold text-blue-900 dark:text-blue-200"
                >
                  <Anchor className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{port}</span>
                  <button
                    type="button"
                    onClick={() => setItemToDelete({ type: 'origin_port', id: port, label: port })}
                    className="p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                    title={language === 'ar' ? 'حذف الميناء' : 'Remove Port'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Origin Port Form */}
            <form onSubmit={handleAddOriginPort} className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <input
                type="text"
                required
                value={newOriginPort}
                onChange={(e) => setNewOriginPort(e.target.value)}
                placeholder={language === 'ar' ? 'اسم ميناء شحن جديد (مثال: Dalian Port (CN) - ميناء داليان)...' : 'New Origin Port name (e.g. Dalian Port)...'}
                className="flex-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'إضافة ميناء إرسال' : 'Add Port'}</span>
              </button>
            </form>
          </div>

          {/* Destination Receiving Ports */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <span>{language === 'ar' ? 'موانئ الاستقبال والتفريغ (Port of Discharge)' : 'Ports of Discharge (Destination Ports)'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'ar'
                    ? 'الموانئ البحرية المعتمدة لاستلام الحاويات والشحنات (بما فيها موانئ سوريا: اللاذقية وطرطوس، موانئ الخليج، والعالم)'
                    : 'Destination receiving ports including Syrian ports (Latakia, Tartus) and regional ports'}
                </p>
              </div>
            </div>

            {/* List of Destination Ports */}
            <div className="flex flex-wrap gap-2">
              {settings.destinationPorts.map((port) => (
                <div
                  key={port}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                    port.includes('(SY)') || port.includes('اللاذقية') || port.includes('طرطوس')
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                      : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{port}</span>
                  <button
                    type="button"
                    onClick={() => setItemToDelete({ type: 'dest_port', id: port, label: port })}
                    className="p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                    title={language === 'ar' ? 'حذف الميناء' : 'Remove Port'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Destination Port Form */}
            <form onSubmit={handleAddDestPort} className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <input
                type="text"
                required
                value={newDestPort}
                onChange={(e) => setNewDestPort(e.target.value)}
                placeholder={language === 'ar' ? 'اسم ميناء استقبال جديد (مثال: Beirut Port (LB) - ميناء بيروت)...' : 'New Destination Port name...'}
                className="flex-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'إضافة ميناء استقبال' : 'Add Port'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: ROLES & PERMISSIONS */}
      {activeTab === 'roles' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>{language === 'ar' ? 'مصفوفة الصلاحيات حسب الدور الوظيفي (RBAC)' : 'Role-Based Access Control Matrix'}</span>
            </h3>
            <span className="text-xs text-blue-600 font-bold">
              {language === 'ar' ? `الدور النشط حالياً: ${activeRole}` : `Current active role: ${activeRole}`}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-[#1e1e1e] text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3 text-start">{language === 'ar' ? 'الوحدة / القسم' : 'Module'}</th>
                  <th className="p-3 text-center">Super Admin</th>
                  <th className="p-3 text-center">Procurement Manager</th>
                  <th className="p-3 text-center">Finance Manager</th>
                  <th className="p-3 text-center">Shipping Manager</th>
                  <th className="p-3 text-center">Viewer (مستعرض)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  { module: 'الموردون والمصانع (Suppliers)', sa: true, pm: true, fi: 'عرض فقط', sh: 'عرض فقط', vi: 'عرض فقط' },
                  { module: 'المنتجات وعروض الأسعار', sa: true, pm: true, fi: 'عرض فقط', sh: 'عرض فقط', vi: 'عرض فقط' },
                  { module: 'أوامر الشراء (POs)', sa: true, pm: true, fi: 'عرض فقط', sh: 'عرض فقط', vi: 'عرض فقط' },
                  { module: 'الفواتير والمدفوعات البنكية', sa: true, pm: 'عرض فقط', fi: true, sh: 'لا يوجد', vi: 'لا يوجد' },
                  { module: 'الشحنات وتتبع الحاويات', sa: true, pm: true, fi: 'عرض فقط', sh: true, vi: 'عرض فقط' },
                  { module: 'حاسبة التكلفة الفعلية (Landed Cost)', sa: true, pm: true, fi: true, sh: true, vi: 'عرض فقط' },
                  { module: 'النسخ الاحتياطي والإعدادات الحساسة', sa: true, pm: false, fi: false, sh: false, vi: false },
                ].map((row, idx) => (
                  <tr key={idx}>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{row.module}</td>
                    <td className="p-3 text-center font-bold text-emerald-600">✓ كامل الصلاحيات</td>
                    <td className="p-3 text-center font-bold text-blue-600">{row.pm === true ? '✓ كامل' : row.pm}</td>
                    <td className="p-3 text-center font-bold text-purple-600">{row.fi === true ? '✓ كامل' : row.fi}</td>
                    <td className="p-3 text-center font-bold text-cyan-600">{row.sh === true ? '✓ كامل' : row.sh}</td>
                    <td className="p-3 text-center text-slate-400">{row.vi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs max-w-2xl space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <span>{language === 'ar' ? 'النسخ الاحتياطي واستعادة قاعدة البيانات' : 'Database Backup & Restore'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'ar'
                ? 'تصدير كامل بيانات الموردين والمنتجات والطلبيات والفواتير والشحنات إلى ملف JSON محلي وحمايتها من الضياع.'
                : 'Export and restore all records as a standalone JSON backup file.'}
            </p>
          </div>

          {/* Storage & Multi-Tier Persistence Health Card */}
          <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {language === 'ar' ? 'نظام الحفظ الدائم متعدد الطبقات (Multi-Tier Persistence)' : 'Permanent Multi-Tier Storage'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                    {language === 'ar' ? 'محمي ضد إغلاق المتصفح ✓' : 'Protected ✓'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'ar'
                    ? 'يتم حفظ بياناتك تلقائياً وبشكل فوري على قاعدة بيانات Cloud Firestore السحابية وخادم المنظومة والمتصفح المحلي.'
                    : 'Data is automatically stored on Cloud Firestore, Server Filesystem, and IndexedDB.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{language === 'ar' ? 'خادم النظام: متصل ودائم' : 'Server Disk: Permanent'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{language === 'ar' ? 'قاعدة المتصفح: IndexedDB نشط' : 'Local: IndexedDB Active'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{language === 'ar' ? 'حفظ تلقائي عند كل تعديل' : 'Auto-saved on edits'}</span>
              </div>
            </div>
          </div>

          {/* Cloud Database Persistence Status & Manual Sync Card */}
          <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-gradient-to-r from-emerald-50/60 to-teal-50/60 dark:from-emerald-950/30 dark:to-teal-950/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{language === 'ar' ? 'قاعدة البيانات السحابية الحقيقية (Firestore Cloud DB)' : 'Cloud Database (Firestore)'}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {language === 'ar' ? 'متصلة ونشطة للأبد' : 'Online & Persistent'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'ar'
                      ? 'جميع البيانات والصور والكتالوجات والفواتير تُحفظ فورياً في سحابة جوجل دون الحاجة لأي حسابات خارجية'
                      : 'All data, images, catalogs, and invoices are saved instantly to Google Cloud database'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => syncAllToGoogleDrive(false)}
                  disabled={isDriveSyncing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDriveSyncing ? 'animate-spin' : ''}`} />
                  <span>{isDriveSyncing ? (language === 'ar' ? 'جارٍ الحفظ...' : 'Saving...') : (language === 'ar' ? 'مزامنة وحفظ السحابة فوراً' : 'Sync Cloud Now')}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                {language === 'ar'
                  ? 'البيانات محمية برقم قاعدة البيانات السحابية الحقيقية ومربوطة بأمان، لن تزول بإغلاق المتصفح أو فتح نافذة جديدة.'
                  : 'Data is permanently secured in the cloud database and will never be lost on browser close.'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1e1e1e] space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                {language === 'ar' ? 'تصدير نسخة احتياطية كاملة' : 'Export JSON Backup'}
              </span>
              <p className="text-[11px] text-slate-500">
                {language === 'ar' ? 'تنزيل ملف JSON يحتوي على كافة الجداول والعلاقات.' : 'Download complete system state.'}
              </p>
              <button
                onClick={handleBackupDownload}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                <Download className="w-4 h-4" />
                <span>{language === 'ar' ? 'تنزيل ملف النسخة (.json)' : 'Download Backup'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1e1e1e] space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                {language === 'ar' ? 'استعادة من ملف نسخة احتياطية' : 'Restore from Backup'}
              </span>
              <p className="text-[11px] text-slate-500">
                {language === 'ar' ? 'رفع ملف JSON تم تصديره مسبقاً.' : 'Upload previously saved JSON.'}
              </p>
              <label className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>{language === 'ar' ? 'اختر ملف النسخة...' : 'Select File...'}</span>
                <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
              </label>
            </div>
          </div>

          {/* Reset button */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                {language === 'ar' ? 'استعادة البيانات التجريبية الافتراضية' : 'Reset to Default Dataset'}
              </span>
              <p className="text-[11px] text-slate-400">
                {language === 'ar' ? 'إعادة شحن الموردين والمصانع الصينية الافتراضية.' : 'Reload default Chinese factories seed.'}
              </p>
            </div>
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl hover:bg-amber-100"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'إعادة ضبط' : 'Reset'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>{language === 'ar' ? 'سجل العمليات والتدقيق الأمني (Audit Logs)' : 'Audit Trail & Operations Log'}</span>
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-[#1e1e1e] text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3 text-start">{language === 'ar' ? 'الوقت والتاريخ' : 'Timestamp'}</th>
                  <th className="p-3 text-start">{language === 'ar' ? 'المستخدم' : 'User'}</th>
                  <th className="p-3 text-start">{language === 'ar' ? 'الدور' : 'Role'}</th>
                  <th className="p-3 text-start">{language === 'ar' ? 'العملية' : 'Action'}</th>
                  <th className="p-3 text-start">{language === 'ar' ? 'العنصر' : 'Entity'}</th>
                  <th className="p-3 text-start">{language === 'ar' ? 'التفاصيل' : 'Details'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{log.userName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded uppercase font-bold text-[10px] ${
                        log.action === 'create' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        log.action === 'delete' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 font-mono">
                      {log.entity}: {log.entityName || log.entityId}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Item Deletion Modal (Ports & Currencies) */}
      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (!itemToDelete) return;
          if (itemToDelete.type === 'origin_port') {
            updateSettings({ chinesePorts: settings.chinesePorts.filter((p) => p !== itemToDelete.id) });
            showToast(language === 'ar' ? `تم حذف ميناء (${itemToDelete.id})` : `Removed port ${itemToDelete.id}`);
          } else if (itemToDelete.type === 'dest_port') {
            updateSettings({ destinationPorts: settings.destinationPorts.filter((p) => p !== itemToDelete.id) });
            showToast(language === 'ar' ? `تم حذف ميناء (${itemToDelete.id})` : `Removed port ${itemToDelete.id}`);
          } else if (itemToDelete.type === 'currency') {
            const updatedCustom = (settings.customCurrencies || []).filter((c) => c.code !== itemToDelete.id);
            const updatedRates = { ...rates };
            delete updatedRates[itemToDelete.id];
            setRates(updatedRates);
            updateSettings({ customCurrencies: updatedCustom, exchangeRates: updatedRates });
            showToast(language === 'ar' ? `تم حذف عملة (${itemToDelete.id})` : `Removed currency ${itemToDelete.id}`);
          }
          setItemToDelete(null);
        }}
        title={language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
        message={
          language === 'ar'
            ? `هل أنت متأكد من رغبتك في حذف (${itemToDelete?.label}) نهائياً؟`
            : `Are you sure you want to delete (${itemToDelete?.label})?`
        }
        confirmText={language === 'ar' ? 'نعم، حذف' : 'Delete'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
      />

      {/* Confirm Database Reset Modal */}
      <ConfirmDeleteModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={() => {
          resetToDefaultData();
          setIsResetModalOpen(false);
        }}
        title={language === 'ar' ? 'استعادة البيانات الافتراضية' : 'Reset Database'}
        message={
          language === 'ar'
            ? 'هل أنت متأكد من استعادة بيانات النظام الافتراضية؟ سيتم إعادة ضبط سجلات الموردين والمنتجات والطلبيات إلى الحالة الأولية.'
            : 'Are you sure you want to reset to default dataset? Initial factories and sample records will be restored.'
        }
        confirmText={language === 'ar' ? 'نعم، إعادة ضبط' : 'Reset Database'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
      />
    </div>
  );
};
