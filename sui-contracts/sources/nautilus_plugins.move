module chess_nautilus::plugins {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::random::{Self, Random};
    use sui::event;
    use std::string::{Self, String};
    use std::vector;
    
    use chess_nautilus::core::{Self, GameRegistry, Treasury};

    // ===== Plugin Structures =====

    /// Rating plugin for ELO system
    struct RatingPlugin has key, store {
        id: UID,
        player_ratings: vector<PlayerRating>,
        default_rating: u32,
        k_factor: u32,
        min_rating: u32,
        max_rating: u32,
    }

    struct PlayerRating has store {
        player: address,
        rating: u32,
        games_played: u32,
        last_updated: u64,
    }

    /// Anti-cheat plugin
    struct AntiCheatPlugin has key, store {
        id: UID,
        suspicious_players: vector<address>,
        move_analysis_enabled: bool,
        time_analysis_enabled: bool,
        pattern_detection: bool,
    }

    /// Matchmaking plugin
    struct MatchmakingPlugin has key, store {
        id: UID,
        queue: vector<MatchRequest>,
        rating_tolerance: u32,
        wait_time_limit: u64,
    }

    struct MatchRequest has store {
        player: address,
        rating: u32,
        game_mode: String,
        wager_amount: u64,
        timestamp: u64,
    }

    /// Analytics plugin
    struct AnalyticsPlugin has key, store {
        id: UID,
        total_moves: u64,
        avg_game_duration: u64,
        popular_openings: vector<String>,
        daily_active_users: u64,
    }

    /// Rewards plugin
    struct RewardsPlugin has key, store {
        id: UID,
        reward_pools: vector<RewardPool>,
        daily_rewards: bool,
        streak_bonuses: bool,
    }

    struct RewardPool has store {
        pool_type: String,
        total_amount: u64,
        participants: vector<address>,
        end_time: u64,
    }

    // ===== Events =====

    struct PluginActivated has copy, drop {
        plugin_type: String,
        plugin_id: address,
        activator: address,
    }

    struct RatingUpdated has copy, drop {
        player: address,
        old_rating: u32,
        new_rating: u32,
        game_id: address,
    }

    struct SuspiciousActivity has copy, drop {
        player: address,
        activity_type: String,
        game_id: address,
        timestamp: u64,
    }

    struct MatchFound has copy, drop {
        player1: address,
        player2: address,
        rating_diff: u32,
        game_mode: String,
    }

    // ===== Plugin Initialization =====

    /// Initialize rating plugin
    public entry fun init_rating_plugin(ctx: &mut TxContext) {
        let plugin = RatingPlugin {
            id: object::new(ctx),
            player_ratings: vector::empty(),
            default_rating: 1500,
            k_factor: 32,
            min_rating: 100,
            max_rating: 3000,
        };

        event::emit(PluginActivated {
            plugin_type: string::utf8(b"rating"),
            plugin_id: object::uid_to_address(&plugin.id),
            activator: tx_context::sender(ctx),
        });

        transfer::share_object(plugin);
    }

    /// Initialize anti-cheat plugin
    public entry fun init_anticheat_plugin(ctx: &mut TxContext) {
        let plugin = AntiCheatPlugin {
            id: object::new(ctx),
            suspicious_players: vector::empty(),
            move_analysis_enabled: true,
            time_analysis_enabled: true,
            pattern_detection: true,
        };

        event::emit(PluginActivated {
            plugin_type: string::utf8(b"anticheat"),
            plugin_id: object::uid_to_address(&plugin.id),
            activator: tx_context::sender(ctx),
        });

        transfer::share_object(plugin);
    }

    /// Initialize matchmaking plugin
    public entry fun init_matchmaking_plugin(ctx: &mut TxContext) {
        let plugin = MatchmakingPlugin {
            id: object::new(ctx),
            queue: vector::empty(),
            rating_tolerance: 200,
            wait_time_limit: 300, // 5 minutes
        };

        event::emit(PluginActivated {
            plugin_type: string::utf8(b"matchmaking"),
            plugin_id: object::uid_to_address(&plugin.id),
            activator: tx_context::sender(ctx),
        });

        transfer::share_object(plugin);
    }

    // ===== Rating Plugin Functions =====

    /// Update player rating after game
    public entry fun update_rating(
        plugin: &mut RatingPlugin,
        player1: address,
        player2: address,
        result: u8, // 0 = player1 wins, 1 = player2 wins, 2 = draw
        game_id: address,
        ctx: &mut TxContext
    ) {
        let (rating1, rating2) = get_player_ratings(plugin, player1, player2);
        let (new_rating1, new_rating2) = calculate_new_ratings(rating1, rating2, result, plugin.k_factor);

        update_player_rating(plugin, player1, new_rating1, ctx);
        update_player_rating(plugin, player2, new_rating2, ctx);

        event::emit(RatingUpdated {
            player: player1,
            old_rating: rating1,
            new_rating: new_rating1,
            game_id,
        });

        event::emit(RatingUpdated {
            player: player2,
            old_rating: rating2,
            new_rating: new_rating2,
            game_id,
        });
    }

    /// Get player ratings
    fun get_player_ratings(plugin: &RatingPlugin, player1: address, player2: address): (u32, u32) {
        let rating1 = get_player_rating(plugin, player1);
        let rating2 = get_player_rating(plugin, player2);
        (rating1, rating2)
    }

    fun get_player_rating(plugin: &RatingPlugin, player: address): u32 {
        let i = 0;
        let len = vector::length(&plugin.player_ratings);
        
        while (i < len) {
            let rating = vector::borrow(&plugin.player_ratings, i);
            if (rating.player == player) {
                return rating.rating
            };
            i = i + 1;
        };
        
        plugin.default_rating
    }

    fun update_player_rating(plugin: &mut RatingPlugin, player: address, new_rating: u32, ctx: &mut TxContext) {
        let i = 0;
        let len = vector::length(&plugin.player_ratings);
        let found = false;
        
        while (i < len) {
            let rating = vector::borrow_mut(&mut plugin.player_ratings, i);
            if (rating.player == player) {
                rating.rating = new_rating;
                rating.games_played = rating.games_played + 1;
                rating.last_updated = tx_context::epoch(ctx);
                found = true;
                break
            };
            i = i + 1;
        };
        
        if (!found) {
            let new_player_rating = PlayerRating {
                player,
                rating: new_rating,
                games_played: 1,
                last_updated: tx_context::epoch(ctx),
            };
            vector::push_back(&mut plugin.player_ratings, new_player_rating);
        };
    }

    /// Calculate new ELO ratings
    fun calculate_new_ratings(rating1: u32, rating2: u32, result: u8, k_factor: u32): (u32, u32) {
        // Simplified ELO calculation
        let expected1 = 1000000 / (1000000 + pow_10((rating2 - rating1) / 400));
        let expected2 = 1000000 / (1000000 + pow_10((rating1 - rating2) / 400));
        
        let actual1 = if (result == 0) { 1000000 } else if (result == 1) { 0 } else { 500000 };
        let actual2 = if (result == 1) { 1000000 } else if (result == 0) { 0 } else { 500000 };
        
        let new_rating1 = rating1 + (k_factor * (actual1 - expected1)) / 1000000;
        let new_rating2 = rating2 + (k_factor * (actual2 - expected2)) / 1000000;
        
        (new_rating1, new_rating2)
    }

    fun pow_10(x: u32): u32 {
        // Simplified power function for ELO calculation
        if (x == 0) { 1 } else { 10 * pow_10(x - 1) }
    }

    // ===== Anti-Cheat Plugin Functions =====

    /// Report suspicious activity
    public entry fun report_suspicious_activity(
        plugin: &mut AntiCheatPlugin,
        player: address,
        activity_type: String,
        game_id: address,
        ctx: &mut TxContext
    ) {
        if (!vector::contains(&plugin.suspicious_players, &player)) {
            vector::push_back(&mut plugin.suspicious_players, player);
        };

        event::emit(SuspiciousActivity {
            player,
            activity_type,
            game_id,
            timestamp: tx_context::epoch(ctx),
        });
    }

    /// Analyze move patterns for cheating
    public fun analyze_move_pattern(
        plugin: &AntiCheatPlugin,
        moves: &vector<String>,
        move_times: &vector<u64>
    ): bool {
        if (!plugin.move_analysis_enabled) return false;
        
        // Implement move pattern analysis
        // This is a simplified version
        let consistent_fast_moves = count_fast_moves(move_times);
        consistent_fast_moves > 10 // Threshold for suspicious activity
    }

    fun count_fast_moves(move_times: &vector<u64>): u32 {
        let count = 0;
        let i = 0;
        let len = vector::length(move_times);
        
        while (i < len) {
            let time = *vector::borrow(move_times, i);
            if (time < 1000) { // Less than 1 second
                count = count + 1;
            };
            i = i + 1;
        };
        
        count
    }

    // ===== Matchmaking Plugin Functions =====

    /// Join matchmaking queue
    public entry fun join_queue(
        plugin: &mut MatchmakingPlugin,
        rating_plugin: &RatingPlugin,
        game_mode: String,
        wager_amount: u64,
        ctx: &mut TxContext
    ) {
        let player = tx_context::sender(ctx);
        let rating = get_player_rating(rating_plugin, player);
        
        let request = MatchRequest {
            player,
            rating,
            game_mode,
            wager_amount,
            timestamp: tx_context::epoch(ctx),
        };
        
        // Try to find a match
        let match_found = find_match(plugin, &request);
        
        if (!match_found) {
            vector::push_back(&mut plugin.queue, request);
        };
    }

    fun find_match(plugin: &mut MatchmakingPlugin, request: &MatchRequest): bool {
        let i = 0;
        let len = vector::length(&plugin.queue);
        
        while (i < len) {
            let other_request = vector::borrow(&plugin.queue, i);
            
            if (is_good_match(request, other_request, plugin.rating_tolerance)) {
                let other_player = other_request.player;
                let rating_diff = if (request.rating > other_request.rating) {
                    request.rating - other_request.rating
                } else {
                    other_request.rating - request.rating
                };
                
                event::emit(MatchFound {
                    player1: request.player,
                    player2: other_player,
                    rating_diff,
                    game_mode: request.game_mode,
                });
                
                // Remove matched request from queue
                vector::remove(&mut plugin.queue, i);
                return true
            };
            
            i = i + 1;
        };
        
        false
    }

    fun is_good_match(req1: &MatchRequest, req2: &MatchRequest, tolerance: u32): bool {
        req1.game_mode == req2.game_mode &&
        req1.wager_amount == req2.wager_amount &&
        abs_diff(req1.rating, req2.rating) <= tolerance
    }

    fun abs_diff(a: u32, b: u32): u32 {
        if (a > b) { a - b } else { b - a }
    }

    // ===== Query Functions =====

    public fun get_player_rating_info(plugin: &RatingPlugin, player: address): (u32, u32) {
        let rating = get_player_rating(plugin, player);
        let games = get_player_games(plugin, player);
        (rating, games)
    }

    fun get_player_games(plugin: &RatingPlugin, player: address): u32 {
        let i = 0;
        let len = vector::length(&plugin.player_ratings);
        
        while (i < len) {
            let rating = vector::borrow(&plugin.player_ratings, i);
            if (rating.player == player) {
                return rating.games_played
            };
            i = i + 1;
        };
        
        0
    }

    public fun is_player_suspicious(plugin: &AntiCheatPlugin, player: address): bool {
        vector::contains(&plugin.suspicious_players, &player)
    }

    public fun get_queue_length(plugin: &MatchmakingPlugin): u64 {
        vector::length(&plugin.queue)
    }
} 