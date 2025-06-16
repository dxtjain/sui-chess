module chess_nautilus::core {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::event;
    use std::string::{Self, String};
    use std::vector;

    // ===== Core Nautilus Structures =====

    /// Main game registry that manages all chess games
    struct GameRegistry has key {
        id: UID,
        games: vector<address>,
        total_games: u64,
        active_games: u64,
        total_volume: u64,
        admin: address,
    }

    /// Modular game component for reusability
    struct GameComponent has key, store {
        id: UID,
        component_type: String,
        version: u64,
        data: vector<u8>,
        is_active: bool,
    }

    /// Plugin system for extending functionality
    struct Plugin has key, store {
        id: UID,
        name: String,
        version: String,
        author: address,
        permissions: vector<String>,
        config: vector<u8>,
    }

    /// Treasury for managing platform funds
    struct Treasury has key {
        id: UID,
        balance: Balance<SUI>,
        total_fees_collected: u64,
        admin: address,
    }

    // ===== Events =====

    struct GameCreated has copy, drop {
        game_id: address,
        player: address,
        game_type: String,
        wager_amount: u64,
        timestamp: u64,
    }

    struct GameCompleted has copy, drop {
        game_id: address,
        winner: address,
        game_type: String,
        duration: u64,
        moves: u32,
    }

    struct PluginInstalled has copy, drop {
        plugin_id: address,
        game_id: address,
        plugin_name: String,
    }

    // ===== Core Functions =====

    /// Initialize the Nautilus chess system
    fun init(ctx: &mut TxContext) {
        let registry = GameRegistry {
            id: object::new(ctx),
            games: vector::empty(),
            total_games: 0,
            active_games: 0,
            total_volume: 0,
            admin: tx_context::sender(ctx),
        };

        let treasury = Treasury {
            id: object::new(ctx),
            balance: balance::zero(),
            total_fees_collected: 0,
            admin: tx_context::sender(ctx),
        };

        transfer::share_object(registry);
        transfer::share_object(treasury);
    }

    /// Register a new game in the system
    public entry fun register_game(
        registry: &mut GameRegistry,
        game_id: address,
        game_type: String,
        wager_amount: u64,
        ctx: &mut TxContext
    ) {
        vector::push_back(&mut registry.games, game_id);
        registry.total_games = registry.total_games + 1;
        registry.active_games = registry.active_games + 1;
        registry.total_volume = registry.total_volume + wager_amount;

        event::emit(GameCreated {
            game_id,
            player: tx_context::sender(ctx),
            game_type,
            wager_amount,
            timestamp: tx_context::epoch(ctx),
        });
    }

    /// Complete a game and update registry
    public entry fun complete_game(
        registry: &mut GameRegistry,
        game_id: address,
        winner: address,
        game_type: String,
        duration: u64,
        moves: u32,
        ctx: &mut TxContext
    ) {
        registry.active_games = registry.active_games - 1;

        event::emit(GameCompleted {
            game_id,
            winner,
            game_type,
            duration,
            moves,
        });
    }

    /// Create a modular game component
    public entry fun create_component(
        component_type: String,
        data: vector<u8>,
        ctx: &mut TxContext
    ) {
        let component = GameComponent {
            id: object::new(ctx),
            component_type,
            version: 1,
            data,
            is_active: true,
        };

        transfer::public_transfer(component, tx_context::sender(ctx));
    }

    /// Install a plugin to extend game functionality
    public entry fun install_plugin(
        game_id: address,
        plugin_name: String,
        plugin_version: String,
        permissions: vector<String>,
        config: vector<u8>,
        ctx: &mut TxContext
    ) {
        let plugin = Plugin {
            id: object::new(ctx),
            name: plugin_name,
            version: plugin_version,
            author: tx_context::sender(ctx),
            permissions,
            config,
        };

        let plugin_id = object::uid_to_address(&plugin.id);

        event::emit(PluginInstalled {
            plugin_id,
            game_id,
            plugin_name: plugin.name,
        });

        transfer::public_transfer(plugin, tx_context::sender(ctx));
    }

    /// Collect platform fees
    public entry fun collect_fees(
        treasury: &mut Treasury,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&payment);
        let fee_balance = coin::into_balance(payment);
        balance::join(&mut treasury.balance, fee_balance);
        treasury.total_fees_collected = treasury.total_fees_collected + amount;
    }

    /// Withdraw funds from treasury (admin only)
    public entry fun withdraw_treasury(
        treasury: &mut Treasury,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == treasury.admin, 0);
        
        let withdrawn = coin::take(&mut treasury.balance, amount, ctx);
        transfer::public_transfer(withdrawn, treasury.admin);
    }

    // ===== Query Functions =====

    public fun get_registry_stats(registry: &GameRegistry): (u64, u64, u64) {
        (registry.total_games, registry.active_games, registry.total_volume)
    }

    public fun get_treasury_balance(treasury: &Treasury): u64 {
        balance::value(&treasury.balance)
    }

    public fun get_component_info(component: &GameComponent): (String, u64, bool) {
        (component.component_type, component.version, component.is_active)
    }

    public fun get_plugin_info(plugin: &Plugin): (String, String, address) {
        (plugin.name, plugin.version, plugin.author)
    }

    // ===== Admin Functions =====

    public entry fun update_admin(
        registry: &mut GameRegistry,
        new_admin: address,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry.admin, 0);
        registry.admin = new_admin;
    }

    public entry fun update_component(
        component: &mut GameComponent,
        new_data: vector<u8>,
        ctx: &mut TxContext
    ) {
        component.data = new_data;
        component.version = component.version + 1;
    }

    public entry fun toggle_component(
        component: &mut GameComponent,
        ctx: &mut TxContext
    ) {
        component.is_active = !component.is_active;
    }
} 