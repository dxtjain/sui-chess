import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { MinimaxAI } from '../utils/aiEngine';
import { useRandomness } from '../hooks/useRandomness';
import { getPieceSymbol, initializeChessBoard, isWhitePiece } from '../utils/chessUtils';

interface GameSettings {
  mode: 'PvP' | 'PvAI' | 'AIvAI';
  wagerAmount: number;
  aiDifficulty: 'easy' | 'medium' | 'hard';
  timeControl: 'blitz' | 'rapid' | 'classical';
}

interface ChessBoardProps {
  gameSettings: GameSettings;
  onGameEnd: (winner: string | null, gameStats: any) => void;
}

interface GameState {
  board: number[][];
  currentPlayer: 'white' | 'black';
  selectedSquare: { row: number; col: number } | null;
  gameStatus: 'active' | 'checkmate' | 'stalemate' | 'draw';
  moveHistory: string[];
  capturedPieces: {
    white: number[];
    black: number[];
  };
  moveCount: number;
  startTime: number;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({ gameSettings, onGameEnd }) => {
  const [gameState, setGameState] = useState<GameState>(() => ({
    board: initializeChessBoard(),
    currentPlayer: 'white',
    selectedSquare: null,
    gameStatus: 'active',
    moveHistory: [],
    capturedPieces: { white: [], black: [] },
    moveCount: 0,
    startTime: Date.now(),
  }));

  const { getWeightedRandomness } = useRandomness();
  const ai = new MinimaxAI();

  // AI move processing
  const makeAIMove = useCallback(async () => {
    if (gameState.gameStatus !== 'active') return;

    try {
      // Get randomness based on difficulty
      const randomness = getWeightedRandomness(gameSettings.aiDifficulty);
      const depth = gameSettings.aiDifficulty === 'easy' ? 2 : 
                   gameSettings.aiDifficulty === 'medium' ? 3 : 4;

      // Calculate AI move
      const [fromRow, fromCol, toRow, toCol] = ai.calculateMove(
        gameState.board, 
        depth, 
        randomness
      );

      // Validate and make the move
      if (isValidMove(fromRow, fromCol, toRow, toCol)) {
        setTimeout(() => {
          makeMove(fromRow, fromCol, toRow, toCol);
        }, 500); // Slight delay for better UX
      } else {
        console.error('AI attempted invalid move:', [fromRow, fromCol, toRow, toCol]);
        toast.error('AI made an invalid move');
      }
    } catch (error) {
      console.error('Error making AI move:', error);
      toast.error('AI failed to make a move');
    }
  }, [gameState, gameSettings, getWeightedRandomness, ai]);

  // Handle AI moves
  useEffect(() => {
    const shouldMakeAIMove = 
      gameSettings.mode === 'AIvAI' ||
      (gameSettings.mode === 'PvAI' && gameState.currentPlayer === 'black');

    if (shouldMakeAIMove && gameState.gameStatus === 'active') {
      makeAIMove();
    }
  }, [gameState.currentPlayer, gameState.gameStatus, gameSettings.mode, makeAIMove]);

  const handleSquareClick = (row: number, col: number) => {
    if (gameState.gameStatus !== 'active') return;
    
    // Prevent human moves during AI turn in PvAI mode
    if (gameSettings.mode === 'PvAI' && gameState.currentPlayer === 'black') return;
    
    // Prevent all moves in AIvAI mode
    if (gameSettings.mode === 'AIvAI') return;

    if (gameState.selectedSquare) {
      const { row: fromRow, col: fromCol } = gameState.selectedSquare;
      
      if (fromRow === row && fromCol === col) {
        // Deselect if clicking the same square
        setGameState(prev => ({ ...prev, selectedSquare: null }));
        return;
      }

      if (isValidMove(fromRow, fromCol, row, col)) {
        makeMove(fromRow, fromCol, row, col);
      } else {
        // Select new piece if clicking on own piece
        const piece = gameState.board[row][col];
        const isWhiteP = isWhitePiece(piece);
        const isCurrentPlayerPiece = 
          (gameState.currentPlayer === 'white' && isWhiteP) ||
          (gameState.currentPlayer === 'black' && !isWhiteP);

        if (piece !== 0 && isCurrentPlayerPiece) {
          setGameState(prev => ({ ...prev, selectedSquare: { row, col } }));
        } else {
          setGameState(prev => ({ ...prev, selectedSquare: null }));
          toast.error('Invalid move');
        }
      }
    } else {
      // Select a piece
      const piece = gameState.board[row][col];
      if (piece !== 0) {
        const isWhiteP = isWhitePiece(piece);
        const isCurrentPlayerPiece = 
          (gameState.currentPlayer === 'white' && isWhiteP) ||
          (gameState.currentPlayer === 'black' && !isWhiteP);

        if (isCurrentPlayerPiece) {
          setGameState(prev => ({ ...prev, selectedSquare: { row, col } }));
        } else {
          toast.error(`It's ${gameState.currentPlayer}'s turn`);
        }
      }
    }
  };

  const makeMove = (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    setGameState((prev: GameState): GameState => {
      const newBoard = prev.board.map(row => [...row]);
      const piece = newBoard[fromRow][fromCol];
      const capturedPiece = newBoard[toRow][toCol];
      
      // Execute the move
      newBoard[toRow][toCol] = piece;
      newBoard[fromRow][fromCol] = 0;

      // Handle captured pieces
      const newCapturedPieces = { ...prev.capturedPieces };
      if (capturedPiece !== 0) {
        if (capturedPiece > 0) {
          newCapturedPieces.black.push(capturedPiece);
        } else {
          newCapturedPieces.white.push(Math.abs(capturedPiece));
        }
      }

      // Generate move notation
      const moveNotation = generateMoveNotation(fromRow, fromCol, toRow, toCol, capturedPiece);
      const newMoveHistory = [...prev.moveHistory, moveNotation];

      // Check for game end
      const nextPlayer: 'white' | 'black' = prev.currentPlayer === 'white' ? 'black' : 'white';
      const gameStatus = checkGameStatus(newBoard, nextPlayer);

      const newState: GameState = {
        ...prev,
        board: newBoard,
        currentPlayer: nextPlayer,
        selectedSquare: null,
        gameStatus,
        moveHistory: newMoveHistory,
        capturedPieces: newCapturedPieces,
        moveCount: prev.moveCount + 1,
      };

      // Handle game end
      if (gameStatus !== 'active') {
        setTimeout(() => {
          const winner = gameStatus === 'checkmate' ? prev.currentPlayer : null;
          const gameStats = {
            moves: newState.moveCount,
            duration: Date.now() - newState.startTime,
            capturedPieces: newCapturedPieces,
            finalPosition: newBoard,
          };
          onGameEnd(winner, gameStats);
          
          if (winner) {
            toast.success(`${winner} wins by ${gameStatus}!`);
          } else {
            toast.success(`Game ends in ${gameStatus}`);
          }
        }, 1000);
      }

      return newState;
    });
  };

  const isValidMove = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    // Basic bounds checking
    if (fromRow < 0 || fromRow > 7 || fromCol < 0 || fromCol > 7 ||
        toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) {
      return false;
    }

    const piece = gameState.board[fromRow][fromCol];
    const targetPiece = gameState.board[toRow][toCol];

    // Can't move empty square
    if (piece === 0) return false;

    // Can't capture own pieces
    if (targetPiece !== 0 && (piece > 0) === (targetPiece > 0)) return false;

    // Check if current player is trying to move their own piece
    const isWhiteP = isWhitePiece(piece);
    const isCurrentPlayerPiece = 
      (gameState.currentPlayer === 'white' && isWhiteP) ||
      (gameState.currentPlayer === 'black' && !isWhiteP);

    if (!isCurrentPlayerPiece) return false;

    // Use AI engine for move validation
    const legalMoves = ai.getLegalMoves(gameState.board, fromRow, fromCol);
    return legalMoves.some(([fR, fC, tR, tC]) => 
      fR === fromRow && fC === fromCol && tR === toRow && tC === toCol
    );
  };

