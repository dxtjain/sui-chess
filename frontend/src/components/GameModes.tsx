import React, { useState } from 'react';
import { User, Bot, Zap, Trophy, Clock } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

interface GameSettings {
  mode: 'PvP' | 'PvAI' | 'AIvAI';
  wagerAmount: number;
  aiDifficulty: 'easy' | 'medium' | 'hard';
  timeControl: 'blitz' | 'rapid' | 'classical';
}

interface GameModesProps {
  onGameModeSelect: (settings: GameSettings) => void;
  currentSettings: GameSettings;
}

export const GameModes: React.FC<GameModesProps> = ({ onGameModeSelect, currentSettings }) => {
  const { isConnected } = useWallet();
  const [selectedMode, setSelectedMode] = useState<'PvP' | 'PvAI' | 'AIvAI'>(currentSettings.mode);
  const [wagerAmount, setWagerAmount] = useState(currentSettings.wagerAmount);
  const [aiDifficulty, setAiDifficulty] = useState(currentSettings.aiDifficulty);
  const [timeControl, setTimeControl] = useState(currentSettings.timeControl);

  const handleStartGame = () => {
    const settings: GameSettings = {
      mode: selectedMode,
      wagerAmount,
      aiDifficulty,
      timeControl,
    };
    onGameModeSelect(settings);
  };

  const gameModes = [
    {
      id: 'PvP',
      title: 'Player vs Player',
      description: 'Challenge another human player',
      icon: <User size={24} />,
      color: '#4f46e5',
      features: ['Real-time multiplayer', 'Wager SUI tokens', 'Competitive rating'],
    },
    {
      id: 'PvAI',
      title: 'Player vs AI',
      description: 'Test your skills against AI',
      icon: <Bot size={24} />,
      color: '#059669',
      features: ['Adjustable difficulty', 'Perfect for practice', 'Immediate gameplay'],
    },
    {
      id: 'AIvAI',
      title: 'AI vs AI',
      description: 'Watch AI agents battle',
      icon: <Zap size={24} />,
      color: '#dc2626',
      features: ['Entertainment mode', 'Study AI strategies', 'Blockchain randomness'],
    },
  ];

  const difficultyLevels = [
    { id: 'easy', label: 'Easy', description: 'Beginner friendly' },
    { id: 'medium', label: 'Medium', description: 'Balanced challenge' },
    { id: 'hard', label: 'Hard', description: 'Expert level' },
  ];

  const timeControls = [
    { id: 'blitz', label: 'Blitz', description: '5 minutes' },
    { id: 'rapid', label: 'Rapid', description: '15 minutes' },
    { id: 'classical', label: 'Classical', description: '30 minutes' },
  ];

  return (
    <div className="game-modes">
      <div className="mode-selection">
        <h3>Choose Game Mode</h3>
        <div className="mode-grid">
          {gameModes.map((mode) => (
            <div
              key={mode.id}
              className={`mode-card ${selectedMode === mode.id ? 'selected' : ''}`}
              onClick={() => setSelectedMode(mode.id as any)}
              style={{ '--accent-color': mode.color } as React.CSSProperties}
            >
              <div className="mode-header">
                <div className="mode-icon" style={{ color: mode.color }}>
                  {mode.icon}
                </div>
                <div className="mode-info">
                  <h4>{mode.title}</h4>
                  <p>{mode.description}</p>
                </div>
              </div>
              <div className="mode-features">
                {mode.features.map((feature, index) => (
                  <span key={index} className="feature-tag">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="game-settings">
        <div className="settings-section">
          <h4>
            <Clock size={16} />
            Time Control
          </h4>
          <div className="setting-options">
            {timeControls.map((control) => (
              <button
                key={control.id}
                className={`setting-option ${timeControl === control.id ? 'selected' : ''}`}
                onClick={() => setTimeControl(control.id as any)}
              >
                <span className="option-label">{control.label}</span>
                <span className="option-description">{control.description}</span>
              </button>
            ))}
          </div>
        </div>

        {(selectedMode === 'PvAI' || selectedMode === 'AIvAI') && (
          <div className="settings-section">
            <h4>
              <Bot size={16} />
              AI Difficulty
            </h4>
            <div className="setting-options">
              {difficultyLevels.map((level) => (
                <button
                  key={level.id}
                  className={`setting-option ${aiDifficulty === level.id ? 'selected' : ''}`}
                  onClick={() => setAiDifficulty(level.id as any)}
                >
                  <span className="option-label">{level.label}</span>
                  <span className="option-description">{level.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedMode === 'PvP' && (
          <div className="settings-section">
            <h4>
              <Trophy size={16} />
              Wager Amount (SUI)
            </h4>
            <div className="wager-input">
              <input
                type="number"
                min="0"
                step="0.1"
                value={wagerAmount}
                onChange={(e) => setWagerAmount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="wager-amount-input"
              />
              <div className="wager-presets">
                {[0, 0.1, 0.5, 1.0].map((amount) => (
                  <button
                    key={amount}
                    className={`preset-button ${wagerAmount === amount ? 'selected' : ''}`}
                    onClick={() => setWagerAmount(amount)}
                  >
                    {amount === 0 ? 'Free' : `${amount} SUI`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="start-game-section">
        <button
          className="start-game-button"
          onClick={handleStartGame}
          disabled={selectedMode === 'PvP' && !isConnected}
        >
          {selectedMode === 'PvP' && !isConnected 
            ? 'Connect Wallet to Play PvP' 
            : `Start ${selectedMode} Game`
          }
        </button>
        
        {selectedMode === 'PvP' && wagerAmount > 0 && (
          <p className="wager-notice">
            ⚠️ This game requires a wager of {wagerAmount} SUI. Winner takes all!
          </p>
        )}
      </div>
    </div>
  );
}; 