/**
 * SinoTrack ERP - Enterprise Login View
 * Supports individual user credentials, Google Drive credentials sync badge,
 * quick role switching demo cards, dark/light theme, and RTL/LTR languages.
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  ShieldCheck,
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Cloud,
  CloudOff,
  Sun,
  Moon,
  Languages,
  CheckCircle2,
  AlertCircle,
  Building2,
  KeyRound,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

/**
 * Masks the domain/ending portion of an email for privacy while keeping it recognizable.
 * E.g., "alosh.takwa@gmail.com" -> "alosh.takwa@g***.com"
 * or "k.mansour@orientappliances.com" -> "k.mansour@o***.com"
 */
export const maskEmail = (emailStr: string): string => {
  if (!emailStr || !emailStr.includes('@')) return emailStr || '';
  const [localPart, domainPart] = emailStr.split('@');
  if (!domainPart) return emailStr;

  const lastDot = domainPart.lastIndexOf('.');
  if (lastDot > 0) {
    const domainName = domainPart.slice(0, lastDot);
    const domainExt = domainPart.slice(lastDot);
    const maskedDomain = domainName.length > 1 ? `${domainName[0]}***` : '***';
    return `${localPart}@${maskedDomain}${domainExt}`;
  }
  return `${localPart}@***`;
};

