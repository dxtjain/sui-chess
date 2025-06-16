module chess_ai::agent {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::random::{Self, Random};
    use std::string::{Self, String};
    use std::vector;

    // AI Agent NFT structure
    struct AIAgent has key, store {
        id: UID,
        name: String,
        strategy_type: String, // "aggressive", "defensive", "balanced", "tactical"
        skill_level: u32, // 1-100
        wins: u32,
        losses: u32,
        total_games: u32,
        owner: address,
        is_available_for_rent: bool,
        rental_price_per_game: u64,
        training_level: u32,
        special_abilities: vector<String>,
        created_at: u64,
    }

    // AI Training Session
    struct TrainingSession has key {
        id: UID,
        agent_id: address,
        trainer: address,
        training_type: String,
        duration_hours: u32,
        cost: u64,
        start_time: u64,
        is_completed: bool,
    }

    // Rental Agreement
    struct RentalAgreement has key {
        id: UID,
        agent_id: address,
        renter: address,
        owner: address,
        games_remaining: u32,
        rental_fee_paid: u64,
        created_at: u64,
    }

    // Create a new AI Agent NFT
    public entry fun mint_ai_agent(
        name: String,
        strategy_type: String,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let agent = AIAgent {
            id: object::new(ctx),
            name,
            strategy_type,
            skill_level: 50, // Start at medium skill
            wins: 0,
            losses: 0,
            total_games: 0,
            owner: recipient,
            is_available_for_rent: false,
            rental_price_per_game: 0,
            training_level: 1,
            special_abilities: vector::empty(),
            created_at: tx_context::epoch(ctx),
        };
        
        transfer::public_transfer(agent, recipient);
    }

    // Train an AI Agent to improve its capabilities
    public entry fun train_agent(
        agent: &mut AIAgent,
        training_type: String,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(agent.owner == tx_context::sender(ctx), 0);
        
        let training_cost = calculate_training_cost(&training_type, agent.training_level);
        assert!(coin::value(&payment) >= training_cost, 1);
        
        // Create training session
        let session = TrainingSession {
            id: object::new(ctx),
            agent_id: object::uid_to_address(&agent.id),
            trainer: tx_context::sender(ctx),
            training_type,
            duration_hours: 24, // 24 hour training
            cost: training_cost,
            start_time: tx_context::epoch(ctx),
            is_completed: false,
        };
        
        // Improve agent stats based on training type
        improve_agent_stats(agent, &training_type);
        
        transfer::public_transfer(payment, @0x0); // Burn payment or send to treasury
        transfer::share_object(session);
    }

    // Set agent available for rental
    public entry fun set_rental_availability(
        agent: &mut AIAgent,
        available: bool,
        price_per_game: u64,
        ctx: &mut TxContext
    ) {
        assert!(agent.owner == tx_context::sender(ctx), 0);
        
        agent.is_available_for_rent = available;
        agent.rental_price_per_game = price_per_game;
    }

    // Rent an AI Agent for games
    public entry fun rent_agent(
        agent: &AIAgent,
        num_games: u32,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(agent.is_available_for_rent, 0);
        
        let total_cost = agent.rental_price_per_game * (num_games as u64);
        assert!(coin::value(&payment) >= total_cost, 1);
        
        let rental = RentalAgreement {
            id: object::new(ctx),
            agent_id: object::uid_to_address(&agent.id),
            renter: tx_context::sender(ctx),
            owner: agent.owner,
            games_remaining: num_games,
            rental_fee_paid: total_cost,
            created_at: tx_context::epoch(ctx),
        };
        
        // Split payment between owner and platform
        let owner_share = coin::split(&mut payment, total_cost * 90 / 100, ctx);
        transfer::public_transfer(owner_share, agent.owner);
        transfer::public_transfer(payment, @0x0); // Platform fee
        
        transfer::share_object(rental);
    }

    // Use rented agent in a game
    public entry fun use_rented_agent(
        rental: &mut RentalAgreement,
        agent: &mut AIAgent,
        game_result: bool, // true = win, false = loss
        ctx: &mut TxContext
    ) {
        assert!(rental.renter == tx_context::sender(ctx), 0);
        assert!(rental.games_remaining > 0, 1);
        
        rental.games_remaining = rental.games_remaining - 1;
        
        // Update agent stats
        agent.total_games = agent.total_games + 1;
        if (game_result) {
            agent.wins = agent.wins + 1;
        } else {
            agent.losses = agent.losses + 1;
        };
        
        // Potentially improve skill based on performance
        if (game_result && agent.skill_level < 100) {
            agent.skill_level = agent.skill_level + 1;
        };
    }

    // Calculate AI move with agent-specific strategy
    public fun calculate_agent_move(
        agent: &AIAgent,
        board_state: &vector<u8>,
        r: &Random,
        ctx: &mut TxContext
    ): (u8, u8) {
        let mut generator = random::new_generator(r, ctx);
        
        // Generate randomness based on agent's strategy and skill
        let strategy_factor = get_strategy_multiplier(&agent.strategy_type);
        let skill_randomness = (100 - agent.skill_level) * strategy_factor / 100;
        
        let random_factor = random::generate_u8_in_range(&mut generator, 1, skill_randomness);
        
        // Calculate move based on agent's capabilities
        calculate_move_with_strategy(board_state, &agent.strategy_type, random_factor)
    }

    // Helper functions
    fun calculate_training_cost(training_type: &String, current_level: u32): u64 {
        // Cost increases with level
        (current_level as u64) * 100000000 // Base cost in MIST
    }

    fun improve_agent_stats(agent: &mut AIAgent, training_type: &String) {
        agent.training_level = agent.training_level + 1;
        
        // Improve skill based on training type
        if (agent.skill_level < 95) {
            agent.skill_level = agent.skill_level + 2;
        };
        
        // Add special abilities based on training
        if (training_type == &string::utf8(b"tactical_mastery")) {
            vector::push_back(&mut agent.special_abilities, string::utf8(b"endgame_expert"));
        };
    }

    fun get_strategy_multiplier(strategy: &String): u8 {
        if (strategy == &string::utf8(b"aggressive")) {
            3
        } else if (strategy == &string::utf8(b"defensive")) {
            1
        } else if (strategy == &string::utf8(b"tactical")) {
            2
        } else {
            2 // balanced
        }
    }

    fun calculate_move_with_strategy(
        board: &vector<u8>,
        strategy: &String,
        randomness: u8
    ): (u8, u8) {
        // Implement strategy-specific move calculation
        // This is a simplified version
        (0, 0)
    }

    // Public getters
    public fun get_agent_stats(agent: &AIAgent): (u32, u32, u32, u32) {
        (agent.skill_level, agent.wins, agent.losses, agent.total_games)
    }

    public fun get_agent_strategy(agent: &AIAgent): String {
        agent.strategy_type
    }

    public fun is_agent_available_for_rent(agent: &AIAgent): bool {
        agent.is_available_for_rent
    }
} 