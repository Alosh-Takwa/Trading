import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { 
  Search, 
  Cloud, 
  CloudOff, 
  Sun, 
  Moon, 
  Languages, 
  ShieldCheck, 
  Menu, 
  Check, 
  ChevronDown,
  LogOut,
  User as UserIcon,
  RefreshCw,
} from 'lucide-react';
import { UserRole } from '../types/erp';

interface NavbarProps {
  onOpenDriveModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const {
    language,
    setLanguage,
    theme,
    setTheme,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    setGlobalSearchOpen,
    isDriveConnected,
    googleUser,
    activeRole,
    setActiveRole,
    currentUser,
    connectGoogleDrive,
    isDriveSyncing,
    lastFullDriveSync,
    hasPendingDriveChanges,
    syncAllToGoogleDrive,
    setActiveView,
    logout,
    settings,
  } = useERP();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const platformName = settings.platformName || 'SinoTrack ERP';
  const platformSubtitle = language === 'ar'
    ? (settings.platformSubtitleAr || 'إدارة الموردين والاستيراد من الصين')
    : (settings.platformSubtitleEn || 'China Sourcing & Logistics ERP');
  const platformLogo = settings.platformLogoUrl;

  const rolesList: { id: UserRole; titleAr: string; titleEn: string }[] = [
    { id: 'super_admin', titleAr: 'مدير عام النظام (Super Admin)', titleEn: 'Super Admin' },
    { id: 'procurement_manager', titleAr: 'مدير المشتريات (Procurement)', titleEn: 'Procurement Manager' },
    { id: 'finance', titleAr: 'المدير المالي (Finance)', titleEn: 'Finance Manager' },
    { id: 'shipping_manager', titleAr: 'مدير الشحن واللوجستيات', titleEn: 'Shipping Manager' },
    { id: 'viewer', titleAr: 'مستعرض فقط (Viewer)', titleEn: 'Read-only Viewer' },
  ];

  const formatLastSync = (iso: string | null): string => {
    if (!iso) return language === 'ar' ? 'لم تتم المزامنة' : 'Not synced';
    try {
      const date = new Date(iso);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return language === 'ar' ? 'الآن' : 'Just now';
      if (diffMins === 1) return language === 'ar' ? 'منذ دقيقة' : '1m ago';
      if (diffMins < 60) return language === 'ar' ? `منذ ${diffMins} د` : `${diffMins}m ago`;
      return date.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const currentRoleObj = rolesList.find((r) => r.id === activeRole) || rolesList[0];

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left section: menu toggle & app brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          {platformLogo ? (
            <img
              src={platformLogo}
              alt={platformName}
              className="w-8 h-8 rounded-lg object-cover ring-2 ring-[#4393ab]/20 shadow-sm"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#4393ab] flex items-center justify-center text-white shadow-sm font-bold text-xs tracking-tight ring-2 ring-[#4393ab]/20">
              {platformName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-black dark:text-white leading-none flex items-center gap-1.5">
              <span>{platformName}</span>
            </h1>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
              {platformSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Center: Global Search Bar Button */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-400 text-xs transition-colors shadow-inner"
        >
          <span className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <span>{language === 'ar' ? 'البحث الشامل في الموردين، المنتجات، الموديلات، الطلبيات...' : 'Search suppliers, products, models, POs...'}</span>
          </span>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-500 dark:text-slate-300 font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Mobile Search Button */}
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Cloud Database Status & Sync Controls */}
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-2xs"
            title={language === 'ar' ? 'قاعدة البيانات السحابية الحقيقية: متصلة ومحفوظة بنجاح' : 'Cloud Database (Firestore): Online & Synced'}
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="hidden sm:inline text-[11px]">
              {language === 'ar' ? 'قاعدة البيانات: متصلة' : 'Database: Online'}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          <button
            onClick={() => syncAllToGoogleDrive(false)}
            disabled={isDriveSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
            title={language === 'ar' ? 'حفظ فوري وتأكيد التخزين في قاعدة البيانات السحابية' : 'Save & Sync with Cloud Database'}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${isDriveSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">
              {isDriveSyncing
                ? (language === 'ar' ? 'جارٍ الحفظ...' : 'Saving...')
                : (language === 'ar' ? 'مزامنة السحابة' : 'Sync Cloud')}
            </span>
          </button>
        </div>

        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
            aria-label="Switch User Role"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden xl:inline">{language === 'ar' ? currentRoleObj.titleAr.split(' ')[0] : currentRoleObj.titleEn}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute end-0 mt-1.5 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-1.5 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                {language === 'ar' ? 'تبديل دور المستخدم الحالي' : 'Active User Role (RBAC)'}
              </div>
              {rolesList.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setActiveRole(r.id);
                    setRoleMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-start transition-colors ${
                    activeRole === r.id
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{language === 'ar' ? r.titleAr : r.titleEn}</span>
                  {activeRole === r.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Language Switcher */}
        <button
          onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1"
          aria-label="Toggle Language"
        >
          <Languages className="w-4 h-4" />
          <span className="text-xs uppercase">{language === 'ar' ? 'EN' : 'عربي'}</span>
        </button>

        {/* Dark / Light Toggle */}
        <button
          id="theme-toggle-btn"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition-all flex items-center justify-center shadow-xs"
          aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          title={language === 'ar' ? (theme === 'light' ? 'تفعيل الوضع الداكن (#161616)' : 'تفعيل الوضع الفاتح') : (theme === 'light' ? 'Switch to Dark Mode (#161616)' : 'Switch to Light Mode')}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-slate-700 hover:text-black transition-colors" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300 transition-colors" />
          )}
        </button>

        {/* User Profile & Menu */}
        <div className="relative">
          <button
            id="navbar-user-btn"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 pe-2 rounded-xl border border-slate-200/60 dark:border-[#2b2b2b] hover:bg-slate-100 dark:hover:bg-[#252525] transition-all group"
            title={language === 'ar' ? 'إدارة حسابي وقائمة المستخدم' : 'My Account & User Menu'}
            aria-label="User Menu"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#4393ab] transition-all"
            />
            <span className="hidden xl:inline text-xs font-bold text-black dark:text-white max-w-[100px] truncate">
              {currentUser.name.split(' ')[0]}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute end-0 mt-2 w-72 rounded-2xl border border-slate-200 dark:border-[#2b2b2b] bg-white dark:bg-[#1d1d1d] shadow-2xl py-2 z-50 animate-fade-in text-start">
              {/* User summary header */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-[#2b2b2b]">
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-[#4393ab]"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-black dark:text-white truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {currentUser.email}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#4393ab]/10 text-[#4393ab] border border-[#4393ab]/20">
                      {currentUser.jobTitle || currentUser.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setActiveView('account');
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#282828] transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-[#4393ab]" />
                  <span>{language === 'ar' ? 'إدارة الحساب والمستخدمين' : 'Manage Account & Team'}</span>
                </button>
              </div>

              {/* Logout Option in Dropdown */}
              <div className="pt-1 border-t border-slate-100 dark:border-[#2b2b2b]">
                <button
                  id="dropdown-logout-btn"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>{language === 'ar' ? 'تسجيل الخروج من المنظومة' : 'Sign Out of System'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Direct Logout Icon Button */}
        <button
          id="navbar-logout-btn"
          onClick={logout}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          title={language === 'ar' ? 'تسجيل الخروج' : 'Log Out'}
          aria-label="Log Out"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span className="hidden lg:inline">{language === 'ar' ? 'خروج' : 'Logout'}</span>
        </button>
      </div>
    </header>
  );
};