export const LoginView: React.FC = () => {
  const {
    login,
    users,
    language,
    setLanguage,
    theme,
    setTheme,
    settings,
  } = useERP();

  const [email, setEmail] = useState('alosh.takwa@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage(language === 'ar' ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email');
      return;
    }
    if (!password) {
      setErrorMessage(language === 'ar' ? 'يرجى إدخال كلمة المرور' : 'Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        setErrorMessage(result.error || (language === 'ar' ? 'فشل تسجيل الدخول' : 'Login failed'));
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemoUser = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#161616] text-black dark:text-white flex flex-col justify-between font-sans transition-colors duration-200">
      {/* Top Bar on Login Screen */}
      <header className="w-full px-4 sm:px-8 py-4 flex items-center justify-between border-b border-slate-200 dark:border-[#252525] bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {settings.platformLogoUrl ? (
            <img
              src={settings.platformLogoUrl}
              alt={settings.platformName || 'Platform Logo'}
              className="w-10 h-10 rounded-xl object-contain bg-white dark:bg-[#202020] p-1 border border-slate-200 dark:border-slate-700 shadow-md shadow-[#4393ab]/20"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2d6f82] to-[#4393ab] flex items-center justify-center text-white shadow-md shadow-[#4393ab]/20 font-black text-sm">
              {settings.platformName ? settings.platformName.slice(0, 2).toUpperCase() : <Building2 className="w-5 h-5" />}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-black dark:text-white">
                {settings.platformName || 'SinoTrack ERP'}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#4393ab]/10 text-[#4393ab] border border-[#4393ab]/20">
                Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              {language === 'ar'
                ? (settings.platformSubtitleAr || 'المنظومة السحابية المتكاملة لإدارة المشتريات والتوريد الصيني')
                : (settings.platformSubtitleEn || 'China Sourcing & Procurement Cloud ERP')}
            </p>
          </div>
        </div>

        {/* Controls: Cloud Database + Theme + Lang */}
        <div className="flex items-center gap-2">
          {/* Cloud Database status */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
            <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">{language === 'ar' ? 'قاعدة البيانات السحابية: متصلة' : 'Cloud Database: Online'}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-lg border border-slate-200 dark:border-[#2c2c2c] bg-white dark:bg-[#202020] hover:bg-slate-100 dark:hover:bg-[#282828] text-slate-700 dark:text-slate-200 transition-colors"
            title={language === 'ar' ? 'تبديل المظهر' : 'Toggle Theme'}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#2c2c2c] bg-white dark:bg-[#202020] hover:bg-slate-100 dark:hover:bg-[#282828] text-xs font-semibold flex items-center gap-1 transition-colors"
            aria-label="Toggle Language"
          >
            <Languages className="w-3.5 h-3.5 text-[#4393ab]" />
            <span className="uppercase">{language === 'ar' ? 'EN' : 'عربي'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 my-4">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left / Main Card: Login Form (Col 7) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#1d1d1d] rounded-2xl border border-slate-200 dark:border-[#2b2b2b] shadow-xl p-6 sm:p-8 relative overflow-hidden">
            {/* Subtle top accent highlight */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#2d6f82] via-[#4393ab] to-emerald-500"></div>

            {/* Header info */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#4393ab]/10 border border-[#4393ab]/20 text-[#4393ab] text-xs font-semibold mb-3">
                <ShieldCheck className="w-4 h-4" />
                <span>{language === 'ar' ? 'تسجيل دخول آمن مشفر' : 'Secure Enterprise Sign-In'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black dark:text-white mb-2">
                {language === 'ar' ? 'تسجيل الدخول إلى حسابك' : 'Sign in to your account'}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {language === 'ar'
                  ? 'أدخل بيانات الدخول الخاصة بك للوصول إلى لوحة المشتريات والتوريد'
                  : 'Enter your credentials to access the China procurement platform'}
              </p>
            </div>

            {/* Cloud Database Credentials Sync Banner */}
            <div className="mb-6 p-3.5 rounded-xl bg-slate-50 dark:bg-[#242424] border border-slate-200 dark:border-[#333333] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-black dark:text-white flex items-center gap-1.5">
                    <span>{language === 'ar' ? 'قاعدة البيانات السحابية:' : 'Cloud Database Storage:'}</span>
                    <span className="text-[11px] font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md font-bold">
                      Google Cloud Firestore
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'ar' ? 'كافة الحسابات والصلاحيات مشفرة ومحفوظة سحابياً بشكل دائم' : 'All accounts and permissions securely persisted'}
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-3 text-sm animate-fade-in">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@company.com"
                    className="w-full ps-10 pe-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#252525] text-black dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4393ab] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ar' ? 'كلمة المرور' : 'Password'}
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full ps-10 pe-10 py-2.5 rounded-xl border border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#252525] text-black dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4393ab] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#4393ab] focus:ring-[#4393ab] dark:bg-[#252525] dark:border-[#3a3a3a]"
                  />
                  <span>{language === 'ar' ? 'تذكر تسجيل الدخول' : 'Remember me on this browser'}</span>
                </label>

                <span className="text-[11px] text-[#4393ab] font-medium cursor-help" title="Passwords are saved locally and synced to Google Drive">
                  {language === 'ar' ? 'حفظ مشفر سحابي' : 'Cloud encrypted storage'}
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#2d6f82] to-[#4393ab] hover:from-[#265e6f] hover:to-[#388095] shadow-lg shadow-[#4393ab]/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{language === 'ar' ? 'جاري التحقق والدخول...' : 'Authenticating...'}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{language === 'ar' ? 'تسجيل الدخول إلى المنظومة' : 'Sign In to SinoTrack'}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Demo Accounts & Quick Fill (Col 5) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-[#1d1d1d] rounded-2xl border border-slate-200 dark:border-[#2b2b2b] p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#4393ab]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-black dark:text-white">
                    {language === 'ar' ? 'حسابات الدخول المسجلة' : 'Registered Team Accounts'}
                  </h3>
                </div>
                <span className="text-[11px] text-[#4393ab] font-semibold bg-[#4393ab]/10 px-2.5 py-0.5 rounded-full">
                  {users.length} {language === 'ar' ? (users.length === 1 ? 'مستخدم' : 'مستخدمين') : 'Users'}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                {language === 'ar'
                  ? 'اضغط على أي مستخدم لتعبئة بيانات الدخول الخاصة به فوراً وتجربة صلاحياته:'
                  : 'Click any registered user to auto-fill their credentials and test their RBAC role:'}
              </p>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pe-1">
                {users.map((u) => {
                  const isSelected = email.trim().toLowerCase() === u.email.trim().toLowerCase();
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectDemoUser(u.email)}
                      className={`w-full text-start p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-[#4393ab] bg-[#4393ab]/10 shadow-xs'
                          : 'border-slate-200 dark:border-[#2b2b2b] bg-slate-50/60 dark:bg-[#232323] hover:border-slate-300 dark:hover:border-[#383838]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-300 dark:ring-slate-700"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-black dark:text-white truncate">
                              {u.name}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#4393ab] shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                            {maskEmail(u.email)}
                          </p>
                        </div>
                      </div>

                      <div className="text-end shrink-0 flex items-center">
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-[#333] text-slate-700 dark:text-slate-300">
                          {u.role === 'super_admin' ? (language === 'ar' ? 'المدير العام' : 'Super Admin') :
                           u.role === 'procurement_manager' ? (language === 'ar' ? 'المشتريات' : 'Procurement') :
                           u.role === 'finance' ? (language === 'ar' ? 'المالية' : 'Finance') :
                           u.role === 'shipping_manager' ? (language === 'ar' ? 'الشحن' : 'Shipping') :
                           (language === 'ar' ? 'مستعرض' : 'Viewer')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cloud Database credentials file info box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#4393ab]/10 to-emerald-500/10 border border-[#4393ab]/20 text-xs">
              <div className="flex items-center gap-2 text-black dark:text-white font-bold mb-1">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{language === 'ar' ? 'حفظ وتأمين الحسابات سحابياً' : 'Cloud Credentials Persistence'}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                {language === 'ar'
                  ? 'يتم تخزين بيانات الدخول الخاصة بكل مستخدم (الاسم، البريد، كلمة المرور، والصلاحيات) ومزامنتها تلقائياً داخل قاعدة البيانات السحابية المركزية لضمان أمان البيانات واستقرارها.'
                  : 'Individual credentials, passwords, and permissions for each user are automatically saved and synced inside Cloud Firestore.'}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-3 px-4 border-t border-slate-200 dark:border-[#252525] bg-white/60 dark:bg-[#191919]/60 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>
          © 2026 {settings.platformName || 'SinoTrack ERP'} Enterprise — {language === 'ar' ? (settings.platformSubtitleAr || 'نظام المشتريات والتوريد الصيني المتخصص') : (settings.platformSubtitleEn || 'China Sourcing & Procurement System')}
        </p>
      </footer>
    </div>
  );
};