  const checkGameStatus = (board: number[][], player: 'white' | 'black'): GameState['gameStatus'] => {
    // Check if kings are still on the board
    let whiteKing = false;
    let blackKing = false;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === 6) whiteKing = true;
        if (board[row][col] === -6) blackKing = true;
      }
    }
    
    // Simple game over condition - if a king is captured
    if (!whiteKing) return 'checkmate';
    if (!blackKing) return 'checkmate';

    // Count available moves for current player
    const allMoves = ai.getAllMoves ? ai.getAllMoves(board, player === 'white') : [];
    
    // If no moves available, it's either checkmate or stalemate
    if (allMoves.length === 0) {
      return 'stalemate'; // Simplified - should check if in check
    }
    
    return 'active';
  };

  const generateMoveNotation = (
    fromRow: number, 
    fromCol: number, 
    toRow: number, 
    toCol: number, 
    capturedPiece: number
  ): string => {
    const files = 'abcdefgh';
    const ranks = '87654321';
    
    const fromSquare = files[fromCol] + ranks[fromRow];
    const toSquare = files[toCol] + ranks[toRow];
    const capture = capturedPiece !== 0 ? 'x' : '';
    
    return `${fromSquare}${capture}${toSquare}`;
  };

  const renderSquare = (row: number, col: number) => {
    const piece = gameState.board[row][col];
    const isSelected = gameState.selectedSquare && 
      gameState.selectedSquare.row === row && 
      gameState.selectedSquare.col === col;
    const isDark = (row + col) % 2 === 1;
    
    // Show possible moves for selected piece
    let showPossibleMove = false;
    if (gameState.selectedSquare) {
      try {
        const possibleMoves = ai.getLegalMoves(gameState.board, gameState.selectedSquare.row, gameState.selectedSquare.col);
        showPossibleMove = possibleMoves.some(([,, tR, tC]) => tR === row && tC === col);
      } catch (error) {
        console.error('Error getting legal moves:', error);
      }
    }

    return (
      <div
        key={`${row}-${col}`}
        className={`chess-square ${isDark ? 'dark' : 'light'} ${isSelected ? 'selected' : ''} ${showPossibleMove ? 'possible-move' : ''}`}
        onClick={() => handleSquareClick(row, col)}
        data-square={`${String.fromCharCode(97 + col)}${8 - row}`}
      >
        {piece !== 0 && (
          <span className="chess-piece" data-piece={piece}>
            {getPieceSymbol(piece)}
          </span>
        )}
        {showPossibleMove && <div className="move-indicator" />}
      </div>
    );
  };

  const getCurrentPlayerIndicator = () => {
    if (gameSettings.mode === 'AIvAI') {
      return 'AI vs AI Battle';
    }
    if (gameSettings.mode === 'PvAI') {
      return gameState.currentPlayer === 'white' ? 'Your Turn' : 'AI Thinking...';
    }
    return `${gameState.currentPlayer === 'white' ? 'White' : 'Black'} to move`;
  };

  return (
    <div className="chess-game">
      <div className="game-sidebar">
        <div className="game-status">
          <h3>Game Status</h3>
          <div className="status-info">
            <div className="current-player">
              <strong>{getCurrentPlayerIndicator()}</strong>
            </div>
            <div className="move-counter">
              Move: {Math.floor(gameState.moveCount / 2) + 1}
            </div>
            <div className="game-timer">
              {Math.floor((Date.now() - gameState.startTime) / 1000)}s
            </div>
          </div>
        </div>

        <div className="captured-pieces">
          <div className="captured-section">
            <h4>Captured by White</h4>
            <div className="captured-list">
              {gameState.capturedPieces.white.map((piece, index) => (
                <span key={index} className="captured-piece">
                  {getPieceSymbol(-piece)}
                </span>
              ))}
            </div>
          </div>
          <div className="captured-section">
            <h4>Captured by Black</h4>
            <div className="captured-list">
              {gameState.capturedPieces.black.map((piece, index) => (
                <span key={index} className="captured-piece">
                  {getPieceSymbol(piece)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="move-history">
          <h4>Move History</h4>
          <div className="history-list">
            {gameState.moveHistory.map((move, index) => (
              <div key={index} className="history-move">
                {Math.floor(index / 2) + 1}.{index % 2 === 0 ? '' : '..'} {move}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="chess-board-container">
        <div className="board-coordinates top">
          {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(file => (
            <span key={file} className="coordinate">{file}</span>
          ))}
        </div>
        
        <div className="board-with-coords">
          <div className="board-coordinates left">
            {[8, 7, 6, 5, 4, 3, 2, 1].map(rank => (
              <span key={rank} className="coordinate">{rank}</span>
            ))}
          </div>
          
          <div className="chess-board">
            {gameState.board.map((row, rowIndex) =>
              row.map((_, colIndex) => renderSquare(rowIndex, colIndex))
            )}
          </div>
          
          <div className="board-coordinates right">
            {[8, 7, 6, 5, 4, 3, 2, 1].map(rank => (
              <span key={rank} className="coordinate">{rank}</span>
            ))}
          </div>
        </div>
        
        <div className="board-coordinates bottom">
          {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(file => (
            <span key={file} className="coordinate">{file}</span>
          ))}
        </div>
      </div>
    </div>
  );
}; 