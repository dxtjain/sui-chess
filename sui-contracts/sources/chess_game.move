module chess_game::game {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::random::{Self, Random};
    use sui::balance::{Self, Balance};
    use sui::event;
    use std::vector;
    use std::string::{Self, String};
    use std::option::{Self, Option};

    // Error codes
    const EGameNotActive: u64 = 1;
    const EInvalidPlayer: u64 = 2;
    const EInvalidMove: u64 = 3;
    const EWagerMismatch: u64 = 4;
    const EGameFull: u64 = 5;
    const ENotYourTurn: u64 = 6;

    // Game modes
    const GAME_MODE_PVP: u8 = 1;
    const GAME_MODE_PVAI: u8 = 2;
    const GAME_MODE_AIVAI: u8 = 3;

    // Piece types (positive for white, negative for black)
    const EMPTY: i8 = 0;
    const WHITE_PAWN: i8 = 1;
    const WHITE_KNIGHT: i8 = 2;
    const WHITE_BISHOP: i8 = 3;
    const WHITE_ROOK: i8 = 4;
    const WHITE_QUEEN: i8 = 5;
    const WHITE_KING: i8 = 6;
    const BLACK_PAWN: i8 = -1;
    const BLACK_KNIGHT: i8 = -2;
    const BLACK_BISHOP: i8 = -3;
    const BLACK_ROOK: i8 = -4;
    const BLACK_QUEEN: i8 = -5;
    const BLACK_KING: i8 = -6;

    // Game state structure
    struct ChessGame has key, store {
        id: UID,
        player1: address,
        player2: Option<address>,
        current_player: u8, // 1 for white, 2 for black
        board_state: vector<i8>, // 64 positions (8x8 board)
        game_mode: u8,
        wager_amount: u64,
        prize_pool: Balance<SUI>,
        winner: Option<address>,
        move_count: u32,
        created_at: u64,
        is_active: bool,
        last_move: Option<ChessMove>,
        captured_pieces: vector<i8>,
    }

    struct ChessMove has store, copy, drop {
        from_row: u8,
        from_col: u8,
        to_row: u8,
        to_col: u8,
        piece_moved: i8,
        piece_captured: Option<i8>,
        is_castling: bool,
        is_en_passant: bool,
        promotion_piece: Option<i8>,
    }

    // Events
    struct GameCreated has copy, drop {
        game_id: address,
        creator: address,
        game_mode: u8,
        wager_amount: u64,
    }

    struct GameJoined has copy, drop {
        game_id: address,
        player2: address,
    }

    struct MoveMade has copy, drop {
        game_id: address,
        player: address,
        chess_move: ChessMove,
        move_count: u32,
    }

    struct GameEnded has copy, drop {
        game_id: address,
        winner: Option<address>,
        reason: String,
        total_moves: u32,
    }

    // Create a new chess game with optional wager
    public entry fun create_game(
        wager: Coin<SUI>,
        game_mode: u8,
        ctx: &mut TxContext
    ) {
        assert!(game_mode >= 1 && game_mode <= 3, EInvalidMove);
        
        let game_id = object::new(ctx);
        let game_address = object::uid_to_address(&game_id);
        let creator = tx_context::sender(ctx);
        let wager_amount = coin::value(&wager);
        
        let game = ChessGame {
            id: game_id,
            player1: creator,
            player2: option::none(),
            current_player: 1,
            board_state: init_chess_board(),
            game_mode,
            wager_amount,
            prize_pool: coin::into_balance(wager),
            winner: option::none(),
            move_count: 0,
            created_at: tx_context::epoch(ctx),
            is_active: true,
            last_move: option::none(),
            captured_pieces: vector::empty(),
        };

        // Emit game created event
        event::emit(GameCreated {
            game_id: game_address,
            creator,
            game_mode,
            wager_amount,
        });

        transfer::share_object(game);
    }

    // Join an existing PvP game
    public entry fun join_game(
        game: &mut ChessGame,
        wager: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(game.is_active, EGameNotActive);
        assert!(option::is_none(&game.player2), EGameFull);
        assert!(game.game_mode == GAME_MODE_PVP, EInvalidMove);
        assert!(coin::value(&wager) == game.wager_amount, EWagerMismatch);
        
        let player2 = tx_context::sender(ctx);
        game.player2 = option::some(player2);
        
        // Add wager to prize pool
        let wager_balance = coin::into_balance(wager);
        balance::join(&mut game.prize_pool, wager_balance);

        // Emit game joined event
        event::emit(GameJoined {
            game_id: object::uid_to_address(&game.id),
            player2,
        });
    }

    // Make a move in the game
    public entry fun make_move(
        game: &mut ChessGame,
        from_row: u8,
        from_col: u8,
        to_row: u8,
        to_col: u8,
        promotion_piece: Option<i8>,
        r: &Random,
        ctx: &mut TxContext
    ) {
        assert!(game.is_active, EGameNotActive);
        
        let player = tx_context::sender(ctx);
        
        // Validate it's the player's turn
        if (game.current_player == 1) {
            assert!(player == game.player1, ENotYourTurn);
        } else {
            if (game.game_mode == GAME_MODE_PVP) {
                assert!(option::contains(&game.player2, &player), ENotYourTurn);
            }
        };

        // Validate move bounds
        assert!(from_row < 8 && from_col < 8 && to_row < 8 && to_col < 8, EInvalidMove);

        // Validate and execute the move
        let chess_move = validate_and_make_move(
            game,
            from_row,
            from_col,
            to_row,
            to_col,
            promotion_piece
        );

        game.move_count = game.move_count + 1;
        game.last_move = option::some(chess_move);

        // Emit move event
        event::emit(MoveMade {
            game_id: object::uid_to_address(&game.id),
            player,
            chess_move,
            move_count: game.move_count,
        });

        // Check for game end conditions
        if (is_checkmate(&game.board_state, game.current_player)) {
            end_game(game, option::some(player), string::utf8(b"Checkmate"), ctx);
        } else if (is_stalemate(&game.board_state, game.current_player)) {
            end_game(game, option::none(), string::utf8(b"Stalemate"), ctx);
        } else {
            // Switch players
            game.current_player = if (game.current_player == 1) { 2 } else { 1 };
            
            // Make AI move if needed
            if (game.game_mode == GAME_MODE_PVAI && game.current_player == 2) {
                make_ai_move(game, r, ctx);
            } else if (game.game_mode == GAME_MODE_AIVAI) {
                make_ai_move(game, r, ctx);
            };
        }
    }

    // AI move with Sui randomness
    fun make_ai_move(
        game: &mut ChessGame,
        r: &Random,
        ctx: &mut TxContext
    ) {
        let mut generator = random::new_generator(r, ctx);
        let random_factor = random::generate_u8_in_range(&mut generator, 1, 100);
        
        // Calculate AI move using minimax with randomness
        let (from_row, from_col, to_row, to_col) = calculate_ai_move(&game.board_state, game.current_player, random_factor);
        
        // Execute AI move
        let ai_move = validate_and_make_move(
            game,
            from_row,
            from_col,
            to_row,
            to_col,
            option::none() // AI doesn't promote for now
        );

        game.move_count = game.move_count + 1;
        game.last_move = option::some(ai_move);

        // Emit AI move event
        event::emit(MoveMade {
            game_id: object::uid_to_address(&game.id),
            player: @0x0, // AI player address
            chess_move: ai_move,
            move_count: game.move_count,
        });

        // Check for game end
        if (is_checkmate(&game.board_state, game.current_player)) {
            let winner = if (game.current_player == 1) { 
                option::some(game.player1) 
            } else { 
                game.player2 
            };
            end_game(game, winner, string::utf8(b"Checkmate"), ctx);
        } else if (is_stalemate(&game.board_state, game.current_player)) {
            end_game(game, option::none(), string::utf8(b"Stalemate"), ctx);
        } else {
            game.current_player = if (game.current_player == 1) { 2 } else { 1 };
        }
    }

    // Initialize standard chess starting position
    fun init_chess_board(): vector<i8> {
        let mut board = vector::empty<i8>();
        
        // Rank 8 (black pieces)
        vector::push_back(&mut board, BLACK_ROOK);
        vector::push_back(&mut board, BLACK_KNIGHT);
        vector::push_back(&mut board, BLACK_BISHOP);
        vector::push_back(&mut board, BLACK_QUEEN);
        vector::push_back(&mut board, BLACK_KING);
        vector::push_back(&mut board, BLACK_BISHOP);
        vector::push_back(&mut board, BLACK_KNIGHT);
        vector::push_back(&mut board, BLACK_ROOK);
        
        // Rank 7 (black pawns)
        let mut i = 0;
        while (i < 8) {
            vector::push_back(&mut board, BLACK_PAWN);
            i = i + 1;
        };
        
        // Ranks 6-3 (empty squares)
        i = 0;
        while (i < 32) {
            vector::push_back(&mut board, EMPTY);
            i = i + 1;
        };
        
        // Rank 2 (white pawns)
        i = 0;
        while (i < 8) {
            vector::push_back(&mut board, WHITE_PAWN);
            i = i + 1;
        };
        
        // Rank 1 (white pieces)
        vector::push_back(&mut board, WHITE_ROOK);
        vector::push_back(&mut board, WHITE_KNIGHT);
        vector::push_back(&mut board, WHITE_BISHOP);
        vector::push_back(&mut board, WHITE_QUEEN);
        vector::push_back(&mut board, WHITE_KING);
        vector::push_back(&mut board, WHITE_BISHOP);
        vector::push_back(&mut board, WHITE_KNIGHT);
        vector::push_back(&mut board, WHITE_ROOK);
        
        board
    }

    // Validate and execute a chess move
    fun validate_and_make_move(
        game: &mut ChessGame,
        from_row: u8,
        from_col: u8,
        to_row: u8,
        to_col: u8,
        promotion_piece: Option<i8>
    ): ChessMove {
        let from_index = (from_row as u64) * 8 + (from_col as u64);
        let to_index = (to_row as u64) * 8 + (to_col as u64);
        
        let piece_moved = *vector::borrow(&game.board_state, from_index);
        let piece_captured = *vector::borrow(&game.board_state, to_index);
        
        // Basic validation
        assert!(piece_moved != EMPTY, EInvalidMove);
        
        // Check if piece belongs to current player
        if (game.current_player == 1) {
            assert!(piece_moved > 0, EInvalidMove);
        } else {
            assert!(piece_moved < 0, EInvalidMove);
        };

        // TODO: Implement detailed move validation (piece-specific rules, check detection, etc.)
        
        // Execute the move
        *vector::borrow_mut(&mut game.board_state, to_index) = piece_moved;
        *vector::borrow_mut(&mut game.board_state, from_index) = EMPTY;
        
        // Handle captured piece
        if (piece_captured != EMPTY) {
            vector::push_back(&mut game.captured_pieces, piece_captured);
        };

        ChessMove {
            from_row,
            from_col,
            to_row,
            to_col,
            piece_moved,
            piece_captured: if (piece_captured == EMPTY) { option::none() } else { option::some(piece_captured) },
            is_castling: false, // TODO: Implement castling detection
            is_en_passant: false, // TODO: Implement en passant detection
            promotion_piece,
        }
    }

    // Simple AI move calculation (placeholder for more sophisticated algorithm)
    fun calculate_ai_move(board: &vector<i8>, player: u8, randomness: u8): (u8, u8, u8, u8) {
        // This is a simplified AI - in practice, implement minimax with alpha-beta pruning
        let mut best_move = (0u8, 0u8, 0u8, 0u8);
        let mut found_move = false;
        
        let mut from_row = 0u8;
        while (from_row < 8 && !found_move) {
            let mut from_col = 0u8;
            while (from_col < 8 && !found_move) {
                let from_index = (from_row as u64) * 8 + (from_col as u64);
                let piece = *vector::borrow(board, from_index);
                
                // Check if piece belongs to AI player
                let is_ai_piece = if (player == 1) { piece > 0 } else { piece < 0 };
                
                if (is_ai_piece) {
                    let mut to_row = 0u8;
                    while (to_row < 8 && !found_move) {
                        let mut to_col = 0u8;
                        while (to_col < 8 && !found_move) {
                            if (is_valid_ai_move(board, from_row, from_col, to_row, to_col, piece)) {
                                best_move = (from_row, from_col, to_row, to_col);
                                found_move = true;
                                
                                // Add some randomness
                                if (randomness > 80) {
                                    // 20% chance to continue looking for potentially better moves
                                    found_move = false;
                                };
                            };
                            to_col = to_col + 1;
                        };
                        to_row = to_row + 1;
                    };
                };
                from_col = from_col + 1;
            };
            from_row = from_row + 1;
        };
        
        best_move
    }

    // Simplified move validation for AI
    fun is_valid_ai_move(board: &vector<i8>, from_row: u8, from_col: u8, to_row: u8, to_col: u8, piece: i8): bool {
        if (from_row == to_row && from_col == to_col) {
            return false
        };
        
        let to_index = (to_row as u64) * 8 + (to_col as u64);
        let target_piece = *vector::borrow(board, to_index);
        
        // Can't capture own pieces
        if (piece > 0 && target_piece > 0) return false;
        if (piece < 0 && target_piece < 0) return false;
        
        // TODO: Implement piece-specific movement rules
        true
    }

    // Check for checkmate (simplified)
    fun is_checkmate(board: &vector<i8>, player: u8): bool {
        // TODO: Implement proper checkmate detection
        false
    }

    // Check for stalemate (simplified)
    fun is_stalemate(board: &vector<i8>, player: u8): bool {
        // TODO: Implement proper stalemate detection
        false
    }

    // End the game and distribute prizes
    fun end_game(game: &mut ChessGame, winner: Option<address>, reason: String, ctx: &mut TxContext) {
        game.is_active = false;
        game.winner = winner;

        // Emit game ended event
        event::emit(GameEnded {
            game_id: object::uid_to_address(&game.id),
            winner,
            reason,
            total_moves: game.move_count,
        });

        // Distribute prize pool
        if (option::is_some(&winner)) {
            let winner_address = *option::borrow(&winner);
            let prize_amount = balance::value(&game.prize_pool);
            if (prize_amount > 0) {
                let prize_coin = coin::from_balance(balance::split(&mut game.prize_pool, prize_amount), ctx);
                transfer::public_transfer(prize_coin, winner_address);
            };
        } else {
            // Draw - split prize pool
            if (option::is_some(&game.player2)) {
                let prize_amount = balance::value(&game.prize_pool);
                if (prize_amount > 0) {
                    let half_prize = prize_amount / 2;
                    let player1_prize = coin::from_balance(balance::split(&mut game.prize_pool, half_prize), ctx);
                    let player2_prize = coin::from_balance(balance::split(&mut game.prize_pool, prize_amount - half_prize), ctx);
                    
                    transfer::public_transfer(player1_prize, game.player1);
                    transfer::public_transfer(player2_prize, *option::borrow(&game.player2));
                };
            };
        };
    }

    // View functions
    public fun get_board_state(game: &ChessGame): &vector<i8> {
        &game.board_state
    }

    public fun get_current_player(game: &ChessGame): u8 {
        game.current_player
    }

    public fun get_move_count(game: &ChessGame): u32 {
        game.move_count
    }

    public fun is_game_active(game: &ChessGame): bool {
        game.is_active
    }

    public fun get_winner(game: &ChessGame): Option<address> {
        game.winner
    }
} 