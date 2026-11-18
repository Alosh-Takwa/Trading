import React, { useState, useMemo, useEffect } from 'react';
import { useERP } from '../context/ERPContext';
import { 
  Search, 
  X, 
  Building2, 
  Package, 
  Users, 
  FileSpreadsheet, 
  ShoppingCart, 
  Receipt, 
  Ship, 
  ExternalLink 
} from 'lucide-react';
import { formatMoney } from '../utils/erpLogic';

export const GlobalSearchModal: React.FC = () => {
  const {
    globalSearchOpen,
    setGlobalSearchOpen,
    suppliers,
    contacts,
    products,
    quotations,
    orders,
    invoices,
    shipments,
    language,
    setActiveView,
    setSelectedSupplierId,
    setSelectedProductId,
  } = useERP();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'suppliers' | 'products' | 'contacts' | 'quotations' | 'orders' | 'shipments'>('all');

  // Keyboard shortcut listener (Cmd+K / Ctrl+K / Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(!globalSearchOpen);
      }
      if (e.key === 'Escape' && globalSearchOpen) {
        setGlobalSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [globalSearchOpen, setGlobalSearchOpen]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const matchedSuppliers = suppliers.filter(
      (s) =>
        s.nameEn.toLowerCase().includes(q) ||
        (s.nameCn && s.nameCn.toLowerCase().includes(q)) ||
        (s.factoryName && s.factoryName.toLowerCase().includes(q)) ||
        s.id.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.wechat && s.wechat.toLowerCase().includes(q)) ||
        (s.whatsapp && s.whatsapp.includes(q))
    );

    const matchedProducts = products.filter(
      (p) =>
        p.nameAr.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        (p.nameCn && p.nameCn.toLowerCase().includes(q)) ||
        p.modelNumber.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.descriptionAr && p.descriptionAr.toLowerCase().includes(q)) ||
        (p.descriptionEn && p.descriptionEn.toLowerCase().includes(q)) ||
        p.specifications.some(
          (sp) =>
            sp.label.toLowerCase().includes(q) ||
            String(sp.value).toLowerCase().includes(q)
        )
    );

    const matchedContacts = contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.chineseName && c.chineseName.toLowerCase().includes(q)) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.whatsapp && c.whatsapp.includes(q)) ||
        (c.wechatId && c.wechatId.toLowerCase().includes(q)) ||
        c.position.toLowerCase().includes(q)
    );

    const matchedQuotations = quotations.filter(
      (qt) =>
        qt.id.toLowerCase().includes(q) ||
        qt.modelNumber.toLowerCase().includes(q) ||
        qt.supplierName.toLowerCase().includes(q) ||
        qt.productName.toLowerCase().includes(q) ||
        qt.portOfOrigin.toLowerCase().includes(q)
    );

    const matchedOrders = orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.supplierName.toLowerCase().includes(q) ||
        o.items.some((i) => i.modelNumber.toLowerCase().includes(q) || i.productName.toLowerCase().includes(q))
    );

    const matchedInvoices = invoices.filter(
      (inv) =>
        inv.id.toLowerCase().includes(q) ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.poNumber.toLowerCase().includes(q) ||
        inv.supplierName.toLowerCase().includes(q)
    );

    const matchedShipments = shipments.filter(
      (sh) =>
        sh.id.toLowerCase().includes(q) ||
        sh.containerNumber.toLowerCase().includes(q) ||
        sh.billOfLadingNumber.toLowerCase().includes(q) ||
        sh.supplierName.toLowerCase().includes(q) ||
        sh.shippingLine.toLowerCase().includes(q) ||
        sh.portOfLoading.toLowerCase().includes(q) ||
        sh.portOfDischarge.toLowerCase().includes(q)
    );

    return {
      suppliers: matchedSuppliers,
      products: matchedProducts,
      contacts: matchedContacts,
      quotations: matchedQuotations,
      orders: matchedOrders,
      invoices: matchedInvoices,
      shipments: matchedShipments,
      totalCount:
        matchedSuppliers.length +
        matchedProducts.length +
        matchedContacts.length +
        matchedQuotations.length +
        matchedOrders.length +
        matchedInvoices.length +
        matchedShipments.length,
    };
  }, [query, suppliers, products, contacts, quotations, orders, invoices, shipments]);

  if (!globalSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
          <Search className="w-5 h-5 text-slate-400 ms-1 me-3 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              language === 'ar'
                ? 'ابحث باسم المورد، الموديل، رقم الحاوية، B/L، أو المواصفات...'
                : 'Search supplier name, model number, container #, B/L, specs...'
            }
            className="w-full bg-transparent border-none text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none text-sm font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setGlobalSearchOpen(false)}
            className="ms-2 px-2 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded border border-slate-200 dark:border-slate-700"
          >
            ESC
          </button>
        </div>

        {/* Category Tabs */}
        {searchResults && (
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-[#1e1e1e] overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {language === 'ar' ? `الكل (${searchResults.totalCount})` : `All (${searchResults.totalCount})`}
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'suppliers'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {language === 'ar' ? `الموردون (${searchResults.suppliers.length})` : `Suppliers (${searchResults.suppliers.length})`}
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'products'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {language === 'ar' ? `المنتجات (${searchResults.products.length})` : `Products (${searchResults.products.length})`}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {language === 'ar' ? `الطلبيات (${searchResults.orders.length})` : `Orders (${searchResults.orders.length})`}
            </button>
            <button
              onClick={() => setActiveTab('shipments')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'shipments'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {language === 'ar' ? `الشحنات (${searchResults.shipments.length})` : `Shipments (${searchResults.shipments.length})`}
            </button>
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!query ? (
            <div className="text-center py-12 text-slate-400">
              <Search className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-medium">
                {language === 'ar'
                  ? 'اكتب أي كلمة، رقم موديل، أو اسم مورد للبحث الشامل'
                  : 'Type any keyword, model number, or supplier to search everywhere'}
              </p>
              <div className="flex justify-center gap-2 mt-4 text-xs text-slate-500">
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">HR-450F-INV</span>
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Midea</span>
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">MSCU7829143</span>
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Inverter</span>
              </div>
            </div>
          ) : searchResults && searchResults.totalCount === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-sm font-medium">
                {language === 'ar' ? `لا توجد نتائج مطابقة لـ "${query}"` : `No matching results for "${query}"`}
              </p>
            </div>
          ) : (
            searchResults && (
              <div className="space-y-4">
                {/* Suppliers Section */}
                {(activeTab === 'all' || activeTab === 'suppliers') && searchResults.suppliers.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-500" />
                      {language === 'ar' ? 'الموردون والمصانع' : 'Suppliers & Factories'}
                    </h3>
                    <div className="space-y-1.5">
                      {searchResults.suppliers.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedSupplierId(s.id);
                            setActiveView('supplier_detail');
                            setGlobalSearchOpen(false);
                          }}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-[#1e1e1e] hover:bg-blue-50/50 dark:hover:bg-slate-800 cursor-pointer transition-all"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{s.id}</span>
                              <span className="text-xs font-semibold text-slate-900 dark:text-white">{s.nameEn}</span>
                              {s.nameCn && <span className="text-xs text-slate-400 font-normal">({s.nameCn})</span>}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {s.city} • {s.type} • ★ {s.rating.overallScore}
                            </p>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products Section */}
                {(activeTab === 'all' || activeTab === 'products') && searchResults.products.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-emerald-500" />
                      {language === 'ar' ? 'المنتجات والأجهزة' : 'Products & Appliances'}
                    </h3>
                    <div className="space-y-1.5">
                      {searchResults.products.map((p) => {
                        // Find which suppliers offer this product
                        const offeringQuotes = quotations.filter((q) => q.productId === p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedProductId(p.id);
                              setActiveView('products');
                              setGlobalSearchOpen(false);
                            }}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-[#1e1e1e] hover:bg-emerald-50/40 dark:hover:bg-slate-800 cursor-pointer transition-all"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  {p.modelNumber}
                                </span>
                                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                  {language === 'ar' ? p.nameAr : p.nameEn}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {language === 'ar' ? `متوفر لدى ${offeringQuotes.length} موردين` : `Available from ${offeringQuotes.length} suppliers`}
                                {offeringQuotes.length > 0 && ` • ${language === 'ar' ? 'أفضل سعر:' : 'Best price:'} $${Math.min(...offeringQuotes.map((q) => q.unitPrice))}`}
                              </p>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Contacts Section */}
                {(activeTab === 'all' || activeTab === 'contacts') && searchResults.contacts.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-500" />
                      {language === 'ar' ? 'جهات الاتصال والممثلون' : 'Supplier Contacts'}
                    </h3>
                    <div className="space-y-1.5">
                      {searchResults.contacts.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedSupplierId(c.supplierId);
                            setActiveView('supplier_detail');
                            setGlobalSearchOpen(false);
                          }}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 bg-white dark:bg-[#1e1e1e] hover:bg-purple-50/40 dark:hover:bg-slate-800 cursor-pointer transition-all"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-900 dark:text-white">{c.name}</span>
                              {c.chineseName && <span className="text-xs text-slate-400">({c.chineseName})</span>}
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                {c.position}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              📞 {c.phone} {c.whatsapp && `• WA: ${c.whatsapp}`} {c.wechatId && `• WeChat: ${c.wechatId}`}
                            </p>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Orders Section */}
                {(activeTab === 'all' || activeTab === 'orders') && searchResults.orders.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ShoppingCart className="w-3.5 h-3.5 text-blue-500" />
                      {language === 'ar' ? 'طلبيات الشراء' : 'Purchase Orders'}
                    </h3>
                    <div className="space-y-1.5">
                      {searchResults.orders.map((o) => (
                        <div
                          key={o.id}
                          onClick={() => {
                            setActiveView('orders');
                            setGlobalSearchOpen(false);
                          }}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-[#1e1e1e] hover:bg-blue-50/40 dark:hover:bg-slate-800 cursor-pointer transition-all"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{o.id}</span>
                              <span className="text-xs font-semibold text-slate-900 dark:text-white">{o.supplierName}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                {o.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {o.items.length} {language === 'ar' ? 'بنود' : 'items'} • {formatMoney(o.grandTotal, o.currency, language)}
                            </p>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shipments Section */}
                {(activeTab === 'all' || activeTab === 'shipments') && searchResults.shipments.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Ship className="w-3.5 h-3.5 text-cyan-500" />
                      {language === 'ar' ? 'الشحنات والحاويات' : 'Shipments & Containers'}
                    </h3>
                    <div className="space-y-1.5">
                      {searchResults.shipments.map((sh) => (
                        <div
                          key={sh.id}
                          onClick={() => {
                            setActiveView('shipments');
                            setGlobalSearchOpen(false);
                          }}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-700 bg-white dark:bg-[#1e1e1e] hover:bg-cyan-50/40 dark:hover:bg-slate-800 cursor-pointer transition-all"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                                {sh.containerNumber}
                              </span>
                              <span className="text-xs text-slate-700 dark:text-slate-300">{sh.shippingLine}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
                                {sh.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              BL: {sh.billOfLadingNumber} • {sh.portOfLoading} ➔ {sh.portOfDischarge}
                            </p>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
