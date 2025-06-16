import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, TrendingUp, Target } from 'lucide-react';

interface PlayerStats {
  address: string;
  displayName: string;
  wins: number;
  losses: number;
  draws: number;
  rating: number;
  gamesPlayed: number;
  totalWinnings: number;
  avgGameTime: number;
  favoriteMode: string;
  trophies: number;
  rank: number;
}

interface LeaderboardProps {}

export const Leaderboard: React.FC<LeaderboardProps> = () => {
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [sortBy, setSortBy] = useState<'rating' | 'wins' | 'winnings'>('rating');
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, this would fetch from your backend/blockchain
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      
      // Simulated data - replace with actual API call
      const mockData: PlayerStats[] = [
        {
          address: '0x1234...5678',
          displayName: 'ChessMaster2024',
          wins: 127,
          losses: 23,
          draws: 8,
          rating: 2340,
          gamesPlayed: 158,
          totalWinnings: 45.7,
          avgGameTime: 892,
          favoriteMode: 'PvP',
          trophies: 12,
          rank: 1,
        },
        {
          address: '0x2345...6789',
          displayName: 'QuantumGrandmaster',
          wins: 89,
          losses: 31,
          draws: 12,
          rating: 2187,
          gamesPlayed: 132,
          totalWinnings: 32.1,
          avgGameTime: 1205,
          favoriteMode: 'PvAI',
          trophies: 8,
          rank: 2,
        },
        {
          address: '0x3456...789a',
          displayName: 'SuiKnight',
          wins: 76,
          losses: 42,
          draws: 7,
          rating: 1998,
          gamesPlayed: 125,
          totalWinnings: 28.9,
          avgGameTime: 743,
          favoriteMode: 'PvP',
          trophies: 6,
          rank: 3,
        },
        {
          address: '0x4567...89ab',
          displayName: 'BlockchainBishop',
          wins: 65,
          losses: 38,
          draws: 15,
          rating: 1876,
          gamesPlayed: 118,
          totalWinnings: 19.4,
          avgGameTime: 987,
          favoriteMode: 'PvAI',
          trophies: 4,
          rank: 4,
        },
        {
          address: '0x5678...9abc',
          displayName: 'CryptoRook',
          wins: 54,
          losses: 29,
          draws: 11,
          rating: 1743,
          gamesPlayed: 94,
          totalWinnings: 15.2,
          avgGameTime: 1134,
          favoriteMode: 'PvP',
          trophies: 3,
          rank: 5,
        },
      ];

      // Simulate API delay
      setTimeout(() => {
        setPlayers(mockData);
        setIsLoading(false);
      }, 1000);
    };

    fetchLeaderboard();
  }, [timeframe]);

  const sortedPlayers = [...players].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'wins':
        return b.wins - a.wins;
      case 'winnings':
        return b.totalWinnings - a.totalWinnings;
      default:
        return b.rating - a.rating;
    }
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="rank-icon gold" size={20} />;
      case 2:
        return <Medal className="rank-icon silver" size={20} />;
      case 3:
        return <Medal className="rank-icon bronze" size={20} />;
      default:
        return <span className="rank-number">#{rank}</span>;
    }
  };

  const getWinRate = (player: PlayerStats) => {
    return ((player.wins / player.gamesPlayed) * 100).toFixed(1);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="leaderboard loading">
        <div className="loading-spinner" />
        <p>Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <div className="header-controls">
          <div className="sort-controls">
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="sort-select"
              title="Sort leaderboard by"
            >
              <option value="rating">Rating</option>
              <option value="wins">Wins</option>
              <option value="winnings">Winnings</option>
            </select>
          </div>
          
          <div className="timeframe-controls">
            <label>Timeframe:</label>
            <div className="timeframe-buttons">
              {['all', 'month', 'week'].map((tf) => (
                <button
                  key={tf}
                  className={`timeframe-button ${timeframe === tf ? 'active' : ''}`}
                  onClick={() => setTimeframe(tf as any)}
                >
                  {tf.charAt(0).toUpperCase() + tf.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="leaderboard-stats">
        <div className="stat-card">
          <TrendingUp size={24} />
          <div className="stat-info">
            <span className="stat-value">{players.length}</span>
            <span className="stat-label">Active Players</span>
          </div>
        </div>
        <div className="stat-card">
          <Target size={24} />
          <div className="stat-info">
            <span className="stat-value">
              {players.reduce((sum, p) => sum + p.gamesPlayed, 0)}
            </span>
            <span className="stat-label">Total Games</span>
          </div>
        </div>
        <div className="stat-card">
          <Trophy size={24} />
          <div className="stat-info">
            <span className="stat-value">
              {players.reduce((sum, p) => sum + p.totalWinnings, 0).toFixed(1)} SUI
            </span>
            <span className="stat-label">Total Winnings</span>
          </div>
        </div>
      </div>

      <div className="leaderboard-table">
        <div className="table-header">
          <div className="header-cell rank">Rank</div>
          <div className="header-cell player">Player</div>
          <div className="header-cell rating">Rating</div>
          <div className="header-cell stats">W/L/D</div>
          <div className="header-cell winrate">Win Rate</div>
          <div className="header-cell winnings">Winnings</div>
          <div className="header-cell trophies">Trophies</div>
        </div>

        <div className="table-body">
          {sortedPlayers.map((player, index) => (
            <div key={player.address} className="table-row">
              <div className="cell rank">
                {getRankIcon(index + 1)}
              </div>
              
              <div className="cell player">
                <div className="player-info">
                  <span className="player-name">{player.displayName}</span>
                  <span className="player-address">{formatAddress(player.address)}</span>
                </div>
              </div>
              
              <div className="cell rating">
                <span className="rating-value">{player.rating}</span>
              </div>
              
              <div className="cell stats">
                <div className="wld-stats">
                  <span className="wins">{player.wins}</span>
                  <span className="separator">/</span>
                  <span className="losses">{player.losses}</span>
                  <span className="separator">/</span>
                  <span className="draws">{player.draws}</span>
                </div>
              </div>
              
              <div className="cell winrate">
                <span className="winrate-value">{getWinRate(player)}%</span>
              </div>
              
              <div className="cell winnings">
                <span className="winnings-value">{player.totalWinnings.toFixed(1)} SUI</span>
              </div>
              
              <div className="cell trophies">
                <div className="trophy-count">
                  <Star size={16} />
                  <span>{player.trophies}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="leaderboard-footer">
        <p className="disclaimer">
          Rankings update every 10 minutes. Only completed games count towards statistics.
        </p>
      </div>
    </div>
  );
}; 