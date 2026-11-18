import React from 'react';
import { useERP, ActiveView } from '../context/ERPContext';
import {
  LayoutDashboard,
  Building2,
  Package,
  FileSpreadsheet,
  ShoppingCart,
  Receipt,
  Ship,
  Calculator,
  ClipboardCheck,
  CheckSquare,
  FileBarChart2,
  Settings,
  ChevronRight,
  ChevronLeft,
  UserCheck
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    language,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    suppliers,
    products,
    orders,
    invoices,
    shipments,
    tasks,
    settings,
    users,
  } = useERP();

  // Badges calculation
  const activeOrdersCount = orders.filter((o) => ['confirmed', 'in_production', 'ready_to_ship'].includes(o.status)).length;
  const unpaidInvoicesCount = invoices.filter((i) => ['unpaid', 'partially_paid', 'overdue'].includes(i.status)).length;
  const inTransitShipmentsCount = shipments.filter((s) => ['in_transit', 'departed_origin'].includes(s.status)).length;
  const pendingTasksCount = tasks.filter((t) => t.status !== 'completed').length;

  interface NavItem {
    id: ActiveView;
    titleAr: string;
    titleEn: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      titleAr: 'لوحة التحكم العامة',
      titleEn: 'Dashboard Overview',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'suppliers',
      titleAr: 'الموردون والمصانع',
      titleEn: 'Suppliers & Factories',
      icon: <Building2 className="w-5 h-5 shrink-0" />,
      badge: suppliers.length,
      badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    {
      id: 'products',
      titleAr: 'المنتجات والمواصفات',
      titleEn: 'Products & Specs',
      icon: <Package className="w-5 h-5 shrink-0" />,
      badge: products.length,
      badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    {
      id: 'quotations',
      titleAr: 'عروض الأسعار والمقارنة',
      titleEn: 'Quotations & Compare',
      icon: <FileSpreadsheet className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'orders',
      titleAr: 'طلبيات الشراء (PO)',
      titleEn: 'Purchase Orders',
      icon: <ShoppingCart className="w-5 h-5 shrink-0" />,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
    },
    {
      id: 'invoices',
      titleAr: 'الفواتير والمدفوعات',
      titleEn: 'Invoices & Payments',
      icon: <Receipt className="w-5 h-5 shrink-0" />,
      badge: unpaidInvoicesCount > 0 ? unpaidInvoicesCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
    },
    {
      id: 'shipments',
      titleAr: 'الشحن وتتبع الحاويات',
      titleEn: 'Shipments & Tracking',
      icon: <Ship className="w-5 h-5 shrink-0" />,
      badge: inTransitShipmentsCount > 0 ? inTransitShipmentsCount : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
    },
    {
      id: 'landed_cost',
      titleAr: 'التكلفة الفعلية للاستيراد',
      titleEn: 'Landed Cost Calculator',
      icon: <Calculator className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'samples_qc',
      titleAr: 'العينات وفحص الجودة',
      titleEn: 'Samples & QC Inspection',
      icon: <ClipboardCheck className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'tasks',
      titleAr: 'المهام والمتابعات',
      titleEn: 'Tasks & Reminders',
      icon: <CheckSquare className="w-5 h-5 shrink-0" />,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300',
    },
    {
      id: 'reports',
      titleAr: 'مركز التقارير والتصدير',
      titleEn: 'Reports & Export',
      icon: <FileBarChart2 className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'account',
      titleAr: 'إدارة الحساب والمستخدمين',
      titleEn: 'Account & Users',
      icon: <UserCheck className="w-5 h-5 shrink-0" />,
      badge: users.length,
      badgeColor: 'bg-[#4393ab]/20 text-[#4393ab]',
    },
    {
      id: 'settings',
      titleAr: 'الإعدادات والنسخ الاحتياطي',
      titleEn: 'Settings & Backup',
      icon: <Settings className="w-5 h-5 shrink-0" />,
    },
  ];

  return (
    <aside
      className={`border-e border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col transition-all duration-300 z-20 shrink-0 ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeView === item.id || (activeView === 'supplier_detail' && item.id === 'suppliers');

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#4393ab] text-white shadow-sm font-semibold'
                  : 'text-black dark:text-white hover:bg-slate-200/70 dark:hover:bg-[#252525] hover:text-black dark:hover:text-white'
              }`}
              title={isSidebarCollapsed ? (language === 'ar' ? item.titleAr : item.titleEn) : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={isActive ? 'text-white' : 'text-slate-700 dark:text-slate-300'}>
                  {item.icon}
                </span>
                {!isSidebarCollapsed && (
                  <span className="truncate">
                    {language === 'ar' ? item.titleAr : item.titleEn}
                  </span>
                )}
              </div>

              {!isSidebarCollapsed && item.badge !== undefined && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info & Collapse Toggle */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        {!isSidebarCollapsed ? (
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 shadow-xs">
            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
              {language === 'ar' ? settings.companyNameAr : settings.companyNameEn}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {language === 'ar' ? 'العملة الأساسية: USD ($)' : 'Base Currency: USD ($)'}
            </p>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Expand sidebar"
            >
              {language === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
