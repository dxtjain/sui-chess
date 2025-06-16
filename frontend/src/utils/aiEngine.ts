export interface ChessAI {
  calculateMove(board: number[][], depth: number, randomnessFactor: number): [number, number, number, number];
}

export interface ChessPosition {
  row: number;
  col: number;
}

export interface ChessMove {
  from: ChessPosition;
  to: ChessPosition;
  piece: number;
  capturedPiece?: number;
  isEnPassant?: boolean;
  isCastling?: boolean;
  promotionPiece?: number;
}

export class MinimaxAI implements ChessAI {
  private randomnessFactor: number = 0;

  // Piece values for evaluation
  private readonly pieceValues = {
    1: 100,   // Pawn
    2: 320,   // Knight
    3: 330,   // Bishop
    4: 500,   // Rook
    5: 900,   // Queen
    6: 20000  // King
  };

  // Position value tables for piece placement evaluation
  private readonly pawnTable = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ];

  private readonly knightTable = [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ];

  calculateMove(
    board: number[][],
    depth: number = 4,
    randomnessFactor: number = 0
  ): [number, number, number, number] {
    this.randomnessFactor = randomnessFactor;
    
    const bestMove = this.minimax(board, depth, false, -Infinity, Infinity, true);
    return bestMove.move || [0, 0, 0, 0];
  }

  private minimax(
    board: number[][],
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number,
    isRoot: boolean = false
  ): { score: number; move?: [number, number, number, number] } {
    if (depth === 0 || this.isGameOver(board)) {
      return { score: this.evaluateBoard(board) };
    }

    const moves = this.generateAllMoves(board, isMaximizing);
    let bestMove: [number, number, number, number] | undefined;

    if (isMaximizing) {
      let maxScore = -Infinity;
      
      for (const move of moves) {
        const newBoard = this.makeMove(board, move);
        const result = this.minimax(newBoard, depth - 1, false, alpha, beta);
        
        // Inject randomness at root level
        let adjustedScore = result.score;
        if (isRoot && this.randomnessFactor > 0) {
          const randomAdjustment = (Math.random() - 0.5) * this.randomnessFactor * 10;
          adjustedScore += randomAdjustment;
        }
        
        if (adjustedScore > maxScore) {
          maxScore = adjustedScore;
          bestMove = move;
        }
        
        alpha = Math.max(alpha, adjustedScore);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      
      return { score: maxScore, move: bestMove };
    } else {
      let minScore = Infinity;
      
      for (const move of moves) {
        const newBoard = this.makeMove(board, move);
        const result = this.minimax(newBoard, depth - 1, true, alpha, beta);
        
        if (result.score < minScore) {
          minScore = result.score;
          bestMove = move;
        }
        
        beta = Math.min(beta, result.score);
        if (beta <= alpha) break;
      }
      
      return { score: minScore, move: bestMove };
    }
  }

  private evaluateBoard(board: number[][]): number {
    let score = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece !== 0) {
          const pieceType = Math.abs(piece);
          const pieceValue = this.pieceValues[pieceType as keyof typeof this.pieceValues] || 0;
          const positionValue = this.getPositionValue(pieceType, row, col, piece > 0);
          
          const totalValue = pieceValue + positionValue;
          
          if (piece > 0) {
            score += totalValue;
          } else {
            score -= totalValue;
          }
        }
      }
    }

    // Add mobility bonus
    const whiteMoves = this.generateAllMoves(board, true).length;
    const blackMoves = this.generateAllMoves(board, false).length;
    score += (whiteMoves - blackMoves) * 10;

    return score;
  }

  private getPositionValue(pieceType: number, row: number, col: number, isWhite: boolean): number {
    let table: number[][];
    
    switch (pieceType) {
      case 1: // Pawn
        table = this.pawnTable;
        break;
      case 2: // Knight
        table = this.knightTable;
        break;
      default:
        return 0;
    }

    // Flip the table for black pieces
    const evalRow = isWhite ? 7 - row : row;
    return table[evalRow][col];
  }

  private generateAllMoves(board: number[][], isWhite: boolean): [number, number, number, number][] {
    const moves: [number, number, number, number][] = [];
    
    for (let fromRow = 0; fromRow < 8; fromRow++) {
      for (let fromCol = 0; fromCol < 8; fromCol++) {
        const piece = board[fromRow][fromCol];
        
        if ((isWhite && piece > 0) || (!isWhite && piece < 0)) {
          const pieceMoves = this.generatePieceMoves(board, fromRow, fromCol);
          moves.push(...pieceMoves);
        }
      }
    }
    
    return moves;
  }

  private generatePieceMoves(board: number[][], fromRow: number, fromCol: number): [number, number, number, number][] {
    const moves: [number, number, number, number][] = [];
    const piece = board[fromRow][fromCol];
    const pieceType = Math.abs(piece);
    const isWhite = piece > 0;

    switch (pieceType) {
      case 1: // Pawn
        moves.push(...this.generatePawnMoves(board, fromRow, fromCol, isWhite));
        break;
      case 2: // Knight
        moves.push(...this.generateKnightMoves(board, fromRow, fromCol, isWhite));
        break;
      case 3: // Bishop
        moves.push(...this.generateBishopMoves(board, fromRow, fromCol, isWhite));
        break;
      case 4: // Rook
        moves.push(...this.generateRookMoves(board, fromRow, fromCol, isWhite));
        break;
      case 5: // Queen
        moves.push(...this.generateQueenMoves(board, fromRow, fromCol, isWhite));
        break;
      case 6: // King
        moves.push(...this.generateKingMoves(board, fromRow, fromCol, isWhite));
        break;
    }
    
    return moves;
  }

  private generatePawnMoves(board: number[][], fromRow: number, fromCol: number, isWhite: boolean): [number, number, number, number][] {
    const moves: [number, number, number, number][] = [];
    const direction = isWhite ? -1 : 1;
    const startRow = isWhite ? 6 : 1;

    // Forward move
    const newRow = fromRow + direction;
    if (newRow >= 0 && newRow < 8 && board[newRow][fromCol] === 0) {
      moves.push([fromRow, fromCol, newRow, fromCol]);
      
      // Double move from starting position
      if (fromRow === startRow && board[newRow + direction] && board[newRow + direction][fromCol] === 0) {
        moves.push([fromRow, fromCol, newRow + direction, fromCol]);
      }
    }

    // Diagonal captures
    for (const colOffset of [-1, 1]) {
      const newCol = fromCol + colOffset;
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const targetPiece = board[newRow][newCol];
        if (targetPiece !== 0 && (targetPiece > 0) !== isWhite) {
          moves.push([fromRow, fromCol, newRow, newCol]);
        }
      }
    }

    return moves;
  }

  private generateKnightMoves(board: number[][], fromRow: number, fromCol: number, isWhite: boolean): [number, number, number, number][] {
    const moves: [number, number, number, number][] = [];
    const knightMoves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];

    for (const [rowOffset, colOffset] of knightMoves) {
      const newRow = fromRow + rowOffset;
      const newCol = fromCol + colOffset;
      
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const targetPiece = board[newRow][newCol];
        if (targetPiece === 0 || (targetPiece > 0) !== isWhite) {
          moves.push([fromRow, fromCol, newRow, newCol]);
        }
      }
    }

    return moves;
  }

  private generateBishopMoves(board: number[][], fromRow: number, fromCol: number, isWhite: boolean): [number, number, number, number][] {
    const directions: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    return this.generateSlidingMoves(board, fromRow, fromCol, isWhite, directions);
  }

  private generateRookMoves(board: number[][], fromRow: number, fromCol: number, isWhite: boolean): [number, number, number, number][] {
    const directions: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    return this.generateSlidingMoves(board, fromRow, fromCol, isWhite, directions);
  }

  private generateQueenMoves(board: number[][], fromRow: number, fromCol: number, isWhite: boolean): [number, number, number, number][] {
    const directions: [number, number][] = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    return this.generateSlidingMoves(board, fromRow, fromCol, isWhite, directions);
  }

  private generateKingMoves(board: number[][], fromRow: number, fromCol: number, isWhite: boolean): [number, number, number, number][] {
    const moves: [number, number, number, number][] = [];
    const kingMoves = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [rowOffset, colOffset] of kingMoves) {
      const newRow = fromRow + rowOffset;
      const newCol = fromCol + colOffset;
      
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const targetPiece = board[newRow][newCol];
        if (targetPiece === 0 || (targetPiece > 0) !== isWhite) {
          moves.push([fromRow, fromCol, newRow, newCol]);
        }
      }
    }

    return moves;
  }

  private generateSlidingMoves(
    board: number[][],
    fromRow: number,
    fromCol: number,
    isWhite: boolean,
    directions: [number, number][]
  ): [number, number, number, number][] {
    const moves: [number, number, number, number][] = [];

    for (const [rowDir, colDir] of directions) {
      let newRow = fromRow + rowDir;
      let newCol = fromCol + colDir;

      while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const targetPiece = board[newRow][newCol];
        
        if (targetPiece === 0) {
          // Empty square
          moves.push([fromRow, fromCol, newRow, newCol]);
        } else {
          // Occupied square
          if ((targetPiece > 0) !== isWhite) {
            // Can capture opponent's piece
            moves.push([fromRow, fromCol, newRow, newCol]);
          }
          // Can't move further in this direction
          break;
        }

        newRow += rowDir;
        newCol += colDir;
      }
    }

    return moves;
  }

  private makeMove(board: number[][], move: [number, number, number, number]): number[][] {
    const [fromRow, fromCol, toRow, toCol] = move;
    const newBoard = board.map(row => [...row]);
    
    newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
    newBoard[fromRow][fromCol] = 0;
    
    return newBoard;
  }

  private isGameOver(board: number[][]): boolean {
    // Check if either king is missing (simple game over condition)
    let whiteKing = false;
    let blackKing = false;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === 6) whiteKing = true;
        if (board[row][col] === -6) blackKing = true;
      }
    }
    
    return !whiteKing || !blackKing;
  }

  // Public methods for external use
  public evaluatePosition(board: number[][]): number {
    return this.evaluateBoard(board);
  }

  public getLegalMoves(board: number[][], fromRow: number, fromCol: number): [number, number, number, number][] {
    const piece = board[fromRow][fromCol];
    if (piece === 0) return [];
    
    return this.generatePieceMoves(board, fromRow, fromCol);
  }

  public getAllMoves(board: number[][], isWhite: boolean): [number, number, number, number][] {
    return this.generateAllMoves(board, isWhite);
  }
} 