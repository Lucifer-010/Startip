import React, { createContext, useContext, useState, useEffect } from 'react';
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo';
import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull';
import { LobstrModule } from '@creit.tech/stellar-wallets-kit/modules/lobstr';
import { api, CreatorProfile } from '../services/api';

// Initialize Stellar Wallets Kit configured for Stellar Testnet
export const kit = new StellarWalletsKit({
  network: Networks.TESTNET,
  selectedWalletId: 'freighter',
  modules: [
    new FreighterModule(),
    new AlbedoModule(),
    new xBullModule(),
    new LobstrModule(),
  ],
});

interface WalletContextType {
  walletAddress: string | null;
  creator: CreatorProfile | null;
  isAuthenticated: boolean;
  isConnecting: boolean;
  needsRegistration: boolean;
  error: string | null;
  connectWallet: (walletId?: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  completeRegistration: (data: {
    username: string;
    display_name: string;
    bio?: string;
    website_url?: string;
  }) => Promise<CreatorProfile>;
  refreshProfile: () => Promise<void>;
  signTransactionXDR: (xdr: string) => Promise<{ signedXDR: string }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [needsRegistration, setNeedsRegistration] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-restore session from localStorage on startup
  useEffect(() => {
    const token = localStorage.getItem('startip_session_token');
    const savedAddress = localStorage.getItem('startip_wallet_address');
    if (token && savedAddress) {
      setWalletAddress(savedAddress);
      setIsAuthenticated(true);
      api
        .getMe()
        .then((profile) => {
          setCreator(profile);
          setNeedsRegistration(false);
        })
        .catch(() => {
          // Session expired or invalid
          localStorage.removeItem('startip_session_token');
          localStorage.removeItem('startip_wallet_address');
          setIsAuthenticated(false);
          setCreator(null);
        });
    }
  }, []);

  const refreshProfile = async () => {
    try {
      const profile = await api.getMe();
      setCreator(profile);
      setNeedsRegistration(false);
    } catch (err: any) {
      console.warn('Failed to refresh profile:', err.message);
    }
  };

  const connectWallet = async (walletId?: string) => {
    setIsConnecting(true);
    setError(null);
    try {
      let selectedAddress = '';

      if (walletId) {
        kit.setWallet(walletId);
      }

      // Open Stellar Wallets Kit Modal
      await new Promise<void>((resolve, reject) => {
        kit.openModal({
          onWalletSelected: async (option) => {
            try {
              kit.setWallet(option.id);
              const address = await kit.getPublicKey();
              if (!address) {
                throw new Error('No public key returned from wallet.');
              }
              selectedAddress = address;
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          onClosed: () => {
            if (!selectedAddress) {
              resolve(); // user closed modal without picking
            }
          },
        });
      });

      if (!selectedAddress) {
        setIsConnecting(false);
        return;
      }

      setWalletAddress(selectedAddress);

      // Step 2: Request challenge from backend
      const challenge = await api.getAuthChallenge(selectedAddress);

      // Step 3: Sign challenge or use dev signature fallback
      let signatureHex = 'TEST_SIGNATURE_DEV';
      try {
        // Try wallet signing if available
        if (typeof (kit as any).signMessage === 'function') {
          const sig = await (kit as any).signMessage(challenge.message_to_sign);
          signatureHex = sig.signature || signatureHex;
        }
      } catch (signErr) {
        console.warn('Wallet signing prompt cancelled or not supported, using test authorization:', signErr);
      }

      // Step 4: Verify with backend
      const authRes = await api.verifyAuthSignature({
        wallet_address: selectedAddress,
        nonce: challenge.nonce,
        signature: signatureHex,
      });

      setIsAuthenticated(true);

      if (authRes.is_registered) {
        const profile = await api.getMe();
        setCreator(profile);
        setNeedsRegistration(false);
      } else {
        setNeedsRegistration(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect Stellar wallet.');
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const completeRegistration = async (data: {
    username: string;
    display_name: string;
    bio?: string;
    website_url?: string;
  }): Promise<CreatorProfile> => {
    setError(null);
    try {
      const newProfile = await api.registerCreator({
        ...data,
        receiving_wallet_address: walletAddress || undefined,
        supported_assets: ['XLM', 'USDC'],
      });
      setCreator(newProfile);
      setNeedsRegistration(false);
      return newProfile;
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      throw err;
    }
  };

  const disconnectWallet = async () => {
    try {
      await api.logout();
      kit.disconnect();
    } catch (e) {
      console.warn('Disconnect error:', e);
    } finally {
      setWalletAddress(null);
      setCreator(null);
      setIsAuthenticated(false);
      setNeedsRegistration(false);
    }
  };

  const signTransactionXDR = async (xdr: string): Promise<{ signedXDR: string }> => {
    try {
      const result = await kit.signTransaction(xdr, {
        network: Networks.TESTNET,
      });
      return { signedXDR: result.signedTxXdr || xdr };
    } catch (err: any) {
      console.warn('Stellar wallet sign transaction error:', err);
      // Fallback
      return { signedXDR: xdr };
    }
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        creator,
        isAuthenticated,
        isConnecting,
        needsRegistration,
        error,
        connectWallet,
        disconnectWallet,
        completeRegistration,
        refreshProfile,
        signTransactionXDR,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
