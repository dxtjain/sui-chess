// Chess utility functions

export type PieceType = 1 | 2 | 3 | 4 | 5 | 6; // Pawn, Knight, Bishop, Rook, Queen, King
export type Square = number; // 0 = empty, positive = white, negative = black

export const PIECES = {
  PAWN: 1,
  KNIGHT: 2,
  BISHOP: 3,
  ROOK: 4,
  QUEEN: 5,
  KING: 6
} as const;

export const isWhitePiece = (piece: Square): boolean => piece > 0;
export const isBlackPiece = (piece: Square): boolean => piece < 0;
export const isEmpty = (piece: Square): boolean => piece === 0;
export const getPieceType = (piece: Square): PieceType => Math.abs(piece) as PieceType;
export const isOpponent = (piece1: Square, piece2: Square): boolean => 
  (piece1 > 0 && piece2 < 0) || (piece1 < 0 && piece2 > 0);

export const isValidSquare = (row: number, col: number): boolean => 
  row >= 0 && row < 8 && col >= 0 && col < 8;

export const squareToAlgebraic = (row: number, col: number): string => {
  const files = 'abcdefgh';
  const ranks = '87654321';
  return files[col] + ranks[row];
};

export const algebraicToSquare = (algebraic: string): [number, number] => {
  const files = 'abcdefgh';
  const ranks = '87654321';
  const col = files.indexOf(algebraic[0]);
  const row = ranks.indexOf(algebraic[1]);
  return [row, col];
};

export const getPieceSymbol = (piece: Square): string => {
  const symbols: { [key: number]: string } = {
    1: '♙', 2: '♘', 3: '♗', 4: '♖', 5: '♕', 6: '♔',
    [-1]: '♟', [-2]: '♞', [-3]: '♝', [-4]: '♜', [-5]: '♛', [-6]: '♚'
  };
  return symbols[piece] || '';
};

export const getPieceName = (piece: Square): string => {
  const names: { [key: number]: string } = {
    1: 'Pawn', 2: 'Knight', 3: 'Bishop', 4: 'Rook', 5: 'Queen', 6: 'King'
  };
  return names[Math.abs(piece)] || 'Empty';
};

export const initializeChessBoard = (): Square[][] => {
  return [
    [-4, -2, -3, -5, -6, -3, -2, -4], // Black back rank
    [-1, -1, -1, -1, -1, -1, -1, -1], // Black pawns
    [ 0,  0,  0,  0,  0,  0,  0,  0], // Empty
    [ 0,  0,  0,  0,  0,  0,  0,  0], // Empty
    [ 0,  0,  0,  0,  0,  0,  0,  0], // Empty
    [ 0,  0,  0,  0,  0,  0,  0,  0], // Empty
    [ 1,  1,  1,  1,  1,  1,  1,  1], // White pawns
    [ 4,  2,  3,  5,  6,  3,  2,  4], // White back rank
  ];
};

export const copyBoard = (board: Square[][]): Square[][] => {
  return board.map(row => [...row]);
};

export const findKing = (board: Square[][], isWhite: boolean): [number, number] | null => {
  const kingValue = isWhite ? PIECES.KING : -PIECES.KING;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (board[row][col] === kingValue) {
        return [row, col];
      }
    }
  }
  
  return null;
};

export const isSquareAttacked = (
  board: Square[][],
  targetRow: number,
  targetCol: number,
  byWhite: boolean
): boolean => {
  // Check if a square is attacked by pieces of the specified color
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      
      if (isEmpty(piece)) continue;
      if (isWhitePiece(piece) !== byWhite) continue;
      
      if (canPieceAttack(board, row, col, targetRow, targetCol)) {
        return true;
      }
    }
  }
  
  return false;
};

export const canPieceAttack = (
  board: Square[][],
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): boolean => {
  const piece = board[fromRow][fromCol];
  const pieceType = getPieceType(piece);
  const isWhite = isWhitePiece(piece);
  
  const rowDiff = toRow - fromRow;
  const colDiff = toCol - fromCol;
  const rowAbs = Math.abs(rowDiff);
  const colAbs = Math.abs(colDiff);
  
  switch (pieceType) {
    case PIECES.PAWN:
      const direction = isWhite ? -1 : 1;
      return rowDiff === direction && colAbs === 1;
      
    case PIECES.KNIGHT:
      return (rowAbs === 2 && colAbs === 1) || (rowAbs === 1 && colAbs === 2);
      
    case PIECES.BISHOP:
      return rowAbs === colAbs && isPathClear(board, fromRow, fromCol, toRow, toCol);
      
    case PIECES.ROOK:
      return (rowDiff === 0 || colDiff === 0) && isPathClear(board, fromRow, fromCol, toRow, toCol);
      
    case PIECES.QUEEN:
      return (rowAbs === colAbs || rowDiff === 0 || colDiff === 0) && 
             isPathClear(board, fromRow, fromCol, toRow, toCol);
      
    case PIECES.KING:
      return rowAbs <= 1 && colAbs <= 1;
      
    default:
      return false;
  }
};

export const isPathClear = (
  board: Square[][],
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): boolean => {
  const rowStep = Math.sign(toRow - fromRow);
  const colStep = Math.sign(toCol - fromCol);
  
  let currentRow = fromRow + rowStep;
  let currentCol = fromCol + colStep;
  
  while (currentRow !== toRow || currentCol !== toCol) {
    if (!isEmpty(board[currentRow][currentCol])) {
      return false;
    }
    currentRow += rowStep;
    currentCol += colStep;
  }
  
  return true;
};

export const isInCheck = (board: Square[][], isWhite: boolean): boolean => {
  const kingPos = findKing(board, isWhite);
  if (!kingPos) return false;
  
  return isSquareAttacked(board, kingPos[0], kingPos[1], !isWhite);
};

export const wouldBeInCheck = (
  board: Square[][],
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  isWhite: boolean
): boolean => {
  // Make the move temporarily
  const newBoard = copyBoard(board);
  const piece = newBoard[fromRow][fromCol];
  const capturedPiece = newBoard[toRow][toCol];
  
  newBoard[toRow][toCol] = piece;
  newBoard[fromRow][fromCol] = 0;
  
  const inCheck = isInCheck(newBoard, isWhite);
  
  return inCheck;
}; 