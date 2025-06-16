import { describe, it, expect, beforeEach } from 'vitest';
import { ChessLogic } from '../chessLogic';
import { 
  isWhitePiece, 
  isBlackPiece, 
  isEmpty, 
  getPieceType, 
  isValidSquare,
  squareToAlgebraic,
  algebraicToSquare 
} from '../chessUtils';

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

describe('Chess Utilities', () => {
  it('piece identification functions', () => {
    expect(isWhitePiece(1)).toBe(true);
    expect(isWhitePiece(-1)).toBe(false);
    expect(isBlackPiece(-1)).toBe(true);
    expect(isBlackPiece(1)).toBe(false);
    expect(isEmpty(0)).toBe(true);
    expect(isEmpty(1)).toBe(false);
  });

  it('piece type extraction', () => {
    expect(getPieceType(6)).toBe(6);
    expect(getPieceType(-6)).toBe(6);
    expect(getPieceType(1)).toBe(1);
    expect(getPieceType(-1)).toBe(1);
  });

  it('square validation', () => {
    expect(isValidSquare(0, 0)).toBe(true);
    expect(isValidSquare(7, 7)).toBe(true);
    expect(isValidSquare(-1, 0)).toBe(false);
    expect(isValidSquare(8, 0)).toBe(false);
    expect(isValidSquare(0, -1)).toBe(false);
    expect(isValidSquare(0, 8)).toBe(false);
  });

  it('algebraic notation conversion', () => {
    expect(squareToAlgebraic(7, 0)).toBe('a1');
    expect(squareToAlgebraic(0, 7)).toBe('h8');
    expect(squareToAlgebraic(6, 4)).toBe('e2');
    
    expect(algebraicToSquare('a1')).toEqual([7, 0]);
    expect(algebraicToSquare('h8')).toEqual([0, 7]);
    expect(algebraicToSquare('e2')).toEqual([6, 4]);
  });
}); 