module chess_nft::trophy {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::package;
    use sui::display;
    use std::string::{Self, String};
    use sui::url::{Self, Url};
    use std::vector;

    // Error codes
    const EInvalidAchievement: u64 = 1;
    const EInvalidRarity: u64 = 2;

    // Trophy rarities
    const RARITY_COMMON: u8 = 1;
    const RARITY_RARE: u8 = 2;
    const RARITY_EPIC: u8 = 3;
    const RARITY_LEGENDARY: u8 = 4;

    // Achievement types
    const ACHIEVEMENT_FIRST_WIN: u8 = 1;
    const ACHIEVEMENT_PERFECT_GAME: u8 = 2;
    const ACHIEVEMENT_TOURNAMENT_WIN: u8 = 3;
    const ACHIEVEMENT_SPEED_WIN: u8 = 4;
    const ACHIEVEMENT_COMEBACK: u8 = 5;
    const ACHIEVEMENT_CHECKMATE_PATTERN: u8 = 6;

    // One-time witness for package publishing
    struct TROPHY has drop {}

    // Main trophy NFT structure
    struct ChessTrophy has key, store {
        id: UID,
        name: String,
        description: String,
        image_url: Url,
        achievement_type: u8,
        match_stats: MatchStats,
        rarity: u8,
        minted_at: u64,
        game_id: address,
        recipient: address,
        trophy_number: u64, // Sequential number for this achievement type
    }

    struct MatchStats has store {
        moves_count: u32,
        game_duration: u64,
        opponent_rating: u32,
        pieces_captured: u8,
        winning_strategy: String,
        final_position: vector<i8>,
    }

    // Global registry for trophy minting
    struct TrophyRegistry has key {
        id: UID,
        total_minted: u64,
        achievement_counters: vector<u64>, // Counter for each achievement type
        rarity_counters: vector<u64>, // Counter for each rarity level
    }

    // Events
    struct TrophyMinted has copy, drop {
        trophy_id: address,
        recipient: address,
        achievement_type: u8,
        rarity: u8,
        trophy_number: u64,
        game_id: address,
    }

    struct RareAchievement has copy, drop {
        recipient: address,
        achievement_type: u8,
        rarity: u8,
        trophy_id: address,
    }

