/**
 * StarTip Backend REST API Client
 */

export interface CreatorProfile {
  id?: number;
  wallet_address: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url?: string;
  website_url?: string;
  social_links?: Record<string, string>;
  receiving_wallet_address: string;
  supported_assets: string[];
  widget_config?: WidgetConfig;
  created_at?: string;
}

export interface WidgetConfig {
  widget_title: string;
  welcome_message: string;
  theme: 'dark' | 'light' | 'midnight' | 'cyber';
  primary_color: string;
  preset_amounts_xlm: number[];
  preset_amounts_usdc: number[];
  allow_custom_amount: boolean;
  allow_supporter_message: boolean;
  overlay_token: string;
  alert_sound_enabled: boolean;
  alert_duration_seconds: number;
  is_active: boolean;
}

export interface DashboardMetrics {
  total_xlm_tips: string | number;
  total_usdc_tips: string | number;
  total_tips_count: number;
  tips_today_count: number;
  tips_today_xlm: string | number;
  tips_today_usdc: string | number;
  recent_tips: Array<{
    id: string;
    supporter_name: string;
    supporter_wallet: string;
    asset_code: string;
    amount: string;
    message: string;
    stellar_tx_hash: string;
    created_at: string;
  }>;
  top_supporters: Array<{
    supporter_name: string;
    supporter_wallet: string;
    total_amount: string;
    asset_code: string;
    tips_count: number;
  }>;
  widget_status: {
    is_active: boolean;
    theme: string;
    primary_color: string;
    overlay_token: string;
  };
}

export interface TipHistoryItem {
  id: number;
  reference_id: string;
  creator_username: string;
  creator_display_name: string;
  supporter_wallet: string;
  supporter_name: string;
  message: string;
  asset_code: 'XLM' | 'USDC';
  amount: string;
  status: 'pending' | 'submitted' | 'confirmed' | 'failed' | 'rejected';
  stellar_tx_hash: string | null;
  stellar_explorer_url: string | null;
  ledger_sequence?: number | null;
  ledger_closed_at?: string | null;
  created_at: string;
}

