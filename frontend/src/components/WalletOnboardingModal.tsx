import React, { useState } from 'react';
import { X, ArrowUpRight, Check, ShieldCheck, Loader2, AlertCircle, Wallet } from 'lucide-react';
import { StarFourPoint } from './Icons';
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

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

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

  // If wallet is connected and needs registration: show registration form
  if (walletAddress && needsRegistration) {
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
              <span className="w-2 h-2 rounded-full bg-[#C6FF3D]" />
              Stellar Testnet
            </span>
          </div>

          <div className="space-y-2 mb-6">
            <h3 className="text-[22px] font-bold text-white tracking-[-0.5px]">
              Complete your creator profile
            </h3>
            <p className="text-sm text-white/60">
              Your wallet is connected! Choose your unique tipping handle and details.
            </p>
          </div>

          <div className="p-3 mb-5 rounded-[14px] bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs">
            <span className="text-white/60">Connected Wallet</span>
            <span className="font-mono-code text-[#C6FF3D] font-medium">
              {walletAddress.slice(0, 6)}…{walletAddress.slice(-6)}
            </span>
          </div>

          {(formError || walletError) && (
            <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError || walletError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                Username Handle
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm font-mono-code">
                  startip.app/
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="yourname"
                  className="w-full pl-[95px] pr-3.5 py-3 rounded-[14px] bg-white/[0.06] border border-white/15 text-white text-sm font-mono-code focus:outline-none focus:border-[#C6FF3D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex River"
                className="w-full px-3.5 py-3 rounded-[14px] bg-white/[0.06] border border-white/15 text-white text-sm focus:outline-none focus:border-[#C6FF3D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                Short Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="What do you build or create?"
                className="w-full px-3.5 py-2.5 rounded-[14px] bg-white/[0.06] border border-white/15 text-white text-sm focus:outline-none focus:border-[#C6FF3D] resize-none"
              />
            </div>

            <button
              onClick={handleRegister}
              disabled={submitting}
              className="w-full h-[52px] rounded-full bg-[#C6FF3D] hover:brightness-95 text-[#0B1026] font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating your tip page...</span>
                </>
              ) : (
                <>
                  <span>Create my StarTip page</span>
                  <ArrowUpRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Initial State: Prompt to trigger the official Stellar Wallets Kit modal
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] rounded-[28px] bg-[#0E1333] border border-white/15 p-6 sm:p-8 text-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 text-center">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full border border-white/18 flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-[#C6FF3D] text-[#0B1026] flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-7 h-7" />
        </div>

        <h3 className="text-[24px] font-bold text-white tracking-[-0.5px] mb-2">
          Connect your Stellar Wallet
        </h3>
        <p className="text-sm text-white/60 max-w-[340px] mx-auto mb-6">
          Powered by the official <a href="https://stellarwalletskit.dev/" target="_blank" rel="noreferrer" className="text-[#C6FF3D] underline">Stellar Wallets Kit</a>. Connect with Freighter, xBull, Lobstr, Albedo, Hana, and more.
        </p>

        {walletError && (
          <div className="p-3 mb-5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{walletError}</span>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={async () => {
              try {
                const res = await connectWallet();
                if (res && res.is_registered) {
                  onSuccess();
                }
              } catch (e) {
                // error handled in context
              }
            }}
            disabled={isConnecting}
            className="w-full h-[54px] rounded-full bg-[#C6FF3D] hover:brightness-95 text-[#0B1026] font-bold text-[15px] flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-60"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting with Stellar Wallets Kit...</span>
              </>
            ) : (
              <>
                <span>Open Stellar Wallets Kit</span>
                <ArrowUpRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-xs text-white/40 pt-2">
            <ShieldCheck className="w-4 h-4 text-[#C6FF3D]" />
            <span>Non-custodial & direct peer-to-peer tipping</span>
          </div>
        </div>
      </div>
    </div>
  );
}
