import React, { useState, useEffect } from 'react';
import { Target, Clock, Trophy, Star, CheckCircle, Gift } from 'lucide-react';
import { useCurrentAccount } from '@mysten/dapp-kit';

interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  progress: number;
  target: number;
  rewards: {
    sui?: number;
    xp?: number;
    nft?: string;
    title?: string;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  timeRemaining: number;
  completed: boolean;
  claimed: boolean;
}

interface PlayerProgress {
  level: number;
  xp: number;
  xpToNext: number;
  dailyStreak: number;
  totalMissionsCompleted: number;
}

export const DailyMissions: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress>({
    level: 5,
    xp: 1250,
    xpToNext: 500,
    dailyStreak: 7,
    totalMissionsCompleted: 23
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'daily' | 'weekly' | 'special'>('daily');
  
  const account = useCurrentAccount();

  useEffect(() => {
    fetchMissions();
  }, [selectedTab]);

  const fetchMissions = async () => {
    try {
      const mockMissions: Mission[] = [
        {
          id: 'daily_1',
          title: 'Quick Victory',
          description: 'Win a game in under 15 moves',
          type: 'daily',
          progress: 0,
          target: 1,
          rewards: { sui: 0.1, xp: 50 },
          difficulty: 'medium',
          timeRemaining: 18 * 3600,
          completed: false,
          claimed: false
        },
        {
          id: 'daily_2',
          title: 'AI Challenger',
          description: 'Defeat the AI on hard difficulty',
          type: 'daily',
          progress: 1,
          target: 1,
          rewards: { sui: 0.15, xp: 75 },
          difficulty: 'hard',
          timeRemaining: 18 * 3600,
          completed: true,
          claimed: false
        }
      ];

      const filteredMissions = mockMissions.filter(mission => mission.type === selectedTab);
      setMissions(filteredMissions);
    } catch (error) {
      console.error('Error fetching missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (missionId: string) => {
    if (!account) {
      alert('Please connect your wallet to claim rewards');
      return;
    }

    try {
      setMissions(prev => prev.map(mission => 
        mission.id === missionId 
          ? { ...mission, claimed: true }
          : mission
      ));
      
      alert('Reward claimed successfully!');
    } catch (error) {
      console.error('Error claiming reward:', error);
      alert('Failed to claim reward');
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    if (seconds === 0) return 'No time limit';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="daily-missions loading">
        <div className="loading-spinner" />
        <p>Loading missions...</p>
      </div>
    );
  }

  return (
    <div className="daily-missions">
      <div className="player-progress">
        <div className="level-info">
          <div className="level-badge">
            <Star size={20} />
            <span>Level {playerProgress.level}</span>
          </div>
        </div>
      </div>

      <div className="mission-tabs">
        {['daily', 'weekly', 'special'].map((tab) => (
          <button
            key={tab}
            className={`tab-button ${selectedTab === tab ? 'active' : ''}`}
            onClick={() => setSelectedTab(tab as any)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} Missions
          </button>
        ))}
      </div>

      <div className="missions-list">
        {missions.map((mission) => (
          <div key={mission.id} className={`mission-card ${mission.completed ? 'completed' : ''}`}>
            <div className="mission-header">
              <div className="mission-info">
                <h3>{mission.title}</h3>
                <p>{mission.description}</p>
              </div>
            </div>

            <div className="mission-actions">
              {mission.completed && !mission.claimed && (
                <button 
                  className="claim-button"
                  onClick={() => claimReward(mission.id)}
                >
                  <Gift size={16} />
                  Claim Reward
                </button>
              )}
              
              {mission.completed && mission.claimed && (
                <div className="claimed-indicator">
                  <CheckCircle size={16} />
                  <span>Claimed</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 