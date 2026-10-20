import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  Sparkles,
  Code2,
  History,
  Bell,
  Settings,
  LogOut,
  Globe,
  Sun,
  Moon,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  Info,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ChevronRight,
  Send,
  Palette,
  Menu,
  X,
  Search,
  ExternalLink,
  Volume2,
  Play,
} from 'lucide-react';
import {
  StarFourPoint,
  StellarNetworkIcon,
  UsdcBadge,
  XlmBadge,
  WalletLogo,
  CornerHandles,
} from './Icons';
import { useWallet } from '../context/WalletContext';
import { api, DashboardMetrics, TipHistoryItem } from '../services/api';

export interface TipRecord {
  id: string;
  supporter: string;
  initial: string;
  avatarBg: string;
  avatarColor: string;
  message: string;
  amount: string;
  currency: 'XLM' | 'USDC';
  usdValue: string;
  status: 'Confirmed' | 'Pending';
  when: string;
  txHash: string;
  isAnonymous?: boolean;
}

export const INITIAL_TIPS: TipRecord[] = [
  {
    id: '1',
    supporter: 'Mara',
    initial: 'M',
    avatarBg: '#ECE8FF',
    avatarColor: '#4A2FC2',
    message: '“Your last tutorial saved my weekend. Keep them coming.”',
    amount: '25 XLM',
    currency: 'XLM',
    usdValue: '$3.00',
    status: 'Confirmed',
    when: '2 min ago',
    txHash: '3f9a…c21e',
  },
  {
    id: '2',
    supporter: 'Anonymous',
    initial: '*',
    avatarBg: '#0B1026',
    avatarColor: '#C6FF3D',
    message: 'No message',
    amount: '5 USDC',
    currency: 'USDC',
    usdValue: '$5.00',
    status: 'Pending',
    when: '6 min ago',
    txHash: '8a1d…f04b',
    isAnonymous: true,
  },
  {
    id: '3',
    supporter: 'Alex',
    initial: 'A',
    avatarBg: '#E3EEFF',
    avatarColor: '#1D4FA8',
    message: '“For the Stellar SDK walkthrough.”',
    amount: '10 USDC',
    currency: 'USDC',
    usdValue: '$10.00',
    status: 'Confirmed',
    when: '1 h ago',
    txHash: '7c2e…a91d',
  },
  {
    id: '4',
    supporter: 'Kemi',
    initial: 'K',
    avatarBg: '#EEFFC2',
    avatarColor: '#3F5A00',
    message: '“Coffee on me ☕”',
    amount: '5 USDC',
    currency: 'USDC',
    usdValue: '$5.00',
    status: 'Confirmed',
    when: '3 h ago',
    txHash: '5b4f…d82c',
  },
  {
    id: '5',
    supporter: 'Daniel',
    initial: 'D',
    avatarBg: '#FDF1E1',
    avatarColor: '#8A4A06',
    message: '“Great stream yesterday.”',
    amount: '50 XLM',
    currency: 'XLM',
    usdValue: '$6.00',
    status: 'Confirmed',
    when: 'Yesterday',
    txHash: '2e8b…901a',
  },
  {
    id: '6',
    supporter: 'Mara',
    initial: 'M',
    avatarBg: '#ECE8FF',
    avatarColor: '#4A2FC2',
    message: '“Small thank you for the repo.”',
    amount: '15 XLM',
    currency: 'XLM',
    usdValue: '$1.80',
    status: 'Confirmed',
    when: 'Yesterday',
    txHash: '9d1c…44ef',
  },
];

const CHART_DATA = [
  { month: 'May', value: 210, heightPx: 47, mobileHeightPx: 30, label: '$210.40' },
  { month: 'Jun', value: 345, heightPx: 78, mobileHeightPx: 50, label: '$345.00' },
  { month: 'Jul', value: 400, heightPx: 89, mobileHeightPx: 57, label: '$402.10' },
  { month: 'Aug', value: 530, heightPx: 119, mobileHeightPx: 76, label: '$531.80' },
  { month: 'Sep', value: 686.3, heightPx: 154, mobileHeightPx: 98, label: '$686.30', highlighted: true },
  { month: 'Oct', value: 415.6, heightPx: 93, mobileHeightPx: 59, label: '$415.60' },
];

export type DashboardTab = 'overview' | 'widget' | 'embed' | 'history' | 'alerts' | 'settings';

interface CreatorDashboardProps {
  mode: 'desktop-preview' | 'mobile-preview' | 'full';
  onOpenDemo?: () => void;
  onBackToLanding?: () => void;
  initialTab?: DashboardTab;
}

