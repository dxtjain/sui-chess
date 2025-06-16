import React, { useState, useEffect } from 'react';
import { Eye, Users, Clock, Trophy, TrendingUp } from 'lucide-react';
import { useSuiClient } from '@mysten/dapp-kit';

interface LiveMatch {
  id: string;
  players: {
    white: string;
    black: string;
  };
  gameMode: 'PvP' | 'PvAI' | 'AIvAI';
  currentMove: number;
  timeElapsed: number;
  spectators: number;
  wagerAmount: number;
  status: 'active' | 'ended';
  board: number[][];
  lastMove?: {
    from: string;
    to: string;
    piece: string;
  };
}

interface LiveSpectatorProps {
  onWatchMatch: (matchId: string) => void;
}

export const LiveSpectator: React.FC<LiveSpectatorProps> = ({ onWatchMatch }) => {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<LiveMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'PvP' | 'PvAI' | 'AIvAI'>('all');
  
  const client = useSuiClient();

  useEffect(() => {
    fetchLiveMatches();
    
    // Set up real-time updates
    const interval = setInterval(fetchLiveMatches, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchLiveMatches = async () => {
    try {
      // In a real implementation, this would fetch from your backend/blockchain
      const mockMatches: LiveMatch[] = [
        {
          id: '0x123abc',
          players: {
            white: 'ChessMaster2024',
            black: 'QuantumGrandmaster'
          },
          gameMode: 'PvP',
          currentMove: 15,
          timeElapsed: 890,
          spectators: 23,
          wagerAmount: 2.5,
          status: 'active',
          board: generateMockBoard(),
          lastMove: {
            from: 'e2',
            to: 'e4',
            piece: 'pawn'
          }
        },
        {
          id: '0x456def',
          players: {
            white: 'AI_Stockfish_v2',
            black: 'AI_AlphaZero_v3'
          },
          gameMode: 'AIvAI',
          currentMove: 27,
          timeElapsed: 1456,
          spectators: 45,
          wagerAmount: 0,
          status: 'active',
          board: generateMockBoard(),
          lastMove: {
            from: 'g1',
            to: 'f3',
            piece: 'knight'
          }
        },
        {
          id: '0x789ghi',
          players: {
            white: 'SuiKnight',
            black: 'AI_Minimax_v1'
          },
          gameMode: 'PvAI',
          currentMove: 8,
          timeElapsed: 234,
          spectators: 12,
          wagerAmount: 0.5,
          status: 'active',
          board: generateMockBoard(),
          lastMove: {
            from: 'b8',
            to: 'c6',
            piece: 'knight'
          }
        }
      ];

      const filteredMatches = filter === 'all' 
        ? mockMatches 
        : mockMatches.filter(match => match.gameMode === filter);

      setLiveMatches(filteredMatches);
    } catch (error) {
      console.error('Error fetching live matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getGameModeIcon = (mode: string) => {
    switch (mode) {
      case 'PvP': return <Users size={16} />;
      case 'PvAI': return <TrendingUp size={16} />;
      case 'AIvAI': return <Trophy size={16} />;
      default: return <Eye size={16} />;
    }
  };

  const generateMockBoard = (): number[][] => {
    // Generate a random mid-game chess position
    return Array(8).fill(null).map(() => Array(8).fill(0));
  };

  if (loading) {
    return (
      <div className="live-spectator loading">
        <div className="loading-spinner" />
        <p>Loading live matches...</p>
      </div>
    );
  }

  return (
    <div className="live-spectator">
      <div className="spectator-header">
        <h2>
          <Eye size={24} />
          Live Matches
        </h2>
        
        <div className="match-filters">
          {['all', 'PvP', 'PvAI', 'AIvAI'].map((filterOption) => (
            <button
              key={filterOption}
              className={`filter-button ${filter === filterOption ? 'active' : ''}`}
              onClick={() => setFilter(filterOption as any)}
            >
              {filterOption === 'all' ? 'All Matches' : filterOption}
            </button>
          ))}
        </div>
      </div>

      <div className="live-matches-grid">
        {liveMatches.map((match) => (
          <div key={match.id} className="live-match-card">
            <div className="match-header">
              <div className="game-mode">
                {getGameModeIcon(match.gameMode)}
                <span>{match.gameMode}</span>
              </div>
              <div className="spectator-count">
                <Eye size={14} />
                <span>{match.spectators}</span>
              </div>
            </div>

            <div className="players">
              <div className="player white">
                <div className="player-info">
                  <span className="player-name">{match.players.white}</span>
                  <span className="player-color">White</span>
                </div>
              </div>
              
              <div className="vs-indicator">VS</div>
              
              <div className="player black">
                <div className="player-info">
                  <span className="player-name">{match.players.black}</span>
                  <span className="player-color">Black</span>
                </div>
              </div>
            </div>

            <div className="match-stats">
              <div className="stat">
                <Clock size={14} />
                <span>{formatTime(match.timeElapsed)}</span>
              </div>
              <div className="stat">
                <span>Move {match.currentMove}</span>
              </div>
              {match.wagerAmount > 0 && (
                <div className="stat wager">
                  <Trophy size={14} />
                  <span>{match.wagerAmount} SUI</span>
                </div>
              )}
            </div>

            {match.lastMove && (
              <div className="last-move">
                Last: {match.lastMove.piece} {match.lastMove.from} → {match.lastMove.to}
              </div>
            )}

            <div className="match-actions">
              <button
                className="watch-button"
                onClick={() => onWatchMatch(match.id)}
              >
                <Eye size={16} />
                Watch Live
              </button>
              
              {match.gameMode === 'AIvAI' && (
                <button className="bet-button">
                  Place Bet
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {liveMatches.length === 0 && (
        <div className="no-matches">
          <Eye size={48} />
          <h3>No Live Matches</h3>
          <p>No {filter === 'all' ? '' : filter} matches are currently being played.</p>
        </div>
      )}
    </div>
  );
}; 