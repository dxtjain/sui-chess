import React, { useState, useEffect } from 'react';
import { useSuiClient, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { toast } from 'react-hot-toast';

interface Tournament {
  id: string;
  name: string;
  status: 'upcoming' | 'active' | 'completed';
  entryFee: number;
  prizePool: number;
  participants: number;
  maxParticipants: number;
  startTime: number;
  endTime: number;
  format: 'single-elimination' | 'swiss' | 'round-robin';
}

export const Tournament: React.FC = () => {
  // const client = useSuiClient(); // Currently unused
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      
      // Mock tournament data for now
      // In production, this would fetch from Sui blockchain
      const mockTournaments: Tournament[] = [
        {
          id: '1',
          name: 'Weekly Blitz Championship',
          status: 'upcoming',
          entryFee: 5,
          prizePool: 100,
          participants: 8,
          maxParticipants: 16,
          startTime: Date.now() + 3600000, // 1 hour from now
          endTime: Date.now() + 7200000,   // 2 hours from now
          format: 'single-elimination'
        },
        {
          id: '2',
          name: 'Monthly Grand Prix',
          status: 'active',
          entryFee: 10,
          prizePool: 500,
          participants: 32,
          maxParticipants: 32,
          startTime: Date.now() - 1800000, // 30 minutes ago
          endTime: Date.now() + 5400000,   // 90 minutes from now
          format: 'swiss'
        },
        {
          id: '3',
          name: 'Season Finale',
          status: 'completed',
          entryFee: 25,
          prizePool: 1000,
          participants: 64,
          maxParticipants: 64,
          startTime: Date.now() - 86400000, // 1 day ago
          endTime: Date.now() - 82800000,   // 23 hours ago
          format: 'single-elimination'
        }
      ];

      setTournaments(mockTournaments);
    } catch (error) {
      console.error('Error loading tournaments:', error);
      toast.error('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const joinTournament = async (tournamentId: string) => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const tx = new Transaction();
      
      // Mock tournament joining transaction
      // In production, this would call the tournament smart contract
      tx.moveCall({
        target: '0x1::tournament::join_tournament',
        arguments: [
          tx.pure.string(tournamentId),
          tx.pure.u64(Date.now()),
        ],
      });

      signAndExecuteTransaction(
        {
          transaction: tx,
          options: {
            showEffects: true,
            showObjectChanges: true,
          },
        },
        {
          onSuccess: (result) => {
            console.log('Tournament joined successfully:', result);
            toast.success('Successfully joined tournament!');
            loadTournaments(); // Refresh tournament list
          },
          onError: (error) => {
            console.error('Error joining tournament:', error);
            toast.error('Failed to join tournament');
          },
        }
      );
    } catch (error) {
      console.error('Error preparing tournament transaction:', error);
      toast.error('Failed to prepare tournament transaction');
    }
  };

  const createTournament = async (tournamentData: Partial<Tournament>) => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const tx = new Transaction();
      
      // Mock tournament creation transaction
      tx.moveCall({
        target: '0x1::tournament::create_tournament',
        arguments: [
          tx.pure.string(tournamentData.name || 'New Tournament'),
          tx.pure.u64(tournamentData.entryFee || 0),
          tx.pure.u64(tournamentData.maxParticipants || 16),
          tx.pure.u64(Date.now()),
        ],
      });

      signAndExecuteTransaction(
        {
          transaction: tx,
          options: {
            showEffects: true,
            showObjectChanges: true,
          },
        },
        {
          onSuccess: (result) => {
            console.log('Tournament created successfully:', result);
            toast.success('Tournament created successfully!');
            loadTournaments(); // Refresh tournament list
          },
          onError: (error) => {
            console.error('Error creating tournament:', error);
            toast.error('Failed to create tournament');
          },
        }
      );
    } catch (error) {
      console.error('Error preparing tournament creation:', error);
      toast.error('Failed to prepare tournament creation');
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'upcoming': return '#f59e0b';
      case 'active': return '#10b981';
      case 'completed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="tournament-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tournament-container">
      <div className="tournament-header">
        <h2>🏁 Chess Tournaments</h2>
        <p>Compete in organized tournaments and win prizes!</p>
      </div>

      <div className="tournament-actions">
        <button 
          className="create-tournament-btn"
          onClick={() => {
            // Mock tournament creation
            createTournament({
              name: 'Custom Tournament',
              entryFee: 5,
              maxParticipants: 16,
              format: 'single-elimination'
            });
          }}
        >
          Create Tournament
        </button>
      </div>

      <div className="tournament-list">
        {tournaments.map((tournament) => (
          <div key={tournament.id} className="tournament-card">
            <div className="tournament-header-info">
              <h3>{tournament.name}</h3>
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(tournament.status) }}
              >
                {tournament.status.toUpperCase()}
              </span>
            </div>

            <div className="tournament-details">
              <div className="detail-item">
                <span className="label">Format:</span>
                <span className="value">{tournament.format}</span>
              </div>
              <div className="detail-item">
                <span className="label">Entry Fee:</span>
                <span className="value">{tournament.entryFee} SUI</span>
              </div>
              <div className="detail-item">
                <span className="label">Prize Pool:</span>
                <span className="value">{tournament.prizePool} SUI</span>
              </div>
              <div className="detail-item">
                <span className="label">Participants:</span>
                <span className="value">{tournament.participants}/{tournament.maxParticipants}</span>
              </div>
              <div className="detail-item">
                <span className="label">Start Time:</span>
                <span className="value">{formatTime(tournament.startTime)}</span>
              </div>
            </div>

            <div className="tournament-actions">
              {tournament.status === 'upcoming' && (
                <button 
                  className="join-btn"
                  onClick={() => joinTournament(tournament.id)}
                  disabled={tournament.participants >= tournament.maxParticipants}
                >
                  {tournament.participants >= tournament.maxParticipants ? 'Full' : 'Join Tournament'}
                </button>
              )}
              {tournament.status === 'active' && (
                <button className="spectate-btn">
                  Watch Live
                </button>
              )}
              {tournament.status === 'completed' && (
                <button className="results-btn">
                  View Results
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {tournaments.length === 0 && (
        <div className="no-tournaments">
          <p>No tournaments available at the moment.</p>
          <p>Check back later or create your own tournament!</p>
        </div>
      )}
    </div>
  );
}; 