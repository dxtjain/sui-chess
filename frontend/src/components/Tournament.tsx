import React, { useState, useEffect } from 'react';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

interface Tournament {
  id: string;
  name: string;
  entryFee: string;
  participants: string[];
  maxParticipants: number;
  status: 'registration' | 'active' | 'completed';
  prizePool: string;
  startTime: number;
  endTime: number;
}

export const Tournament: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  
  const client = useSuiClient();
  const account = useCurrentAccount();

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      // Fetch tournament data from Sui
      const mockTournaments: Tournament[] = [
        {
          id: '0x123',
          name: 'Weekly Chess Championship',
          entryFee: '1.0',
          participants: ['0x1', '0x2', '0x3'],
          maxParticipants: 16,
          status: 'registration',
          prizePool: '12.5',
          startTime: Date.now() + 3600000,
          endTime: Date.now() + 7200000,
        },
        // Add more tournaments...
      ];
      
      setTournaments(mockTournaments);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinTournament = async (tournament: Tournament) => {
    if (!account) {
      alert('Please connect your wallet');
      return;
    }

    try {
      const tx = new Transaction();
      
      const entryFee = tx.splitCoins(tx.gas, [
        tx.pure.u64(parseFloat(tournament.entryFee) * 1000000000)
      ]);

      tx.moveCall({
        target: '${PACKAGE_ID}::tournament::join_tournament',
        arguments: [
          tx.object(tournament.id),
          entryFee,
        ],
      });

      await client.signAndExecuteTransaction({
        signer: account,
        transaction: tx,
      });

      alert('Successfully joined tournament!');
      fetchTournaments(); // Refresh data
    } catch (error) {
      console.error('Error joining tournament:', error);
      alert('Failed to join tournament');
    }
  };

  const createTournament = async (
    name: string,
    entryFee: string,
    maxParticipants: number,
    durationHours: number
  ) => {
    if (!account) return;

    try {
      const tx = new Transaction();

      tx.moveCall({
        target: '${PACKAGE_ID}::tournament::create_tournament',
        arguments: [
          tx.pure.string(name),
          tx.pure.u64(parseFloat(entryFee) * 1000000000),
          tx.pure.u32(maxParticipants),
          tx.pure.u64(durationHours),
        ],
      });

      await client.signAndExecuteTransaction({
        signer: account,
        transaction: tx,
      });

      alert('Tournament created successfully!');
      fetchTournaments();
    } catch (error) {
      console.error('Error creating tournament:', error);
    }
  };

  if (loading) {
    return <div>Loading tournaments...</div>;
  }

  return (
    <div className="tournament-system">
      <h2>🏆 Chess Tournaments</h2>
      
      <div className="tournament-grid">
        {tournaments.map((tournament) => (
          <div key={tournament.id} className="tournament-card">
            <h3>{tournament.name}</h3>
            <div className="tournament-info">
              <p>Entry Fee: {tournament.entryFee} SUI</p>
              <p>Prize Pool: {tournament.prizePool} SUI</p>
              <p>Participants: {tournament.participants.length}/{tournament.maxParticipants}</p>
              <p>Status: {tournament.status}</p>
            </div>
            
            {tournament.status === 'registration' && (
              <button
                onClick={() => joinTournament(tournament)}
                disabled={tournament.participants.length >= tournament.maxParticipants}
              >
                Join Tournament
              </button>
            )}
            
            {tournament.status === 'active' && (
              <button onClick={() => setSelectedTournament(tournament)}>
                View Bracket
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="create-tournament">
        <h3>Create New Tournament</h3>
        <CreateTournamentForm onSubmit={createTournament} />
      </div>
    </div>
  );
};

interface CreateTournamentFormProps {
  onSubmit: (name: string, entryFee: string, maxParticipants: number, duration: number) => void;
}

const CreateTournamentForm: React.FC<CreateTournamentFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [entryFee, setEntryFee] = useState('1.0');
  const [maxParticipants, setMaxParticipants] = useState(16);
  const [duration, setDuration] = useState(24);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(name, entryFee, maxParticipants, duration);
    
    // Reset form
    setName('');
    setEntryFee('1.0');
    setMaxParticipants(16);
    setDuration(24);
  };

  return (
    <form onSubmit={handleSubmit} className="create-tournament-form">
      <input
        type="text"
        placeholder="Tournament Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Entry Fee (SUI)"
        value={entryFee}
        onChange={(e) => setEntryFee(e.target.value)}
        step="0.1"
        min="0.1"
        required
      />
      <input
        type="number"
        placeholder="Max Participants"
        value={maxParticipants}
        onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
        min="2"
        max="64"
        required
      />
      <input
        type="number"
        placeholder="Duration (hours)"
        value={duration}
        onChange={(e) => setDuration(parseInt(e.target.value))}
        min="1"
        max="168"
        required
      />
      <button type="submit">Create Tournament</button>
    </form>
  );
}; 