/**
 * SinoTrack ERP - Main Application Shell
 * Complete Enterprise China Sourcing & Procurement Management Platform
 */

import React, { useState } from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { GlobalSearchModal } from './components/GlobalSearchModal';

// Views
import { DashboardView } from './components/views/DashboardView';
import { SuppliersView } from './components/views/SuppliersView';
import { SupplierDetailView } from './components/views/SupplierDetailView';
import { ProductsView } from './components/views/ProductsView';
import { QuotationsView } from './components/views/QuotationsView';
import { OrdersView } from './components/views/OrdersView';
import { InvoicesView } from './components/views/InvoicesView';
import { ShipmentsView } from './components/views/ShipmentsView';
import { LandedCostCalculatorView } from './components/views/LandedCostCalculatorView';
import { SamplesAndQCView } from './components/views/SamplesAndQCView';
import { TasksView } from './components/views/TasksView';
import { ReportsView } from './components/views/ReportsView';
import { SettingsView } from './components/views/SettingsView';
import { AccountManagementView } from './components/views/AccountManagementView';
import { LoginView } from './components/views/LoginView';

const AppShell: React.FC = () => {
  const { activeView, isAuthenticated } = useERP();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#161616] text-black dark:text-white font-sans transition-colors duration-200">
        <LoginView />
        <ToastContainer />
      </div>
    );
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'supplier_detail':
        return <SupplierDetailView />;
      case 'products':
        return <ProductsView />;
      case 'quotations':
        return <QuotationsView />;
      case 'orders':
        return <OrdersView />;
      case 'invoices':
        return <InvoicesView />;
      case 'shipments':
        return <ShipmentsView />;
      case 'landed_cost':
        return <LandedCostCalculatorView />;
      case 'samples_qc':
        return <SamplesAndQCView />;
      case 'tasks':
        return <TasksView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      case 'account':
        return <AccountManagementView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#161616] text-black dark:text-white flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Body with Sidebar + Active View */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Overlays & Modals */}
      <GlobalSearchModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ERPProvider>
      <AppShell />
    </ERPProvider>
  );
}
