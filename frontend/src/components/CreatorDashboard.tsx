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
  Plus,
  Trash2,
  Edit3,
  Image,
  Link,
  Share2,
  Layers,
  CheckSquare,
  Square,
  Twitter,
  Github,
  Twitch,
  Youtube,
  Tv,
  QrCode,
  ArrowLeft,
  Users,
  Upload,
  ShieldAlert,
  Filter,
  AlertTriangle,
  Sliders,
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
import { api, DashboardMetrics, TipHistoryItem, WidgetConfig } from '../services/api';
import { WalletProfileDropdown } from './WalletProfileDropdown';

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
  const connectedWallet = 'freighter';

  const normalizeTab = (raw: string | null | undefined): DashboardTab => {
    if (!raw) return 'overview';
    if (raw === 'embed') return 'widget';
    if (['overview', 'widget', 'history', 'alerts', 'settings'].includes(raw)) {
      return raw as DashboardTab;
    }
    return 'overview';
  };

  const getInitialTab = (): DashboardTab => {
    if (typeof window !== 'undefined') {
      const searchParam = new URLSearchParams(window.location.search).get('tab');
      if (searchParam) return normalizeTab(searchParam);
      const hashParam = window.location.hash.replace('#', '');
      if (hashParam) return normalizeTab(hashParam);
      const savedTab = localStorage.getItem('startip_active_tab');
      if (savedTab) return normalizeTab(savedTab);
    }
    return normalizeTab(initialTab);
  };

  const [activeTab, setActiveTabState] = useState<DashboardTab>(getInitialTab);

  // Sync if initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTabState(normalizeTab(initialTab));
    }
  }, [initialTab]);

  const setActiveTab = (tab: DashboardTab) => {
    const normalized = normalizeTab(tab);
    setActiveTabState(normalized);
    if (typeof window !== 'undefined') {
      localStorage.setItem('startip_active_tab', normalized);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', normalized);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Ensure localStorage and URL parameter stay strictly in sync with activeTab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('startip_active_tab', activeTab);
      const url = new URL(window.location.href);
      if (url.searchParams.get('tab') !== activeTab) {
        url.searchParams.set('tab', activeTab);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      const searchParam = new URLSearchParams(window.location.search).get('tab');
      if (searchParam) {
        setActiveTabState(normalizeTab(searchParam));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedObs, setCopiedObs] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('Sep');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'USDC' | 'XLM' | 'USDT'>('ALL');
  const [historyWidgetFilter, setHistoryWidgetFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [testAlertActive, setTestAlertActive] = useState(false);
  const [activeAlert, setActiveAlert] = useState<{
    id: string;
    supporter_name: string;
    amount: string;
    asset_code: string;
    message: string;
    created_at: string;
    is_test?: boolean;
  } | null>(() => {
    if (mode !== 'full') {
      return {
        id: 'preview-alert',
        supporter_name: 'Ada',
        amount: '5',
        asset_code: 'USDC',
        message: 'Your Stellar series got me my first dev job.',
        created_at: new Date().toISOString(),
        is_test: false,
      };
    }
    return null;
  });
  const [alertHistory, setAlertHistory] = useState<Array<{
    id: string;
    supporter_name: string;
    amount: string;
    asset_code: string;
    message: string;
    created_at: string;
    is_test?: boolean;
  }>>([]);

  // Backend state
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null);
  const [tipHistory, setTipHistory] = useState<TipHistoryItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSavingWidget, setIsSavingWidget] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Multi-Widget / Tip Links Suite state
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    return creator?.widgets || (creator?.widget_config ? [creator.widget_config] : []);
  });
  const [selectedWidgetId, setSelectedWidgetId] = useState<number | null>(() => {
    return creator?.widgets?.[0]?.id || creator?.widget_config?.id || null;
  });

  // Selected widget form state
  const [widgetName, setWidgetName] = useState('Main Tip Link');
  const [widgetSlug, setWidgetSlug] = useState('main');
  const [widgetTitle, setWidgetTitle] = useState('Tip Me');
  const [widgetWelcome, setWidgetWelcome] = useState('Thanks for supporting my work!');
  const [widgetAvatarUrl, setWidgetAvatarUrl] = useState('');
  const [widgetBannerUrl, setWidgetBannerUrl] = useState('');
  const [widgetTheme, setWidgetTheme] = useState<'dark' | 'light' | 'midnight' | 'cyber'>('light');
  const [widgetPrimaryColor, setWidgetPrimaryColor] = useState('#6A4CF5');
  const [widgetPresetsXlm, setWidgetPresetsXlm] = useState<number[]>([10, 25, 50, 100]);
  const [widgetPresetsUsdc, setWidgetPresetsUsdc] = useState<number[]>([1, 2, 5, 10]);
  const [widgetPresetsUsdt, setWidgetPresetsUsdt] = useState<number[]>([1, 5, 10, 20]);
  const [widgetIsDefault, setWidgetIsDefault] = useState(true);

  // Remark filter moderation state
  const [widgetFilterRemarks, setWidgetFilterRemarks] = useState(false);
  const [widgetBannedWords, setWidgetBannedWords] = useState<string[]>([]);
  const [widgetFilterAction, setWidgetFilterAction] = useState<'mask' | 'block'>('mask');
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Temporary filter modal editing state
  const [tempFilterRemarks, setTempFilterRemarks] = useState(false);
  const [tempBannedWords, setTempBannedWords] = useState<string[]>([]);
  const [tempFilterAction, setTempFilterAction] = useState<'mask' | 'block'>('mask');
  const [newBannedWordInput, setNewBannedWordInput] = useState('');

  // Image upload states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [bannerUploadError, setBannerUploadError] = useState<string | null>(null);
  const avatarFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const bannerFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sub-view within 'widget' tab:
  // 'list': The main Hub listing all tip links as cards with Share, Embed, Edit, Delete
  // 'create': Dedicated page for creating a new tip link
  // 'edit': Dedicated page for editing an existing tip link
  const [widgetSubView, setWidgetSubView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingWidgetId, setEditingWidgetId] = useState<number | null>(null);

  // Unified Share & Embed modal state
  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [embedModalTab, setEmbedModalTab] = useState<'share' | 'widget' | 'iframe' | 'obs'>('share');
  const [embedWidgetSubTab, setEmbedWidgetSubTab] = useState<'float' | 'custom' | 'inline'>('float');
  const [embedTargetWidget, setEmbedTargetWidget] = useState<WidgetConfig | null>(null);

  // Post-save action modal state
  const [postSaveModalOpen, setPostSaveModalOpen] = useState(false);
  const [savedWidgetResult, setSavedWidgetResult] = useState<WidgetConfig | null>(null);

  // Account Settings state
  const [settingsDisplayName, setSettingsDisplayName] = useState('');
  const [settingsUsername, setSettingsUsername] = useState('');
  const [settingsBio, setSettingsBio] = useState('');
  const [settingsAvatarUrl, setSettingsAvatarUrl] = useState('');
  const [settingsWebsiteUrl, setSettingsWebsiteUrl] = useState('');
  const [settingsReceivingWallet, setSettingsReceivingWallet] = useState('');
  const [settingsTwitter, setSettingsTwitter] = useState('');
  const [settingsGithub, setSettingsGithub] = useState('');
  const [settingsTwitch, setSettingsTwitch] = useState('');
  const [settingsYoutube, setSettingsYoutube] = useState('');
  const [settingsDiscord, setSettingsDiscord] = useState('');
  const [settingsSupportedAssets, setSettingsSupportedAssets] = useState<string[]>(['XLM', 'USDC', 'USDT']);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveStatus, setSettingsSaveStatus] = useState<string | null>(null);

  // Widget Customizer legacy preview state
  const [creatorName, setCreatorName] = useState('Tobi Ade');
  const [creatorHandle, setCreatorHandle] = useState('tobibuilds');
  const [creatorBio, setCreatorBio] = useState(
    'Open-source tutorials on Stellar. Every tip funds another free video.'
  );
  const [widgetCurrency, setWidgetCurrency] = useState<'USDC' | 'XLM' | 'USDT'>('USDC');
  const [widgetSelectedPreset, setWidgetSelectedPreset] = useState<number>(5);
  const [timeframe, setTimeframe] = useState<'All time' | 'This month' | 'Last 7 days'>('All time');
  const [showTimeframeMenu, setShowTimeframeMenu] = useState(false);

  // Currently selected widget object
  const selectedWidget: WidgetConfig | null =
    widgets.find((w) => w.id === selectedWidgetId) ||
    widgets[0] ||
    (creator?.widget_config as WidgetConfig) ||
    null;

  const formatTimeAgo = (dateStr?: string | null) => {
    if (!dateStr) return 'Recently';
    try {
      const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} min ago`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour} hr ago`;
      const diffDays = Math.floor(diffHour / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const latestTip =
    mode === 'full'
      ? (dashboardData?.recent_tips && dashboardData.recent_tips.length > 0
          ? dashboardData.recent_tips[0]
          : tipHistory.length > 0
          ? {
              id: String(tipHistory[0].id),
              supporter_name: tipHistory[0].supporter_name || 'Anonymous',
              amount: String(tipHistory[0].amount),
              asset_code: tipHistory[0].asset_code,
              message: tipHistory[0].message || '',
              stellar_tx_hash: tipHistory[0].stellar_tx_hash || '',
              created_at: tipHistory[0].created_at,
            }
          : null)
      : {
          id: 'preview-latest',
          supporter_name: 'Mara',
          amount: '25',
          asset_code: 'XLM',
          message: 'Your last tutorial saved my weekend. Keep them coming.',
          stellar_tx_hash: '3f9a941b2e88a0bc1d77a83f12089c21e',
          created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        };

  const biggestTip =
    mode === 'full'
      ? dashboardData?.biggest_tip ||
        (tipHistory.length > 0
          ? [...tipHistory]
              .sort((a, b) => Number(b.amount) - Number(a.amount))
              .map((t) => ({
                id: String(t.id),
                supporter_name: t.supporter_name || 'Anonymous',
                amount: String(t.amount),
                asset_code: t.asset_code,
                message: t.message || '',
                stellar_tx_hash: t.stellar_tx_hash || '',
                created_at: t.created_at,
              }))[0]
          : null)
      : {
          id: 'preview-biggest',
          supporter_name: 'Alex',
          amount: '60',
          asset_code: 'USDC',
          message: 'The whole series paid for itself.',
          stellar_tx_hash: '8f72a41b2e88a0bc1d77a83f12089c21e',
          created_at: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
        };

  const computedTopSupporters = (() => {
    if (mode === 'full') {
      if (dashboardData?.top_supporters && dashboardData.top_supporters.length > 0) {
        return dashboardData.top_supporters.map((s, idx) => ({
          rank: idx + 1,
          name: s.supporter_name,
          initial: (s.supporter_name || 'A').charAt(0).toUpperCase(),
          bg: s.asset_code === 'USDC' ? '#E3EEFF' : s.asset_code === 'USDT' ? '#E6F8F3' : '#ECE8FF',
          color: s.asset_code === 'USDC' ? '#1D4FA8' : s.asset_code === 'USDT' ? '#1E8062' : '#4A2FC2',
          amount: `${s.total_amount} ${s.asset_code}`,
          usd: s.asset_code === 'USDC' || s.asset_code === 'USDT'
            ? `≈ $${Number(s.total_amount).toFixed(2)}`
            : `≈ $${(Number(s.total_amount) * 0.12).toFixed(2)}`,
        }));
      }
      if (tipHistory.length > 0) {
        const groups: Record<string, { name: string; asset_code: string; total: number }> = {};
        tipHistory.forEach((t) => {
          const key = t.supporter_name || 'Anonymous';
          if (!groups[key]) {
            groups[key] = { name: key, asset_code: t.asset_code, total: 0 };
          }
          groups[key].total += Number(t.amount);
        });
        return Object.values(groups)
          .sort((a, b) => b.total - a.total)
          .slice(0, 5)
          .map((s, idx) => ({
            rank: idx + 1,
            name: s.name,
            initial: s.name.charAt(0).toUpperCase(),
            bg: s.asset_code === 'USDC' ? '#E3EEFF' : s.asset_code === 'USDT' ? '#E6F8F3' : '#ECE8FF',
            color: s.asset_code === 'USDC' ? '#1D4FA8' : s.asset_code === 'USDT' ? '#1E8062' : '#4A2FC2',
            amount: `${s.total.toFixed(2)} ${s.asset_code}`,
            usd: s.asset_code === 'USDC' || s.asset_code === 'USDT'
              ? `≈ $${s.total.toFixed(2)}`
              : `≈ $${(s.total * 0.12).toFixed(2)}`,
          }));
      }
      return [];
    }
    return [
      { rank: 1, name: 'Alex', initial: 'A', bg: '#E3EEFF', color: '#1D4FA8', amount: '160 USDC', usd: '≈ $160.00' },
      { rank: 2, name: 'Kemi', initial: 'K', bg: '#EEFFC2', color: '#3F5A00', amount: '95 USDC', usd: '≈ $95.00' },
      { rank: 3, name: 'Mara', initial: 'M', bg: '#ECE8FF', color: '#4A2FC2', amount: '310 XLM', usd: '≈ $37.20' },
    ];
  })();

  // Sync creator profile into account settings
  useEffect(() => {
    if (creator) {
      if (creator.display_name) {
        setCreatorName(creator.display_name);
        setSettingsDisplayName(creator.display_name);
      }
      if (creator.username) {
        setCreatorHandle(creator.username);
        setSettingsUsername(creator.username);
      }
      if (creator.bio) {
        setCreatorBio(creator.bio);
        setSettingsBio(creator.bio);
      }
      if (creator.avatar_url) setSettingsAvatarUrl(creator.avatar_url);
      if (creator.website_url) setSettingsWebsiteUrl(creator.website_url);
      if (creator.receiving_wallet_address) {
        setSettingsReceivingWallet(creator.receiving_wallet_address);
      } else if (creator.wallet_address) {
        setSettingsReceivingWallet(creator.wallet_address);
      }
      if (creator.social_links) {
        setSettingsTwitter(creator.social_links.twitter || '');
        setSettingsGithub(creator.social_links.github || '');
        setSettingsTwitch(creator.social_links.twitch || '');
        setSettingsYoutube(creator.social_links.youtube || '');
        setSettingsDiscord(creator.social_links.discord || '');
      }
      if (creator.supported_assets && creator.supported_assets.length > 0) {
        setSettingsSupportedAssets(creator.supported_assets);
      }
      if (creator.widgets && creator.widgets.length > 0) {
        setWidgets(creator.widgets);
        if (!selectedWidgetId) {
          setSelectedWidgetId(creator.widgets[0].id || null);
        }
      }
    }
  }, [creator]);

  // Load widgets from backend
  const loadWidgets = async () => {
    if (mode !== 'full') return;
    try {
      const list = await api.getWidgets();
      setWidgets(list);
      if (list.length > 0 && (!selectedWidgetId || !list.some((w) => w.id === selectedWidgetId))) {
        setSelectedWidgetId(list[0].id || null);
      }
    } catch (e) {
      console.warn('Failed to load widgets:', e);
    }
  };

  useEffect(() => {
    if (mode === 'full') {
      loadWidgets();
    }
  }, [mode]);

  // Sync selected widget into editor form
  useEffect(() => {
    if (selectedWidget) {
      setWidgetName(selectedWidget.name || 'Main Tip Link');
      setWidgetSlug(selectedWidget.slug || 'main');
      setWidgetTitle(selectedWidget.widget_title || `Tip ${creator?.display_name || 'Creator'}`);
      setWidgetWelcome(selectedWidget.welcome_message || creator?.bio || '');
      setWidgetAvatarUrl(selectedWidget.avatar_url || creator?.avatar_url || '');
      setWidgetBannerUrl(selectedWidget.banner_url || '');
      setWidgetTheme(selectedWidget.theme || 'light');
      setWidgetPrimaryColor(selectedWidget.primary_color || '#6A4CF5');
      if (selectedWidget.preset_amounts_xlm?.length) setWidgetPresetsXlm(selectedWidget.preset_amounts_xlm);
      if (selectedWidget.preset_amounts_usdc?.length) setWidgetPresetsUsdc(selectedWidget.preset_amounts_usdc);
      if (selectedWidget.preset_amounts_usdt?.length) setWidgetPresetsUsdt(selectedWidget.preset_amounts_usdt);
      setWidgetIsDefault(!!selectedWidget.is_default);
      setWidgetFilterRemarks(!!selectedWidget.filter_remarks);
      setWidgetBannedWords(Array.isArray(selectedWidget.banned_words) ? selectedWidget.banned_words : []);
      setWidgetFilterAction(selectedWidget.filter_action || 'mask');
    }
  }, [selectedWidget?.id]);

  // Load backend dashboard metrics and tip history (filtered by widget and asset)
  const loadDashboardMetrics = () => {
    if (mode === 'full') {
      setIsLoadingData(true);
      Promise.all([
        api.getDashboard().then((res) => setDashboardData(res)).catch(() => null),
        api
          .getTipHistory({
            asset: historyFilter,
            widget_id: historyWidgetFilter,
            search: searchQuery,
          })
          .then((res) => setTipHistory(res))
          .catch(() => []),
      ]).finally(() => {
        setIsLoadingData(false);
      });
    }
  };

  useEffect(() => {
    loadDashboardMetrics();
  }, [mode, historyFilter, historyWidgetFilter, searchQuery]);

  const appBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://startip.app';
  const effectiveHandle = (mode === 'full' && creator?.username) ? creator.username : creatorHandle;
  const effectiveOverlayToken = selectedWidget?.overlay_token || creator?.widget_config?.overlay_token || effectiveHandle;

  const getWidgetTipUrl = (w?: WidgetConfig | null) => {
    const slug = w?.slug;
    if (slug && slug !== 'main' && slug !== 'default') {
      return `${appBaseUrl}/${effectiveHandle}?widget=${slug}`;
    }
    return `${appBaseUrl}/${effectiveHandle}`;
  };

  const getWidgetScriptSnippet = (w?: WidgetConfig | null) => {
    const slug = w?.slug;
    const slugParam = slug && slug !== 'main' && slug !== 'default' ? `?widget=${slug}` : '';
    return `<script src="${appBaseUrl}/embed/${effectiveHandle}/widget.js${slugParam}" async></script>`;
  };

  const getWidgetCustomButtonSnippet = (w?: WidgetConfig | null) => {
    const slug = w?.slug;
    const slugParam = slug && slug !== 'main' && slug !== 'default' ? `?widget=${slug}` : '';
    const query = slugParam ? `${slugParam}&button=false` : '?button=false';
    return `<!-- 1. Add data-startip-open to any custom button or link on your website -->\n<button data-startip-open class="my-tip-btn">\n  ⚡ Tip @${effectiveHandle}\n</button>\n\n<!-- 2. Embed the StarTip loader script -->\n<script src="${appBaseUrl}/embed/${effectiveHandle}/widget.js${query}" async></script>`;
  };

  const getWidgetInlineSnippet = (w?: WidgetConfig | null) => {
    const slug = w?.slug;
    const slugParam = slug && slug !== 'main' && slug !== 'default' ? `?widget=${slug}` : '';
    const query = slugParam ? `${slugParam}&mode=inline` : '?mode=inline';
    return `<!-- 1. Container div where the full tipping window will appear -->\n<div id="startip-widget"></div>\n\n<!-- 2. Embed the StarTip loader script -->\n<script src="${appBaseUrl}/embed/${effectiveHandle}/widget.js${query}" async></script>`;
  };

  const getWidgetIframeSnippet = (w?: WidgetConfig | null) => {
    const slug = w?.slug;
    const slugParam = slug && slug !== 'main' && slug !== 'default' ? `?widget=${slug}` : '';
    return `<iframe src="${appBaseUrl}/embed/${effectiveHandle}/${slugParam}" width="380" height="640" frameborder="0"></iframe>`;
  };

  const getWidgetOverlayUrl = (w?: WidgetConfig | null) => {
    const token = w?.overlay_token || creator?.widget_config?.overlay_token || effectiveHandle;
    return `${appBaseUrl}/overlay/${token}/`;
  };

  const currentTipLinkUrl = getWidgetTipUrl(selectedWidget);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(currentTipLinkUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard?.writeText(getWidgetScriptSnippet(selectedWidget));
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleCopyObs = () => {
    navigator.clipboard?.writeText(getWidgetOverlayUrl(selectedWidget));
    setCopiedObs(true);
    setTimeout(() => setCopiedObs(false), 2000);
  };

  // Clear unread alerts when alerts tab is opened
  useEffect(() => {
    if (activeTab === 'alerts') {
      setUnreadAlerts(0);
    }
  }, [activeTab]);

  // Seed alert history with real past tips when in full mode
  useEffect(() => {
    if (mode === 'full') {
      if (dashboardData?.recent_tips && dashboardData.recent_tips.length > 0) {
        const seeded = dashboardData.recent_tips.map((t) => ({
          id: t.id,
          supporter_name: t.supporter_name || 'Anonymous',
          amount: t.amount,
          asset_code: t.asset_code,
          message: t.message || '',
          created_at: t.created_at,
          is_test: false,
        }));
        setAlertHistory((prev) => (prev.length === 0 ? seeded : prev));
        setActiveAlert((prev) => prev || seeded[0]);
      } else if (tipHistory.length > 0) {
        const seeded = tipHistory.slice(0, 10).map((t) => ({
          id: String(t.id),
          supporter_name: t.supporter_name || 'Anonymous',
          amount: String(t.amount),
          asset_code: t.asset_code,
          message: t.message || '',
          created_at: t.created_at,
          is_test: false,
        }));
        setAlertHistory((prev) => (prev.length === 0 ? seeded : prev));
        setActiveAlert((prev) => prev || seeded[0]);
      }
    }
  }, [dashboardData, tipHistory, mode]);

  // Real-time EventSource listener for live stream overlay alerts
  useEffect(() => {
    if (mode !== 'full' || !effectiveOverlayToken || effectiveOverlayToken.length < 20) return;
    let es: EventSource | null = null;
    try {
      es = new EventSource(`/api/alerts/stream/${effectiveOverlayToken}/`);
      es.addEventListener('tip', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          const alertItem = {
            id: data.reference_id || String(Date.now()),
            supporter_name: data.supporter_name || 'Anonymous',
            amount: String(data.amount || '0'),
            asset_code: data.asset_code || 'USDC',
            message: data.message || '',
            created_at: new Date().toISOString(),
            is_test: !!data.is_test,
          };
          setActiveAlert(alertItem);
          setAlertHistory((prev) => [alertItem, ...prev.filter((p) => p.id !== alertItem.id).slice(0, 19)]);
          setTestAlertActive(true);
          setTimeout(() => setTestAlertActive(false), (data.duration_seconds || 5) * 1000);
          if (activeTab !== 'alerts') {
            setUnreadAlerts((prev) => prev + 1);
          }
          loadDashboardMetrics();
        } catch (e) {
          console.error('Error parsing SSE tip alert:', e);
        }
      });
    } catch (err) {
      console.warn('EventSource connection error:', err);
    }
    return () => {
      if (es) es.close();
    };
  }, [mode, effectiveOverlayToken, activeTab]);

  const triggerTestStreamAlert = async () => {
    setTestAlertActive(true);
    const testAlertItem = {
      id: `test-${Date.now()}`,
      supporter_name: 'Stellar Supporter',
      amount: '10',
      asset_code: 'USDC',
      message: 'Testing live stream tip alert for overlay!',
      created_at: new Date().toISOString(),
      is_test: true,
    };
    setActiveAlert(testAlertItem);
    setAlertHistory((prev) => [testAlertItem, ...prev.slice(0, 19)]);
    if (mode === 'full') {
      try {
        await api.triggerTestAlert({
          overlay_token: effectiveOverlayToken,
          amount: '10',
          asset_code: 'USDC',
          supporter_name: 'Stellar Supporter',
          message: 'Testing live stream tip alert for overlay!',
        });
      } catch (err) {
        console.warn('Backend test alert trigger error:', err);
      }
    }
    setTimeout(() => setTestAlertActive(false), 5000);
  };

  // Save selected widget config
  const handleSaveSelectedWidget = async () => {
    setIsSavingWidget(true);
    setSaveStatus(null);
    try {
      if (selectedWidget?.id) {
        await api.updateWidget(selectedWidget.id, {
          name: widgetName,
          slug: widgetSlug.trim().toLowerCase().replace(/\s+/g, '-'),
          widget_title: widgetTitle,
          welcome_message: widgetWelcome,
          avatar_url: widgetAvatarUrl,
          banner_url: widgetBannerUrl,
          theme: widgetTheme,
          primary_color: widgetPrimaryColor,
          preset_amounts_xlm: widgetPresetsXlm,
          preset_amounts_usdc: widgetPresetsUsdc,
          preset_amounts_usdt: widgetPresetsUsdt,
          is_default: widgetIsDefault,
        });
      } else {
        await api.updateWidgetConfig({
          welcome_message: widgetWelcome,
          widget_title: widgetTitle,
          theme: widgetTheme,
        });
      }
      await loadWidgets();
      await refreshProfile();
      setSaveStatus(`Saved "${widgetName}" tip link successfully!`);
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err: any) {
      setSaveStatus(`Failed to save: ${err.message}`);
    } finally {
      setIsSavingWidget(false);
    }
  };

  // Tip Links & Widgets Hub action helpers
  const startCreateWidget = () => {
    setWidgetName('');
    setWidgetSlug('');
    setWidgetTitle(`Tip ${creator?.display_name || 'Creator'}`);
    setWidgetWelcome('Thanks for supporting my work!');
    setWidgetAvatarUrl(creator?.avatar_url || '');
    setWidgetBannerUrl('');
    setWidgetTheme('light');
    setWidgetPrimaryColor('#6A4CF5');
    setWidgetPresetsXlm([10, 25, 50, 100]);
    setWidgetPresetsUsdc([1, 2, 5, 10]);
    setWidgetPresetsUsdt([1, 5, 10, 20]);
    setWidgetIsDefault(widgets.length === 0);
    setWidgetFilterRemarks(false);
    setWidgetBannedWords([]);
    setWidgetFilterAction('mask');
    setAvatarUploadError(null);
    setBannerUploadError(null);
    setEditingWidgetId(null);
    setWidgetSubView('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEditWidget = (widget: WidgetConfig) => {
    setSelectedWidgetId(widget.id || null);
    setEditingWidgetId(widget.id || null);
    setWidgetName(widget.name || 'Main Tip Link');
    setWidgetSlug(widget.slug || 'main');
    setWidgetTitle(widget.widget_title || `Tip ${creator?.display_name || 'Creator'}`);
    setWidgetWelcome(widget.welcome_message || creator?.bio || '');
    setWidgetAvatarUrl(widget.avatar_url || creator?.avatar_url || '');
    setWidgetBannerUrl(widget.banner_url || '');
    setWidgetTheme((widget.theme as any) || 'light');
    setWidgetPrimaryColor(widget.primary_color || '#6A4CF5');
    setWidgetPresetsXlm(widget.preset_amounts_xlm?.length ? widget.preset_amounts_xlm : [10, 25, 50, 100]);
    setWidgetPresetsUsdc(widget.preset_amounts_usdc?.length ? widget.preset_amounts_usdc : [1, 2, 5, 10]);
    setWidgetPresetsUsdt(widget.preset_amounts_usdt?.length ? widget.preset_amounts_usdt : [1, 5, 10, 20]);
    setWidgetIsDefault(!!widget.is_default);
    setWidgetFilterRemarks(!!widget.filter_remarks);
    setWidgetBannedWords(Array.isArray(widget.banned_words) ? widget.banned_words : []);
    setWidgetFilterAction(widget.filter_action || 'mask');
    setAvatarUploadError(null);
    setBannerUploadError(null);
    setWidgetSubView('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Image Upload Handlers
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    setAvatarUploadError(null);
    try {
      const res = await api.uploadImage(file);
      if (res.url) {
        setWidgetAvatarUrl(res.url);
        setSaveStatus('Avatar image uploaded successfully!');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (err: any) {
      console.error('Failed to upload avatar:', err);
      setAvatarUploadError(err?.message || 'Failed to upload avatar image');
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    setBannerUploadError(null);
    try {
      const res = await api.uploadImage(file);
      if (res.url) {
        setWidgetBannerUrl(res.url);
        setSaveStatus('Banner image uploaded successfully!');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (err: any) {
      console.error('Failed to upload banner:', err);
      setBannerUploadError(err?.message || 'Failed to upload banner image');
    } finally {
      setIsUploadingBanner(false);
      if (e.target) e.target.value = '';
    }
  };

  // Remark Moderation Filter Helpers
  const openFilterModal = () => {
    setTempFilterRemarks(widgetFilterRemarks);
    setTempBannedWords([...widgetBannedWords]);
    setTempFilterAction(widgetFilterAction);
    setNewBannedWordInput('');
    setFilterModalOpen(true);
  };

  const applyFilterModal = () => {
    let words = [...tempBannedWords];
    const pending = newBannedWordInput.trim().toLowerCase();
    if (pending && !words.includes(pending)) {
      words.push(pending);
    }
    setWidgetFilterRemarks(tempFilterRemarks);
    setWidgetBannedWords(words);
    setWidgetFilterAction(tempFilterAction);
    setFilterModalOpen(false);
  };

  const addBannedWord = (wordToAdd?: string) => {
    const term = (wordToAdd || newBannedWordInput).trim().toLowerCase();
    if (!term) return;
    if (!tempBannedWords.includes(term)) {
      setTempBannedWords([...tempBannedWords, term]);
      setTempFilterRemarks(true);
    }
    if (!wordToAdd) setNewBannedWordInput('');
  };

  const removeBannedWord = (wordToRemove: string) => {
    const updated = tempBannedWords.filter((w) => w !== wordToRemove);
    setTempBannedWords(updated);
    if (updated.length === 0) {
      setTempFilterRemarks(false);
    }
  };

  const addPresetWords = (presets: string[]) => {
    const combined = Array.from(new Set([...tempBannedWords, ...presets.map((p) => p.toLowerCase())]));
    setTempBannedWords(combined);
    setTempFilterRemarks(true);
  };

  const openShareModal = (widget: WidgetConfig) => {
    setEmbedTargetWidget(widget);
    setEmbedModalTab('share');
    setEmbedModalOpen(true);
  };

  const openEmbedModal = (widget: WidgetConfig) => {
    setEmbedTargetWidget(widget);
    setEmbedModalTab('widget');
    setEmbedModalOpen(true);
  };

  // Dedicated Page Save Handler (for both Create & Edit)
  const handleSaveWidgetPage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!widgetName.trim()) {
      alert('Please enter a name for this tip link / widget.');
      return;
    }
    setIsSavingWidget(true);
    setSaveStatus(null);
    try {
      const generatedSlug = (widgetSlug.trim() || widgetName.trim())
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      let saved: WidgetConfig;
      if (widgetSubView === 'edit' && editingWidgetId) {
        saved = await api.updateWidget(editingWidgetId, {
          name: widgetName.trim(),
          slug: generatedSlug,
          widget_title: widgetTitle.trim(),
          welcome_message: widgetWelcome.trim(),
          avatar_url: widgetAvatarUrl.trim(),
          banner_url: widgetBannerUrl.trim(),
          theme: widgetTheme,
          primary_color: widgetPrimaryColor,
          preset_amounts_xlm: widgetPresetsXlm,
          preset_amounts_usdc: widgetPresetsUsdc,
          preset_amounts_usdt: widgetPresetsUsdt,
          is_default: widgetIsDefault,
          filter_remarks: widgetFilterRemarks,
          banned_words: widgetBannedWords,
          filter_action: widgetFilterAction,
        });
      } else {
        saved = await api.createWidget({
          name: widgetName.trim(),
          slug: generatedSlug,
          widget_title: widgetTitle.trim() || `Tip ${creator?.display_name || 'Creator'}`,
          welcome_message: widgetWelcome.trim() || 'Thanks for supporting my work!',
          avatar_url: widgetAvatarUrl.trim() || creator?.avatar_url || '',
          banner_url: widgetBannerUrl.trim(),
          theme: widgetTheme,
          primary_color: widgetPrimaryColor,
          preset_amounts_xlm: widgetPresetsXlm,
          preset_amounts_usdc: widgetPresetsUsdc,
          preset_amounts_usdt: widgetPresetsUsdt,
          is_default: widgetIsDefault || widgets.length === 0,
          filter_remarks: widgetFilterRemarks,
          banned_words: widgetBannedWords,
          filter_action: widgetFilterAction,
        });
      }

      await loadWidgets();
      await refreshProfile();
      setSelectedWidgetId(saved.id || null);
      setSavedWidgetResult(saved);
      setPostSaveModalOpen(true);
      setSaveStatus(`Saved "${saved.name}" successfully!`);
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setIsSavingWidget(false);
    }
  };

  // Set default widget handler
  const handleSetDefaultWidget = async (widget: WidgetConfig) => {
    if (!widget.id) return;
    try {
      await api.updateWidget(widget.id, { is_default: true });
      await loadWidgets();
      await refreshProfile();
      setSaveStatus(`Set "${widget.name}" as primary tip link.`);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      alert(`Failed to set default: ${err.message}`);
    }
  };

  // Delete widget handler
  const handleDeleteWidget = async (id: number) => {
    if (widgets.length <= 1) {
      alert('You must have at least one tip link/widget configured.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this tip link?')) return;
    try {
      await api.deleteWidget(id);
      await loadWidgets();
      setSaveStatus('Tip link deleted.');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      alert(`Failed to delete widget: ${err.message}`);
    }
  };

  // Save Account Settings handler
  const handleSaveAccountSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSaveStatus(null);
    try {
      await api.updateProfile({
        display_name: settingsDisplayName.trim(),
        username: settingsUsername.trim().toLowerCase(),
        bio: settingsBio.trim(),
        avatar_url: settingsAvatarUrl.trim(),
        website_url: settingsWebsiteUrl.trim(),
        receiving_wallet_address: settingsReceivingWallet.trim(),
        social_links: {
          twitter: settingsTwitter.trim(),
          github: settingsGithub.trim(),
          twitch: settingsTwitch.trim(),
          youtube: settingsYoutube.trim(),
          discord: settingsDiscord.trim(),
        },
        supported_assets: settingsSupportedAssets,
      });
      await refreshProfile();
      setSettingsSaveStatus('Account settings updated successfully!');
      setTimeout(() => setSettingsSaveStatus(null), 3500);
    } catch (err: any) {
      setSettingsSaveStatus(`Error saving settings: ${err.message}`);
    } finally {
      setIsSavingSettings(false);
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
                    {(['overview', 'widget', 'history', 'alerts', 'settings'] as DashboardTab[]).map(
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
                          <span>{tab === 'widget' ? 'Tip Links & Embeds' : tab === 'alerts' ? 'Live alerts' : tab}</span>
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
        <header className="md:hidden sticky top-0 z-30 bg-white border-b border-[#E4E7F2] px-3.5 py-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#F6F7FB] active:scale-95 transition shrink-0"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5 text-[#0B1026]" />
              {unreadAlerts > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#C6FF3D] ring-2 ring-white" />
              )}
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-[7px] bg-[#C6FF3D] flex items-center justify-center shrink-0">
                <StarFourPoint className="w-4 h-4" color="#0B1026" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-[15px] leading-tight tracking-[-0.4px] text-[#0B1026]">
                  StarTip
                </span>
                <span className="text-[10px] font-mono-code font-bold text-[#6A4CF5] truncate max-w-[110px] sm:max-w-[140px]">
                  @{effectiveHandle}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center shrink-0">
            <WalletProfileDropdown
              theme="light"
              onNavigateToSettings={() => setActiveTab('settings')}
              onNavigateToWidgets={() => setActiveTab('widget')}
            />
          </div>
        </header>
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
                    { id: 'widget', label: 'Tip Links & Embeds', icon: Sparkles },
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
                { id: 'widget', label: 'Tip Links & Embeds', icon: Sparkles },
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
        {/* Top Bar (65px height) - hidden on mobile, replaced by clean Mobile Header */}
        <div className="hidden md:flex h-[65px] px-8 bg-white border-b border-[#E4E7F2] items-center justify-between shrink-0">
          <div>
            <div className="text-[13px] leading-[20px] font-semibold text-[#4A5070]">
              Welcome, {creator?.display_name || creatorName}
            </div>
            <div className="text-[9.75px] leading-[13px] font-medium text-[#646A8A]">
              Stellar Testnet Live Dashboard
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Profile & Live Balances (replacing testnet pill) */}
            <WalletProfileDropdown
              theme="light"
              onNavigateToSettings={() => setActiveTab('settings')}
              onNavigateToWidgets={() => setActiveTab('widget')}
            />

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

                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center justify-between text-[9.75px] leading-[13px]">
                        <span className="font-semibold tracking-[0.4px] text-[#C6FF3D] uppercase">
                          LATEST TIP
                        </span>
                        <span className="font-medium text-[#B3B8D4]">
                          {latestTip ? formatTimeAgo(latestTip.created_at) : 'Live on Stellar'}
                        </span>
                      </div>

                      {latestTip ? (
                        <>
                          <div className="font-anton text-[38px] sm:text-[44px] leading-[42px] sm:leading-[46px] tracking-[0.4px] uppercase">
                            <div className="text-white truncate">
                              {(latestTip.supporter_name || 'Anonymous').toUpperCase()} TIPPED
                            </div>
                            <div className="text-[#C6FF3D] truncate">
                              {latestTip.amount} {latestTip.asset_code}
                            </div>
                          </div>

                          <p className="text-[13px] leading-[20px] text-[#DDE0F0] line-clamp-2">
                            {latestTip.message ? `“${latestTip.message}”` : <span className="italic text-[#8A91B4]">No message attached</span>}
                          </p>

                          <div className="flex items-center justify-between pt-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#3DD68C]/12 border border-[#3DD68C]/38 text-[#3DD68C] text-[9.75px] font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              Confirmed
                            </span>
                            {latestTip.stellar_tx_hash ? (
                              <a
                                href={`https://stellar.expert/explorer/testnet/tx/${latestTip.stellar_tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-mono-code text-[9.75px] text-[#B3B8D4] hover:text-white"
                              >
                                <span>tx {latestTip.stellar_tx_hash.slice(0, 4)}…{latestTip.stellar_tx_hash.slice(-4)}</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </a>
                            ) : (
                              <button
                                onClick={() => setActiveTab('history')}
                                className="inline-flex items-center gap-1 font-mono-code text-[9.75px] text-[#B3B8D4] hover:text-white cursor-pointer"
                              >
                                <span>View history</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="py-4 space-y-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#C6FF3D]">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div className="font-anton text-[26px] leading-[30px] uppercase text-white tracking-[0.4px]">
                            AWAITING FIRST TIP
                          </div>
                          <p className="text-[12.5px] leading-[18px] text-[#B3B8D4]">
                            Share your tip link or embed a widget to start receiving instant tips in XLM, USDC & USDT.
                          </p>
                          <button
                            onClick={() => setActiveTab('widget')}
                            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#C6FF3D] text-[#0B1026] text-xs font-bold hover:brightness-95 transition cursor-pointer"
                          >
                            <span>Share Tip Link</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* BIGGEST TIP section */}
                    <div className="relative z-10 pt-3.5 mt-5 border-t border-white/12 space-y-2.5">
                      <div className="flex items-center justify-between text-[9.75px] leading-[13px]">
                        <span className="font-semibold tracking-[0.4px] text-[#8A91B4] uppercase">
                          BIGGEST TIP
                        </span>
                        <span className="font-medium text-[#8A91B4]">
                          {biggestTip ? 'All time' : 'Awaiting data'}
                        </span>
                      </div>

                      {biggestTip ? (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-[32.5px] h-[32.5px] rounded-full bg-[#5A9CFF]/22 text-[#8DBBFF] font-extrabold text-[13px] flex items-center justify-center">
                                {(biggestTip.supporter_name || 'A').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-[11.375px] leading-[16px] font-bold text-white">
                                  {biggestTip.supporter_name || 'Anonymous'}
                                </div>
                                <div className="text-[9.75px] leading-[13px] font-medium text-[#8A91B4]">
                                  {formatTimeAgo(biggestTip.created_at)}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-[16.25px] leading-[23px] font-extrabold text-[#C6FF3D] tabular-nums">
                                {biggestTip.amount} {biggestTip.asset_code}
                              </div>
                              <div className="text-[9.75px] leading-[13px] font-medium text-[#8A91B4]">
                                {biggestTip.asset_code === 'USDC' || biggestTip.asset_code === 'USDT'
                                  ? `≈ $${Number(biggestTip.amount).toFixed(2)}`
                                  : `≈ $${(Number(biggestTip.amount) * 0.12).toFixed(2)}`}
                              </div>
                            </div>
                          </div>

                          {biggestTip.message && (
                            <div className="px-3 py-2 rounded-[9.75px] bg-white/[0.06] text-[11.375px] leading-[16px] text-[#DDE0F0] truncate">
                              “{biggestTip.message}”
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="py-2 text-[11.5px] text-[#8A91B4] italic">
                          No tips recorded yet
                        </div>
                      )}
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
                          onClick={() => setActiveTab('widget')}
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

                      {computedTopSupporters.length > 0 ? (
                        <div className="space-y-2.5">
                          {computedTopSupporters.map((s) => (
                            <div key={s.rank} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-[9.75px] font-semibold text-[#646A8A] w-3">
                                  {s.rank}
                                </span>
                                <div
                                  style={{ backgroundColor: s.bg, color: s.color }}
                                  className="w-[26px] h-[26px] rounded-full font-extrabold text-[11.375px] flex items-center justify-center shrink-0"
                                >
                                  {s.initial}
                                </div>
                                <span className="text-[11.375px] leading-[16px] font-bold text-[#0B1026] truncate">
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
                      ) : (
                        <div className="py-6 text-center space-y-1.5">
                          <Users className="w-8 h-8 text-[#A0A6C2] mx-auto opacity-50" />
                          <div className="text-xs font-bold text-[#0B1026]">No supporters yet</div>
                          <div className="text-[11px] text-[#646A8A] max-w-[200px] mx-auto leading-relaxed">
                            Your top supporters will appear here automatically as tips arrive.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ============================================================== */}
            {/* ============================================================== */}
            {/* TAB 2: UNIFIED TIP LINKS & EMBEDS SUITE                        */}
            {/* ============================================================== */}
            {activeTab === 'widget' && (
              <div className="space-y-6">
                {/* ------------------------------------------------------------ */}
                {/* SUB-VIEW 1: TIP LINKS & EMBEDS CARDS HUB (LIST VIEW)        */}
                {/* ------------------------------------------------------------ */}
                {widgetSubView === 'list' && (
                  <div className="space-y-6">
                    {/* Header Row */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#E4E7F2]">
                      <div className="max-w-2xl">
                        <h2 className="text-[28px] font-extrabold tracking-tight text-[#0B1026]">
                          Tip Links & Embeds
                        </h2>
                        <p className="text-sm text-[#646A8A] mt-1 leading-relaxed">
                          Create multiple tip links with custom branding for different platforms (Twitch, YouTube, Discord, Website). Share public links or grab embed codes anytime.
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
                        <button
                          onClick={startCreateWidget}
                          className="h-11 px-5 rounded-full bg-[#C6FF3D] hover:bg-[#bbf030] text-[#0B1026] text-sm font-bold inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-sm hover:shadow hover:-translate-y-0.5 whitespace-nowrap active:translate-y-0"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>Create New Tip Link</span>
                        </button>
                        <button
                          onClick={onOpenDemo}
                          className="h-11 px-5 rounded-full bg-[#0B1026] hover:bg-[#1A2244] text-[#C6FF3D] text-sm font-bold inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-sm hover:shadow hover:-translate-y-0.5 whitespace-nowrap active:translate-y-0"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Test Tip Flow</span>
                        </button>
                      </div>
                    </div>

                    {saveStatus && (
                      <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200 ${saveStatus.startsWith('Error') || saveStatus.startsWith('Failed') ? 'bg-[#FDF1E1] text-[#B45309]' : 'bg-[#E7F6EC] text-[#15803D]'}`}>
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{saveStatus}</span>
                      </div>
                    )}

                    {/* Tip Links Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {widgets.map((w) => {
                        const tipUrl = getWidgetTipUrl(w);
                        const isDefault = !!w.is_default;
                        return (
                          <div
                            key={w.id || w.slug}
                            className="bg-white rounded-2xl border border-[#E4E7F2] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                          >
                            {/* Card Header: Banner & Badges */}
                            <div>
                              <div className="relative h-24 w-full bg-gradient-to-r from-[#8C73FF] via-[#A892FF] to-[#D5CCFF] overflow-hidden">
                                {w.banner_url ? (
                                  <img
                                    src={w.banner_url}
                                    alt="Banner"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full opacity-70 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-300 via-purple-300 to-pink-200" />
                                )}
                                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                                  {isDefault && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-[#C6FF3D] text-[#0B1026] text-[10px] font-extrabold shadow-sm">
                                      ★ Primary Link
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 rounded-full bg-[#0B1026]/80 text-white text-[9.5px] font-mono-code font-bold backdrop-blur-sm capitalize">
                                    {w.theme || 'light'}
                                  </span>
                                </div>
                              </div>

                              {/* Overlapping Avatar & Info */}
                              <div className="px-5 pt-0 pb-3 relative">
                                <div className="-mt-7 flex items-end justify-between mb-2.5">
                                  <div className="w-14 h-14 rounded-full bg-[#0B1026] text-[#C6FF3D] border-[3px] border-white flex items-center justify-center font-extrabold text-lg overflow-hidden shadow-md">
                                    {w.avatar_url ? (
                                      <img src={w.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                      <span>{(creator?.display_name || 'C').charAt(0).toUpperCase()}</span>
                                    )}
                                  </div>
                                  <span className="text-[11px] font-mono-code font-bold text-[#6A4CF5] bg-[#F4F1FF] px-2.5 py-1 rounded-lg">
                                    ?widget={w.slug || 'main'}
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-extrabold text-base text-[#0B1026] truncate">
                                      {w.name}
                                    </h3>
                                  </div>
                                  <p className="text-xs text-[#646A8A] line-clamp-2">
                                    {w.welcome_message || w.widget_title || 'Direct Stellar tip link.'}
                                  </p>
                                </div>

                                {/* URL Quick Strip */}
                                <div className="mt-3 p-2 rounded-xl bg-[#F6F7FB] border border-[#EEF0F7] flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-mono-code text-[#646A8A] truncate flex-1">
                                    {tipUrl}
                                  </span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard?.writeText(tipUrl);
                                      setSaveStatus(`Copied link for "${w.name}"!`);
                                      setTimeout(() => setSaveStatus(null), 2500);
                                    }}
                                    className="p-1 rounded-lg hover:bg-white text-[#0B1026] transition shrink-0 cursor-pointer"
                                    title="Quick copy link"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Card Actions: Share, Embed, Edit */}
                            <div className="p-4 pt-3 border-t border-[#EEF0F7] space-y-2.5 bg-white">
                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  onClick={() => openShareModal(w)}
                                  className="px-2.5 py-2 rounded-xl bg-[#F4F1FF] hover:bg-[#ECE7FF] text-[#6A4CF5] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                                  title="Share link, copy URL, or get QR code"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                  <span>Share</span>
                                </button>
                                <button
                                  onClick={() => openEmbedModal(w)}
                                  className="px-2.5 py-2 rounded-xl bg-[#0B1026] hover:bg-[#1E2548] text-[#C6FF3D] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                                  title="Get website embed code, iFrame, or OBS overlay"
                                >
                                  <Code2 className="w-3.5 h-3.5" />
                                  <span>Embed</span>
                                </button>
                                <button
                                  onClick={() => startEditWidget(w)}
                                  className="px-2.5 py-2 rounded-xl bg-[#F6F7FB] hover:bg-[#EEF0F7] text-[#0B1026] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                                  title="Open dedicated editor for this tip link"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-[#646A8A]" />
                                  <span>Edit</span>
                                </button>
                              </div>

                              {/* Secondary Row: Set Primary & Delete */}
                              <div className="flex items-center justify-between pt-1 text-[11px]">
                                {!isDefault ? (
                                  <button
                                    onClick={() => handleSetDefaultWidget(w)}
                                    className="font-bold text-[#6A4CF5] hover:underline cursor-pointer"
                                  >
                                    Set as Primary
                                  </button>
                                ) : (
                                  <span className="text-[#10B981] font-semibold flex items-center gap-1">
                                    <Check className="w-3 h-3 stroke-[3]" /> Active Default
                                  </span>
                                )}

                                {widgets.length > 1 && !isDefault && w.id && (
                                  <button
                                    onClick={() => handleDeleteWidget(w.id!)}
                                    className="text-[#E5484D] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Quick Add Card */}
                      <button
                        onClick={startCreateWidget}
                        className="p-8 rounded-2xl border-2 border-dashed border-[#D5D8E6] hover:border-[#6A4CF5] hover:bg-[#F4F1FF]/30 transition-all flex flex-col items-center justify-center text-center group cursor-pointer min-h-[300px]"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-[#F6F7FB] group-hover:bg-[#6A4CF5] group-hover:text-white text-[#646A8A] flex items-center justify-center mb-3 transition-colors shadow-sm">
                          <Plus className="w-6 h-6 stroke-[2.5]" />
                        </div>
                        <div className="font-extrabold text-sm text-[#0B1026] group-hover:text-[#6A4CF5] transition-colors">
                          Create New Tip Link
                        </div>
                        <div className="text-xs text-[#646A8A] mt-1 max-w-[200px]">
                          Add a unique branded page for Twitch, YouTube, Discord, or Web.
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------ */}
                {/* SUB-VIEW 2: DEDICATED CLEAN PAGE FOR TIP CREATION & EDITING */}
                {/* ------------------------------------------------------------ */}
                {(widgetSubView === 'create' || widgetSubView === 'edit') && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Top Navigation & Breadcrumb Bar */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E4E7F2] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setWidgetSubView('list')}
                          className="px-3 py-2 rounded-xl bg-[#F6F7FB] hover:bg-[#EEF0F7] text-[#0B1026] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Back to all tip links</span>
                        </button>
                        <div className="h-5 w-px bg-[#E4E7F2] hidden sm:block" />
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-[#6A4CF5]">
                            {widgetSubView === 'create' ? '✨ New Tip Link Page' : '✏️ Tip Link Editor'}
                          </div>
                          <div className="text-base font-extrabold text-[#0B1026]">
                            {widgetSubView === 'create' ? 'Create a New Tip Link & Embed' : `Edit: ${widgetName || 'Tip Link'}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setWidgetSubView('list')}
                          className="px-4 py-2 rounded-full border border-[#E4E7F2] text-xs font-bold text-[#646A8A] hover:bg-[#F6F7FB] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveWidgetPage()}
                          disabled={isSavingWidget || !widgetName.trim()}
                          className="px-5 py-2.5 rounded-full bg-[#C6FF3D] hover:brightness-95 text-[#0B1026] text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-50 transition cursor-pointer shadow-sm"
                        >
                          {isSavingWidget ? (
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          )}
                          <span>
                            {isSavingWidget
                              ? 'Saving…'
                              : widgetSubView === 'create'
                              ? 'Create & Continue →'
                              : 'Save Changes'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Dedicated Two-Column Editor Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left Column: Form Configuration */}
                      <form
                        onSubmit={handleSaveWidgetPage}
                        className="lg:col-span-7 space-y-5"
                      >
                        {/* Section 1: Purpose & URL Slug */}
                        <div className="p-6 rounded-2xl bg-white border border-[#E4E7F2] space-y-4">
                          <div className="flex items-center gap-2 pb-3 border-b border-[#EEF0F7]">
                            <Layers className="w-4 h-4 text-[#6A4CF5]" />
                            <h3 className="font-extrabold text-sm text-[#0B1026]">
                              1. Purpose & Link Identity
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-[#0B1026] mb-1.5">
                                Purpose / Link Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={widgetName}
                                onChange={(e) => {
                                  setWidgetName(e.target.value);
                                  if (widgetSubView === 'create' && !widgetSlug) {
                                    setWidgetSlug(
                                      e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20)
                                    );
                                  }
                                }}
                                placeholder="e.g. Twitch Stream, YouTube, Discord"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E7F2] text-sm text-[#0B1026] focus:outline-none focus:border-[#6A4CF5]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-[#0B1026] mb-1.5">
                                Custom URL Slug *
                              </label>
                              <div className="flex items-center rounded-xl border border-[#E4E7F2] px-3 py-2.5 bg-[#F6F7FB]">
                                <span className="font-mono-code text-xs text-[#646A8A]">?widget=</span>
                                <input
                                  type="text"
                                  required
                                  value={widgetSlug}
                                  onChange={(e) => setWidgetSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                                  placeholder="twitch"
                                  className="flex-1 bg-transparent font-mono-code text-xs font-bold text-[#0B1026] focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-[#F6F7FB] border border-[#EEF0F7] flex items-center justify-between text-xs font-mono-code">
                            <span className="text-[#646A8A] truncate">
                              {appBaseUrl}/{effectiveHandle}?widget={widgetSlug || 'slug'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-[#0B1026] mb-1.5">
                                Public Widget Title
                              </label>
                              <input
                                type="text"
                                value={widgetTitle}
                                onChange={(e) => setWidgetTitle(e.target.value)}
                                placeholder={`e.g. Tip ${creator?.display_name || 'Alex'}`}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E7F2] text-sm text-[#0B1026] focus:outline-none focus:border-[#6A4CF5]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-[#0B1026] mb-1.5">
                                Visual Theme
                              </label>
                              <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#EEF0F7]">
                                {(['light', 'dark', 'midnight', 'cyber'] as const).map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => setWidgetTheme(t)}
                                    className={`py-2 rounded-lg text-xs font-bold capitalize transition ${
                                      widgetTheme === t
                                        ? 'bg-white text-[#0B1026] shadow-sm'
                                        : 'text-[#646A8A] hover:text-[#0B1026]'
                                    }`}
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#0B1026] mb-1.5">
                              Welcome / Supporter Message
                            </label>
                            <textarea
                              rows={2}
                              value={widgetWelcome}
                              onChange={(e) => setWidgetWelcome(e.target.value)}
                              placeholder="Message shown to supporters when tipping..."
                              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E7F2] text-xs text-[#0B1026] focus:outline-none focus:border-[#6A4CF5]"
                            />
                          </div>
                        </div>

                        {/* Section 2: Branding, Banner & Avatar */}
                        <div className="p-6 rounded-2xl bg-white border border-[#E4E7F2] space-y-5">
                          <div className="flex items-center justify-between pb-3 border-b border-[#EEF0F7]">
                            <div className="flex items-center gap-2">
                              <Palette className="w-4 h-4 text-[#6A4CF5]" />
                              <h3 className="font-extrabold text-sm text-[#0B1026]">
                                2. Custom Avatar & Header Banner
                              </h3>
                            </div>
                            <span className="text-[11px] text-[#646A8A]">
                              Upload from device or enter URL
                            </span>
                          </div>

                          {/* Custom Avatar Upload & URL */}
                          <div className="space-y-2.5">
                            <label className="block text-xs font-bold text-[#0B1026]">
                              Tip Link Avatar / Profile Picture
                            </label>

                            {/* Hidden file input for avatar */}
                            <input
                              type="file"
                              ref={avatarFileInputRef}
                              onChange={handleAvatarFileUpload}
                              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                              className="hidden"
                            />

                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              {/* Preview thumbnail */}
                              <div className="relative w-14 h-14 rounded-full overflow-hidden bg-[#0B1026] text-[#C6FF3D] flex items-center justify-center font-bold text-base shrink-0 border-2 border-white shadow-md">
                                {widgetAvatarUrl ? (
                                  <img src={widgetAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <span>{(creator?.display_name || 'C').charAt(0).toUpperCase()}</span>
                                )}
                                {isUploadingAvatar && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-[#C6FF3D] animate-spin" />
                                  </div>
                                )}
                              </div>

                              {/* Upload and quick actions */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => avatarFileInputRef.current?.click()}
                                  disabled={isUploadingAvatar}
                                  className="h-9 px-3.5 rounded-xl bg-[#0B1026] hover:bg-[#1A2244] text-[#C6FF3D] text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                                >
                                  {isUploadingAvatar ? (
                                    <>
                                      <Clock className="w-3.5 h-3.5 animate-spin" />
                                      <span>Uploading…</span>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-3.5 h-3.5" />
                                      <span>Upload Image</span>
                                    </>
                                  )}
                                </button>

                                {creator?.avatar_url && (
                                  <button
                                    type="button"
                                    onClick={() => setWidgetAvatarUrl(creator.avatar_url || '')}
                                    className="h-9 px-3 rounded-xl bg-[#F6F7FB] border border-[#E4E7F2] text-xs font-bold text-[#0B1026] hover:bg-[#EEF0F7] whitespace-nowrap cursor-pointer transition"
                                  >
                                    Use Profile Avatar
                                  </button>
                                )}

                                {widgetAvatarUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setWidgetAvatarUrl('')}
                                    className="h-9 px-2.5 rounded-xl bg-[#FDF2F2] hover:bg-[#FCE8E8] text-[#E5484D] text-xs font-semibold cursor-pointer transition"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            </div>

                            {avatarUploadError && (
                              <div className="text-[11px] text-[#E5484D] font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>{avatarUploadError}</span>
                              </div>
                            )}

                            {/* Or paste direct URL */}
                            <div className="pt-1">
                              <input
                                type="text"
                                value={widgetAvatarUrl}
                                onChange={(e) => setWidgetAvatarUrl(e.target.value)}
                                placeholder="Or enter image URL: https://... (PNG, JPG, WEBP, SVG)"
                                className="w-full px-3.5 py-2 rounded-xl border border-[#E4E7F2] text-xs text-[#0B1026] focus:outline-none focus:border-[#6A4CF5]"
                              />
                            </div>
                          </div>

                          {/* Custom Banner Upload & Presets */}
                          <div className="space-y-2.5 pt-3 border-t border-[#EEF0F7]">
                            <label className="block text-xs font-bold text-[#0B1026]">
                              Tip Link Header Banner
                            </label>

                            {/* Hidden file input for banner */}
                            <input
                              type="file"
                              ref={bannerFileInputRef}
                              onChange={handleBannerFileUpload}
                              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                              className="hidden"
                            />

                            {/* Banner Preview & Upload Box */}
                            <div className="relative h-28 w-full rounded-2xl overflow-hidden bg-gradient-to-r from-[#8C73FF] via-[#A892FF] to-[#D5CCFF] border border-[#E4E7F2] group">
                              {widgetBannerUrl ? (
                                <img
                                  src={widgetBannerUrl}
                                  alt="Banner"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-[#F8FAFC] text-[#646A8A]">
                                  <Image className="w-6 h-6 mb-1 opacity-40" />
                                  <span className="text-xs font-medium">No banner chosen (default gradient will be used)</span>
                                </div>
                              )}

                              {isUploadingBanner && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 text-white text-xs font-bold backdrop-blur-xs">
                                  <Clock className="w-4 h-4 text-[#C6FF3D] animate-spin" />
                                  <span>Uploading banner image…</span>
                                </div>
                              )}

                              {/* Hover controls overlay */}
                              <div className="absolute top-2.5 right-2.5 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => bannerFileInputRef.current?.click()}
                                  disabled={isUploadingBanner}
                                  className="h-8 px-3 rounded-lg bg-[#0B1026]/90 hover:bg-[#0B1026] text-[#C6FF3D] text-[11px] font-bold inline-flex items-center gap-1.5 shadow-md backdrop-blur-xs cursor-pointer transition"
                                >
                                  <Upload className="w-3 h-3" />
                                  <span>{widgetBannerUrl ? 'Change Banner' : 'Upload Banner'}</span>
                                </button>
                                {widgetBannerUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setWidgetBannerUrl('')}
                                    className="h-8 px-2.5 rounded-lg bg-white/90 hover:bg-white text-[#E5484D] text-[11px] font-bold shadow-md cursor-pointer transition"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>

                            {bannerUploadError && (
                              <div className="text-[11px] text-[#E5484D] font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>{bannerUploadError}</span>
                              </div>
                            )}

                            {/* Banner URL input & Presets */}
                            <div className="space-y-2 pt-1">
                              <input
                                type="text"
                                value={widgetBannerUrl}
                                onChange={(e) => setWidgetBannerUrl(e.target.value)}
                                placeholder="Or enter banner URL: https://... (Unsplash, Imgur, or direct link)"
                                className="w-full px-3.5 py-2 rounded-xl border border-[#E4E7F2] text-xs text-[#0B1026] focus:outline-none focus:border-[#6A4CF5]"
                              />
                              <div className="flex items-center gap-2 text-[11px] text-[#646A8A] flex-wrap">
                                <span>Banner Presets:</span>
                                <button
                                  type="button"
                                  onClick={() => setWidgetBannerUrl('https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop')}
                                  className="px-2 py-0.5 rounded-lg bg-[#F6F7FB] border border-[#E4E7F2] hover:bg-[#EEF0F7] text-[#0B1026] cursor-pointer"
                                >
                                  Retro Tech
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setWidgetBannerUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop')}
                                  className="px-2 py-0.5 rounded-lg bg-[#F6F7FB] border border-[#E4E7F2] hover:bg-[#EEF0F7] text-[#0B1026] cursor-pointer"
                                >
                                  Violet Flow
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setWidgetBannerUrl('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop')}
                                  className="px-2 py-0.5 rounded-lg bg-[#F6F7FB] border border-[#E4E7F2] hover:bg-[#EEF0F7] text-[#0B1026] cursor-pointer"
                                >
                                  Gradient Glow
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 3: Preset Tip Amounts */}
                        <div className="p-6 rounded-2xl bg-white border border-[#E4E7F2] space-y-4">
                          <div className="flex items-center gap-2 pb-3 border-b border-[#EEF0F7]">
                            <Sparkles className="w-4 h-4 text-[#6A4CF5]" />
                            <h3 className="font-extrabold text-sm text-[#0B1026]">
                              3. Suggested Tip Amounts
                            </h3>
                          </div>

                          {/* USDC */}
                          <div>
                            <div className="text-[11px] font-bold text-[#646A8A] mb-1.5 flex items-center gap-1.5">
                              <UsdcBadge size={14} />
                              <span>USDC Presets ($ Dollar Value)</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {widgetPresetsUsdc.map((amt, idx) => (
                                <input
                                  key={`usdc-${idx}`}
                                  type="number"
                                  value={amt}
                                  onChange={(e) => {
                                    const newP = [...widgetPresetsUsdc];
                                    newP[idx] = Number(e.target.value);
                                    setWidgetPresetsUsdc(newP);
                                  }}
                                  className="px-2.5 py-2 rounded-xl border border-[#E4E7F2] text-center font-mono-code text-xs font-bold text-[#0B1026] focus:outline-none focus:border-[#6A4CF5]"
                                />
                              ))}
                            </div>
                          </div>

                          {/* XLM */}
                          <div>
                            <div className="text-[11px] font-bold text-[#646A8A] mb-1.5 flex items-center gap-1.5">
                              <XlmBadge size={14} />
                              <span>XLM Presets (Stroops / Lumens)</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {widgetPresetsXlm.map((amt, idx) => (
                                <input
                                  key={`xlm-${idx}`}
                                  type="number"
                                  value={amt}
                                  onChange={(e) => {
                                    const newP = [...widgetPresetsXlm];
                                    newP[idx] = Number(e.target.value);
                                    setWidgetPresetsXlm(newP);
                                  }}
                                  className="px-2.5 py-2 rounded-xl border border-[#E4E7F2] text-center font-mono-code text-xs font-bold text-[#0B1026] focus:outline-none focus:border-[#6A4CF5]"
                                />
                              ))}
                            </div>
                          </div>

                          {/* USDT */}
                          <div>
                            <div className="text-[11px] font-bold text-[#646A8A] mb-1.5 flex items-center gap-1.5">
                              <span className="w-3.5 h-3.5 rounded-full bg-[#26A17B] text-white text-[9px] font-bold flex items-center justify-center">₮</span>
                              <span>USDT Presets (Tether)</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {widgetPresetsUsdt.map((amt, idx) => (
                                <input
                                  key={`usdt-${idx}`}
                                  type="number"
                                  value={amt}
                                  onChange={(e) => {
                                    const newP = [...widgetPresetsUsdt];
                                    newP[idx] = Number(e.target.value);
                                    setWidgetPresetsUsdt(newP);
                                  }}
                                  className="px-2.5 py-2 rounded-xl border border-[#E4E7F2] text-center font-mono-code text-xs font-bold text-[#0B1026] focus:outline-none focus:border-[#6A4CF5]"
                                />
                              ))}
                            </div>
                          </div>

                          {/* Primary Default Checkbox */}
                          <div className="pt-3 border-t border-[#EEF0F7] flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-[#0B1026]">Primary Default Tip Link</div>
                              <div className="text-[11px] text-[#646A8A]">
                                Make this your default landing page link when visiting your main profile URL.
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={widgetIsDefault}
                              onChange={(e) => setWidgetIsDefault(e.target.checked)}
                              className="w-4 h-4 rounded text-[#6A4CF5] focus:ring-0 cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Section 4: Supporter Remark Moderation Filter (Optional) */}
                        <div className="p-6 rounded-2xl bg-white border border-[#E4E7F2] space-y-4">
                          <div className="flex items-center justify-between pb-3 border-b border-[#EEF0F7]">
                            <div className="flex items-center gap-2">
                              <ShieldAlert className="w-4 h-4 text-[#6A4CF5]" />
                              <h3 className="font-extrabold text-sm text-[#0B1026]">
                                4. Supporter Remark & Comment Moderation
                              </h3>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F6F7FB] text-[#646A8A] border border-[#E4E7F2]">
                                Optional
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={openFilterModal}
                              className="px-3 py-1.5 rounded-xl bg-[#F4F1FF] hover:bg-[#ECE7FF] text-[#6A4CF5] text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              <span>Configure Filter Rules (Modal)</span>
                            </button>
                          </div>

                          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${widgetFilterRemarks ? 'bg-[#10B981]' : 'bg-[#94A3B8]'}`} />
                                <span className="text-xs font-extrabold text-[#0B1026]">
                                  {widgetFilterRemarks
                                    ? `Filter Active (${widgetBannedWords.length} banned terms)`
                                    : 'Filter Disabled (All remarks accepted)'}
                                </span>
                                {widgetFilterRemarks && (
                                  <span className="px-2 py-0.5 rounded-full bg-[#0B1026] text-white text-[9.5px] font-mono-code capitalize font-bold">
                                    {widgetFilterAction === 'mask' ? 'Mask with ****' : 'Block Tip'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11.5px] text-[#646A8A] leading-relaxed">
                                {widgetFilterRemarks
                                  ? widgetFilterAction === 'mask'
                                    ? 'Prohibited words in supporter remarks will be automatically masked with asterisks (****) on live alerts and feeds.'
                                    : 'Tips containing prohibited terms will be rejected, prompting the supporter to edit their comment.'
                                  : 'Optional protection against spam, harassment, and inappropriate remarks when supporters send you tips.'}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setWidgetFilterRemarks(!widgetFilterRemarks)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                                  widgetFilterRemarks
                                    ? 'bg-[#E7F6EC] text-[#15803D] border-[#BBF7D0]'
                                    : 'bg-white text-[#646A8A] border-[#E4E7F2] hover:bg-[#F6F7FB]'
                                }`}
                              >
                                {widgetFilterRemarks ? 'Enabled' : 'Disabled'}
                              </button>
                              <button
                                type="button"
                                onClick={openFilterModal}
                                className="px-3.5 py-1.5 rounded-xl bg-[#0B1026] text-[#C6FF3D] text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#1A2244] transition cursor-pointer"
                              >
                                <span>Manage Rules</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {widgetFilterRemarks && widgetBannedWords.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <div className="text-[11px] font-bold text-[#646A8A]">Active Banned Words & Phrases:</div>
                              <div className="flex flex-wrap gap-1.5">
                                {widgetBannedWords.map((word) => (
                                  <span
                                    key={word}
                                    className="px-2.5 py-1 rounded-lg bg-white border border-[#E4E7F2] text-[#0B1026] text-[11px] font-mono-code font-bold flex items-center gap-1.5 shadow-2xs"
                                  >
                                    <span>{word}</span>
                                    <button
                                      type="button"
                                      onClick={() => setWidgetBannedWords(widgetBannedWords.filter((w) => w !== word))}
                                      className="text-[#94A3B8] hover:text-[#E5484D] cursor-pointer"
                                      title="Remove word"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bottom Actions */}
                        <div className="p-4 rounded-2xl bg-white border border-[#E4E7F2] flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setWidgetSubView('list')}
                            className="px-4 py-2 rounded-xl border border-[#E4E7F2] text-xs font-bold text-[#646A8A] hover:bg-[#F6F7FB] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingWidget || !widgetName.trim()}
                            className="px-6 py-2.5 rounded-full bg-[#C6FF3D] hover:brightness-95 text-[#0B1026] text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-50 transition cursor-pointer shadow-sm"
                          >
                            {isSavingWidget ? (
                              <Clock className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            )}
                            <span>
                              {isSavingWidget
                                ? 'Saving…'
                                : widgetSubView === 'create'
                                ? 'Create & Continue →'
                                : 'Save Changes'}
                            </span>
                          </button>
                        </div>
                      </form>

                      {/* Right Column: Live Sticky Preview */}
                      <div className="lg:col-span-5 sticky top-6 space-y-4">
                        <div className="p-6 rounded-2xl bg-[#0B1026] flex flex-col items-center justify-center shadow-xl">
                          <div className="text-xs font-mono-code text-[#C6FF3D] mb-4 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>[ Live Supporter Preview ]</span>
                          </div>

                          {/* Standalone Widget Card Preview */}
                          <div className="w-full max-w-[360px] rounded-[24px] bg-white overflow-hidden text-[#0B1026] shadow-2xl relative border border-[#E4E7F2]">
                            {/* Banner */}
                            <div className="relative h-20 w-full bg-gradient-to-r from-[#8C73FF] via-[#A892FF] to-[#D5CCFF] overflow-hidden">
                              {widgetBannerUrl ? (
                                <img
                                  src={widgetBannerUrl}
                                  alt="Banner Preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full opacity-60 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-300 via-purple-300 to-pink-200" />
                              )}
                              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-[#0B1026]/80 text-[#C6FF3D] text-[9.5px] font-bold backdrop-blur-sm">
                                Stellar Live
                              </span>
                            </div>

                            {/* Avatar Overlapping Banner */}
                            <div className="px-5 pt-0 pb-5 space-y-3.5 relative">
                              <div className="-mt-8 flex items-end justify-between">
                                <div className="w-16 h-16 rounded-full bg-[#0B1026] text-[#C6FF3D] border-4 border-white flex items-center justify-center font-extrabold text-xl overflow-hidden shadow-md">
                                  {widgetAvatarUrl ? (
                                    <img src={widgetAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{(creator?.display_name || creatorName || 'C').charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                                <span className="text-[11px] font-mono-code font-bold text-[#6A4CF5] bg-[#F4F1FF] px-2.5 py-1 rounded-full">
                                  #{widgetSlug || 'main'}
                                </span>
                              </div>

                              <div>
                                <div className="font-extrabold text-base text-[#0B1026] leading-tight">
                                  {widgetTitle || `Tip ${creator?.display_name || creatorName}`}
                                </div>
                                <div className="text-xs text-[#646A8A] mt-1 line-clamp-2">
                                  {widgetWelcome || creatorBio}
                                </div>
                              </div>

                              {/* Currency Selector */}
                              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#EEF0F7] text-xs font-bold text-center">
                                {(['USDC', 'XLM', 'USDT'] as const).map((c) => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => setWidgetCurrency(c)}
                                    className={`py-1.5 rounded-lg transition cursor-pointer ${
                                      widgetCurrency === c
                                        ? 'bg-white text-[#0B1026] shadow-sm'
                                        : 'text-[#646A8A]'
                                    }`}
                                  >
                                    {c}
                                  </button>
                                ))}
                              </div>

                              {/* Presets Grid */}
                              <div className="grid grid-cols-4 gap-1.5">
                                {(widgetCurrency === 'USDC'
                                  ? widgetPresetsUsdc
                                  : widgetCurrency === 'XLM'
                                  ? widgetPresetsXlm
                                  : widgetPresetsUsdt
                                ).map((amt) => (
                                  <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setWidgetSelectedPreset(amt)}
                                    className={`py-2 rounded-xl font-bold text-xs border transition cursor-pointer ${
                                      widgetSelectedPreset === amt
                                        ? 'bg-[#0B1026] text-[#C6FF3D] border-[#0B1026]'
                                        : 'border-[#E4E7F2] text-[#0B1026] hover:bg-[#F6F7FB]'
                                    }`}
                                  >
                                    {amt}
                                  </button>
                                ))}
                              </div>

                              {/* Tip Action Button */}
                              <button
                                onClick={onOpenDemo}
                                className="w-full py-3 rounded-full bg-[#C6FF3D] text-[#0B1026] font-extrabold text-xs flex items-center justify-center gap-2 hover:brightness-95 transition cursor-pointer shadow-sm"
                              >
                                {widgetCurrency === 'USDC' && <UsdcBadge size={16} />}
                                {widgetCurrency === 'XLM' && <XlmBadge size={16} />}
                                {widgetCurrency === 'USDT' && (
                                  <span className="w-4 h-4 rounded-full bg-[#26A17B] text-white text-[9px] font-bold flex items-center justify-center">
                                    ₮
                                  </span>
                                )}
                                <span>
                                  Tip {widgetSelectedPreset} {widgetCurrency}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}



            {/* ============================================================== */}
            {/* POST-SAVE ACTION MODAL (AFTER CREATING / EDITING TIP LINK)     */}
            {/* ============================================================== */}
            {postSaveModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#E4E7F2] space-y-5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-center space-y-1.5 pt-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#E7F6EC] text-[#15803D] flex items-center justify-center mx-auto text-xl font-bold mb-2">
                      <Check className="w-6 h-6 stroke-[3]" />
                    </div>
                    <h3 className="font-extrabold text-xl text-[#0B1026]">
                      {savedWidgetResult?.name || 'Tip Link'} is Live!
                    </h3>
                    <p className="text-xs text-[#646A8A] max-w-sm mx-auto">
                      Your tip link was saved successfully. What would you like to do next?
                    </p>
                  </div>

                  {/* Public Link Quick Box */}
                  <div className="p-3.5 rounded-2xl bg-[#F6F7FB] border border-[#EEF0F7] space-y-2">
                    <div className="text-[11px] font-bold text-[#646A8A] uppercase tracking-wider">
                      Direct Public Tip Link:
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-code text-xs text-[#0B1026] truncate">
                        {getWidgetTipUrl(savedWidgetResult)}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(getWidgetTipUrl(savedWidgetResult));
                          setSaveStatus('Copied link!');
                          setTimeout(() => setSaveStatus(null), 2500);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white border border-[#E4E7F2] text-xs font-bold text-[#0B1026] flex items-center gap-1 hover:bg-[#EEF0F7] transition cursor-pointer shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>

                  {/* Next Step Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setPostSaveModalOpen(false);
                        if (savedWidgetResult) openShareModal(savedWidgetResult);
                      }}
                      className="p-4 rounded-2xl border border-[#E4E7F2] hover:border-[#6A4CF5] hover:bg-[#F4F1FF]/30 transition text-left group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#F4F1FF] text-[#6A4CF5] flex items-center justify-center mb-2">
                        <Share2 className="w-4 h-4" />
                      </div>
                      <div className="font-extrabold text-xs text-[#0B1026] group-hover:text-[#6A4CF5]">
                        Share & QR Code
                      </div>
                      <div className="text-[11px] text-[#646A8A] mt-0.5">
                        Share on Twitter, Discord, or view scannable QR code.
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setPostSaveModalOpen(false);
                        if (savedWidgetResult) openEmbedModal(savedWidgetResult);
                      }}
                      className="p-4 rounded-2xl border border-[#E4E7F2] hover:border-[#6A4CF5] hover:bg-[#F4F1FF]/30 transition text-left group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#0B1026] text-[#C6FF3D] flex items-center justify-center mb-2">
                        <Code2 className="w-4 h-4" />
                      </div>
                      <div className="font-extrabold text-xs text-[#0B1026] group-hover:text-[#6A4CF5]">
                        Get Embed Code
                      </div>
                      <div className="text-[11px] text-[#646A8A] mt-0.5">
                        Floating script widget, iFrame, or OBS stream alert.
                      </div>
                    </button>
                  </div>

                  {/* Dismiss */}
                  <div className="pt-2 border-t border-[#EEF0F7] flex justify-end">
                    <button
                      onClick={() => {
                        setPostSaveModalOpen(false);
                        setWidgetSubView('list');
                      }}
                      className="px-5 py-2.5 rounded-full bg-[#0B1026] text-white text-xs font-bold hover:bg-[#1E2548] cursor-pointer"
                    >
                      View All Tip Links
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* REMARK MODERATION FILTER CONFIGURATION MODAL (OPTIONAL)        */}
            {/* ============================================================== */}
            {filterModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-[#E4E7F2] space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#EEF0F7]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-[#F4F1FF] text-[#6A4CF5] flex items-center justify-center">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-lg text-[#0B1026]">
                            Supporter Remark Filter
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F6F7FB] text-[#646A8A] border border-[#E4E7F2]">
                            Optional
                          </span>
                        </div>
                        <p className="text-xs text-[#646A8A]">
                          Moderate or ban offensive comments and spam when supporters make tips.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFilterModalOpen(false)}
                      className="p-1.5 rounded-full hover:bg-[#F6F7FB] text-[#646A8A] cursor-pointer transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Toggle: Enable / Disable Filter */}
                  <div
                    onClick={() => setTempFilterRemarks(!tempFilterRemarks)}
                    className="p-4 rounded-2xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-between gap-4 cursor-pointer transition select-none"
                  >
                    <div>
                      <div className="font-extrabold text-sm text-[#0B1026]">
                        Enable Remark Filtering for this Tip Link
                      </div>
                      <div className="text-xs text-[#646A8A] mt-0.5">
                        (Optional) When off, supporters can send remarks without filter moderation.
                      </div>
                    </div>
                    <div className="relative inline-flex items-center shrink-0">
                      <div className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${tempFilterRemarks ? 'bg-[#6A4CF5]' : 'bg-slate-300'} relative`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out absolute top-0.5 left-0.5 ${tempFilterRemarks ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </div>
                  </div>

                  {/* Moderation Action: Mask vs Block */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#0B1026]">
                      Moderation Action when Banned Words Match
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setTempFilterAction('mask')}
                        className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                          tempFilterAction === 'mask'
                            ? 'border-[#6A4CF5] bg-[#F4F1FF]/50'
                            : 'border-[#E4E7F2] hover:border-[#CBD5E1]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-extrabold text-[#0B1026]">
                            Mask with Asterisks (****)
                          </span>
                          <span className="text-[10px] font-bold text-[#6A4CF5] bg-white px-2 py-0.5 rounded-full border border-[#E4E7F2]">
                            Recommended
                          </span>
                        </div>
                        <p className="text-[11px] text-[#646A8A] leading-relaxed">
                          Tip succeeds directly, but prohibited words are censored (e.g. "free **** here") on live alerts and history.
                        </p>
                      </div>

                      <div
                        onClick={() => setTempFilterAction('block')}
                        className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                          tempFilterAction === 'block'
                            ? 'border-[#6A4CF5] bg-[#F4F1FF]/50'
                            : 'border-[#E4E7F2] hover:border-[#CBD5E1]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-extrabold text-[#0B1026]">
                            Block Remark / Tip
                          </span>
                          <span className="text-[10px] font-bold text-[#E5484D] bg-[#FDF2F2] px-2 py-0.5 rounded-full">
                            Strict
                          </span>
                        </div>
                        <p className="text-[11px] text-[#646A8A] leading-relaxed">
                          Rejects the tip request and asks the supporter to remove the banned word from their comment before sending.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Banned Words & Phrases Manager */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[#0B1026]">
                        Banned Words & Phrases ({tempBannedWords.length})
                      </label>
                      {tempBannedWords.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setTempBannedWords([])}
                          className="text-[11px] font-semibold text-[#E5484D] hover:underline cursor-pointer"
                        >
                          Clear All Words
                        </button>
                      )}
                    </div>

                    {/* Word Tag Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newBannedWordInput}
                        onChange={(e) => setNewBannedWordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addBannedWord();
                          }
                        }}
                        placeholder="Type a word or phrase to ban (press Enter to add)"
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E4E7F2] text-xs text-[#0B1026] focus:outline-none focus:border-[#6A4CF5]"
                      />
                      <button
                        type="button"
                        onClick={() => addBannedWord()}
                        className="px-4 py-2.5 rounded-xl bg-[#0B1026] text-[#C6FF3D] text-xs font-bold hover:bg-[#1E2548] transition cursor-pointer shrink-0"
                      >
                        Add Term
                      </button>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-2 text-[11px] text-[#646A8A] flex-wrap">
                      <span className="font-semibold">Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() =>
                          addPresetWords([
                            'scam',
                            'free crypto',
                            'airdrop',
                            'dm me',
                            'telegram',
                            'whatsapp',
                            'guaranteed profit',
                            'doubler',
                          ])
                        }
                        className="px-2.5 py-1 rounded-lg bg-[#F6F7FB] border border-[#E4E7F2] hover:bg-[#EEF0F7] text-[#0B1026] font-medium cursor-pointer transition"
                      >
                        + Spam & Crypto Scams
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          addPresetWords([
                            'hate',
                            'loser',
                            'scammer',
                            'fraud',
                            'trash',
                            'fake',
                            'idiot',
                            'abuse',
                          ])
                        }
                        className="px-2.5 py-1 rounded-lg bg-[#F6F7FB] border border-[#E4E7F2] hover:bg-[#EEF0F7] text-[#0B1026] font-medium cursor-pointer transition"
                      >
                        + Harassment & Toxicity
                      </button>
                    </div>

                    {/* Words Badges Container */}
                    <div className="p-3.5 rounded-2xl bg-[#F6F7FB] border border-[#EEF0F7] min-h-[90px] max-h-48 overflow-y-auto">
                      {tempBannedWords.length === 0 ? (
                        <div className="text-center py-5 text-xs text-[#94A3B8]">
                          No banned words configured yet. Type a word above or click a preset to add terms.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {tempBannedWords.map((word) => (
                            <span
                              key={word}
                              className="px-2.5 py-1 rounded-lg bg-white border border-[#E4E7F2] text-[#0B1026] text-xs font-mono-code font-bold flex items-center gap-1.5 shadow-2xs group"
                            >
                              <span>{word}</span>
                              <button
                                type="button"
                                onClick={() => removeBannedWord(word)}
                                className="text-[#94A3B8] hover:text-[#E5484D] transition cursor-pointer"
                                title="Remove term"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="pt-3 border-t border-[#EEF0F7] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setFilterModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-[#E4E7F2] text-xs font-bold text-[#646A8A] hover:bg-[#F6F7FB] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={applyFilterModal}
                      className="px-6 py-2.5 rounded-full bg-[#C6FF3D] hover:brightness-95 text-[#0B1026] text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Save & Apply Filter Rules</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* UNIFIED SHARE & EMBED MODAL (4 TABS)                           */}
            {/* ============================================================== */}
            {embedModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-[#E4E7F2] space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#EEF0F7]">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#6A4CF5]">
                        Tip Link Hub
                      </div>
                      <h3 className="font-extrabold text-lg text-[#0B1026]">
                        {embedTargetWidget?.name || selectedWidget?.name || 'Main Tip Link'} — Share & Embed
                      </h3>
                    </div>
                    <button
                      onClick={() => setEmbedModalOpen(false)}
                      className="p-1.5 rounded-full hover:bg-[#F6F7FB] text-[#646A8A] cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Navigation Tabs */}
                  <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-[#EEF0F7]">
                    <button
                      onClick={() => setEmbedModalTab('share')}
                      className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        embedModalTab === 'share'
                          ? 'bg-white text-[#0B1026] shadow-sm'
                          : 'text-[#646A8A] hover:text-[#0B1026]'
                      }`}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share & QR</span>
                    </button>
                    <button
                      onClick={() => setEmbedModalTab('widget')}
                      className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        embedModalTab === 'widget'
                          ? 'bg-white text-[#0B1026] shadow-sm'
                          : 'text-[#646A8A] hover:text-[#0B1026]'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>JS Widget</span>
                    </button>
                    <button
                      onClick={() => setEmbedModalTab('iframe')}
                      className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        embedModalTab === 'iframe'
                          ? 'bg-white text-[#0B1026] shadow-sm'
                          : 'text-[#646A8A] hover:text-[#0B1026]'
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>iFrame</span>
                    </button>
                    <button
                      onClick={() => setEmbedModalTab('obs')}
                      className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        embedModalTab === 'obs'
                          ? 'bg-white text-[#0B1026] shadow-sm'
                          : 'text-[#646A8A] hover:text-[#0B1026]'
                      }`}
                    >
                      <Tv className="w-3.5 h-3.5" />
                      <span>OBS Stream</span>
                    </button>
                  </div>

                  {/* Tab 1: Share Link & QR Code */}
                  {embedModalTab === 'share' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-[#F6F7FB] border border-[#EEF0F7] space-y-2">
                        <label className="block text-xs font-bold text-[#0B1026]">
                          Public Tip Link URL
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={getWidgetTipUrl(embedTargetWidget || selectedWidget)}
                            className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#E4E7F2] font-mono-code text-xs text-[#0B1026] focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(getWidgetTipUrl(embedTargetWidget || selectedWidget));
                              setCopiedLink(true);
                              setTimeout(() => setCopiedLink(false), 2000);
                            }}
                            className="px-4 py-2 rounded-xl bg-[#0B1026] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#1E2548] cursor-pointer"
                          >
                            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#C6FF3D]" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                          </button>
                          <a
                            href={getWidgetTipUrl(embedTargetWidget || selectedWidget)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-white border border-[#E4E7F2] text-[#0B1026] hover:bg-[#EEF0F7] transition"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      {/* QR Code and Social Share */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center p-4 rounded-2xl bg-white border border-[#E4E7F2]">
                        <div className="flex flex-col items-center justify-center p-4 bg-[#F6F7FB] rounded-xl border border-[#EEF0F7]">
                          <div className="w-32 h-32 rounded-2xl bg-white p-3 shadow-sm border border-[#E4E7F2] flex flex-col items-center justify-center relative group hover:border-[#6A4CF5] transition-colors">
                            <QrCode className="w-20 h-20 text-[#0B1026] group-hover:scale-105 transition-transform" />
                            <span className="text-[10px] font-mono-code font-extrabold text-[#6A4CF5] mt-1">STAR·TIP</span>
                          </div>
                          <span className="text-[10px] font-mono-code text-[#646A8A] mt-2">
                            Scan with mobile wallet
                          </span>
                        </div>

                        <div className="space-y-3">
                          <div className="font-extrabold text-xs text-[#0B1026]">
                            Share to your audience
                          </div>
                          <div className="space-y-2">
                            <a
                              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                                `Support my work on Stellar with zero fees: ${getWidgetTipUrl(embedTargetWidget || selectedWidget)}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2 px-3 rounded-xl bg-[#0B1026] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#1E2548]"
                            >
                              <Twitter className="w-3.5 h-3.5" />
                              <span>Share on X / Twitter</span>
                            </a>
                            <a
                              href={`https://t.me/share/url?url=${encodeURIComponent(
                                getWidgetTipUrl(embedTargetWidget || selectedWidget)
                              )}&text=${encodeURIComponent(`Tip me directly on Stellar!`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2 px-3 rounded-xl bg-[#229ED9] text-white text-xs font-bold flex items-center justify-center gap-2 hover:brightness-95"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Share on Telegram</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: JS Widget & Embed Options */}
                  {embedModalTab === 'widget' && (
                    <div className="space-y-4">
                      {/* Embed Mode Switcher */}
                      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[#F6F7FB] border border-[#EEF0F7]">
                        <button
                          type="button"
                          onClick={() => setEmbedWidgetSubTab('float')}
                          className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            embedWidgetSubTab === 'float'
                              ? 'bg-white text-[#6A4CF5] shadow-sm'
                              : 'text-[#646A8A] hover:text-[#0B1026]'
                          }`}
                        >
                          <span>⚡ Floating Button</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmbedWidgetSubTab('custom')}
                          className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            embedWidgetSubTab === 'custom'
                              ? 'bg-white text-[#6A4CF5] shadow-sm'
                              : 'text-[#646A8A] hover:text-[#0B1026]'
                          }`}
                        >
                          <span>🎨 Custom Button</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmbedWidgetSubTab('inline')}
                          className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            embedWidgetSubTab === 'inline'
                              ? 'bg-white text-[#6A4CF5] shadow-sm'
                              : 'text-[#646A8A] hover:text-[#0B1026]'
                          }`}
                        >
                          <span>🪟 Inline Window</span>
                        </button>
                      </div>

                      {/* Sub-tab 1: Floating Corner Button */}
                      {embedWidgetSubTab === 'float' && (
                        <div className="space-y-3">
                          <div>
                            <div className="font-extrabold text-sm text-[#0B1026]">
                              Floating Corner Button & Popup Modal (Default)
                            </div>
                            <p className="text-xs text-[#646A8A] mt-0.5">
                              Displays a modern floating <code className="text-[#6A4CF5] font-bold">⚡ Tip @{effectiveHandle}</code> pill at the bottom-right corner of your site that smoothly opens the popup modal on click.
                            </p>
                          </div>

                          <div className="p-4 rounded-2xl bg-[#0B1026] text-white space-y-3">
                            <div className="flex items-center justify-between text-xs text-[#646A8A]">
                              <span className="font-mono-code text-[#C6FF3D]">HTML snippet:</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard?.writeText(getWidgetScriptSnippet(embedTargetWidget || selectedWidget));
                                  setCopiedEmbed(true);
                                  setTimeout(() => setCopiedEmbed(false), 2000);
                                }}
                                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[#C6FF3D] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                {copiedEmbed ? <Check className="w-3 h-3 text-[#C6FF3D]" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedEmbed ? 'Copied Script!' : 'Copy Code'}</span>
                              </button>
                            </div>
                            <pre className="font-mono-code text-xs text-white/90 overflow-x-auto p-2 bg-white/5 rounded-xl whitespace-pre-wrap break-all">
                              {getWidgetScriptSnippet(embedTargetWidget || selectedWidget)}
                            </pre>
                          </div>

                          <div className="p-3.5 rounded-xl bg-[#F4F1FF] border border-[#E4E7F2] text-xs text-[#6A4CF5] flex items-center gap-2">
                            <Info className="w-4 h-4 shrink-0" />
                            <span>Zero configuration required. Paste this script anywhere on your page and the button will appear automatically.</span>
                          </div>
                        </div>
                      )}

                      {/* Sub-tab 2: Custom Button */}
                      {embedWidgetSubTab === 'custom' && (
                        <div className="space-y-3">
                          <div>
                            <div className="font-extrabold text-sm text-[#0B1026]">
                              Design Your Own Custom Button
                            </div>
                            <p className="text-xs text-[#646A8A] mt-0.5">
                              Have your own website design? Simply add <code className="text-[#6A4CF5] font-bold">data-startip-open</code> to any button or link, and clicking it will open the StarTip popup modal!
                            </p>
                          </div>

                          <div className="p-4 rounded-2xl bg-[#0B1026] text-white space-y-3">
                            <div className="flex items-center justify-between text-xs text-[#646A8A]">
                              <span className="font-mono-code text-[#C6FF3D]">Custom button code:</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard?.writeText(getWidgetCustomButtonSnippet(embedTargetWidget || selectedWidget));
                                  setCopiedEmbed(true);
                                  setTimeout(() => setCopiedEmbed(false), 2000);
                                }}
                                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[#C6FF3D] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                {copiedEmbed ? <Check className="w-3 h-3 text-[#C6FF3D]" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedEmbed ? 'Copied Code!' : 'Copy Snippet'}</span>
                              </button>
                            </div>
                            <pre className="font-mono-code text-xs text-white/90 overflow-x-auto p-2 bg-white/5 rounded-xl whitespace-pre-wrap break-all">
                              {getWidgetCustomButtonSnippet(embedTargetWidget || selectedWidget)}
                            </pre>
                          </div>

                          <div className="p-3.5 rounded-xl bg-[#F4F1FF] border border-[#E4E7F2] text-xs text-[#6A4CF5] flex items-center gap-2">
                            <Info className="w-4 h-4 shrink-0" />
                            <span>You can also trigger it programmatically anywhere in JavaScript with <code className="font-mono-code font-bold ml-1">window.StarTip.open()</code>.</span>
                          </div>
                        </div>
                      )}

                      {/* Sub-tab 3: Inline Window Embed */}
                      {embedWidgetSubTab === 'inline' && (
                        <div className="space-y-3">
                          <div>
                            <div className="font-extrabold text-sm text-[#0B1026]">
                              Embed Window Directly into Page Layout
                            </div>
                            <p className="text-xs text-[#646A8A] mt-0.5">
                              Renders the interactive tipping card directly inline in your blog post, sidebar, or support section.
                            </p>
                          </div>

                          <div className="p-4 rounded-2xl bg-[#0B1026] text-white space-y-3">
                            <div className="flex items-center justify-between text-xs text-[#646A8A]">
                              <span className="font-mono-code text-[#C6FF3D]">Inline snippet:</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard?.writeText(getWidgetInlineSnippet(embedTargetWidget || selectedWidget));
                                  setCopiedEmbed(true);
                                  setTimeout(() => setCopiedEmbed(false), 2000);
                                }}
                                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[#C6FF3D] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                {copiedEmbed ? <Check className="w-3 h-3 text-[#C6FF3D]" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedEmbed ? 'Copied Inline Code!' : 'Copy Code'}</span>
                              </button>
                            </div>
                            <pre className="font-mono-code text-xs text-white/90 overflow-x-auto p-2 bg-white/5 rounded-xl whitespace-pre-wrap break-all">
                              {getWidgetInlineSnippet(embedTargetWidget || selectedWidget)}
                            </pre>
                          </div>

                          <div className="p-3.5 rounded-xl bg-[#F4F1FF] border border-[#E4E7F2] text-xs text-[#6A4CF5] flex items-center gap-2">
                            <Info className="w-4 h-4 shrink-0" />
                            <span>The widget will automatically center and fit cleanly inside <code className="font-mono-code font-bold ml-1">&lt;div id="startip-widget"&gt;</code>.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: iFrame Embed */}
                  {embedModalTab === 'iframe' && (
                    <div className="space-y-4">
                      <div>
                        <div className="font-extrabold text-sm text-[#0B1026]">
                          Inline Responsive iFrame
                        </div>
                        <p className="text-xs text-[#646A8A] mt-0.5">
                          Embed the tipping interface directly inside a blog post, sidebar, or support page.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#0B1026] text-white space-y-3">
                        <div className="flex items-center justify-between text-xs text-[#646A8A]">
                          <span className="font-mono-code text-[#C6FF3D]">iFrame embed:</span>
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(getWidgetIframeSnippet(embedTargetWidget || selectedWidget));
                              setCopiedEmbed(true);
                              setTimeout(() => setCopiedEmbed(false), 2000);
                            }}
                            className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[#C6FF3D] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            {copiedEmbed ? <Check className="w-3 h-3 text-[#C6FF3D]" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedEmbed ? 'Copied iFrame!' : 'Copy iFrame'}</span>
                          </button>
                        </div>
                        <pre className="font-mono-code text-xs text-white/90 overflow-x-auto p-2 bg-white/5 rounded-xl whitespace-pre-wrap break-all">
                          {getWidgetIframeSnippet(embedTargetWidget || selectedWidget)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Tab 4: OBS Stream Overlay */}
                  {embedModalTab === 'obs' && (
                    <div className="space-y-4">
                      <div>
                        <div className="font-extrabold text-sm text-[#0B1026]">
                          OBS / Streamlabs Browser Source
                        </div>
                        <p className="text-xs text-[#646A8A] mt-0.5">
                          Add an animated pop-up alert for your live stream on Twitch, YouTube, or Kick.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#F6F7FB] border border-[#EEF0F7] space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[#0B1026]">
                            Browser Source URL
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={triggerTestStreamAlert}
                              disabled={testAlertActive}
                              className="px-3 py-1 rounded-full bg-[#6A4CF5] text-white text-xs font-bold flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 cursor-pointer"
                            >
                              <Volume2 className="w-3 h-3" />
                              <span>{testAlertActive ? 'Playing Alert…' : 'Test Alert'}</span>
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard?.writeText(getWidgetOverlayUrl(embedTargetWidget || selectedWidget));
                                setCopiedObs(true);
                                setTimeout(() => setCopiedObs(false), 2000);
                              }}
                              className="px-3 py-1 rounded-full bg-[#0B1026] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#1E2548] cursor-pointer"
                            >
                              {copiedObs ? <Check className="w-3.5 h-3.5 text-[#C6FF3D]" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedObs ? 'Copied!' : 'Copy URL'}</span>
                            </button>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-[#E4E7F2] font-mono-code text-xs text-[#0B1026] break-all">
                          {getWidgetOverlayUrl(embedTargetWidget || selectedWidget)}
                        </div>

                        <div className="text-[11px] text-[#646A8A]">
                          Recommended OBS Settings: Width: <strong>800px</strong>, Height: <strong>400px</strong>, FPS: <strong>60</strong>, enable "Shutdown source when not visible".
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Modal Footer */}
                  <div className="pt-3 border-t border-[#EEF0F7] flex items-center justify-between">
                    <span className="text-xs text-[#646A8A]">
                      Slug: <span className="font-mono-code font-bold text-[#0B1026]">{(embedTargetWidget || selectedWidget)?.slug || 'main'}</span>
                    </span>
                    <button
                      onClick={() => setEmbedModalOpen(false)}
                      className="px-5 py-2 rounded-full bg-[#0B1026] text-white text-xs font-bold hover:bg-[#1E2548] cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 4: FULL HISTORY & CAMPAIGN FILTERS                         */}
            {/* ============================================================== */}
            {activeTab === 'history' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[28px] font-extrabold tracking-tight text-[#0B1026]">
                      Tip History
                    </h2>
                    <p className="text-xs text-[#646A8A]">
                      Filter tip receipts by specific tip link/widget, asset (XLM, USDC, USDT), status, or supporter name.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Widget / Campaign Filter Dropdown */}
                    <div className="flex items-center gap-1.5">
                      <select
                        value={historyWidgetFilter}
                        onChange={(e) => setHistoryWidgetFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-white border border-[#E4E7F2] text-xs font-bold text-[#0B1026] focus:outline-none focus:border-[#6A4CF5]"
                      >
                        <option value="ALL">All Tip Links / Campaigns</option>
                        {widgets.map((w) => (
                          <option key={w.id || w.slug} value={String(w.id)}>
                            {w.name} ({w.slug})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Search Supporter / Reference */}
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

                    {/* Asset Filter Tabs */}
                    <div className="flex items-center p-1 rounded-xl bg-[#EEF0F7]">
                      {(['ALL', 'USDC', 'XLM', 'USDT'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setHistoryFilter(f)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
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
                    <div className="col-span-4">SUPPORTER & MESSAGE</div>
                    <div className="col-span-2">TIP LINK / CAMPAIGN</div>
                    <div className="col-span-2">AMOUNT</div>
                    <div className="col-span-1">STATUS</div>
                    <div className="col-span-2">TRANSACTION</div>
                    <div className="col-span-1 text-right">WHEN</div>
                  </div>
                  <div className="divide-y divide-[#EEF0F7]">
                    {(mode === 'full'
                      ? tipHistory.map((t) => ({
                          id: String(t.id),
                          supporter: t.supporter_name || 'Anonymous',
                          initial: (t.supporter_name || 'A').charAt(0).toUpperCase(),
                          avatarBg: t.asset_code === 'USDC' ? '#E3EEFF' : t.asset_code === 'USDT' ? '#E6F8F3' : '#ECE8FF',
                          avatarColor: t.asset_code === 'USDC' ? '#1D4FA8' : t.asset_code === 'USDT' ? '#1E8062' : '#4A2FC2',
                          message: t.message || 'No message attached',
                          widgetName: t.widget_name || 'Main Tip Link',
                          amount: `${t.amount} ${t.asset_code}`,
                          usdValue: t.asset_code === 'USDC' || t.asset_code === 'USDT'
                            ? `$${Number(t.amount).toFixed(2)}`
                            : `$${(Number(t.amount) * 0.12).toFixed(2)}`,
                          status: t.status === 'confirmed' ? 'Confirmed' : t.status === 'failed' ? 'Failed' : 'Pending',
                          txHash: t.stellar_tx_hash ? `${t.stellar_tx_hash.slice(0, 4)}…${t.stellar_tx_hash.slice(-4)}` : 'Pending',
                          rawTxHash: t.stellar_tx_hash,
                          explorerUrl: t.stellar_explorer_url || (t.stellar_tx_hash ? `https://stellar.expert/explorer/testnet/tx/${t.stellar_tx_hash}` : null),
                          when: new Date(t.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
                          isAnonymous: !t.supporter_name || t.supporter_name === 'Anonymous',
                        }))
                      : filteredTips.map((fTip) => ({
                          ...fTip,
                          widgetName: 'Main Tip Link',
                          explorerUrl: fTip.txHash ? `https://stellar.expert/explorer/testnet/tx/${fTip.txHash}` : null,
                        }))
                    ).map((tip: any) => (
                      <div key={tip.id} className="px-5 py-3.5 grid grid-cols-12 items-center gap-2">
                        <div className="col-span-4 flex items-center gap-3 min-w-0">
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

                        {/* Campaign / Widget Badge */}
                        <div className="col-span-2">
                          <span className="px-2.5 py-1 rounded-full bg-[#F4F1FF] text-[#6A4CF5] text-[10.5px] font-bold truncate max-w-[140px] inline-block">
                            #{tip.widgetName}
                          </span>
                        </div>

                        <div className="col-span-2">
                          <div className="text-xs font-extrabold text-[#0B1026] tabular-nums">
                            {tip.amount}
                          </div>
                          <div className="text-[10px] text-[#646A8A] tabular-nums">{tip.usdValue}</div>
                        </div>

                        <div className="col-span-1">
                          {tip.status === 'Confirmed' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E7F6EC] border border-[#A7E3BE] text-[#15803D] text-[10px] font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              OK
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
                      href={`${appBaseUrl}/overlay/${effectiveOverlayToken}/`}
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
                      {appBaseUrl}/overlay/{effectiveOverlayToken}/
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
                  className="p-6 rounded-2xl border border-white/15 relative min-h-[320px] flex flex-col justify-between overflow-hidden shadow-2xl"
                  style={{
                    background: 'linear-gradient(160deg, #141A3A 10.99%, #070A1A 89.01%)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded bg-[#E5484D] text-white font-extrabold text-[11px] tracking-wider animate-pulse">
                        LIVE
                      </span>
                      <span className="font-mono-code text-xs text-white/60">OBS Browser Source Listening</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 font-mono-code text-xs text-white/80">
                      {testAlertActive ? 'SSE broadcast active!' : 'Stream ready'}
                    </span>
                  </div>

                  {activeAlert ? (
                    <div className="flex items-end justify-between mt-6">
                      <div
                        className={`p-4 rounded-2xl bg-white border-[3px] border-[#C6FF3D] shadow-2xl flex items-start gap-3.5 max-w-[400px] transition-all duration-300 ${
                          testAlertActive ? 'scale-105 shadow-[0_0_35px_rgba(198,255,61,0.6)]' : ''
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-xl text-white font-extrabold text-xl flex items-center justify-center shrink-0 ${
                            activeAlert.asset_code === 'USDC'
                              ? 'bg-[#2775CA]'
                              : activeAlert.asset_code === 'USDT'
                              ? 'bg-[#26A17B]'
                              : 'bg-[#14B6FF]'
                          }`}
                        >
                          {activeAlert.asset_code === 'USDC' || activeAlert.asset_code === 'USDT' ? '$' : '✦'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#4A5070] flex items-center gap-1.5">
                            <span className="truncate">{activeAlert.supporter_name} just tipped</span>
                            {activeAlert.is_test ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#F3F0FF] text-[#4A2FC2] shrink-0">
                                Test
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#E7F6EC] text-[#15803D] shrink-0">
                                Live
                              </span>
                            )}
                          </div>
                          <div className="font-anton text-2xl text-[#0B1026] mt-0.5 tabular-nums">
                            {activeAlert.amount} {activeAlert.asset_code}
                          </div>
                          <div className="text-xs text-[#4A5070] mt-1 line-clamp-2">
                            {activeAlert.message ? `“${activeAlert.message}”` : <span className="italic text-[#8A91B4]">No message attached</span>}
                          </div>
                        </div>
                      </div>

                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#C6FF3D] text-[#0B1026] font-extrabold text-xl flex items-center justify-center ring-4 ring-[#070A1A] shrink-0">
                        {(creator?.display_name || creatorName || 'C').charAt(0).toUpperCase()}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center my-auto py-8 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#C6FF3D] ring-2 ring-white/15 animate-pulse">
                        <Bell className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-base font-extrabold text-white">Stream Overlay Listening</div>
                        <p className="text-xs text-white/60 max-w-[360px] mx-auto leading-relaxed">
                          No alerts received yet. When supporters tip you on stream or when you fire a test alert, the animated card previews here in real time.
                        </p>
                      </div>
                      <button
                        onClick={triggerTestStreamAlert}
                        className="px-4 py-2 rounded-full bg-[#C6FF3D] hover:bg-[#bbf030] text-[#0B1026] text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Fire Test Alert Now</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Stream Alert History Feed */}
                <div className="p-6 rounded-2xl bg-white border border-[#E4E7F2] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EEF0F7]">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-[#6A4CF5]" />
                      <span className="font-extrabold text-sm text-[#0B1026]">Stream Alert History</span>
                    </div>
                    <span className="text-[11px] font-medium text-[#646A8A]">
                      {alertHistory.length} event{alertHistory.length === 1 ? '' : 's'} recorded
                    </span>
                  </div>

                  {alertHistory.length > 0 ? (
                    <div className="divide-y divide-[#EEF0F7]">
                      {alertHistory.map((item) => (
                        <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-xs shrink-0 ${
                                item.asset_code === 'USDC'
                                  ? 'bg-[#2775CA]'
                                  : item.asset_code === 'USDT'
                                  ? 'bg-[#26A17B]'
                                  : 'bg-[#14B6FF]'
                              }`}
                            >
                              {item.asset_code === 'USDC' || item.asset_code === 'USDT' ? '$' : '✦'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#0B1026] truncate">
                                  {item.supporter_name}
                                </span>
                                {item.is_test ? (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#F3F0FF] text-[#4A2FC2]">
                                    Test
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#E7F6EC] text-[#15803D]">
                                    Live Tip
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#646A8A] truncate max-w-[320px]">
                                {item.message || 'No message'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-extrabold text-[#0B1026] tabular-nums">
                              {item.amount} {item.asset_code}
                            </div>
                            <div className="text-[10px] text-[#8A91B4]">
                              {formatTimeAgo(item.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-1.5">
                      <Bell className="w-7 h-7 text-[#A0A6C2] mx-auto opacity-40" />
                      <div className="text-xs font-bold text-[#0B1026]">No stream alerts recorded yet</div>
                      <div className="text-[11px] text-[#646A8A] max-w-[280px] mx-auto leading-relaxed">
                        Tips sent to your page or test alerts fired will automatically be logged here.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 6: ACCOUNT & PROFILE SETTINGS                              */}
            {/* ============================================================== */}
            {activeTab === 'settings' && (
              <form onSubmit={handleSaveAccountSettings} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-[28px] font-extrabold tracking-tight text-[#0B1026]">
                      Account & Profile Settings
                    </h2>
                    <p className="text-sm text-[#646A8A]">
                      Manage your public creator identity, social channels, and Stellar receiving wallet configuration.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-5 py-2.5 rounded-full bg-[#C6FF3D] hover:brightness-95 text-[#0B1026] text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-50 transition cursor-pointer shadow-sm shrink-0"
                  >
                    {isSavingSettings ? (
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                    <span>{isSavingSettings ? 'Saving Changes…' : 'Save Account Settings'}</span>
                  </button>
                </div>

                {settingsSaveStatus && (
                  <div
                    className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      settingsSaveStatus.startsWith('Error')
                        ? 'bg-[#FDF1E1] text-[#B45309]'
                        : 'bg-[#E7F6EC] text-[#15803D]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{settingsSaveStatus}</span>
                  </div>
                )}

                {/* Section 1: Creator Identity & Bio */}
                <div className="p-6 rounded-2xl bg-white border border-[#E4E7F2] space-y-4">
                  <div className="font-extrabold text-sm text-[#0B1026] pb-2 border-b border-[#EEF0F7] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#6A4CF5]" />
                    <span>Public Creator Identity</span>
                  </div>

                  {/* Avatar row */}
                  <div>
                    <label className="block text-xs font-bold text-[#0B1026] mb-1.5">
                      Profile Avatar URL
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-[#0B1026] text-[#C6FF3D] flex items-center justify-center font-extrabold text-base shrink-0 border-2 border-[#C6FF3D]">
                        {settingsAvatarUrl ? (
                          <img
                            src={settingsAvatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{(settingsDisplayName || 'C').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <input
                          type="url"
                          value={settingsAvatarUrl}
                          onChange={(e) => setSettingsAvatarUrl(e.target.value)}
                          placeholder="https://... avatar image URL (e.g. GitHub avatar, Gravatar, IPFS)"
                          className="w-full px-3.5 py-2 rounded-xl border border-[#E4E7F2] text-xs text-[#0B1026] focus:outline-none focus:border-[#6A4CF5]"
                        />
                        <div className="flex items-center gap-2 text-[11px] text-[#646A8A]">
                          <span>Sample avatars:</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsAvatarUrl(
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop'
                              )
                            }
                            className="text-[#6A4CF5] hover:underline"
                          >
                            Sample 1
                          </button>
                          <span>·</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsAvatarUrl(
                                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop'
                              )
                            }
                            className="text-[#6A4CF5] hover:underline"
                          >
                            Sample 2
                          </button>
                          {settingsAvatarUrl && (
                            <>
                              <span>·</span>
                              <button
                                type="button"
                                onClick={() => setSettingsAvatarUrl('')}
                                className="text-[#E5484D] hover:underline"
                              >
                                Clear
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#0B1026] mb-1.5">
                        Display Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsDisplayName}
                        onChange={(e) => setSettingsDisplayName(e.target.value)}
                        placeholder="Alex Developer"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E7F2] text-sm font-semibold text-[#0B1026] focus:outline-none focus:border-[#6A4CF5]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0B1026] mb-1.5">
                        StarTip Username / Handle *
                      </label>
                      <div className="flex items-center rounded-xl border border-[#E4E7F2] px-3.5 py-2.5 bg-[#F6F7FB]">
                        <span className="font-mono-code text-xs text-[#646A8A]">startip.app/</span>
                        <input
                          type="text"
                          required
                          value={settingsUsername}
                          onChange={(e) => setSettingsUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          placeholder="alexdev"
                          className="flex-1 bg-transparent font-mono-code text-xs font-bold text-[#0B1026] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0B1026] mb-1.5">
                      Bio / Description
                    </label>
                    <textarea
                      rows={3}
                      value={settingsBio}
                      onChange={(e) => setSettingsBio(e.target.value)}
                      placeholder="Tell supporters what you build or stream..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E7F2] text-sm text-[#0B1026] focus:outline-none focus:border-[#6A4CF5]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0B1026] mb-1.5">
                      Website / Portfolio Link
                    </label>
                    <input
                      type="url"
                      value={settingsWebsiteUrl}
                      onChange={(e) => setSettingsWebsiteUrl(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E4E7F2] text-xs text-[#0B1026] focus:outline-none focus:border-[#6A4CF5]"
                    />
                  </div>
                </div>

                {/* Section 2: Social & Channel Profiles */}
                <div className="p-6 rounded-2xl bg-white border border-[#E4E7F2] space-y-4">
                  <div className="font-extrabold text-sm text-[#0B1026] pb-2 border-b border-[#EEF0F7] flex items-center gap-2">
                    <Link className="w-4 h-4 text-[#6A4CF5]" />
                    <span>Connected Social Channels</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Twitter */}
                    <div>
                      <label className="block text-xs font-bold text-[#0B1026] mb-1.5 flex items-center gap-1.5">
                        <Twitter className="w-3.5 h-3.5 text-[#1DA1F2]" />
                        <span>Twitter / X</span>
                      </label>
                      <input
                        type="text"
                        value={settingsTwitter}
                        onChange={(e) => setSettingsTwitter(e.target.value)}
                        placeholder="@username or https://x.com/username"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E4E7F2] text-xs text-[#0B1026] focus:outline-none focus:border-[#6A4CF5]"
                      />
                    </div>

                    {/* Twitch */}
                    <div>
                      <label className="block text-xs font-bold text-[#0B1026] mb-1.5 flex items-center gap-1.5">
                        <Twitch className="w-3.5 h-3.5 text-[#9146FF]" />
                        <span>Twitch Channel</span>
                      </label>
                      <input
                        type="text"
                        value={settingsTwitch}
                        onChange={(e) => setSettingsTwitch(e.target.value)}
                        placeholder="channel or https://twitch.tv/channel"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E4E7F2] text-xs text-[#0B1026] focus:outline-none focus:border-[#6A4CF5]"
                      />
                    </div>

                    {/* YouTube */}
                    <div>
                      <label className="block text-xs font-bold text-[#0B1026] mb-1.5 flex items-center gap-1.5">
                        <Youtube className="w-3.5 h-3.5 text-[#FF0000]" />
                        <span>YouTube Channel</span>
                      </label>
                      <input
                        type="text"
                        value={settingsYoutube}
                        onChange={(e) => setSettingsYoutube(e.target.value)}
                        placeholder="@channel or https://youtube.com/@channel"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E4E7F2] text-xs text-[#0B1026] focus:outline-none focus:border-[#6A4CF5]"
                      />
                    </div>

                    {/* GitHub */}
                    <div>
                      <label className="block text-xs font-bold text-[#0B1026] mb-1.5 flex items-center gap-1.5">
                        <Github className="w-3.5 h-3.5 text-[#0B1026]" />
                        <span>GitHub Profile</span>
                      </label>
                      <input
                        type="text"
                        value={settingsGithub}
                        onChange={(e) => setSettingsGithub(e.target.value)}
                        placeholder="username or https://github.com/username"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E4E7F2] text-xs text-[#0B1026] focus:outline-none focus:border-[#6A4CF5]"
                      />
                    </div>
                  </div>

                  {/* Discord */}
                  <div>
                    <label className="block text-xs font-bold text-[#0B1026] mb-1.5 flex items-center gap-1.5">
                      <Tv className="w-3.5 h-3.5 text-[#5865F2]" />
                      <span>Discord Server Invite or Tag</span>
                    </label>
                    <input
                      type="text"
                      value={settingsDiscord}
                      onChange={(e) => setSettingsDiscord(e.target.value)}
                      placeholder="e.g. https://discord.gg/yourserver"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E4E7F2] text-xs text-[#0B1026] focus:outline-none focus:border-[#6A4CF5]"
                    />
                  </div>
                </div>

                {/* Section 3: Stellar Wallet & Financial Configuration */}
                <div className="p-6 rounded-2xl bg-white border border-[#E4E7F2] space-y-4">
                  <div className="font-extrabold text-sm text-[#0B1026] pb-2 border-b border-[#EEF0F7] flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#10B981]" />
                    <span>Stellar Wallet & Financial Routing</span>
                  </div>

                  {/* Authenticated Signing Wallet */}
                  <div className="p-4 rounded-xl bg-[#F6F7FB] border border-[#E4E7F2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <WalletLogo name="freighter" size={32} />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0B1026]">Connected Signing Wallet (Testnet)</div>
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

                  {/* Receiving Address for Tips (Editable) */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-[#0B1026] mb-1.5">
                      Receiving Stellar Address for Tips
                    </label>
                    <input
                      type="text"
                      value={settingsReceivingWallet}
                      onChange={(e) => setSettingsReceivingWallet(e.target.value.trim())}
                      placeholder="G... (defaults to your signing wallet)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E7F2] font-mono-code text-xs text-[#0B1026] focus:outline-none focus:border-[#6A4CF5]"
                    />
                    <p className="text-[11px] text-[#646A8A] mt-1.5">
                      All supporter payments are sent straight to this address on the Stellar Testnet. You can route tips to a vault, hardware wallet, or multi-sig.
                    </p>
                  </div>

                  {/* Supported Currencies */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-[#0B1026] mb-2">
                      Supported Tip Currencies
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {(['XLM', 'USDC', 'USDT'] as const).map((curr) => {
                        const isChecked = settingsSupportedAssets.includes(curr);
                        return (
                          <button
                            key={curr}
                            type="button"
                            onClick={() => {
                              if (isChecked) {
                                if (settingsSupportedAssets.length > 1) {
                                  setSettingsSupportedAssets(settingsSupportedAssets.filter((c) => c !== curr));
                                }
                              } else {
                                setSettingsSupportedAssets([...settingsSupportedAssets, curr]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                              isChecked
                                ? 'bg-[#0B1026] text-[#C6FF3D] border-[#0B1026]'
                                : 'bg-[#F6F7FB] text-[#646A8A] border-[#E4E7F2]'
                            }`}
                          >
                            {isChecked ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                            <span>{curr}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Section 4: Save & Session Actions */}
                <div className="p-6 rounded-2xl bg-white border border-[#E4E7F2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-[#0B1026]">Save All Profile & Account Changes</div>
                    <div className="text-[11px] text-[#646A8A]">
                      Updates will be live across your public pages and embed widgets immediately.
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="px-4 py-2 rounded-xl bg-[#FDF2F2] hover:bg-[#FCE8E8] text-[#E5484D] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="px-5 py-2.5 rounded-full bg-[#C6FF3D] hover:brightness-95 text-[#0B1026] text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-50 transition cursor-pointer shadow-sm"
                    >
                      {isSavingSettings ? (
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      )}
                      <span>{isSavingSettings ? 'Saving…' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              </form>
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
