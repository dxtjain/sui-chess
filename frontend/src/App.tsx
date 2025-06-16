import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider, createNetworkConfig } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { Toaster } from 'react-hot-toast';
import { ChessBoard } from './components/ChessBoard';
import { WalletConnect } from './components/WalletConnect';
import { GameModes } from './components/GameModes';
import { Leaderboard } from './components/Leaderboard';
import { Tournament } from './components/Tournament';
import { LiveSpectator } from './components/LiveSpectator';
import { DailyMissions } from './components/DailyMissions';
import { NautilusDashboard } from './components/NautilusDashboard';
import '@mysten/dapp-kit/dist/index.css';
import './App.css';
import './styles/nautilus.css';

// Setup Sui network configuration
const { networkConfig } = createNetworkConfig({
  devnet: { url: getFullnodeUrl('devnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
});

const queryClient = new QueryClient();

type GameMode = 'PvP' | 'PvAI' | 'AIvAI';
type View = 'menu' | 'game' | 'leaderboard' | 'profile' | 'tournaments' | 'spectator' | 'missions' | 'nautilus';

interface GameSettings {
  mode: GameMode;
  wagerAmount: number;
  aiDifficulty: 'easy' | 'medium' | 'hard';
  timeControl: 'blitz' | 'rapid' | 'classical';
}

function App() {
  const [currentView, setCurrentView] = useState<View>('menu');
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    mode: 'PvP',
    wagerAmount: 0,
    aiDifficulty: 'medium',
    timeControl: 'rapid',
  });

  const handleGameModeSelect = (settings: GameSettings) => {
    setGameSettings(settings);
    setCurrentView('game');
  };

  const handleGameEnd = (winner: string | null, gameStats: any) => {
    console.log('Game ended, winner:', winner, 'stats:', gameStats);
    // Here you would handle:
    // 1. Minting NFT trophies
    // 2. Updating leaderboard
    // 3. Distributing prize pool
    // 4. Recording game history
    
    setTimeout(() => setCurrentView('menu'), 3000);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'menu':
        return (
          <div className="app-menu">
            <h1 className="app-title">⚡ Web3 Chess ⚡</h1>
            <p className="app-subtitle">Play chess on the Sui blockchain</p>
            
            <div className="menu-content">
              <GameModes 
                onGameModeSelect={handleGameModeSelect}
                currentSettings={gameSettings}
              />
              
              <div className="menu-buttons">
                <button 
                  className="nav-button"
                  onClick={() => setCurrentView('leaderboard')}
                >
                  🏆 Leaderboard
                </button>
                <button 
                  className="nav-button"
                  onClick={() => setCurrentView('tournaments')}
                >
                  🏁 Tournaments
                </button>
                <button 
                  className="nav-button"
                  onClick={() => setCurrentView('spectator')}
                >
                  👁️ Live Matches
                </button>
                <button 
                  className="nav-button"
                  onClick={() => setCurrentView('missions')}
                >
                  🎯 Daily Missions
                </button>
                <button 
                  className="nav-button"
                  onClick={() => setCurrentView('profile')}
                >
                  👤 Profile & Trophies
                </button>
                <button 
                  className="nav-button nautilus-button"
                  onClick={() => setCurrentView('nautilus')}
                >
                  ⚙️ Nautilus Control
                </button>
              </div>
            </div>
          </div>
        );

      case 'game':
        return (
          <div className="game-container">
            <div className="game-header">
              <button 
                className="back-button"
                onClick={() => setCurrentView('menu')}
              >
                ← Back to Menu
              </button>
              <div className="game-info">
                <span className="game-mode">{gameSettings.mode}</span>
                {gameSettings.wagerAmount > 0 && (
                  <span className="wager-amount">{gameSettings.wagerAmount} SUI</span>
                )}
              </div>
            </div>
            
            <ChessBoard 
              gameSettings={gameSettings}
              onGameEnd={handleGameEnd}
            />
          </div>
        );

      case 'leaderboard':
        return (
          <div className="leaderboard-container">
            <div className="page-header">
              <button 
                className="back-button"
                onClick={() => setCurrentView('menu')}
              >
                ← Back to Menu
              </button>
              <h2>🏆 Leaderboard</h2>
            </div>
            <Leaderboard />
          </div>
        );

      case 'tournaments':
        return (
          <div className="tournaments-container">
            <div className="page-header">
              <button 
                className="back-button"
                onClick={() => setCurrentView('menu')}
              >
                ← Back to Menu
              </button>
              <h2>🏁 Tournaments</h2>
            </div>
            <Tournament />
          </div>
        );

      case 'spectator':
        return (
          <div className="spectator-container">
            <div className="page-header">
              <button 
                className="back-button"
                onClick={() => setCurrentView('menu')}
              >
                ← Back to Menu
              </button>
              <h2>👁️ Live Matches</h2>
            </div>
            <LiveSpectator onWatchMatch={(matchId) => {
              console.log('Watching match:', matchId);
              // Here you would open the spectator view for the specific match
            }} />
          </div>
        );

      case 'missions':
        return (
          <div className="missions-container">
            <div className="page-header">
              <button 
                className="back-button"
                onClick={() => setCurrentView('menu')}
              >
                ← Back to Menu
              </button>
              <h2>🎯 Daily Missions</h2>
            </div>
            <DailyMissions />
          </div>
        );

      case 'nautilus':
        return (
          <div className="nautilus-container">
            <div className="page-header">
              <button 
                className="back-button"
                onClick={() => setCurrentView('menu')}
              >
                ← Back to Menu
              </button>
              <h2>⚙️ Nautilus Control Center</h2>
            </div>
            <NautilusDashboard />
          </div>
        );

      case 'profile':
        return (
          <div className="profile-container">
            <div className="page-header">
              <button 
                className="back-button"
                onClick={() => setCurrentView('menu')}
              >
                ← Back to Menu
              </button>
              <h2>👤 Profile & Trophies</h2>
            </div>
            <div className="profile-content">
              <div className="coming-soon">
                <h3>🏗️ Under Construction</h3>
                <p>Profile management and NFT trophy gallery coming soon!</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="devnet">
        <WalletProvider autoConnect>
          <div className="app">
            <header className="app-header">
              <div className="header-content">
                <div className="header-left">
                  <h1 className="header-title">Web3 Chess</h1>
                  <span className="network-badge">Sui Devnet</span>
                </div>
                <div className="header-right">
                  <WalletConnect />
                </div>
              </div>
            </header>

            <main className="app-main">
              {renderCurrentView()}
            </main>

            <footer className="app-footer">
              <p>Built on Sui Blockchain • Powered by Move Smart Contracts</p>
            </footer>

            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1a1a1a',
                  color: '#ffffff',
                  border: '1px solid #333',
                },
              }}
            />
          </div>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

export default App; 