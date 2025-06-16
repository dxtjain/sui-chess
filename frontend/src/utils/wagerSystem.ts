import { Transaction } from '@mysten/sui/transactions';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';

export const useWagerSystem = () => {
  const client = useSuiClient();
  const account = useCurrentAccount();

  const createWageredGame = async (wagerAmount: string, gameMode: number) => {
    if (!account) throw new Error('No wallet connected');

    const tx = new Transaction();
    
    // Split coins for wager
    const wagerCoin = tx.splitCoins(tx.gas, [
      tx.pure.u64(parseFloat(wagerAmount) * 1000000000) // Convert to MIST
    ]);

    // Create game with wager
    tx.moveCall({
      target: '${PACKAGE_ID}::chess_game::create_game',
      arguments: [
        wagerCoin,
        tx.pure.u8(gameMode),
      ],
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
  };

  const joinWageredGame = async (gameId: string, wagerAmount: string) => {
    if (!account) throw new Error('No wallet connected');

    const tx = new Transaction();
    
    const wagerCoin = tx.splitCoins(tx.gas, [
      tx.pure.u64(parseFloat(wagerAmount) * 1000000000)
    ]);

    tx.moveCall({
      target: '${PACKAGE_ID}::chess_game::join_game',
      arguments: [
        tx.object(gameId),
        wagerCoin,
      ],
    });

    return await client.signAndExecuteTransaction({
      signer: account,
      transaction: tx,
    });
  };

  const claimWinnings = async (gameId: string) => {
    if (!account) throw new Error('No wallet connected');

    const tx = new Transaction();

    tx.moveCall({
      target: '${PACKAGE_ID}::chess_game::claim_winnings',
      arguments: [tx.object(gameId)],
    });

    return await client.signAndExecuteTransaction({
      signer: account,
      transaction: tx,
    });
  };

  return {
    createWageredGame,
    joinWageredGame,
    claimWinnings,
  };
}; 