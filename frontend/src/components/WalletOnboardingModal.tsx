import React, { useState } from 'react';
import { X, ArrowUpRight, Check, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { WalletLogo, StarFourPoint, StellarNetworkIcon } from './Icons';
import { useWallet } from '../context/WalletContext';

interface WalletOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function WalletOnboardingModal({
  isOpen,
  onClose,
  onSuccess,
}: WalletOnboardingModalProps) {
  const {
    connectWallet,
    completeRegistration,
    walletAddress,
    needsRegistration,
    isConnecting,
    error: walletError,
  } = useWallet();

  const [selectedWallet, setSelectedWallet] = useState<
    'freighter' | 'lobstr' | 'xbull' | 'albedo' | 'walletconnect'
  >('freighter');

  const [username, setUsername] = useState('alex_dev');
  const [displayName, setDisplayName] = useState('Alex River');
  const [bio, setBio] = useState('Building open-source tools on Stellar.');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setFormError(null);
    try {
      await connectWallet(selectedWallet);
      // If user is already registered, complete flow
      if (!needsRegistration && walletAddress) {
        onSuccess();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to connect wallet.');
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !displayName.trim()) {
      setFormError('Please enter a display name and username handle.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await completeRegistration({
        username: username.trim().toLowerCase(),
        display_name: displayName.trim(),
        bio: bio.trim(),
      });
      onSuccess();
    } catch (err: any) {
      setFormError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const wallets: {
    id: 'freighter' | 'lobstr' | 'xbull' | 'albedo' | 'walletconnect';
    label: string;
    desc: string;
  }[] = [
    { id: 'freighter', label: 'Freighter', desc: 'Browser extension · Recommended' },
    { id: 'lobstr', label: 'LOBSTR', desc: 'Mobile & web Stellar wallet' },
    { id: 'xbull', label: 'xBull', desc: 'Power-user Stellar wallet' },
    { id: 'albedo', label: 'Albedo', desc: 'Web-based signer' },
    { id: 'walletconnect', label: 'WalletConnect', desc: 'Scan QR from mobile' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] rounded-[28px] bg-[#0E1333] border border-white/15 p-6 sm:p-8 text-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full border border-white/18 flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-full bg-[#C6FF3D] flex items-center justify-center">
            <StarFourPoint className="w-4 h-4" color="#0B1026" />
          </div>
          <span className="font-bold text-[19px] tracking-[-0.5px]">StarTip</span>
          <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/15 text-xs text-white/80">
            <span className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
              <StellarNetworkIcon className="w-2.5 h-2.5" color="#0B1026" />
            </span>
            Testnet
          </span>
        </div>

        {/* Error notification */}
        {(formError || walletError) && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError || walletError}</span>
          </div>
        )}

        {!needsRegistration ? (
          <>
            <h3 className="text-[26px] leading-[32px] font-semibold tracking-[-0.5px]">
              Connect your Stellar wallet
            </h3>
            <p className="mt-1.5 text-[14px] leading-[22px] text-white/60">
              Sign in with Stellar Wallets Kit. Your wallet is your login and your bank—no forms or payout holds.
            </p>

            {/* Wallet selection list */}
            <div className="mt-5 space-y-2">
              {wallets.map((w) => {
                const active = selectedWallet === w.id;
                return (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWallet(w.id)}
                    className={`w-full p-3 rounded-2xl border flex items-center justify-between transition cursor-pointer ${
                      active
                        ? 'bg-white/[0.08] border-[#C6FF3D]'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <WalletLogo name={w.id} size={32} />
                      <div>
                        <div className="text-sm font-semibold text-white">{w.label}</div>
                        <div className="text-xs text-white/50">{w.desc}</div>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        active ? 'bg-[#C6FF3D] border-[#C6FF3D] text-[#0B1026]' : 'border-white/25'
                      }`}
                    >
                      {active && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="mt-6 w-full h-[52px] rounded-full bg-[#C6FF3D] hover:brightness-95 text-[#0B1026] font-semibold text-[15px] flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting with Stellar Wallets Kit…</span>
                </>
              ) : (
                <>
                  <span>Connect Wallet & Sign In</span>
                  <ArrowUpRight className="w-4 h-4" />
                </>
              )}
            </button>
          </>
        ) : (
          /* Step 2: New Creator Onboarding Profile Registration */
          <>
            <h3 className="text-[24px] leading-[30px] font-semibold tracking-[-0.5px]">
              Complete your Creator Profile
            </h3>
            <p className="mt-1 text-xs text-white/60">
              Wallet connected: <span className="font-mono text-[#C6FF3D]">{walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}</span>
            </p>

            <div className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex River"
                  className="w-full h-[44px] px-3.5 rounded-xl bg-white/[0.05] border border-white/15 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Claim your Public Tip URL</label>
                <div className="flex items-center h-[44px] px-3.5 rounded-xl bg-white/[0.05] border border-white/15 focus-within:border-[#C6FF3D]">
                  <span className="font-mono text-xs text-white/50">startip.app/</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className="flex-1 bg-transparent font-mono text-sm text-[#C6FF3D] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Short Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  placeholder="Tell your fans what you create..."
                  className="w-full p-3 rounded-xl bg-white/[0.05] border border-white/15 text-xs text-white focus:outline-none focus:border-[#C6FF3D] resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleRegister}
              disabled={submitting}
              className="mt-5 w-full h-[50px] rounded-full bg-[#C6FF3D] hover:brightness-95 text-[#0B1026] font-semibold text-[14px] flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Creator Profile…</span>
                </>
              ) : (
                <>
                  <span>Launch Creator Dashboard</span>
                  <ArrowUpRight className="w-4 h-4" />
                </>
              )}
            </button>
          </>
        )}

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/50">
          <ShieldCheck className="w-4 h-4 text-[#C6FF3D]" />
          <span>Non-custodial · StarTip never holds your funds</span>
        </div>
      </div>
    </div>
  );
}
