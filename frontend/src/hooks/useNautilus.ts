import { useState, useEffect } from 'react';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

interface NautilusPlugin {
  id: string;
  type: 'rating' | 'anticheat' | 'matchmaking' | 'analytics' | 'rewards';
  name: string;
  version: string;
  enabled: boolean;
  config: any;
}

interface PlayerRating {
  player: string;
  rating: number;
  gamesPlayed: number;
  lastUpdated: number;
}

interface MatchRequest {
  player: string;
  rating: number;
  gameMode: string;
  wagerAmount: number;
  timestamp: number;
}

interface GameStats {
  totalGames: number;
  activeGames: number;
  totalVolume: number;
}

export const useNautilus = () => {
  const client = useSuiClient();
  const account = useCurrentAccount();
  
  const [plugins, setPlugins] = useState<NautilusPlugin[]>([]);
  const [gameStats, setGameStats] = useState<GameStats>({
    totalGames: 0,
    activeGames: 0,
    totalVolume: 0
  });
  const [playerRating, setPlayerRating] = useState<PlayerRating | null>(null);
  const [matchmakingQueue, setMatchmakingQueue] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize Nautilus system
  const initializeNautilus = async () => {
    if (!account) throw new Error('No wallet connected');

    setLoading(true);
    try {
      const tx = new Transaction();
      
      // Initialize core system
      tx.moveCall({
        target: '${PACKAGE_ID}::nautilus_core::init',
        arguments: [],
      });

      const result = await client.signAndExecuteTransaction({
        signer: account,
        transaction: tx,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      return result;
    } catch (error) {
      console.error('Error initializing Nautilus:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Install a plugin
  const installPlugin = async (
    pluginType: 'rating' | 'anticheat' | 'matchmaking' | 'analytics' | 'rewards',
    config: any = {}
  ) => {
    if (!account) throw new Error('No wallet connected');

    setLoading(true);
    try {
      const tx = new Transaction();
      
      // Install plugin based on type
      switch (pluginType) {
        case 'rating':
          tx.moveCall({
            target: '${PACKAGE_ID}::nautilus_plugins::init_rating_plugin',
            arguments: [],
          });
          break;
        case 'anticheat':
          tx.moveCall({
            target: '${PACKAGE_ID}::nautilus_plugins::init_anticheat_plugin',
            arguments: [],
          });
          break;
        case 'matchmaking':
          tx.moveCall({
            target: '${PACKAGE_ID}::nautilus_plugins::init_matchmaking_plugin',
            arguments: [],
          });
          break;
        default:
          throw new Error(`Unsupported plugin type: ${pluginType}`);
      }

      const result = await client.signAndExecuteTransaction({
        signer: account,
        transaction: tx,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      // Update local plugin state
      const newPlugin: NautilusPlugin = {
        id: `${pluginType}_${Date.now()}`,
        type: pluginType,
        name: pluginType.charAt(0).toUpperCase() + pluginType.slice(1),
        version: '1.0.0',
        enabled: true,
        config,
      };

      setPlugins(prev => [...prev, newPlugin]);
      return result;
    } catch (error) {
      console.error(`Error installing ${pluginType} plugin:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register a game in the system
  const registerGame = async (
    gameId: string,
    gameType: string,
    wagerAmount: number
  ) => {
    if (!account) throw new Error('No wallet connected');

    try {
      const tx = new Transaction();
      
      tx.moveCall({
        target: '${PACKAGE_ID}::nautilus_core::register_game',
        arguments: [
          tx.object('${REGISTRY_ID}'),
          tx.pure.address(gameId),
          tx.pure.string(gameType),
          tx.pure.u64(wagerAmount * 1000000000), // Convert to MIST
        ],
      });

      const result = await client.signAndExecuteTransaction({
        signer: account,
        transaction: tx,
      });

      // Update local stats
      setGameStats(prev => ({
        totalGames: prev.totalGames + 1,
        activeGames: prev.activeGames + 1,
        totalVolume: prev.totalVolume + wagerAmount,
      }));

      return result;
    } catch (error) {
      console.error('Error registering game:', error);
      throw error;
    }
  };

  // Complete a game
  const completeGame = async (
    gameId: string,
    winner: string,
    gameType: string,
    duration: number,
    moves: number
  ) => {
    if (!account) throw new Error('No wallet connected');

    try {
      const tx = new Transaction();
      
      tx.moveCall({
        target: '${PACKAGE_ID}::nautilus_core::complete_game',
        arguments: [
          tx.object('${REGISTRY_ID}'),
          tx.pure.address(gameId),
          tx.pure.address(winner),
          tx.pure.string(gameType),
          tx.pure.u64(duration),
          tx.pure.u32(moves),
        ],
      });

      const result = await client.signAndExecuteTransaction({
        signer: account,
        transaction: tx,
      });

      // Update local stats
      setGameStats(prev => ({
        ...prev,
        activeGames: prev.activeGames - 1,
      }));

      return result;
    } catch (error) {
      console.error('Error completing game:', error);
      throw error;
    }
  };

  // Update player rating
  const updateRating = async (
    player1: string,
    player2: string,
    result: 0 | 1 | 2, // 0 = player1 wins, 1 = player2 wins, 2 = draw
    gameId: string
  ) => {
    if (!account) throw new Error('No wallet connected');

    try {
      const tx = new Transaction();
      
      tx.moveCall({
        target: '${PACKAGE_ID}::nautilus_plugins::update_rating',
        arguments: [
          tx.object('${RATING_PLUGIN_ID}'),
          tx.pure.address(player1),
          tx.pure.address(player2),
          tx.pure.u8(result),
          tx.pure.address(gameId),
        ],
      });

      const result_tx = await client.signAndExecuteTransaction({
        signer: account,
        transaction: tx,
      });

      return result_tx;
    } catch (error) {
      console.error('Error updating rating:', error);
      throw error;
    }
  };

  // Join matchmaking queue
  const joinMatchmakingQueue = async (
    gameMode: string,
    wagerAmount: number
  ) => {
    if (!account) throw new Error('No wallet connected');

    try {
      const tx = new Transaction();
      
      tx.moveCall({
        target: '${PACKAGE_ID}::nautilus_plugins::join_queue',
        arguments: [
          tx.object('${MATCHMAKING_PLUGIN_ID}'),
          tx.object('${RATING_PLUGIN_ID}'),
          tx.pure.string(gameMode),
          tx.pure.u64(wagerAmount * 1000000000),
        ],
      });

      const result = await client.signAndExecuteTransaction({
        signer: account,
        transaction: tx,
      });

      return result;
    } catch (error) {
      console.error('Error joining matchmaking queue:', error);
      throw error;
    }
  };

  // Report suspicious activity
  const reportSuspiciousActivity = async (
    player: string,
    activityType: string,
    gameId: string
  ) => {
    if (!account) throw new Error('No wallet connected');

    try {
      const tx = new Transaction();
      
      tx.moveCall({
        target: '${PACKAGE_ID}::nautilus_plugins::report_suspicious_activity',
        arguments: [
          tx.object('${ANTICHEAT_PLUGIN_ID}'),
          tx.pure.address(player),
          tx.pure.string(activityType),
          tx.pure.address(gameId),
        ],
      });

      const result = await client.signAndExecuteTransaction({
        signer: account,
        transaction: tx,
      });

      return result;
    } catch (error) {
      console.error('Error reporting suspicious activity:', error);
      throw error;
    }
  };

  // Fetch player rating
  const fetchPlayerRating = async (playerAddress?: string) => {
    const address = playerAddress || account?.address;
    if (!address) return null;

    try {
      // In a real implementation, this would query the blockchain
      // For now, return mock data
      const mockRating: PlayerRating = {
        player: address,
        rating: 1500 + Math.floor(Math.random() * 1000),
        gamesPlayed: Math.floor(Math.random() * 100),
        lastUpdated: Date.now(),
      };

      setPlayerRating(mockRating);
      return mockRating;
    } catch (error) {
      console.error('Error fetching player rating:', error);
      return null;
    }
  };

  // Fetch game statistics
  const fetchGameStats = async () => {
    try {
      // In a real implementation, this would query the blockchain
      const mockStats: GameStats = {
        totalGames: 1234,
        activeGames: 56,
        totalVolume: 789.5,
      };

      setGameStats(mockStats);
      return mockStats;
    } catch (error) {
      console.error('Error fetching game stats:', error);
      return null;
    }
  };

  // Get installed plugins
  const getInstalledPlugins = () => {
    return plugins;
  };

  // Enable/disable plugin
  const togglePlugin = (pluginId: string) => {
    setPlugins(prev => prev.map(plugin => 
      plugin.id === pluginId 
        ? { ...plugin, enabled: !plugin.enabled }
        : plugin
    ));
  };

  // Initialize on component mount
  useEffect(() => {
    if (account) {
      fetchPlayerRating();
      fetchGameStats();
    }
  }, [account]);

  return {
    // State
    plugins,
    gameStats,
    playerRating,
    matchmakingQueue,
    loading,

    // Core functions
    initializeNautilus,
    installPlugin,
    registerGame,
    completeGame,

    // Plugin functions
    updateRating,
    joinMatchmakingQueue,
    reportSuspiciousActivity,

    // Query functions
    fetchPlayerRating,
    fetchGameStats,
    getInstalledPlugins,
    togglePlugin,
  };
}; 