export interface EmbedCodeResponse {
  creator_username: string;
  direct_link: string;
  iframe_code: string;
  javascript_code: string;
  overlay_url: string;
}

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('startip_session_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      errorDetail =
        errJson.error?.detail?.detail ||
        errJson.error?.detail ||
        (typeof errJson.error === 'string' ? errJson.error : JSON.stringify(errJson.error)) ||
        errJson.detail ||
        errorDetail;
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // --- Wallet Authentication ---
  async getAuthChallenge(walletAddress: string): Promise<{
    wallet_address: string;
    nonce: string;
    message_to_sign: string;
    expires_at: string;
  }> {
    const res = await fetch(`${API_BASE}/auth/challenge/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: walletAddress }),
    });
    return handleResponse(res);
  },

  async verifyAuthSignature(params: {
    wallet_address: string;
    nonce: string;
    signature: string;
  }): Promise<{
    token: string;
    wallet_address: string;
    expires_at: string;
    is_registered: boolean;
    username: string | null;
  }> {
    const res = await fetch(`${API_BASE}/auth/verify/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await handleResponse<{
      token: string;
      wallet_address: string;
      expires_at: string;
      is_registered: boolean;
      username: string | null;
    }>(res);
    if (data.token) {
      localStorage.setItem('startip_session_token', data.token);
      localStorage.setItem('startip_wallet_address', data.wallet_address);
    }
    return data;
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
    } finally {
      localStorage.removeItem('startip_session_token');
      localStorage.removeItem('startip_wallet_address');
    }
  },

  // --- Creator Profile & Onboarding ---
  async getMe(): Promise<CreatorProfile> {
    const res = await fetch(`${API_BASE}/creators/me/`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });
    return handleResponse<CreatorProfile>(res);
  },

  async registerCreator(payload: {
    username: string;
    display_name: string;
    bio?: string;
    website_url?: string;
    receiving_wallet_address?: string;
    supported_assets?: string[];
  }): Promise<CreatorProfile> {
    const res = await fetch(`${API_BASE}/creators/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<CreatorProfile>(res);
  },

  async updateProfile(payload: Partial<CreatorProfile>): Promise<CreatorProfile> {
    const res = await fetch(`${API_BASE}/creators/me/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<CreatorProfile>(res);
  },

  async getPublicCreator(username: string): Promise<CreatorProfile> {
    const res = await fetch(`${API_BASE}/creators/${encodeURIComponent(username)}/`);
    return handleResponse<CreatorProfile>(res);
  },

  // --- Dashboard & Analytics ---
  async getDashboard(): Promise<DashboardMetrics> {
    const res = await fetch(`${API_BASE}/creators/me/dashboard/`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });
    return handleResponse<DashboardMetrics>(res);
  },

  async updateWidgetConfig(payload: Partial<WidgetConfig>): Promise<WidgetConfig> {
    const res = await fetch(`${API_BASE}/creators/me/widget-config/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<WidgetConfig>(res);
  },

  async getEmbedCodes(username: string): Promise<EmbedCodeResponse> {
    const res = await fetch(`${API_BASE}/creators/${encodeURIComponent(username)}/embed-code/`);
    return handleResponse<EmbedCodeResponse>(res);
  },

  // --- Payments Engine ---
  async createPaymentRequest(payload: {
    creator_username: string;
    asset_code: 'XLM' | 'USDC';
    amount: number | string;
    supporter_name?: string;
    message?: string;
    supporter_wallet?: string;
  }): Promise<{
    reference_id: string;
    creator_username: string;
    creator_display_name: string;
    recipient_address: string;
    asset_code: string;
    amount: string;
    supporter_name: string;
    message: string;
    status: string;
    created_at: string;
  }> {
    const res = await fetch(`${API_BASE}/payments/create-request/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async buildTransactionXDR(payload: {
    reference_id: string;
    supporter_wallet: string;
  }): Promise<{
    reference_id: string;
    unsigned_xdr: string;
    network_passphrase: string;
    recipient_address: string;
    amount: string;
    asset_code: string;
    estimated_network_fee_stroops: number;
  }> {
    const res = await fetch(`${API_BASE}/payments/build-xdr/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async verifyPayment(payload: {
    reference_id: string;
    stellar_tx_hash: string;
  }): Promise<TipHistoryItem> {
    const res = await fetch(`${API_BASE}/payments/verify/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<TipHistoryItem>(res);
  },

  async getTipHistory(params?: {
    asset?: string;
    status?: string;
    search?: string;
  }): Promise<TipHistoryItem[]> {
    const query = new URLSearchParams();
    if (params?.asset && params.asset !== 'ALL') query.set('asset', params.asset);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`${API_BASE}/payments/tips/?${query.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });
    return handleResponse<TipHistoryItem[]>(res);
  },

  // --- Alerts & Overlay ---
  async triggerTestAlert(payload: {
    overlay_token: string;
    amount?: string;
    asset_code?: string;
    supporter_name?: string;
    message?: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/alerts/test/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // --- OpenAI Message Moderation & Thank-You ---
  async moderateMessage(message: string): Promise<{
    is_safe: boolean;
    flagged_categories: string[];
    clean_message: string;
    engine: string;
  }> {
    const res = await fetch(`${API_BASE}/ai/moderate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    return handleResponse(res);
  },

  async generateThankYouNote(payload: {
    creator_name: string;
    supporter_name?: string;
    amount: string;
    asset_code: string;
    supporter_message?: string;
    tone?: 'warm' | 'playful' | 'formal';
  }): Promise<{ thank_you_note: string; tone: string }> {
    const res = await fetch(`${API_BASE}/ai/generate-thank-you/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // --- System Health ---
  async getHealth(): Promise<{
    status: string;
    database: string;
    stellar_network: string;
    stellar_horizon: string;
    version: string;
  }> {
    const res = await fetch(`${API_BASE}/health/`);
    return handleResponse(res);
  },
};