export function CreatorDashboard({
  mode,
  onOpenDemo,
  onBackToLanding,
  initialTab = 'overview',
}: CreatorDashboardProps) {
  const { creator, walletAddress, disconnectWallet, refreshProfile } = useWallet();

  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedObs, setCopiedObs] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('Sep');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'USDC' | 'XLM'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(1);
  const [testAlertActive, setTestAlertActive] = useState(false);

  // Backend state
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null);
  const [tipHistory, setTipHistory] = useState<TipHistoryItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSavingWidget, setIsSavingWidget] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Widget Customizer state
  const [creatorName, setCreatorName] = useState('Tobi Ade');
  const [creatorHandle, setCreatorHandle] = useState('tobibuilds');
  const [creatorBio, setCreatorBio] = useState(
    'Open-source tutorials on Stellar. Every tip funds another free video.'
  );
  const [widgetCurrency, setWidgetCurrency] = useState<'USDC' | 'XLM'>('USDC');
  const [widgetSelectedPreset, setWidgetSelectedPreset] = useState<number>(5);
  const [connectedWallet, setConnectedWallet] = useState<'freighter' | 'lobstr' | 'xbull'>('freighter');
  const [timeframe, setTimeframe] = useState<'All time' | 'This month' | 'Last 7 days'>('All time');
  const [showTimeframeMenu, setShowTimeframeMenu] = useState(false);

  // Synchronize creator profile when loaded from backend
  useEffect(() => {
    if (creator) {
      if (creator.display_name) setCreatorName(creator.display_name);
      if (creator.username) setCreatorHandle(creator.username);
      if (creator.bio) setCreatorBio(creator.bio);
    }
  }, [creator]);

  // Load backend dashboard metrics and tip history
  useEffect(() => {
    if (mode === 'full') {
      setIsLoadingData(true);
      Promise.all([
        api.getDashboard().then((res) => setDashboardData(res)).catch(() => null),
        api.getTipHistory({ asset: historyFilter, search: searchQuery }).then((res) => setTipHistory(res)).catch(() => []),
      ]).finally(() => {
        setIsLoadingData(false);
      });
    }
  }, [mode, historyFilter, searchQuery]);

  const appBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://startip.app';
  const effectiveHandle = (mode === 'full' && creator?.username) ? creator.username : creatorHandle;
  const overlayToken = (mode === 'full' && creator?.widget_config?.overlay_token)
    ? creator.widget_config.overlay_token
    : effectiveHandle;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(`${appBaseUrl}/?creator=${effectiveHandle}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard?.writeText(
      `<script src="${appBaseUrl}/embed/${effectiveHandle}/widget.js" async></script>`
    );
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleCopyObs = () => {
    navigator.clipboard?.writeText(`${appBaseUrl}/overlay/${overlayToken}/`);
    setCopiedObs(true);
    setTimeout(() => setCopiedObs(false), 2000);
  };

  const triggerTestStreamAlert = async () => {
    setTestAlertActive(true);
    if (mode === 'full') {
      try {
        await api.triggerTestAlert({
          overlay_token: overlayToken,
          amount: '5',
          asset_code: 'USDC',
          supporter_name: 'Ada',
          message: 'Your Stellar series got me my first dev job.',
        });
      } catch (err) {
        console.warn('Backend test alert trigger error:', err);
      }
    }
    setTimeout(() => setTestAlertActive(false), 4500);
  };

  const handleSaveWidgetConfig = async () => {
    setIsSavingWidget(true);
    setSaveStatus(null);
    try {
      await api.updateProfile({
        display_name: creatorName,
        bio: creatorBio,
      });
      await api.updateWidgetConfig({
        welcome_message: creatorBio,
      });
      await refreshProfile();
      setSaveStatus('Widget settings saved to Stellar backend successfully!');
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err: any) {
      setSaveStatus(`Failed to save: ${err.message}`);
    } finally {
      setIsSavingWidget(false);
    }
  };

  const handleSignOut = async () => {
    await disconnectWallet();
    if (onBackToLanding) {
      onBackToLanding();
    }
  };

  const filteredTips = INITIAL_TIPS.filter((tip) => {
    const matchesCurrency = historyFilter === 'ALL' || tip.currency === historyFilter;
    const matchesSearch =
      !searchQuery ||
      tip.supporter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tip.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCurrency && matchesSearch;
  });

  // ============================================================================
  // MOBILE PHONE FRAME PREVIEW (Used in Landing Page Mobile View)
  // Matches "Phone frame" (300x582) -> "Dashboard screen" (278x560)
  // ============================================================================
  if (mode === 'mobile-preview') {
    return (
      <div className="relative w-[300px] h-[582px] p-[11px] bg-white/[0.04] border border-white/[0.12] backdrop-blur-[5px] rounded-[40px] mx-auto select-none">
        <CornerHandles variant="white" size={9} />

        <div className="relative w-[278px] h-[560px] bg-[#F6F7FB] rounded-[30px] overflow-hidden text-[#0B1026]">
          {/* Scrollable interior */}
          <div className="w-full h-full overflow-y-auto custom-scrollbar pb-24">
            {/* Mobile Top bar */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-2.5 py-2 bg-white border-b border-[#E4E7F2]">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
                  className="relative w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F6F7FB]"
                  aria-label="Toggle dashboard menu"
                >
                  <Menu className="w-4 h-4 text-[#0B1026]" />
                  {unreadAlerts > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C6FF3D] ring-2 ring-white" />
                  )}
                </button>
                <div className="w-[22px] h-[22px] rounded-[6px] bg-[#C6FF3D] flex items-center justify-center">
                  <StarFourPoint className="w-3.5 h-3.5" color="#0B1026" />
                </div>
                <span className="font-extrabold text-[13px] tracking-[-0.35px] text-[#0B1026]">
                  StarTip
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#0B1026] text-[#C6FF3D] text-[8.5px] font-semibold">
                  <Globe className="w-2.5 h-2.5 text-[#C6FF3D]" />
                  Testnet
                </span>
                <button
                  onClick={onOpenDemo}
                  className="w-6 h-6 rounded-full border border-[#C9CEE2] flex items-center justify-center text-[#0B1026]"
                  title="Sun theme"
                >
                  <Sun className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Mobile Drawer Overlay inside Phone Frame */}
            {mobileDrawerOpen && (
              <div className="absolute inset-0 z-30 bg-white flex flex-col justify-between p-4">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-[#E4E7F2]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#C6FF3D] flex items-center justify-center">
                        <StarFourPoint className="w-4 h-4" color="#0B1026" />
                      </div>
                      <span className="font-extrabold text-sm text-[#0B1026]">StarTip</span>
                    </div>
                    <button
                      onClick={() => setMobileDrawerOpen(false)}
                      className="p-1 rounded-lg hover:bg-[#F6F7FB]"
                    >
                      <X className="w-4 h-4 text-[#0B1026]" />
                    </button>
                  </div>
                  <div className="mt-3 space-y-1">
                    {(['overview', 'widget', 'embed', 'history', 'alerts', 'settings'] as DashboardTab[]).map(
                      (tab) => (
                        <button
                          key={tab}
                          onClick={() => {
                            setActiveTab(tab);
                            setMobileDrawerOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold capitalize ${
                            activeTab === tab
                              ? 'bg-[#0B1026] text-white'
                              : 'text-[#4A5070] hover:bg-[#F6F7FB]'
                          }`}
                        >
                          <span>{tab === 'embed' ? 'Embed code' : tab === 'alerts' ? 'Live alerts' : tab}</span>
                          {tab === 'alerts' && (
                            <span className="px-1.5 py-0.5 rounded-full bg-[#C6FF3D] text-[#0B1026] text-[10px]">
                              3
                            </span>
                          )}
                        </button>
                      )
                    )}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F6F7FB] border border-[#E4E7F2]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#0B1026] text-[#C6FF3D] font-extrabold text-xs flex items-center justify-center">
                      TA
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#0B1026]">Tobi Ade</div>
                      <div className="text-[10px] text-[#646A8A]">@tobibuilds</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Mobile Content */}
            <div className="px-3 pt-3 space-y-3">
              {/* Greeting & Overview Header */}
              <div>
                <p className="text-[10px] font-semibold text-[#4A5070]">Good evening, Tobi</p>
                <div className="flex items-center justify-between mt-0.5">
                  <h4 className="text-[22px] leading-[28px] font-extrabold tracking-[-0.7px] text-[#0B1026]">
                    Overview
                  </h4>
                  <div className="inline-flex items-center gap-1 px-2 py-1.5 bg-white border border-[#E4E7F2] rounded-[8.5px] text-[10px] font-semibold text-[#0B1026]">
                    <Calendar className="w-3 h-3 text-[#0B1026]" />
                    <span>All time</span>
                    <ChevronDown className="w-3 h-3 text-[#0B1026]" />
                  </div>
                </div>
                <p className="text-[8.5px] font-medium text-[#646A8A] mt-0.5">
                  2 May 2026 – 16 Oct 2026
                </p>
              </div>

              {/* Share your page button */}
              <button
                onClick={handleCopyLink}
                className="w-full h-[40px] pl-4 pr-1.5 rounded-full bg-[#C6FF3D] flex items-center justify-between hover:brightness-95 transition"
              >
                <span className="font-bold text-[11.4px] text-[#0B1026]">
                  {copiedLink ? 'Copied startip.app/tobibuilds!' : 'Share your page'}
                </span>
                <span className="w-7 h-7 rounded-full bg-[#0B1026] flex items-center justify-center">
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#C6FF3D]" />
                </span>
              </button>

              {/* 2x2 KPI Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Total XLM */}
                <div
                  className="relative p-2.5 rounded-[11.4px] text-white overflow-hidden"
                  style={{
                    background: 'linear-gradient(140deg, #232B63 14.51%, #0B1026 65.62%)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-white">Total XLM</span>
                    <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <ArrowUpRight className="w-3 h-3 text-[#0B1026]" />
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-[20px] leading-[26px] font-extrabold tracking-[-0.7px] tabular-nums">
                      12,092
                    </span>
                    <span className="text-[10px] font-bold text-[#C9CEE2]">XLM</span>
                  </div>
                  <p className="text-[8.5px] font-medium text-[#C9CEE2] mt-1">
                    ≈ $1,451.07 · 268 tips
                  </p>
                </div>

                {/* Total USDC */}
                <div className="p-2.5 rounded-[11.4px] bg-white border border-[#E4E7F2]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-[#0B1026]">Total USDC</span>
                    <span className="w-5 h-5 rounded-full border border-[#C9CEE2] flex items-center justify-center">
                      <ArrowUpRight className="w-3 h-3 text-[#4A5070]" />
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-[20px] leading-[26px] font-extrabold tracking-[-0.7px] text-[#0B1026] tabular-nums">
                      1,140
                    </span>
                    <span className="text-[10px] font-bold text-[#646A8A]">USDC</span>
                  </div>
                  <p className="text-[8.5px] font-medium text-[#646A8A] mt-1">
                    ≈ $1,140.13 · 211 tips
                  </p>
                </div>

                {/* All tips */}
                <div className="p-2.5 rounded-[11.4px] bg-white border border-[#E4E7F2]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-[#0B1026]">All tips</span>
                    <span className="w-5 h-5 rounded-full border border-[#C9CEE2] flex items-center justify-center">
                      <ArrowUpRight className="w-3 h-3 text-[#4A5070]" />
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="text-[20px] leading-[26px] font-extrabold tracking-[-0.7px] text-[#0B1026] tabular-nums">
                      479
                    </span>
                  </div>
                  <p className="text-[8.5px] font-medium text-[#646A8A] mt-1">
                    From 212 supporters
                  </p>
                </div>

                {/* Tips today */}
                <div className="p-2.5 rounded-[11.4px] bg-white border border-[#E4E7F2]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-[#0B1026]">Tips today</span>
                    <Info className="w-3 h-3 text-[#646A8A]" />
                  </div>
                  <div className="mt-1">
                    <span className="text-[20px] leading-[26px] font-extrabold tracking-[-0.7px] text-[#0B1026] tabular-nums">
                      4
                    </span>
                  </div>
                  <p className="text-[8.5px] font-medium text-[#646A8A] mt-1">
                    Latest 2 min ago
                  </p>
                </div>
              </div>

              {/* Earnings Card */}
              <div className="p-3 rounded-[14px] bg-white border border-[#E4E7F2]">
                <span className="text-[12.8px] font-bold text-[#0B1026]">Earnings</span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-[25.6px] leading-[29px] font-extrabold tracking-[-0.7px] text-[#0B1026] tabular-nums">
                    $2,591.20
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#15803D]">
                    <ArrowUpRight className="w-3 h-3" />
                    +24%
                  </span>
                </div>
                <p className="text-[8.5px] font-medium text-[#646A8A] mt-1">
                  ≈ USD at today’s rate · since you joined
                </p>

                {/* Currency breakdown pills */}
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-[10px] bg-[#EEF0F7]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#0B1026] flex items-center justify-center">
                        <StellarNetworkIcon className="w-2.5 h-2.5" color="#FFFFFF" />
                      </span>
                      <span className="text-[10px] font-bold text-[#0B1026]">12,092 XLM</span>
                      <span className="text-[8.5px] font-medium text-[#646A8A]">≈ $1,451.07</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-full bg-[#E7F6EC] text-[#15803D] text-[8.5px] font-bold">
                      ↗ +38%
                    </span>
                  </div>

                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-[10px] bg-[#EEF0F7]">
                    <div className="flex items-center gap-1.5">
                      <UsdcBadge size={14} />
                      <span className="text-[10px] font-bold text-[#0B1026]">1,140 USDC</span>
                      <span className="text-[8.5px] font-medium text-[#646A8A]">≈ $1,140.13</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-full bg-[#E7F6EC] text-[#15803D] text-[8.5px] font-bold">
                      ↗ +19%
                    </span>
                  </div>
                </div>

                {/* Compact Bar Chart */}
                <div className="mt-4">
                  <div className="flex items-end justify-between mb-1">
                    <span className="text-[8.5px] text-[#646A8A]">$800</span>
                    <div className="px-2 py-1 rounded-[8.5px] bg-white border border-[#E4E7F2] shadow-md">
                      <div className="text-[8px] text-[#646A8A]">Sep 2026</div>
                      <div className="text-[10px] font-extrabold text-[#0B1026]">$686.30</div>
                    </div>
                  </div>
                  <div className="border-t border-dashed border-[#6A4CF5] pt-2 flex items-end justify-between gap-1.5">
                    <div className="flex flex-col justify-between h-[98px] text-[8.5px] text-[#646A8A] pr-1">
                      <span>$600</span>
                      <span>$400</span>
                      <span>$200</span>
                      <span>$0</span>
                    </div>
                    {CHART_DATA.map((bar) => (
                      <div key={bar.month} className="flex flex-col items-center gap-1">
                        <div className="relative flex items-end h-[98px]">
                          {bar.highlighted && (
                            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white border-2 border-[#6A4CF5] z-10" />
                          )}
                          <div
                            style={{ height: bar.mobileHeightPx }}
                            className={`w-[22px] rounded-[7px] ${
                              bar.highlighted ? 'bg-[#6A4CF5]' : 'bg-[#DCDFEA]'
                            }`}
                          />
                        </div>
                        <span
                          className={`text-[8.5px] px-1 rounded-full ${
                            bar.highlighted
                              ? 'bg-[#F3F0FF] text-[#4A2FC2] font-bold'
                              : 'text-[#646A8A] font-medium'
                          }`}
                        >
                          {bar.month}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Latest Tip Card */}
              <div className="p-3.5 rounded-[14px] bg-[#0B1026] text-white">
                <div className="flex items-center justify-between text-[8.5px]">
                  <span className="font-semibold tracking-wider text-[#C6FF3D] uppercase">
                    LATEST TIP
                  </span>
                  <span className="text-[#B3B8D4]">2 min ago</span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5 font-anton text-[22px] leading-[26px] tracking-[0.35px] uppercase">
                  <span>MARA TIPPED</span>
                  <span className="text-[#C6FF3D]">25 XLM</span>
                </div>
                <p className="mt-2 text-[10px] leading-[14px] text-[#DDE0F0]">
                  “Your last tutorial saved my weekend. Keep them coming.”
                </p>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#3DD68C]/12 border border-[#3DD68C]/38 text-[#3DD68C] text-[8.5px] font-semibold">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Confirmed
                  </span>
                  <span className="font-mono-code text-[8.5px] text-[#B3B8D4] inline-flex items-center gap-1">
                    tx 3f9a…c21e <ExternalLink className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>

              {/* Recent Tips Card */}
              <div className="rounded-[14px] bg-white border border-[#E4E7F2] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-[12.8px] font-bold text-[#0B1026]">Recent tips</span>
                  <span className="text-[10px] font-bold text-[#6A4CF5]">View all</span>
                </div>
                <div className="divide-y divide-[#E4E7F2]">
                  {INITIAL_TIPS.slice(0, 4).map((t) => (
                    <div key={t.id} className="px-3 py-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          style={{ backgroundColor: t.avatarBg, color: t.avatarColor }}
                          className="w-[22px] h-[22px] rounded-full font-extrabold text-[10px] flex items-center justify-center shrink-0"
                        >
                          {t.isAnonymous ? (
                            <StarFourPoint className="w-2.5 h-2.5" color="#C6FF3D" />
                          ) : (
                            t.initial
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-[#0B1026] truncate">
                            {t.supporter}
                          </div>
                          <div className="text-[8.5px] text-[#646A8A] truncate">{t.message}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] font-extrabold text-[#0B1026] tabular-nums">
                          {t.amount}
                        </div>
                        {t.status === 'Pending' ? (
                          <span className="inline-block px-1.5 py-0.5 rounded-full bg-[#FDF1E1] border border-[#F6CF94] text-[#B45309] text-[7.8px] font-semibold">
                            Pending
                          </span>
                        ) : (
                          <div className="text-[8.5px] text-[#646A8A]">{t.when}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Your Tip Page Card */}
              <div className="p-3 rounded-[14px] bg-white border border-[#E4E7F2] space-y-2">
                <div className="text-[12.8px] font-bold text-[#0B1026]">Your tip page</div>
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-[10px] border border-[#E4E7F2]">
                  <span className="font-mono-code text-[10px] text-[#0B1026]">
                    startip.app/tobibuilds
                  </span>
                  <button onClick={handleCopyLink} className="text-[#0B1026]">
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="text-[10px] text-[#4A5070]">
                  Widget live on <strong className="text-[#0B1026]">tobi.dev</strong>
                </div>
              </div>

              {/* Top Supporters Card */}
              <div className="p-3 rounded-[14px] bg-white border border-[#E4E7F2] space-y-2">
                <div>
                  <div className="text-[12.8px] font-bold text-[#0B1026]">Top supporters</div>
                  <div className="text-[8.5px] text-[#646A8A]">By USD value · All time</div>
                </div>
                <div className="space-y-1.5">
                  {[
                    { rank: 1, name: 'Alex', init: 'A', bg: '#E3EEFF', col: '#1D4FA8', amt: '160 USDC', usd: '≈ $160.00' },
                    { rank: 2, name: 'Kemi', init: 'K', bg: '#EEFFC2', col: '#3F5A00', amt: '95 USDC', usd: '≈ $95.00' },
                    { rank: 3, name: 'Mara', init: 'M', bg: '#ECE8FF', col: '#4A2FC2', amt: '310 XLM', usd: '≈ $37.20' },
                  ].map((s) => (
                    <div key={s.rank} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[8.5px] font-semibold text-[#646A8A] w-2">
                          {s.rank}
                        </span>
                        <div
                          style={{ backgroundColor: s.bg, color: s.col }}
                          className="w-[22px] h-[22px] rounded-full font-extrabold text-[10px] flex items-center justify-center"
                        >
                          {s.init}
                        </div>
                        <span className="text-[10px] font-bold text-[#0B1026]">{s.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-extrabold text-[#0B1026]">{s.amt}</div>
                        <div className="text-[8.5px] text-[#646A8A]">{s.usd}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Fade Gradient matching Figma "Dashboard fade" */}
          <div
            className="pointer-events-none absolute bottom-0 inset-x-0 h-[110px] z-10"
            style={{
              background:
                'linear-gradient(180deg, rgba(11, 15, 36, 0) 0%, rgba(11, 15, 36, 0.8) 65%, #0B0F24 100%)',
            }}
          />
        </div>
      </div>
    );
  }

  // ============================================================================
  // DESKTOP EMBEDDED WINDOW OR FULL-SCREEN DASHBOARD
  // ============================================================================
  const isPreview = mode === 'desktop-preview';

  const dashboardInner = (
    <div
      className={`flex flex-col md:flex-row bg-[#F6F7FB] text-[#0B1026] ${
        isPreview
          ? 'w-full h-[900px] rounded-[18px] overflow-hidden relative'
          : 'min-h-screen w-full'
      }`}
    >
      {/* Mobile Header when in Full Mode */}
      {!isPreview && (
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#E4E7F2] sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#F6F7FB]"
            >
              <Menu className="w-5 h-5 text-[#0B1026]" />
              {unreadAlerts > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#C6FF3D] ring-2 ring-white" />
              )}
            </button>
            <button onClick={onBackToLanding} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[7px] bg-[#C6FF3D] flex items-center justify-center">
                <StarFourPoint className="w-4 h-4" color="#0B1026" />
              </div>
              <span className="font-extrabold text-[16px] tracking-[-0.4px] text-[#0B1026]">
                StarTip
              </span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0B1026] text-[#C6FF3D] text-[10px] font-semibold">
              <Globe className="w-3 h-3 text-[#C6FF3D]" />
              Testnet
            </span>
            {onBackToLanding && (
              <button
                onClick={onBackToLanding}
                className="px-3 py-1.5 rounded-full border border-[#E4E7F2] text-xs font-semibold text-[#0B1026]"
              >
                Home
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Drawer when in Full Mode */}
      {!isPreview && mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden flex">
          <div className="w-[260px] bg-white h-full flex flex-col justify-between p-4">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E4E7F2]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[7px] bg-[#C6FF3D] flex items-center justify-center">
                    <StarFourPoint className="w-4 h-4" color="#0B1026" />
                  </div>
                  <span className="font-extrabold text-[16px] text-[#0B1026]">StarTip</span>
                </div>
                <button onClick={() => setMobileDrawerOpen(false)} className="p-1.5">
                  <X className="w-5 h-5 text-[#0B1026]" />
                </button>
              </div>
              <nav className="mt-4 space-y-1">
                {(
                  [
                    { id: 'overview', label: 'Overview', icon: LayoutGrid },
                    { id: 'widget', label: 'Widget', icon: Sparkles },
                    { id: 'embed', label: 'Embed code', icon: Code2 },
                    { id: 'history', label: 'History', icon: History },
                    { id: 'alerts', label: 'Live alerts', icon: Bell, badge: unreadAlerts },
                    { id: 'settings', label: 'Settings', icon: Settings },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileDrawerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[8px] text-[13px] font-semibold transition ${
                        active
                          ? 'bg-[#0B1026] text-white'
                          : 'text-[#4A5070] hover:bg-[#F6F7FB] hover:text-[#0B1026]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </span>
                      {'badge' in item && item.badge ? (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#C6FF3D] text-[#0B1026] text-[10px] font-bold">
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded-[11px] bg-[#F6F7FB] border border-[#E4E7F2] space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#0B1026] text-[#C6FF3D] font-extrabold text-[13px] flex items-center justify-center ring-2 ring-[#C6FF3D]">
                    {(creator?.display_name || creatorName).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#0B1026]">{creator?.display_name || creatorName}</div>
                    <div className="text-[10px] font-medium text-[#646A8A]">@{effectiveHandle}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between px-2 py-1.5 rounded-[8px] bg-white border border-[#E4E7F2]">
                  <div className="flex items-center gap-1.5">
                    <WalletLogo name={connectedWallet} size={16} />
                    <span className="font-mono-code text-[10px] text-[#4A5070]">
                      {walletAddress ? `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}` : 'GBXK…7Q2M'}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#E7F6EC] border border-[#A7E3BE] text-[#15803D] text-[9px] font-semibold">
                    ✓ Connected
                  </span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#4A5070] hover:text-[#0B1026]"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (208px wide as in Figma spec) */}
      <aside
        className={`${
          isPreview ? 'flex' : 'hidden md:flex'
        } w-[208px] shrink-0 bg-white border-r border-[#E4E7F2] flex-col justify-between pb-5 select-none`}
      >
        <div className="space-y-6">
          {/* Logo */}
          <div className="h-[65px] px-5 flex items-center justify-between">
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-[26px] h-[26px] rounded-[7px] bg-[#C6FF3D] flex items-center justify-center">
                <StarFourPoint className="w-4 h-4" color="#0B1026" />
              </div>
              <span className="font-extrabold text-[16.25px] leading-[23px] tracking-[-0.4px] text-[#0B1026]">
                StarTip
              </span>
            </button>
          </div>

          {/* Nav items */}
          <nav className="px-3 space-y-1">
            {(
              [
                { id: 'overview', label: 'Overview', icon: LayoutGrid },
                { id: 'widget', label: 'Widget', icon: Sparkles },
                { id: 'embed', label: 'Embed code', icon: Code2 },
                { id: 'history', label: 'History', icon: History },
                { id: 'alerts', label: 'Live alerts', icon: Bell, badge: unreadAlerts },
                { id: 'settings', label: 'Settings', icon: Settings },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id === 'alerts') setUnreadAlerts(0);
                  }}
                  className={`w-full h-[36px] px-2.5 rounded-[8.125px] flex items-center justify-between text-[11.375px] leading-[16px] font-semibold transition-colors ${
                    active
                      ? 'bg-[#0B1026] text-white'
                      : 'text-[#4A5070] hover:bg-[#F6F7FB] hover:text-[#0B1026]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-[16.25px] h-[16.25px]" />
                    <span>{item.label}</span>
                  </span>
                  {'badge' in item && item.badge ? (
                    <span className="px-1.5 py-0.5 rounded-[8px] bg-[#C6FF3D] text-[#0B1026] text-[9.75px] leading-[14px] font-semibold">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Account Card */}
        <div className="px-3 space-y-3">
          <div className="p-2.5 rounded-[11.375px] bg-[#F6F7FB] border border-[#E4E7F2] space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div
                className="w-[32.5px] h-[32.5px] rounded-full bg-[#0B1026] text-[#C6FF3D] font-extrabold text-[13px] flex items-center justify-center shrink-0"
                style={{
                  boxShadow: '0px 0px 0px 1.625px #F6F7FB, 0px 0px 0px 2.84375px #C6FF3D',
                }}
              >
                {(creator?.display_name || creatorName).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-[11.375px] leading-[16px] font-bold text-[#0B1026] truncate">
                  {creator?.display_name || creatorName}
                </div>
                <div className="text-[9.75px] leading-[13px] font-medium text-[#646A8A] truncate">
                  @{effectiveHandle}
                </div>
              </div>
            </div>

            <div className="px-2 py-1.5 rounded-[8.125px] bg-white border border-[#E4E7F2] flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <WalletLogo name={connectedWallet} size={16} />
                <span className="font-mono-code text-[9.75px] leading-[13px] text-[#4A5070] truncate">
                  {walletAddress ? `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}` : 'GBXK…7Q2M'}
                </span>
              </div>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[8px] bg-[#E7F6EC] border border-[#A7E3BE] text-[#15803D] text-[8.9px] leading-[10px] font-semibold shrink-0">
                ✓ Connected
              </span>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full px-2.5 py-2 rounded-[8px] flex items-center gap-2 text-[11.375px] font-semibold text-[#4A5070] hover:bg-[#F6F7FB] hover:text-[#0B1026] transition-colors"
          >
            <LogOut className="w-[14.6px] h-[14.6px]" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar (65px height) */}
        <div className="h-[65px] px-4 md:px-8 bg-white border-b border-[#E4E7F2] flex items-center justify-between shrink-0">
          <div>
            <div className="text-[13px] leading-[20px] font-semibold text-[#4A5070]">
              Welcome, {creator?.display_name || creatorName}
            </div>
            <div className="text-[9.75px] leading-[13px] font-medium text-[#646A8A]">
              Stellar Testnet Live Dashboard
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Testnet pill */}
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0B1026] text-[#C6FF3D] text-[9.75px] font-semibold">
              <Globe className="w-3 h-3 text-[#C6FF3D]" />
              <span>Testnet</span>
            </div>

            {/* Day mode pill */}
            <div className="hidden sm:flex items-center gap-3 pl-3.5 pr-1 py-1 rounded-full bg-[#EEF0F7] border border-[#E4E7F2]">
              <span className="text-[9.75px] font-bold tracking-[0.4px] text-[#0B1026] uppercase">
                DAY MODE
              </span>
              <span className="w-[27.6px] h-[27.6px] rounded-full bg-white shadow-sm flex items-center justify-center text-[#0B1026]">
                <Sun className="w-4 h-4" />
              </span>
            </div>

            {/* Share your page button */}
            <button
              onClick={handleCopyLink}
              className="h-[45.5px] pl-5 pr-1.5 rounded-full bg-[#C6FF3D] hover:brightness-95 transition flex items-center gap-3.5 cursor-pointer"
            >
              <span className="font-bold text-[13px] leading-[17px] text-[#0B1026] whitespace-nowrap">
                {copiedLink ? 'Link copied!' : 'Share your page'}
              </span>
              <span className="w-[32.5px] h-[32.5px] rounded-full bg-[#0B1026] flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 text-[#C6FF3D]" />
              </span>
            </button>
          </div>
        </div>

        {/* Tab Viewport */}
        <div
          className={`flex-1 px-4 md:px-8 pt-6 pb-12 ${
            isPreview ? 'overflow-y-auto custom-scrollbar' : ''
          }`}
        >
          <div className="max-w-[898.5px] mx-auto space-y-5">
            {activeTab === 'overview' && (
              <>
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <h2 className="text-[32.5px] leading-[39px] font-extrabold tracking-[-0.81px] text-[#0B1026]">
                    Overview
                  </h2>
                  <div className="flex items-center gap-6 relative">
                    <span className="text-[11.375px] leading-[16px] font-medium text-[#646A8A]">
                      2 May 2026 – 16 Oct 2026
                    </span>
                    <button
                      onClick={() => setShowTimeframeMenu(!showTimeframeMenu)}
                      className="h-[35.75px] px-3.5 bg-white border border-[#E4E7F2] rounded-[9.75px] flex items-center gap-2 text-[11.375px] font-semibold text-[#0B1026] hover:border-[#C9CEE2]"
                    >
                      <Calendar className="w-[13px] h-[13px]" />
                      <span>{timeframe}</span>
                      <ChevronDown className="w-[13px] h-[13px]" />
                    </button>
                    {showTimeframeMenu && (
                      <div className="absolute right-0 top-10 z-30 w-36 bg-white border border-[#E4E7F2] rounded-xl shadow-lg py-1">
                        {(['All time', 'This month', 'Last 7 days'] as const).map((tf) => (
                          <button
                            key={tf}
                            onClick={() => {
                              setTimeframe(tf);
                              setShowTimeframeMenu(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-[#0B1026] hover:bg-[#F6F7FB]"
                          >
                            {tf}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 4 KPI Cards Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Card 1: Total XLM tips */}
                  <div
                    className="relative h-[130px] p-4 rounded-[16.25px] text-white flex flex-col justify-between overflow-hidden"
                    style={{
                      background: 'linear-gradient(140deg, #232B63 14.51%, #0B1026 65.62%)',
                    }}
                  >
                    {/* Subtle decorative orbital rings */}
                    <div className="pointer-events-none absolute -right-8 -top-8 w-32 h-32 rounded-full border-[5px] border-white/10" />
                    <div className="pointer-events-none absolute -right-3 -top-3 w-20 h-20 rounded-full border-[3px] border-white/10" />

                    <div className="relative z-10 flex items-center justify-between">
                      <span className="text-[13px] leading-[20px] font-semibold text-white">
                        Total XLM tips
                      </span>
                      <button
                        onClick={() => {
                          setHistoryFilter('XLM');
                          setActiveTab('history');
                        }}
                        className="w-[26px] h-[26px] rounded-full bg-white flex items-center justify-center hover:scale-105 transition"
                        title="Open XLM tips in History"
                      >
                        <ArrowUpRight className="w-[13px] h-[13px] text-[#0B1026]" />
                      </button>
                    </div>

                    <div className="relative z-10 flex items-baseline gap-1.5">
                      <span className="text-[32.5px] leading-[39px] font-extrabold tracking-[-0.81px] text-white tabular-nums">
                        {mode === 'full' ? (dashboardData ? Number(dashboardData.total_xlm_tips).toLocaleString() : '0') : '12,092'}
                      </span>
                      <span className="text-[14.6px] leading-[20px] font-bold text-[#C9CEE2]">
                        XLM
                      </span>
                    </div>

                    <div className="relative z-10 text-[9.75px] leading-[13px] font-medium text-[#C9CEE2]">
                      ≈ ${mode === 'full' ? (Number(dashboardData?.total_xlm_tips || 0) * 0.12).toFixed(2) : '1,451.07'} · {mode === 'full' ? (dashboardData?.total_tips_count || 0) : '268'} tips
                    </div>
                  </div>

                  {/* Card 2: Total USDC tips */}
                  <div className="h-[130px] p-4 rounded-[16.25px] bg-white border border-[#E4E7F2] flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] leading-[20px] font-semibold text-[#0B1026]">
                        Total USDC tips
                      </span>
                      <button
                        onClick={() => {
                          setHistoryFilter('USDC');
                          setActiveTab('history');
                        }}
                        className="w-[26px] h-[26px] rounded-full border border-[#C9CEE2] flex items-center justify-center hover:bg-[#F6F7FB] transition"
                        title="Open USDC tips in History"
                      >
                        <ArrowUpRight className="w-[13px] h-[13px] text-[#4A5070]" />
                      </button>
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[32.5px] leading-[39px] font-extrabold tracking-[-0.81px] text-[#0B1026] tabular-nums">
                        {mode === 'full' ? (dashboardData ? Number(dashboardData.total_usdc_tips).toLocaleString() : '0') : '1,140'}
                      </span>
                      <span className="text-[14.6px] leading-[20px] font-bold text-[#646A8A]">
                        USDC
                      </span>
                    </div>

                    <div className="text-[9.75px] leading-[13px] font-medium text-[#646A8A]">
                      ≈ ${mode === 'full' ? Number(dashboardData?.total_usdc_tips || 0).toFixed(2) : '1,140.13'} · Direct to wallet
                    </div>
                  </div>

                  {/* Card 3: Number of tips */}
                  <div className="h-[130px] p-4 rounded-[16.25px] bg-white border border-[#E4E7F2] flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] leading-[20px] font-semibold text-[#0B1026]">
                        Number of tips
                      </span>
                      <button
                        onClick={() => {
                          setHistoryFilter('ALL');
                          setActiveTab('history');
                        }}
                        className="w-[26px] h-[26px] rounded-full border border-[#C9CEE2] flex items-center justify-center hover:bg-[#F6F7FB] transition"
                        title="Open tip history"
                      >
                        <ArrowUpRight className="w-[13px] h-[13px] text-[#4A5070]" />
                      </button>
                    </div>

                    <div>
                      <span className="text-[32.5px] leading-[39px] font-extrabold tracking-[-0.81px] text-[#0B1026] tabular-nums">
                        {mode === 'full' ? (dashboardData?.total_tips_count ?? 0) : '479'}
                      </span>
                    </div>

                    <div className="text-[9.75px] leading-[13px] font-medium text-[#646A8A]">
                      {mode === 'full' ? 'Stellar on-chain verified' : 'From 212 supporters'}
                    </div>
                  </div>

                  {/* Card 4: Tips today */}
                  <div className="h-[130px] p-4 rounded-[16.25px] bg-white border border-[#E4E7F2] flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] leading-[20px] font-semibold text-[#0B1026]">
                        Tips today
                      </span>
                      <span
                        className="w-[26px] h-[26px] flex items-center justify-center text-[#646A8A]"
                        title="Tips today: counted from midnight in your time zone"
                      >
                        <Info className="w-[13px] h-[13px]" />
                      </span>
                    </div>

                    <div>
                      <span className="text-[32.5px] leading-[39px] font-extrabold tracking-[-0.81px] text-[#0B1026] tabular-nums">
                        {mode === 'full' ? (dashboardData?.tips_today_count ?? 0) : '4'}
                      </span>
                    </div>

                    <div className="text-[9.75px] leading-[13px] font-medium text-[#646A8A]">
                      {mode === 'full' ? 'Counted since 00:00 UTC' : 'Latest 2 min ago'}
                    </div>
                  </div>
                </div>

                {/* Middle Row: Earnings Card (585px) + LATEST TIP Card (292.5px) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Earnings Card */}
                  <div className="lg:col-span-8 p-5 rounded-[16.25px] bg-white border border-[#E4E7F2] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[16.25px] leading-[23px] font-bold text-[#0B1026]">
                          Earnings
                        </span>
                        <span className="px-2.5 py-1.5 rounded-[8.125px] border border-[#E4E7F2] text-[9.75px] leading-[13px] font-semibold text-[#4A5070]">
                          All time
                        </span>
                      </div>

                      <div className="mt-3.5 flex items-baseline gap-6">
                        <span className="text-[39px] leading-[42px] font-extrabold tracking-[-1.2px] text-[#0B1026] tabular-nums">
                          ${mode === 'full' ? (Number(dashboardData?.total_xlm_tips || 0) * 0.12 + Number(dashboardData?.total_usdc_tips || 0)).toFixed(2) : '2,591.20'}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[11.375px] leading-[16px] font-bold text-[#15803D]">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          +100%
                        </span>
                      </div>
                      <p className="mt-1.5 text-[9.75px] leading-[13px] font-medium text-[#646A8A]">
                        ≈ USD at testnet rate · non-custodial
                      </p>

                      {/* 2 Currency Breakdown Pills */}
                      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="h-[42.25px] px-3 rounded-[11.375px] bg-[#EEF0F7] flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-[#0B1026] flex items-center justify-center">
                                <StellarNetworkIcon className="w-3 h-3" color="#FFFFFF" />
                              </span>
                              <span className="text-[11.375px] font-bold text-[#0B1026] tabular-nums">
                                {mode === 'full' ? (dashboardData ? Number(dashboardData.total_xlm_tips).toLocaleString() : '0') : '12,092'} XLM
                              </span>
                            </div>
                            <span className="text-[11.375px] font-medium text-[#646A8A] tabular-nums">
                              ≈ ${mode === 'full' ? (Number(dashboardData?.total_xlm_tips || 0) * 0.12).toFixed(2) : '1,451.07'}
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded-full bg-[#E7F6EC] text-[#15803D] text-[9.75px] font-bold">
                            <ArrowUpRight className="w-2.5 h-2.5" />
                            Stellar
                          </span>
                        </div>

                        <div className="h-[42.25px] px-3 rounded-[11.375px] bg-[#EEF0F7] flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <UsdcBadge size={16} />
                              <span className="text-[11.375px] font-bold text-[#0B1026] tabular-nums">
                                {mode === 'full' ? (dashboardData ? Number(dashboardData.total_usdc_tips).toLocaleString() : '0') : '1,140'} USDC
                              </span>
                            </div>
                            <span className="text-[11.375px] font-medium text-[#646A8A] tabular-nums">
                              ≈ ${mode === 'full' ? Number(dashboardData?.total_usdc_tips || 0).toFixed(2) : '1,140.13'}
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded-full bg-[#E7F6EC] text-[#15803D] text-[9.75px] font-bold">
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bar Chart Area */}
                    <div className="mt-5">
                      <div className="flex items-end justify-between mb-1 pr-8">
                        <span className="text-[9.75px] font-medium text-[#646A8A]">$800</span>
                        <div
                          className="px-3 py-2 rounded-[9.75px] bg-white border border-[#E4E7F2]"
                          style={{
                            boxShadow:
                              '0px 1.625px 3.25px rgba(11, 16, 38, 0.06), 0px 9.75px 26px rgba(11, 16, 38, 0.14)',
                          }}
                        >
                          <div className="text-[9.75px] leading-[13px] font-medium text-[#646A8A]">
                            {selectedMonth} 2026
                          </div>
                          <div className="text-[13px] leading-[20px] font-extrabold text-[#0B1026] tabular-nums">
                            {CHART_DATA.find((d) => d.month === selectedMonth)?.label || '$686.30'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-end gap-5">
                        {/* Y-axis labels */}
                        <div className="flex flex-col justify-between h-[154px] text-[9.75px] font-medium text-[#646A8A] pb-1">
                          <span>$600</span>
                          <span>$400</span>
                          <span>$200</span>
                          <span>$0</span>
                        </div>

                        {/* Bars + Dashed $800 line */}
                        <div className="flex-1 border-t-[1.625px] border-dashed border-[#6A4CF5] pt-1.5">
                          <div className="grid grid-cols-6 gap-3 sm:gap-6 items-end h-[154px]">
                            {CHART_DATA.map((bar) => {
                              const isSelected = selectedMonth === bar.month;
                              return (
                                <button
                                  key={bar.month}
                                  onClick={() => setSelectedMonth(bar.month)}
                                  className="group flex flex-col items-center justify-end h-full focus:outline-none"
                                >
                                  <div className="relative w-full max-w-[53px] flex items-end justify-center">
                                    {isSelected && (
                                      <span className="absolute -top-1.5 w-[11.38px] h-[11.38px] rounded-full bg-white border-[2.4px] border-[#6A4CF5] z-10" />
                                    )}
                                    <div
                                      style={{ height: bar.heightPx }}
                                      className={`w-full rounded-[11.375px] transition-colors ${
                                        isSelected
                                          ? 'bg-[#6A4CF5]'
                                          : 'bg-[#DCDFEA] group-hover:bg-[#C9CEE2]'
                                      }`}
                                    />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* X-axis Month Labels */}
                      <div className="flex items-center gap-5 mt-2">
                        <div className="w-[26px]" />
                        <div className="flex-1 grid grid-cols-6 gap-3 sm:gap-6 text-center">
                          {CHART_DATA.map((bar) => {
                            const isSelected = selectedMonth === bar.month;
                            return (
                              <button
                                key={bar.month}
                                onClick={() => setSelectedMonth(bar.month)}
                                className={`mx-auto px-2 py-0.5 rounded-full text-[9.75px] leading-[13px] transition ${
                                  isSelected
                                    ? 'bg-[#F3F0FF] text-[#4A2FC2] font-bold'
                                    : 'text-[#646A8A] font-medium hover:text-[#0B1026]'
                                }`}
                              >
                                {bar.month}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* LATEST TIP Card */}
                  <div className="lg:col-span-4 p-5 rounded-[16.25px] bg-[#0B1026] text-white relative overflow-hidden flex flex-col justify-between">
                    {/* Decorative background rings */}
                    <div className="pointer-events-none absolute -right-12 -top-10 w-44 h-44 rounded-full border-[8px] border-[#A894FF]/20" />
                    <div className="pointer-events-none absolute -right-4 -top-2 w-28 h-28 rounded-full border-[5px] border-[#A894FF]/20" />

                    <div className="relative z-10 space-y-5">
                      <div className="flex items-center justify-between text-[9.75px] leading-[13px]">
                        <span className="font-semibold tracking-[0.4px] text-[#C6FF3D] uppercase">
                          LATEST TIP
                        </span>
                        <span className="font-medium text-[#B3B8D4]">2 min ago</span>
                      </div>

                      <div className="font-anton text-[45.5px] leading-[46px] tracking-[0.4px] uppercase">
                        <div className="text-white">MARA TIPPED</div>
                        <div className="text-[#C6FF3D]">25 XLM</div>
                      </div>

                      <p className="text-[13px] leading-[20px] text-[#DDE0F0]">
                        “Your last tutorial saved my weekend. Keep them coming.”
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#3DD68C]/12 border border-[#3DD68C]/38 text-[#3DD68C] text-[9.75px] font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          Confirmed
                        </span>
                        <a
                          href="#explorer"
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveTab('history');
                          }}
                          className="inline-flex items-center gap-1 font-mono-code text-[9.75px] text-[#B3B8D4] hover:text-white"
                        >
                          <span>tx 3f9a…c21e</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* BIGGEST TIP section */}
                    <div className="relative z-10 pt-3.5 mt-6 border-t border-white/12 space-y-2.5">
                      <div className="flex items-center justify-between text-[9.75px] leading-[13px]">
                        <span className="font-semibold tracking-[0.4px] text-[#8A91B4] uppercase">
                          BIGGEST TIP
                        </span>
                        <span className="font-medium text-[#8A91B4]">All time</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-[32.5px] h-[32.5px] rounded-full bg-[#5A9CFF]/22 text-[#8DBBFF] font-extrabold text-[13px] flex items-center justify-center">
                            A
                          </div>
                          <div>
                            <div className="text-[11.375px] leading-[16px] font-bold text-white">
                              Alex
                            </div>
                            <div className="text-[9.75px] leading-[13px] font-medium text-[#8A91B4]">
                              12 Aug
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[16.25px] leading-[23px] font-extrabold text-[#C6FF3D] tabular-nums">
                            60 USDC
                          </div>
                          <div className="text-[9.75px] leading-[13px] font-medium text-[#8A91B4]">
                            ≈ $60.00
                          </div>
                        </div>
                      </div>

                      <div className="px-3 py-2 rounded-[9.75px] bg-white/[0.06] text-[11.375px] leading-[16px] text-[#DDE0F0]">
                        “The whole series paid for itself.”
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Recent Tips Table (585px) + Right Stack (Your tip page + Top supporters) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Recent Tips Table */}
                  <div className="lg:col-span-8 rounded-[16.25px] bg-white border border-[#E4E7F2] overflow-hidden flex flex-col">
                    <div className="px-5 py-4 flex items-center justify-between">
                      <span className="text-[16.25px] leading-[23px] font-bold text-[#0B1026]">
                        Recent tips
                      </span>
                      <button
                        onClick={() => setActiveTab('history')}
                        className="text-[11.375px] leading-[16px] font-bold text-[#6A4CF5] hover:underline"
                      >
                        View all history
                      </button>
                    </div>

                    {/* Table Header */}
                    <div className="px-5 py-2 bg-[#F6F7FB] border-y border-[#E4E7F2] grid grid-cols-12 text-[9.75px] leading-[13px] font-semibold tracking-[0.4px] text-[#646A8A] uppercase">
                      <div className="col-span-6">SUPPORTER</div>
                      <div className="col-span-2">AMOUNT</div>
                      <div className="col-span-2">STATUS</div>
                      <div className="col-span-2 text-right">WHEN</div>
                    </div>

                    {/* Table Rows */}
                    <div className="divide-y divide-[#EEF0F7]">
                      {((mode === 'full' && dashboardData?.recent_tips && dashboardData.recent_tips.length > 0)
                        ? dashboardData.recent_tips.map((t) => ({
                            id: t.id,
                            supporter: t.supporter_name || 'Anonymous',
                            initial: (t.supporter_name || 'A').charAt(0).toUpperCase(),
                            avatarBg: t.asset_code === 'USDC' ? '#E3EEFF' : '#ECE8FF',
                            avatarColor: t.asset_code === 'USDC' ? '#1D4FA8' : '#4A2FC2',
                            message: t.message || 'No message attached',
                            amount: `${t.amount} ${t.asset_code}`,
                            status: 'Confirmed' as const,
                            when: new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            isAnonymous: !t.supporter_name || t.supporter_name === 'Anonymous',
                          }))
                        : mode === 'full' && tipHistory.length > 0
                        ? tipHistory.slice(0, 6).map((t) => ({
                            id: String(t.id),
                            supporter: t.supporter_name || 'Anonymous',
                            initial: (t.supporter_name || 'A').charAt(0).toUpperCase(),
                            avatarBg: t.asset_code === 'USDC' ? '#E3EEFF' : '#ECE8FF',
                            avatarColor: t.asset_code === 'USDC' ? '#1D4FA8' : '#4A2FC2',
                            message: t.message || 'No message attached',
                            amount: `${t.amount} ${t.asset_code}`,
                            status: (t.status === 'confirmed' ? 'Confirmed' : 'Pending') as 'Confirmed' | 'Pending',
                            when: new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            isAnonymous: !t.supporter_name || t.supporter_name === 'Anonymous',
                          }))
                        : mode === 'full'
                        ? []
                        : INITIAL_TIPS
                      ).map((tip) => (
                        <div
                          key={tip.id}
                          className="px-5 py-3 grid grid-cols-12 items-center gap-2 hover:bg-[#F6F7FB]/60 transition-colors"
                        >
                          <div className="col-span-6 flex items-center gap-2.5 min-w-0">
                            <div
                              style={{
                                backgroundColor: tip.avatarBg,
                                color: tip.avatarColor,
                              }}
                              className="w-[26px] h-[26px] rounded-full font-extrabold text-[11.375px] flex items-center justify-center shrink-0"
                            >
                              {tip.isAnonymous ? (
                                <StarFourPoint className="w-3 h-3" color="#C6FF3D" />
                              ) : (
                                tip.initial
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[11.375px] leading-[16px] font-bold text-[#0B1026] truncate">
                                {tip.supporter}
                              </div>
                              <div className="text-[9.75px] leading-[13px] font-medium text-[#646A8A] truncate">
                                {tip.message}
                              </div>
                            </div>
                          </div>

                          <div className="col-span-2 text-[11.375px] leading-[16px] font-extrabold text-[#0B1026] tabular-nums">
                            {tip.amount}
                          </div>

                          <div className="col-span-2">
                            {tip.status === 'Confirmed' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#E7F6EC] border border-[#A7E3BE] text-[#15803D] text-[9.75px] leading-[12px] font-semibold">
                                <CheckCircle2 className="w-3 h-3" />
                                Confirmed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#FDF1E1] border border-[#F6CF94] text-[#B45309] text-[9.75px] leading-[12px] font-semibold">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                          </div>

                          <div className="col-span-2 text-right text-[9.75px] leading-[13px] font-medium text-[#646A8A]">
                            {tip.when}
                          </div>
                        </div>
                      ))}

                      {mode === 'full' && (!dashboardData?.recent_tips || dashboardData.recent_tips.length === 0) && tipHistory.length === 0 && (
                        <div className="p-8 text-center text-xs text-[#646A8A]">
                          No tips received yet. Your live tips will appear here instantly!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column Stack: Your tip page card + Top supporters card */}
                  <div className="lg:col-span-4 space-y-5">
                    {/* Your tip page card */}
                    <div className="p-5 rounded-[16.25px] bg-white border border-[#E4E7F2] space-y-3">
                      <div className="text-[16.25px] leading-[23px] font-bold text-[#0B1026]">
                        Your tip page
                      </div>

                      <div className="h-[39px] pl-3 pr-1 rounded-[11.375px] border border-[#E4E7F2] flex items-center justify-between">
                        <span className="font-mono-code text-[11.375px] text-[#0B1026] truncate">
                          startip.app/{effectiveHandle}
                        </span>
                        <button
                          onClick={handleCopyLink}
                          className="w-8 h-8 rounded-lg hover:bg-[#F6F7FB] flex items-center justify-center text-[#0B1026]"
                          title="Copy link"
                        >
                          {copiedLink ? (
                            <Check className="w-4 h-4 text-[#15803D]" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="text-[11.375px] leading-[16px] text-[#4A5070]">
                        Widget ready for <strong className="font-bold text-[#0B1026]">@{effectiveHandle}</strong>
                      </div>

                      <div className="pt-1 space-y-1">
                        <button
                          onClick={() => setActiveTab('widget')}
                          className="w-full p-2 rounded-[9.75px] hover:bg-[#F6F7FB] flex items-center justify-between transition text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-[32.5px] h-[32.5px] rounded-[8.125px] bg-[#F3F0FF] flex items-center justify-center text-[#4A2FC2]">
                              <Palette className="w-4 h-4" />
                            </span>
                            <div>
                              <div className="text-[11.375px] leading-[16px] font-bold text-[#0B1026]">
                                Customize widget
                              </div>
                              <div className="text-[9.75px] leading-[13px] font-medium text-[#646A8A]">
                                Colours, amounts and theme
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-[#646A8A]" />
                        </button>

                        <button
                          onClick={() => setActiveTab('embed')}
                          className="w-full p-2 rounded-[9.75px] hover:bg-[#F6F7FB] flex items-center justify-between transition text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-[32.5px] h-[32.5px] rounded-[8.125px] bg-[#F3F0FF] flex items-center justify-center text-[#4A2FC2]">
                              <Code2 className="w-4 h-4" />
                            </span>
                            <div>
                              <div className="text-[11.375px] leading-[16px] font-bold text-[#0B1026]">
                                Get embed code
                              </div>
                              <div className="text-[9.75px] leading-[13px] font-medium text-[#646A8A]">
                                Add the widget to any site
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-[#646A8A]" />
                        </button>

                        <button
                          onClick={() => {
                            if (onOpenDemo) onOpenDemo();
                            else setActiveTab('alerts');
                          }}
                          className="w-full p-2 rounded-[9.75px] hover:bg-[#F6F7FB] flex items-center justify-between transition text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-[32.5px] h-[32.5px] rounded-[8.125px] bg-[#F3F0FF] flex items-center justify-center text-[#4A2FC2]">
                              <Send className="w-4 h-4" />
                            </span>
                            <div>
                              <div className="text-[11.375px] leading-[16px] font-bold text-[#0B1026]">
                                Send a test tip
                              </div>
                              <div className="text-[9.75px] leading-[13px] font-medium text-[#646A8A]">
                                Testnet, no real money
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-[#646A8A]" />
                        </button>
                      </div>
                    </div>

                    {/* Top supporters card */}
                    <div className="p-5 rounded-[16.25px] bg-white border border-[#E4E7F2] space-y-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[16.25px] leading-[23px] font-bold text-[#0B1026]">
                          Top supporters
                        </span>
                        <span className="text-[9.75px] leading-[13px] font-medium text-[#646A8A]">
                          By USD value · All time
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {((mode === 'full' && dashboardData?.top_supporters && dashboardData.top_supporters.length > 0)
                          ? dashboardData.top_supporters.map((s, idx) => ({
                              rank: idx + 1,
                              name: s.supporter_name,
                              initial: s.supporter_name.charAt(0).toUpperCase(),
                              bg: s.asset_code === 'USDC' ? '#E3EEFF' : '#ECE8FF',
                              color: s.asset_code === 'USDC' ? '#1D4FA8' : '#4A2FC2',
                              amount: `${s.total_amount} ${s.asset_code}`,
                              usd: s.asset_code === 'USDC' ? `≈ $${Number(s.total_amount).toFixed(2)}` : `≈ $${(Number(s.total_amount) * 0.12).toFixed(2)}`,
                            }))
                          : [
                              {
                                rank: 1,
                                name: 'Alex',
                                initial: 'A',
                                bg: '#E3EEFF',
                                color: '#1D4FA8',
                                amount: '160 USDC',
                                usd: '≈ $160.00',
                              },
                              {
                                rank: 2,
                                name: 'Kemi',
                                initial: 'K',
                                bg: '#EEFFC2',
                                color: '#3F5A00',
                                amount: '95 USDC',
                                usd: '≈ $95.00',
                              },
                              {
                                rank: 3,
                                name: 'Mara',
                                initial: 'M',
                                bg: '#ECE8FF',
                                color: '#4A2FC2',
                                amount: '310 XLM',
                                usd: '≈ $37.20',
                              },
                            ]
                        ).map((s) => (
                          <div key={s.rank} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-[9.75px] font-semibold text-[#646A8A] w-3">
                                {s.rank}
                              </span>
                              <div
                                style={{ backgroundColor: s.bg, color: s.color }}
                                className="w-[26px] h-[26px] rounded-full font-extrabold text-[11.375px] flex items-center justify-center"
                              >
                                {s.initial}
                              </div>
                              <span className="text-[11.375px] leading-[16px] font-bold text-[#0B1026]">
                                {s.name}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-[11.375px] leading-[16px] font-extrabold text-[#0B1026] tabular-nums">
                                {s.amount}
                              </div>
                              <div className="text-[9.75px] leading-[13px] font-medium text-[#646A8A] tabular-nums">
                                {s.usd}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ============================================================== */}
            {/* TAB 2: WIDGET CUSTOMIZER                                       */}
            {/* ============================================================== */}
            {activeTab === 'widget' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-[28px] font-extrabold tracking-tight text-[#0B1026]">
                      Customize your tip widget
                    </h2>
                    <p className="text-sm text-[#646A8A]">
                      Changes update your public page startip.app/{effectiveHandle} and embedded widget immediately.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handleSaveWidgetConfig}
                      disabled={isSavingWidget}
                      className="px-4 py-2.5 rounded-full bg-[#C6FF3D] text-[#0B1026] text-xs font-extrabold flex items-center gap-1.5 hover:brightness-95 disabled:opacity-50 transition cursor-pointer shadow-sm"
                    >
                      {isSavingWidget ? (
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      )}
                      <span>{isSavingWidget ? 'Saving…' : 'Save Changes'}</span>
                    </button>
                    <button
                      onClick={onOpenDemo}
                      className="px-4 py-2.5 rounded-full bg-[#0B1026] text-[#C6FF3D] text-xs font-bold flex items-center gap-2 hover:opacity-90 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Test in Demo Mode
                    </button>
                  </div>
                </div>

                {saveStatus && (
                  <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${saveStatus.startsWith('Error') ? 'bg-[#FDF1E1] text-[#B45309]' : 'bg-[#E7F6EC] text-[#15803D]'}`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{saveStatus}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-[#E4E7F2] space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#0B1026] mb-1.5">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={creatorName}
                        onChange={(e) => setCreatorName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E7F2] text-sm text-[#0B1026] focus:outline-none focus:border-[#6A4CF5]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0B1026] mb-1.5">
                        StarTip Username
                      </label>
                      <div className="flex items-center rounded-xl border border-[#E4E7F2] px-3.5 py-2.5 bg-[#F6F7FB]">
                        <span className="font-mono-code text-xs text-[#646A8A]">startip.app/</span>
                        <input
                          type="text"
                          value={creatorHandle}
                          onChange={(e) => setCreatorHandle(e.target.value)}
                          className="flex-1 bg-transparent font-mono-code text-xs font-semibold text-[#0B1026] focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0B1026] mb-1.5">
                        Short Bio
                      </label>
                      <textarea
                        rows={3}
                        value={creatorBio}
                        onChange={(e) => setCreatorBio(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E7F2] text-sm text-[#0B1026] focus:outline-none focus:border-[#6A4CF5]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0B1026] mb-1.5">
                        Default Currency
                      </label>
                      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#EEF0F7]">
                        {(['USDC', 'XLM'] as const).map((cur) => (
                          <button
                            key={cur}
                            onClick={() => setWidgetCurrency(cur)}
                            className={`py-2 rounded-lg text-xs font-bold transition ${
                              widgetCurrency === cur
                                ? 'bg-white text-[#0B1026] shadow-sm'
                                : 'text-[#4A5070]'
                            }`}
                          >
                            {cur}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="lg:col-span-6 p-6 rounded-2xl bg-[#0B1026] flex flex-col items-center justify-center">
                    <div className="text-xs font-mono-code text-[#C6FF3D] mb-4">
                      [ Live Widget Preview ]
                    </div>
                    <div className="w-full max-w-[360px] rounded-[24px] bg-white p-5 text-[#0B1026] shadow-xl space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#0B1026] text-[#C6FF3D] font-extrabold text-base flex items-center justify-center">
                          {(creatorName || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-base text-[#0B1026]">{creatorName}</div>
                          <div className="font-mono-code text-xs text-[#7A809E]">
                            startip.app/{effectiveHandle}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-[#4A5070] leading-relaxed">{creatorBio}</p>
                      <div className="grid grid-cols-4 gap-2">
                        {(widgetCurrency === 'USDC' ? [1, 2, 5, 10] : [10, 25, 50, 100]).map((amt) => (
                          <button
                            key={amt}
                            onClick={() => setWidgetSelectedPreset(amt)}
                            className={`py-2.5 rounded-xl font-bold text-sm border transition ${
                              widgetSelectedPreset === amt
                                ? 'bg-[#0B1026] text-[#C6FF3D] border-[#0B1026]'
                                : 'border-[#E4E7F2] text-[#0B1026]'
                            }`}
                          >
                            {amt}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={onOpenDemo}
                        className="w-full py-3.5 rounded-full bg-[#C6FF3D] text-[#0B1026] font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {widgetCurrency === 'USDC' ? <UsdcBadge size={20} /> : <XlmBadge size={20} />}
                        <span>
                          Tip {widgetSelectedPreset} {widgetCurrency}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 3: EMBED CODE                                              */}
            {/* ============================================================== */}
            {activeTab === 'embed' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[28px] font-extrabold tracking-tight text-[#0B1026]">
                    Embed on your website or stream
                  </h2>
                  <p className="text-sm text-[#646A8A]">
                    Drop one script tag on your site or add your alert overlay URL into OBS Browser Source.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-[#E4E7F2] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-[#0B1026] block">
                        1. JavaScript Snippet (HTML / React / Next.js)
                      </span>
                      <span className="text-xs text-[#646A8A]">
                        Embeds a lightweight, floating tip button on any website.
                      </span>
                    </div>
                    <button
                      onClick={handleCopyEmbed}
                      className="px-3.5 py-1.5 rounded-full bg-[#C6FF3D] text-[#0B1026] text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:brightness-95"
                    >
                      {copiedEmbed ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedEmbed ? 'Copied snippet!' : 'Copy snippet'}
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-[#0B1026] text-[#C6FF3D] font-mono-code text-xs overflow-x-auto">
                    {`<script src="${appBaseUrl}/embed/${effectiveHandle}/widget.js" async></script>`}
                  </pre>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-[#E4E7F2] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-[#0B1026] block">
                        2. Direct iframe Embed Code
                      </span>
                      <span className="text-xs text-[#646A8A]">
                        Embed the full standalone tipping card into WordPress, Ghost, or Webflow.
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(`<iframe src="${appBaseUrl}/embed/${effectiveHandle}/" width="380" height="620" frameborder="0"></iframe>`);
                        setCopiedEmbed(true);
                        setTimeout(() => setCopiedEmbed(false), 2000);
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-[#0B1026] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy iframe
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-[#F6F7FB] border border-[#E4E7F2] text-[#0B1026] font-mono-code text-xs overflow-x-auto">
                    {`<iframe src="${appBaseUrl}/embed/${effectiveHandle}/" width="380" height="620" frameborder="0"></iframe>`}
                  </pre>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-[#E4E7F2] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-[#0B1026] block">
                        3. OBS Stream Alert Overlay URL
                      </span>
                      <span className="text-xs text-[#646A8A]">
                        Add as a Browser Source in OBS Studio or Streamlabs for real-time alert popups.
                      </span>
                    </div>
                    <button
                      onClick={handleCopyObs}
                      className="px-3.5 py-1.5 rounded-full bg-[#0B1026] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                    >
                      {copiedObs ? <Check className="w-3.5 h-3.5 text-[#C6FF3D]" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedObs ? 'Copied OBS URL!' : 'Copy OBS URL'}
                    </button>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F6F7FB] border border-[#E4E7F2] font-mono-code text-xs text-[#0B1026] break-all">
                    {appBaseUrl}/overlay/{overlayToken}/
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 4: FULL HISTORY                                            */}
            {/* ============================================================== */}
            {activeTab === 'history' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[28px] font-extrabold tracking-tight text-[#0B1026]">
                      Tip History
                    </h2>
                    <p className="text-xs text-[#646A8A]">
                      Every tip settles directly into your Stellar wallet with an on-chain receipt.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#646A8A] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search supporter or message…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-2 rounded-xl bg-white border border-[#E4E7F2] text-xs text-[#0B1026] focus:outline-none focus:border-[#6A4CF5]"
                      />
                    </div>
                    <div className="flex items-center p-1 rounded-xl bg-[#EEF0F7]">
                      {(['ALL', 'USDC', 'XLM'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setHistoryFilter(f)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            historyFilter === f
                              ? 'bg-white text-[#0B1026] shadow-sm'
                              : 'text-[#4A5070]'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E4E7F2] overflow-hidden">
                  <div className="px-5 py-2.5 bg-[#F6F7FB] border-b border-[#E4E7F2] grid grid-cols-12 text-[10px] font-semibold text-[#646A8A] uppercase">
                    <div className="col-span-5">SUPPORTER & MESSAGE</div>
                    <div className="col-span-2">AMOUNT</div>
                    <div className="col-span-2">STATUS</div>
                    <div className="col-span-2">TRANSACTION</div>
                    <div className="col-span-1 text-right">WHEN</div>
                  </div>
                  <div className="divide-y divide-[#EEF0F7]">
                    {(mode === 'full'
                      ? tipHistory.map((t) => ({
                          id: String(t.id),
                          supporter: t.supporter_name || 'Anonymous',
                          initial: (t.supporter_name || 'A').charAt(0).toUpperCase(),
                          avatarBg: t.asset_code === 'USDC' ? '#E3EEFF' : '#ECE8FF',
                          avatarColor: t.asset_code === 'USDC' ? '#1D4FA8' : '#4A2FC2',
                          message: t.message || 'No message attached',
                          amount: `${t.amount} ${t.asset_code}`,
                          usdValue: t.asset_code === 'USDC' ? `$${Number(t.amount).toFixed(2)}` : `$${(Number(t.amount) * 0.12).toFixed(2)}`,
                          status: t.status === 'confirmed' ? 'Confirmed' : t.status === 'failed' ? 'Failed' : 'Pending',
                          txHash: t.stellar_tx_hash ? `${t.stellar_tx_hash.slice(0, 4)}…${t.stellar_tx_hash.slice(-4)}` : 'Pending',
                          rawTxHash: t.stellar_tx_hash,
                          explorerUrl: t.stellar_explorer_url || (t.stellar_tx_hash ? `https://stellar.expert/explorer/testnet/tx/${t.stellar_tx_hash}` : null),
                          when: new Date(t.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
                          isAnonymous: !t.supporter_name || t.supporter_name === 'Anonymous',
                        }))
                      : filteredTips
                    ).map((tip: any) => (
                      <div key={tip.id} className="px-5 py-3.5 grid grid-cols-12 items-center gap-2">
                        <div className="col-span-5 flex items-center gap-3 min-w-0">
                          <div
                            style={{ backgroundColor: tip.avatarBg, color: tip.avatarColor }}
                            className="w-7 h-7 rounded-full font-extrabold text-xs flex items-center justify-center shrink-0"
                          >
                            {tip.isAnonymous ? (
                              <StarFourPoint className="w-3.5 h-3.5" color="#C6FF3D" />
                            ) : (
                              tip.initial
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#0B1026] truncate">
                              {tip.supporter}
                            </div>
                            <div className="text-[11px] text-[#646A8A] truncate">{tip.message}</div>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-xs font-extrabold text-[#0B1026] tabular-nums">
                            {tip.amount}
                          </div>
                          <div className="text-[10px] text-[#646A8A] tabular-nums">{tip.usdValue}</div>
                        </div>
                        <div className="col-span-2">
                          {tip.status === 'Confirmed' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E7F6EC] border border-[#A7E3BE] text-[#15803D] text-[10px] font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              Confirmed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FDF1E1] border border-[#F6CF94] text-[#B45309] text-[10px] font-semibold">
                              <Clock className="w-3 h-3" />
                              {tip.status}
                            </span>
                          )}
                        </div>
                        <div className="col-span-2 font-mono-code text-[11px] text-[#4A5070]">
                          {tip.explorerUrl ? (
                            <a
                              href={tip.explorerUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[#6A4CF5] hover:underline"
                            >
                              <span>{tip.txHash}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span>{tip.txHash}</span>
                          )}
                        </div>
                        <div className="col-span-1 text-right text-[11px] text-[#646A8A]">
                          {tip.when}
                        </div>
                      </div>
                    ))}

                    {mode === 'full' && tipHistory.length === 0 && (
                      <div className="p-8 text-center text-xs text-[#646A8A]">
                        No tips recorded on-chain yet for this filter.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 5: LIVE ALERTS                                             */}
            {/* ============================================================== */}
            {activeTab === 'alerts' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[28px] font-extrabold tracking-tight text-[#0B1026]">
                      Live Stream Alerts
                    </h2>
                    <p className="text-xs text-[#646A8A]">
                      Connected to real-time Server-Sent Events (SSE). Use this URL in OBS Studio or Streamlabs.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={triggerTestStreamAlert}
                      className="px-4 py-2.5 rounded-full bg-[#C6FF3D] text-[#0B1026] text-xs font-extrabold flex items-center gap-2 shadow-sm hover:brightness-95 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      Fire Test Alert
                    </button>
                    <a
                      href={`${appBaseUrl}/overlay/${overlayToken}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-full bg-[#0B1026] text-white text-xs font-bold flex items-center gap-1.5 hover:opacity-90"
                    >
                      <span>Open Overlay Tab</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#E4E7F2] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#0B1026]">OBS Browser Source URL</div>
                    <div className="font-mono-code text-xs text-[#6A4CF5] truncate mt-0.5">
                      {appBaseUrl}/overlay/{overlayToken}/
                    </div>
                  </div>
                  <button
                    onClick={handleCopyObs}
                    className="px-3 py-1.5 rounded-lg border border-[#E4E7F2] hover:bg-[#F6F7FB] text-xs font-bold text-[#0B1026] flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {copiedObs ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedObs ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div
                  className="p-6 rounded-2xl border border-white/15 relative h-[320px] flex flex-col justify-between overflow-hidden"
                  style={{
                    background: 'linear-gradient(160deg, #141A3A 10.99%, #070A1A 89.01%)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded bg-[#E5484D] text-white font-extrabold text-[11px] tracking-wider">
                        LIVE
                      </span>
                      <span className="font-mono-code text-xs text-white/60">OBS Source Listening</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 font-mono-code text-xs text-white/80">
                      {testAlertActive ? 'SSE broadcast sent!' : 'Stream ready'}
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div className={`p-4 rounded-2xl bg-white border-[3px] border-[#C6FF3D] shadow-2xl flex items-start gap-3.5 max-w-[380px] transition-all duration-300 ${testAlertActive ? 'scale-105 shadow-[0_0_30px_rgba(198,255,61,0.5)]' : ''}`}>
                      <div className="w-12 h-12 rounded-xl bg-[#2775CA] text-white font-extrabold text-xl flex items-center justify-center shrink-0">
                        $
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#4A5070]">Ada just tipped</div>
                        <div className="font-anton text-2xl text-[#0B1026] mt-0.5">5 USDC</div>
                        <div className="text-xs text-[#4A5070] mt-1">
                          “Your Stellar series got me my first dev job.”
                        </div>
                      </div>
                    </div>

                    <div className="w-20 h-20 rounded-full bg-[#C6FF3D] text-[#0B1026] font-extrabold text-xl flex items-center justify-center ring-4 ring-[#070A1A]">
                      {(creatorName || 'C').charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 6: SETTINGS                                                */}
            {/* ============================================================== */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[28px] font-extrabold tracking-tight text-[#0B1026]">
                    Wallet & Account Settings
                  </h2>
                  <p className="text-xs text-[#646A8A]">
                    StarTip is non-custodial. Every tip goes straight to your connected Stellar wallet.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-[#E4E7F2] space-y-4">
                  <div className="text-sm font-bold text-[#0B1026]">
                    Connected Stellar Wallet (Testnet)
                  </div>
                  <div className="p-4 rounded-xl bg-[#F6F7FB] border border-[#E4E7F2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <WalletLogo name="freighter" size={32} />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0B1026]">Authenticated Wallet</div>
                        <div className="font-mono-code text-xs text-[#646A8A] truncate">
                          {walletAddress || creator?.wallet_address || 'GBXK4H2M2P6LNV2B6XQQ5U3VYV6Y2R6E762E44P3A4L2K7C4M3O2DEV1'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`https://stellar.expert/explorer/testnet/account/${walletAddress || creator?.wallet_address || ''}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg border border-[#E4E7F2] hover:bg-white text-xs font-semibold text-[#0B1026] flex items-center gap-1"
                      >
                        <span>Stellar Explorer</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="text-sm font-bold text-[#0B1026] mb-1">
                      Receiving Address for Tips
                    </div>
                    <div className="p-3.5 rounded-xl bg-white border border-[#E4E7F2] font-mono-code text-xs text-[#0B1026] break-all">
                      {creator?.receiving_wallet_address || walletAddress || 'Direct wallet-to-wallet'}
                    </div>
                    <p className="text-[11px] text-[#646A8A] mt-1.5">
                      Supporter payments are sent straight to this address on the Stellar Testnet with memo references.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#EEF0F7] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#0B1026]">Disconnect Session</div>
                      <div className="text-[11px] text-[#646A8A]">
                        Log out of your Stellar Wallets Kit session on this device.
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="px-4 py-2 rounded-xl bg-[#E5484D] hover:bg-[#D0383D] text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Fade when inside Landing Page Desktop Preview */}
      {isPreview && (
        <div
          className="pointer-events-none absolute bottom-0 inset-x-0 h-[130px] z-20"
          style={{
            background:
              'linear-gradient(180deg, rgba(11, 15, 36, 0) 0%, rgba(11, 15, 36, 0.8) 65%, #0B0F24 100%)',
          }}
        />
      )}
    </div>
  );

  if (isPreview) {
    return (
      <div className="relative w-full max-w-[1200px] h-[930px] p-[15px] bg-white/[0.04] border border-white/[0.12] backdrop-blur-[5px] rounded-[28px] mx-auto">
        <CornerHandles variant="white" size={9} />
        {dashboardInner}
      </div>
    );
  }

  return dashboardInner;
}
