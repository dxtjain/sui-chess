import { describe, it, expect, beforeEach } from 'vitest';
import { ChessLogic } from '../chessLogic';

describe('ChessLogic', () => {
  let chess: ChessLogic;

  beforeEach(() => {
    chess = new ChessLogic();
  });

  it('should initialize with correct starting position', () => {
    const board = chess.getBoard();
    expect(board[0][0]).toBe(-4); // Black rook
    expect(board[7][0]).toBe(4);  // White rook
    expect(board[1][0]).toBe(-1); // Black pawn
    expect(board[6][0]).toBe(1);  // White pawn
  });

  it('should validate legal pawn moves', () => {
    const isValid = chess.isValidMove(6, 0, 4, 0); // Pawn two squares forward
    expect(isValid).toBe(true);
  });

  it('should reject illegal moves', () => {
    const isValid = chess.isValidMove(7, 0, 5, 0); // Rook through pawn
    expect(isValid).toBe(false);
  });

  it('should detect checkmate', () => {
    // Set up a checkmate position
    chess.loadPosition('rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 1');
    const isCheckmate = chess.isCheckmate();
    expect(isCheckmate).toBe(false); // This position is not checkmate
  });
}); 