#[test_only]
module chess_game::game_tests {
    use chess_game::game::{Self, ChessGame};
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;

    #[test]
    fun test_create_game() {
        let mut scenario = test_scenario::begin(@0x1);
        let ctx = test_scenario::ctx(&mut scenario);
        
        // Create a coin for wager
        let wager = coin::mint_for_testing<SUI>(1000000000, ctx); // 1 SUI
        
        // Create game
        game::create_game(wager, 1, ctx);
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_join_game() {
        let mut scenario = test_scenario::begin(@0x1);
        
        // Player 1 creates game
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let wager = coin::mint_for_testing<SUI>(1000000000, ctx);
            game::create_game(wager, 1, ctx);
        };
        
        // Player 2 joins game
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let mut game = test_scenario::take_shared<ChessGame>(&scenario);
            let wager = coin::mint_for_testing<SUI>(1000000000, ctx);
            
            game::join_game(&mut game, wager, ctx);
            test_scenario::return_shared(game);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_make_move() {
        // Test chess move functionality
        // Implementation here...
    }
} 