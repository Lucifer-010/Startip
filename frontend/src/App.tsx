import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { DemoWidgetPage, DemoStepState } from './components/DemoWidgetPage';
import { CreatorDashboard } from './components/CreatorDashboard';
import { WalletOnboardingModal } from './components/WalletOnboardingModal';
import { WalletProvider, useWallet } from './context/WalletContext';

export type AppPage = 'landing' | 'demo' | 'dashboard';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<AppPage>('landing');
  const [demoInitialStep, setDemoInitialStep] = useState<DemoStepState>('01_pick');
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const { isAuthenticated, creator } = useWallet();

  // If user visits ?creator=username or /tip/username
  const [publicCreatorUser, setPublicCreatorUser] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('creator');
    if (c) {
      setPublicCreatorUser(c);
      setCurrentPage('demo');
    }
  }, []);

  const openDemo = (step: DemoStepState = '01_pick') => {
    setDemoInitialStep(step);
    setCurrentPage('demo');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDashboard = () => {
    if (!isAuthenticated) {
      setWalletModalOpen(true);
      return;
    }
    setCurrentPage('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openLanding = () => {
    setCurrentPage('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#070A1A]">
      {currentPage === 'landing' && (
        <LandingPage
          onOpenDemo={() => openDemo('01_pick')}
          onOpenDashboard={openDashboard}
          onOpenWalletModal={() => setWalletModalOpen(true)}
        />
      )}

      {currentPage === 'demo' && (
        <DemoWidgetPage
          key={demoInitialStep}
          initialStep={demoInitialStep}
          targetCreator={publicCreatorUser || creator?.username || 'alex_dev'}
          onBackToHome={openLanding}
          onStartForFree={() => setWalletModalOpen(true)}
        />
      )}

      {currentPage === 'dashboard' && (
        <CreatorDashboard
          mode="full"
          onOpenDemo={() => openDemo('01_pick')}
          onBackToLanding={openLanding}
        />
      )}

      <WalletOnboardingModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        onSuccess={() => {
          setWalletModalOpen(false);
          setCurrentPage('dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}
