import React, { useState, useEffect } from 'react';
import { Settings, Plug, Shield, Target, BarChart3, Gift, Power, Info } from 'lucide-react';
import { useNautilus } from '../hooks/useNautilus';
import toast from 'react-hot-toast';

export const NautilusDashboard: React.FC = () => {
  const {
    plugins,
    gameStats,
    playerRating,
    loading,
    initializeNautilus,
    installPlugin,
    togglePlugin,
    fetchPlayerRating,
    fetchGameStats,
  } = useNautilus();

  const [selectedTab, setSelectedTab] = useState<'overview' | 'plugins' | 'analytics'>('overview');
  const [installingPlugin, setInstallingPlugin] = useState<string | null>(null);

  useEffect(() => {
    fetchPlayerRating();
    fetchGameStats();
  }, []);

  const handleInstallPlugin = async (pluginType: 'rating' | 'anticheat' | 'matchmaking' | 'analytics' | 'rewards') => {
    setInstallingPlugin(pluginType);
    try {
      await installPlugin(pluginType);
      toast.success(`${pluginType} plugin installed successfully!`);
    } catch (error) {
      toast.error(`Failed to install ${pluginType} plugin`);
      console.error(error);
    } finally {
      setInstallingPlugin(null);
    }
  };

  const handleTogglePlugin = (pluginId: string) => {
    togglePlugin(pluginId);
    const plugin = plugins.find(p => p.id === pluginId);
    if (plugin) {
      toast.success(`${plugin.name} plugin ${plugin.enabled ? 'disabled' : 'enabled'}`);
    }
  };

  const getPluginIcon = (type: string) => {
    switch (type) {
      case 'rating': return <Target size={20} />;
      case 'anticheat': return <Shield size={20} />;
      case 'matchmaking': return <Plug size={20} />;
      case 'analytics': return <BarChart3 size={20} />;
      case 'rewards': return <Gift size={20} />;
      default: return <Settings size={20} />;
    }
  };

  const availablePlugins = [
    {
      type: 'rating',
      name: 'ELO Rating System',
      description: 'Automatic player rating calculation using ELO algorithm',
      features: ['Dynamic rating updates', 'Match history tracking', 'Skill-based matchmaking'],
      installed: plugins.some(p => p.type === 'rating'),
    },
    {
      type: 'anticheat',
      name: 'Anti-Cheat Protection',
      description: 'Advanced cheat detection and prevention system',
      features: ['Move pattern analysis', 'Time analysis', 'Suspicious activity tracking'],
      installed: plugins.some(p => p.type === 'anticheat'),
    },
    {
      type: 'matchmaking',
      name: 'Smart Matchmaking',
      description: 'Intelligent player matching based on skill and preferences',
      features: ['Rating-based matching', 'Queue management', 'Fair game creation'],
      installed: plugins.some(p => p.type === 'matchmaking'),
    },
    {
      type: 'analytics',
      name: 'Game Analytics',
      description: 'Comprehensive game statistics and insights',
      features: ['Player behavior tracking', 'Game outcome analysis', 'Performance metrics'],
      installed: plugins.some(p => p.type === 'analytics'),
    },
    {
      type: 'rewards',
      name: 'Reward System',
      description: 'Automated reward distribution and incentive management',
      features: ['Daily rewards', 'Achievement bonuses', 'Loyalty programs'],
      installed: plugins.some(p => p.type === 'rewards'),
    },
  ];

  return (
    <div className="nautilus-dashboard">
      <div className="dashboard-header">
        <h2>
          <Settings size={24} />
          Nautilus Control Center
        </h2>
        <p>Manage your modular Web3 Chess system</p>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        {['overview', 'plugins', 'analytics'].map((tab) => (
          <button
            key={tab}
            className={`tab-button ${selectedTab === tab ? 'active' : ''}`}
            onClick={() => setSelectedTab(tab as any)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="overview-section">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>🎮 Total Games</h3>
              <div className="stat-value">{gameStats.totalGames.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <h3>⚡ Active Games</h3>
              <div className="stat-value">{gameStats.activeGames}</div>
            </div>
            <div className="stat-card">
              <h3>💰 Total Volume</h3>
              <div className="stat-value">{gameStats.totalVolume.toFixed(2)} SUI</div>
            </div>
            <div className="stat-card">
              <h3>🔧 Active Plugins</h3>
              <div className="stat-value">{plugins.filter(p => p.enabled).length}</div>
            </div>
          </div>

          {playerRating && (
            <div className="player-rating-card">
              <h3>Your Rating</h3>
              <div className="rating-info">
                <div className="rating-value">{playerRating.rating}</div>
                <div className="rating-details">
                  <span>Games Played: {playerRating.gamesPlayed}</span>
                  <span>Last Updated: {new Date(playerRating.lastUpdated).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="system-status">
            <h3>System Status</h3>
            <div className="status-items">
              <div className="status-item">
                <div className="status-indicator active" />
                <span>Nautilus Core</span>
              </div>
              {plugins.map((plugin) => (
                <div key={plugin.id} className="status-item">
                  <div className={`status-indicator ${plugin.enabled ? 'active' : 'inactive'}`} />
                  <span>{plugin.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Plugins Tab */}
      {selectedTab === 'plugins' && (
        <div className="plugins-section">
          <div className="installed-plugins">
            <h3>Installed Plugins</h3>
            {plugins.length > 0 ? (
              <div className="plugin-list">
                {plugins.map((plugin) => (
                  <div key={plugin.id} className="plugin-card installed">
                    <div className="plugin-header">
                      <div className="plugin-icon">
                        {getPluginIcon(plugin.type)}
                      </div>
                      <div className="plugin-info">
                        <h4>{plugin.name}</h4>
                        <span className="plugin-version">v{plugin.version}</span>
                      </div>
                      <button
                        className={`toggle-button ${plugin.enabled ? 'enabled' : 'disabled'}`}
                        onClick={() => handleTogglePlugin(plugin.id)}
                      >
                        <Power size={16} />
                        {plugin.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-plugins">
                <Info size={48} />
                <h4>No plugins installed</h4>
                <p>Install plugins below to extend your chess game functionality</p>
              </div>
            )}
          </div>

          <div className="available-plugins">
            <h3>Available Plugins</h3>
            <div className="plugin-grid">
              {availablePlugins.map((plugin) => (
                <div key={plugin.type} className="plugin-card available">
                  <div className="plugin-header">
                    <div className="plugin-icon">
                      {getPluginIcon(plugin.type)}
                    </div>
                    <div className="plugin-info">
                      <h4>{plugin.name}</h4>
                      <p>{plugin.description}</p>
                    </div>
                  </div>
                  
                  <div className="plugin-features">
                    <h5>Features:</h5>
                    <ul>
                      {plugin.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="plugin-actions">
                    {plugin.installed ? (
                      <div className="installed-badge">
                        ✅ Installed
                      </div>
                    ) : (
                      <button
                        className="install-button"
                        onClick={() => handleInstallPlugin(plugin.type as any)}
                        disabled={installingPlugin === plugin.type || loading}
                      >
                        {installingPlugin === plugin.type ? 'Installing...' : 'Install Plugin'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {selectedTab === 'analytics' && (
        <div className="analytics-section">
          <div className="analytics-grid">
            <div className="analytics-card">
              <h3>📊 Game Distribution</h3>
              <div className="chart-placeholder">
                <div className="chart-bar" style={{ height: '60%' }}>
                  <span>PvP: 45%</span>
                </div>
                <div className="chart-bar" style={{ height: '35%' }}>
                  <span>PvAI: 35%</span>
                </div>
                <div className="chart-bar" style={{ height: '20%' }}>
                  <span>AIvAI: 20%</span>
                </div>
              </div>
            </div>

            <div className="analytics-card">
              <h3>⏱️ Average Game Duration</h3>
              <div className="duration-stats">
                <div className="duration-item">
                  <span>Blitz:</span>
                  <span>8m 32s</span>
                </div>
                <div className="duration-item">
                  <span>Rapid:</span>
                  <span>24m 18s</span>
                </div>
                <div className="duration-item">
                  <span>Classical:</span>
                  <span>1h 42m</span>
                </div>
              </div>
            </div>

            <div className="analytics-card">
              <h3>🏆 Top Players</h3>
              <div className="top-players">
                <div className="player-item">
                  <span>1. ChessMaster2024</span>
                  <span>2340 ELO</span>
                </div>
                <div className="player-item">
                  <span>2. QuantumGrandmaster</span>
                  <span>2187 ELO</span>
                </div>
                <div className="player-item">
                  <span>3. SuiKnight</span>
                  <span>1998 ELO</span>
                </div>
              </div>
            </div>

            <div className="analytics-card">
              <h3>💎 Plugin Performance</h3>
              <div className="plugin-performance">
                {plugins.map((plugin) => (
                  <div key={plugin.id} className="performance-item">
                    <div className="performance-header">
                      {getPluginIcon(plugin.type)}
                      <span>{plugin.name}</span>
                    </div>
                    <div className="performance-meter">
                      <div 
                        className="performance-bar"
                        style={{ width: `${Math.random() * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 