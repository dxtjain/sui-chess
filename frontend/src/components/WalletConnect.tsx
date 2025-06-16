import React from 'react';
import { ConnectButton } from '@mysten/dapp-kit';
import { useWallet } from '../hooks/useWallet';
import { Wallet, LogOut, RefreshCw } from 'lucide-react';

export const WalletConnect: React.FC = () => {
  const { isConnected, formattedAddress, balance, isLoading, error, disconnect, fetchBalance } = useWallet();

  if (isConnected) {
    return (
      <div className="wallet-connected">
        <div className="wallet-info">
          <div className="wallet-address">
            <Wallet size={16} />
            <span>{formattedAddress}</span>
          </div>
          <div className="wallet-balance">
            <span className="balance-label">Balance:</span>
            <span className="balance-amount">
              {isLoading ? (
                <RefreshCw size={14} className="spinning" />
              ) : (
                `${balance} SUI`
              )}
            </span>
            <button 
              className="refresh-button"
              onClick={fetchBalance}
              disabled={isLoading}
              title="Refresh balance"
            >
              <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
            </button>
          </div>
          {error && (
            <div className="wallet-error">
              <small>{error}</small>
            </div>
          )}
        </div>
        <button 
          className="disconnect-button"
          onClick={() => disconnect()}
          title="Disconnect wallet"
        >
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      <ConnectButton 
        className="connect-wallet-button"
        connectText="Connect Wallet"
      />
      <div className="wallet-hint">
        <small>Connect your Sui wallet to start playing</small>
      </div>
    </div>
  );
}; 