    // Initialize the trophy system
    fun init(otw: TROPHY, ctx: &mut TxContext) {
        // Create display object for NFT metadata
        let keys = vector[
            string::utf8(b"name"),
            string::utf8(b"description"),
            string::utf8(b"image_url"),
            string::utf8(b"project_url"),
            string::utf8(b"creator"),
        ];

        let values = vector[
            string::utf8(b"{name}"),
            string::utf8(b"{description}"),
            string::utf8(b"{image_url}"),
            string::utf8(b"https://web3chess.game"),
            string::utf8(b"Web3 Chess Game"),
        ];

        let publisher = package::claim(otw, ctx);
        let mut display = display::new_with_fields<ChessTrophy>(
            &publisher, keys, values, ctx
        );

        display::update_version(&mut display);
        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));

        // Create global registry
        let registry = TrophyRegistry {
            id: object::new(ctx),
            total_minted: 0,
            achievement_counters: vector[0, 0, 0, 0, 0, 0], // 6 achievement types
            rarity_counters: vector[0, 0, 0, 0], // 4 rarity levels
        };

        transfer::share_object(registry);
    }

    // Mint a trophy for a player's achievement
    public entry fun mint_trophy(
        registry: &mut TrophyRegistry,
        recipient: address,
        game_id: address,
        achievement_type: u8,
        match_stats: MatchStats,
        ctx: &mut TxContext
    ) {
        assert!(achievement_type >= 1 && achievement_type <= 6, EInvalidAchievement);
        
        // Calculate rarity based on achievement and stats
        let rarity = calculate_rarity(achievement_type, &match_stats);
        
        // Update counters
        registry.total_minted = registry.total_minted + 1;
        let achievement_index = (achievement_type - 1) as u64;
        let rarity_index = (rarity - 1) as u64;
        
        *vector::borrow_mut(&mut registry.achievement_counters, achievement_index) = 
            *vector::borrow(&registry.achievement_counters, achievement_index) + 1;
        *vector::borrow_mut(&mut registry.rarity_counters, rarity_index) = 
            *vector::borrow(&registry.rarity_counters, rarity_index) + 1;

        let trophy_number = *vector::borrow(&registry.achievement_counters, achievement_index);

        // Generate trophy metadata
        let name = generate_trophy_name(achievement_type, rarity, trophy_number);
        let description = generate_trophy_description(achievement_type, &match_stats, rarity);
        let image_url = generate_trophy_image(achievement_type, rarity);

        let trophy_id = object::new(ctx);
        let trophy_address = object::uid_to_address(&trophy_id);

        let trophy = ChessTrophy {
            id: trophy_id,
            name,
            description,
            image_url,
            achievement_type,
            match_stats,
            rarity,
            minted_at: tx_context::epoch(ctx),
            game_id,
            recipient,
            trophy_number,
        };

        // Emit events
        event::emit(TrophyMinted {
            trophy_id: trophy_address,
            recipient,
            achievement_type,
            rarity,
            trophy_number,
            game_id,
        });

        if (rarity >= RARITY_EPIC) {
            event::emit(RareAchievement {
                recipient,
                achievement_type,
                rarity,
                trophy_id: trophy_address,
            });
        };

        transfer::public_transfer(trophy, recipient);
    }

    // Calculate trophy rarity based on achievement and performance
    fun calculate_rarity(achievement_type: u8, stats: &MatchStats): u8 {
        let mut base_rarity = RARITY_COMMON;

        // Base rarity by achievement type
        if (achievement_type == ACHIEVEMENT_TOURNAMENT_WIN) {
            base_rarity = RARITY_RARE;
        } else if (achievement_type == ACHIEVEMENT_PERFECT_GAME) {
            base_rarity = RARITY_RARE;
        } else if (achievement_type == ACHIEVEMENT_CHECKMATE_PATTERN) {
            base_rarity = RARITY_EPIC;
        };

        // Boost rarity based on performance
        let mut rarity_boost = 0u8;
        
        // Very fast games (under 20 moves)
        if (stats.moves_count < 20) {
            rarity_boost = rarity_boost + 1;
        };

        // Perfect games (no pieces lost)
        if (stats.pieces_captured == 0) {
            rarity_boost = rarity_boost + 1;
        };

        // Against high-rated opponents
        if (stats.opponent_rating > 2000) {
            rarity_boost = rarity_boost + 1;
        };

        // Apply boost
        let final_rarity = base_rarity + rarity_boost;
        if (final_rarity > RARITY_LEGENDARY) {
            RARITY_LEGENDARY
        } else {
            final_rarity
        }
    }

    // Generate trophy name based on type and rarity
    fun generate_trophy_name(achievement_type: u8, rarity: u8, trophy_number: u64): String {
        let mut name = string::utf8(b"");
        
        // Rarity prefix
        if (rarity == RARITY_COMMON) {
            string::append(&mut name, string::utf8(b"Bronze "));
        } else if (rarity == RARITY_RARE) {
            string::append(&mut name, string::utf8(b"Silver "));
        } else if (rarity == RARITY_EPIC) {
            string::append(&mut name, string::utf8(b"Gold "));
        } else if (rarity == RARITY_LEGENDARY) {
            string::append(&mut name, string::utf8(b"Platinum "));
        };

        // Achievement name
        if (achievement_type == ACHIEVEMENT_FIRST_WIN) {
            string::append(&mut name, string::utf8(b"First Victory"));
        } else if (achievement_type == ACHIEVEMENT_PERFECT_GAME) {
            string::append(&mut name, string::utf8(b"Perfect Game"));
        } else if (achievement_type == ACHIEVEMENT_TOURNAMENT_WIN) {
            string::append(&mut name, string::utf8(b"Tournament Champion"));
        } else if (achievement_type == ACHIEVEMENT_SPEED_WIN) {
            string::append(&mut name, string::utf8(b"Lightning Strike"));
        } else if (achievement_type == ACHIEVEMENT_COMEBACK) {
            string::append(&mut name, string::utf8(b"Phoenix Rising"));
        } else if (achievement_type == ACHIEVEMENT_CHECKMATE_PATTERN) {
            string::append(&mut name, string::utf8(b"Tactical Master"));
        };

        // Add trophy number for uniqueness
        string::append(&mut name, string::utf8(b" #"));
        string::append(&mut name, u64_to_string(trophy_number));

        name
    }

    // Generate trophy description
    fun generate_trophy_description(achievement_type: u8, stats: &MatchStats, rarity: u8): String {
        let mut description = string::utf8(b"Awarded for ");

        if (achievement_type == ACHIEVEMENT_FIRST_WIN) {
            string::append(&mut description, string::utf8(b"achieving your first victory in Web3 Chess! "));
        } else if (achievement_type == ACHIEVEMENT_PERFECT_GAME) {
            string::append(&mut description, string::utf8(b"winning without losing any pieces! "));
        } else if (achievement_type == ACHIEVEMENT_TOURNAMENT_WIN) {
            string::append(&mut description, string::utf8(b"claiming victory in a chess tournament! "));
        } else if (achievement_type == ACHIEVEMENT_SPEED_WIN) {
            string::append(&mut description, string::utf8(b"achieving a lightning-fast victory! "));
        } else if (achievement_type == ACHIEVEMENT_COMEBACK) {
            string::append(&mut description, string::utf8(b"an incredible comeback victory! "));
        } else if (achievement_type == ACHIEVEMENT_CHECKMATE_PATTERN) {
            string::append(&mut description, string::utf8(b"executing a brilliant tactical checkmate! "));
        };

        // Add game stats
        string::append(&mut description, string::utf8(b"Game completed in "));
        string::append(&mut description, u32_to_string(stats.moves_count));
        string::append(&mut description, string::utf8(b" moves with strategy: "));
        string::append(&mut description, stats.winning_strategy);

        description
    }

    // Generate trophy image URL
    fun generate_trophy_image(achievement_type: u8, rarity: u8): Url {
        let mut image_path = string::utf8(b"https://api.web3chess.game/trophy-images/");
        
        // Add rarity folder
        if (rarity == RARITY_COMMON) {
            string::append(&mut image_path, string::utf8(b"bronze/"));
        } else if (rarity == RARITY_RARE) {
            string::append(&mut image_path, string::utf8(b"silver/"));
        } else if (rarity == RARITY_EPIC) {
            string::append(&mut image_path, string::utf8(b"gold/"));
        } else if (rarity == RARITY_LEGENDARY) {
            string::append(&mut image_path, string::utf8(b"platinum/"));
        };

        // Add achievement image
        if (achievement_type == ACHIEVEMENT_FIRST_WIN) {
            string::append(&mut image_path, string::utf8(b"first_victory.png"));
        } else if (achievement_type == ACHIEVEMENT_PERFECT_GAME) {
            string::append(&mut image_path, string::utf8(b"perfect_game.png"));
        } else if (achievement_type == ACHIEVEMENT_TOURNAMENT_WIN) {
            string::append(&mut image_path, string::utf8(b"tournament_win.png"));
        } else if (achievement_type == ACHIEVEMENT_SPEED_WIN) {
            string::append(&mut image_path, string::utf8(b"speed_win.png"));
        } else if (achievement_type == ACHIEVEMENT_COMEBACK) {
            string::append(&mut image_path, string::utf8(b"comeback.png"));
        } else if (achievement_type == ACHIEVEMENT_CHECKMATE_PATTERN) {
            string::append(&mut image_path, string::utf8(b"tactical_master.png"));
        };

        url::new_unsafe(string::to_ascii(image_path))
    }

    // Helper functions for string conversion
    fun u64_to_string(value: u64): String {
        if (value == 0) {
            return string::utf8(b"0")
        };

        let mut result = vector::empty<u8>();
        let mut n = value;
        
        while (n > 0) {
            let digit = ((n % 10) as u8) + 48; // ASCII '0' = 48
            vector::push_back(&mut result, digit);
            n = n / 10;
        };
        
        vector::reverse(&mut result);
        string::utf8(result)
    }

    fun u32_to_string(value: u32): String {
        u64_to_string((value as u64))
    }

    // View functions
    public fun get_trophy_stats(trophy: &ChessTrophy): &MatchStats {
        &trophy.match_stats
    }

    public fun get_trophy_rarity(trophy: &ChessTrophy): u8 {
        trophy.rarity
    }

    public fun get_achievement_type(trophy: &ChessTrophy): u8 {
        trophy.achievement_type
    }

    public fun get_trophy_number(trophy: &ChessTrophy): u64 {
        trophy.trophy_number
    }

    public fun get_game_id(trophy: &ChessTrophy): address {
        trophy.game_id
    }

    public fun get_total_minted(registry: &TrophyRegistry): u64 {
        registry.total_minted
    }

    public fun get_achievement_count(registry: &TrophyRegistry, achievement_type: u8): u64 {
        *vector::borrow(&registry.achievement_counters, (achievement_type - 1) as u64)
    }

    public fun get_rarity_count(registry: &TrophyRegistry, rarity: u8): u64 {
        *vector::borrow(&registry.rarity_counters, (rarity - 1) as u64)
    }

    // Public helper for creating match stats
    public fun create_match_stats(
        moves_count: u32,
        game_duration: u64,
        opponent_rating: u32,
        pieces_captured: u8,
        winning_strategy: String,
        final_position: vector<i8>
    ): MatchStats {
        MatchStats {
            moves_count,
            game_duration,
            opponent_rating,
            pieces_captured,
            winning_strategy,
            final_position,
        }
    }
} 