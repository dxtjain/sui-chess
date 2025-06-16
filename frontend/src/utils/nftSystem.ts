import { Transaction } from '@mysten/sui/transactions';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';

export const useNFTSystem = () => {
  const client = useSuiClient();
  const account = useCurrentAccount();

  const mintTrophyNFT = async (
    achievementType: string,
    matchStats: {
      movesCount: number;
      gameDuration: number;
      opponentRating: number;
      winningStrategy: string;
    }
  ) => {
    if (!account) throw new Error('No wallet connected');

    const tx = new Transaction();

    tx.moveCall({
      target: '${PACKAGE_ID}::trophy::mint_trophy',
      arguments: [
        tx.pure.address(account.address),
        tx.pure.string(achievementType),
        tx.pure.vector('u32', [
          matchStats.movesCount,
          matchStats.gameDuration,
          matchStats.opponentRating,
        ]),
        tx.pure.string(matchStats.winningStrategy),
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

  const getUserTrophies = async (userAddress: string) => {
    try {
      const ownedObjects = await client.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: '${PACKAGE_ID}::trophy::ChessTrophy'
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      return ownedObjects.data;
    } catch (error) {
      console.error('Error fetching user trophies:', error);
      return [];
    }
  };

  return {
    mintTrophyNFT,
    getUserTrophies,
  };
}; 