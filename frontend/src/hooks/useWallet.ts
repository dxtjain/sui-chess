import { useCurrentAccount, useDisconnectWallet, useSuiClient } from '@mysten/dapp-kit';
import { useState, useEffect } from 'react';
import { SuiClient } from '@mysten/sui/client';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  isLoading: boolean;
  error: string | null;
}

export const useWallet = () => {
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const client = useSuiClient();
  
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = !!currentAccount;
  const address = currentAccount?.address || null;

  // Fetch wallet balance
  const fetchBalance = async () => {
    if (!address) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const balanceResult = await client.getBalance({
        owner: address,
      });
      
      // Convert from MIST to SUI (1 SUI = 1e9 MIST)
      const suiBalance = (parseInt(balanceResult.totalBalance) / 1e9).toFixed(4);
      setBalance(suiBalance);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to fetch balance');
      setBalance('0');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch balance when wallet connects
  useEffect(() => {
    if (isConnected) {
      fetchBalance();
    } else {
      setBalance('0');
      setError(null);
    }
  }, [isConnected, address]);

  // Format address for display
  const formatAddress = (addr: string | null) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Get wallet state object
  const walletState: WalletState = {
    isConnected,
    address,
    balance,
    isLoading,
    error,
  };

  return {
    ...walletState,
    formattedAddress: formatAddress(address),
    disconnect,
    fetchBalance,
    client,
  };
}; 