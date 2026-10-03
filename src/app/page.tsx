'use client';

import React, { useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { DashboardView } from '@/components/DashboardView';
import { ProductsView } from '@/components/ProductsView';
import { CompetitorsView } from '@/components/CompetitorsView';
import { MonitoringScansView } from '@/components/MonitoringScansView';
import { AlertsView } from '@/components/AlertsView';
import { SuperAdminView } from '@/components/SuperAdminView';
import { SettingsView } from '@/components/SettingsView';
import { NotificationDrawer } from '@/components/NotificationDrawer';
import { LiveScanRunnerModal } from '@/components/LiveScanRunnerModal';
import { CsvImportModal } from '@/components/CsvImportModal';
import { AddProductModal } from '@/components/AddProductModal';
import { AutoMatchModal } from '@/components/AutoMatchModal';
import { AddCompetitorModal } from '@/components/AddCompetitorModal';
import { RegisterBrandModal } from '@/components/RegisterBrandModal';
import { CandidateMatchSelectorModal } from '@/components/CandidateMatchSelectorModal';
import { AuthView } from '@/components/AuthView';
import { UpgradePlanModal } from '@/components/UpgradePlanModal';
import { SuspendedAccountNotice } from '@/components/SuspendedAccountNotice';
import { Product } from '@/types';

function AppContent() {
  const {
    activeTab,
    isSuperAdmin,
    currentUser,
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
  } = useApp();

  // Modal states
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [scanRunnerModalOpen, setScanRunnerModalOpen] = useState(false);
  const [autoMatchModalOpen, setAutoMatchModalOpen] = useState(false);
  const [targetProductForMatch, setTargetProductForMatch] = useState<Product | null>(null);
  const [addCompetitorModalOpen, setAddCompetitorModalOpen] = useState(false);
  const [registerBrandModalOpen, setRegisterBrandModalOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);

  // Candidate Match URL Selector Modal State
  const [candidateMatcherOpen, setCandidateMatcherOpen] = useState(false);
  const [targetProductForCandidate, setTargetProductForCandidate] = useState<Product | null>(null);

  const handleOpenAutoMatch = (product?: Product) => {
    setTargetProductForMatch(product || null);
    setAutoMatchModalOpen(true);
  };

  const handleOpenCandidateMatcher = (product: Product) => {
    setTargetProductForCandidate(product);
    setCandidateMatcherOpen(true);
  };

  if (!currentUser) {
    return <AuthView />;
  }

  const renderActiveView = () => {
    if (
      isSuperAdmin ||
      activeTab === 'superadmin' ||
      activeTab === 'admin_tenants' ||
      activeTab === 'admin_subscriptions' ||
      activeTab === 'admin_crawler'
    ) {
      return (
        <SuperAdminView
          onOpenRegisterBrandModal={() => setRegisterBrandModalOpen(true)}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onOpenCsvModal={() => setCsvModalOpen(true)}
            onOpenAddProductModal={() => setAddProductModalOpen(true)}
            onOpenScanRunner={() => setScanRunnerModalOpen(true)}
            onOpenAutoMatchModal={() => handleOpenAutoMatch()}
          />
        );
      case 'products':
        return (
          <ProductsView
            onOpenAddModal={() => setAddProductModalOpen(true)}
            onOpenCsvModal={() => setCsvModalOpen(true)}
            onOpenCandidateMatcher={handleOpenCandidateMatcher}
          />
        );
      case 'competitors':
        return (
          <CompetitorsView
            onOpenAddCompetitorModal={() => setAddCompetitorModalOpen(true)}
            onOpenAutoMatchModal={() => handleOpenAutoMatch()}
          />
        );
      case 'scans':
        return (
          <MonitoringScansView
            onOpenScanRunner={() => setScanRunnerModalOpen(true)}
          />
        );
      case 'alerts':
        return <AlertsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView
            onOpenCsvModal={() => setCsvModalOpen(true)}
            onOpenAddProductModal={() => setAddProductModalOpen(true)}
            onOpenScanRunner={() => setScanRunnerModalOpen(true)}
            onOpenAutoMatchModal={() => handleOpenAutoMatch()}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#080d19] flex flex-col text-slate-100">
      {/* Top Navigation Header */}
      <Header
        onOpenNotifications={() => setNotificationDrawerOpen(true)}
        onOpenScanRunner={() => setScanRunnerModalOpen(true)}
        onOpenRegisterBrand={() => setRegisterBrandModalOpen(true)}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>

      {/* Candidate Match URL Selector Modal (User picks which URL to monitor for each competitor) */}
      <CandidateMatchSelectorModal
        isOpen={candidateMatcherOpen}
        onClose={() => {
          setCandidateMatcherOpen(false);
          setTargetProductForCandidate(null);
        }}
        product={targetProductForCandidate}
      />

      {/* Interactive Modals & Drawers */}
      <NotificationDrawer
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
      />

      <LiveScanRunnerModal
        isOpen={scanRunnerModalOpen}
        onClose={() => setScanRunnerModalOpen(false)}
      />

      <CsvImportModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onOpenCandidateMatcher={handleOpenCandidateMatcher}
      />

      <AddProductModal
        isOpen={addProductModalOpen}
        onClose={() => setAddProductModalOpen(false)}
        onOpenCandidateMatcher={handleOpenCandidateMatcher}
      />

      <AutoMatchModal
        isOpen={autoMatchModalOpen}
        onClose={() => {
          setAutoMatchModalOpen(false);
          setTargetProductForMatch(null);
        }}
        targetProduct={targetProductForMatch}
      />

      <AddCompetitorModal
        isOpen={addCompetitorModalOpen}
        onClose={() => setAddCompetitorModalOpen(false)}
      />

      <RegisterBrandModal
        isOpen={registerBrandModalOpen}
        onClose={() => setRegisterBrandModalOpen(false)}
      />

      <SuspendedAccountNotice />

      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
}

export default function Page() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
