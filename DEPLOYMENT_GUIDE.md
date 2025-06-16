# 🚀 Web3 Chess Game Deployment Guide

Complete deployment guide for your Sui blockchain-powered chess game with PvP, PvAI, and AIvAI modes.

## 📋 Prerequisites

### macOS + Codex Setup
1. **Install Sui CLI and Dependencies**
   ```bash
   # Install Rust
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   
   # Install Sui CLI
   cargo install --locked --git https://github.com/MystenLabs/sui.git --branch devnet sui
   
   # Install Node.js
   brew install node npm
   
   # Verify installations
   sui --version
   node --version
   npm --version
   ```

2. **Clone Repository in Codex**
   ```bash
   git clone https://github.com/yourusername/web3-chess-game.git
   cd web3-chess-game
   ```

## 🏗️ Local Development Setup

### 1. Install Dependencies
```bash
# Install all project dependencies
npm run install:all

# Or install individually
npm install                    # Root dependencies
cd frontend && npm install     # Frontend dependencies
cd ../backend && npm install   # Backend dependencies (if applicable)
```

### 2. Configure Environment
```bash
# Copy environment template
cp frontend/.env.example frontend/.env

# Edit with your configuration
# VITE_SUI_NETWORK=devnet
# VITE_PACKAGE_ID=0x... (will be set after deployment)
```

### 3. Build and Test Smart Contracts
```bash
# Build Move contracts
npm run contracts:build

# Run contract tests
npm run contracts:test

# Deploy to Sui devnet
npm run contracts:publish
```

### 4. Start Development Server
```bash
# Start frontend development server
npm run dev

# The app will be available at http://localhost:5173
```

## 🌐 Smart Contract Deployment

### Deploy to Sui Devnet
1. **Set up Sui Client**
   ```bash
   # Switch to devnet
   sui client switch --env devnet
   
   # Create or import wallet
   sui client new-address ed25519
   
   # Get devnet SUI tokens
   sui client faucet
   ```

2. **Deploy Contracts**
   ```bash
   # Deploy all contracts
   cd sui-contracts
   sui client publish --gas-budget 100000000
   
   # Save the package ID from deployment output
   # Update frontend/.env with VITE_PACKAGE_ID
   ```

3. **Verify Deployment**
   ```bash
   # Check deployed objects
   sui client object <PACKAGE_ID>
   ```

## 🎯 Frontend Deployment Options

### Option 1: Deploy to Replit
1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Replit**
   - Go to [Replit](https://replit.com)
   - Click "Create" → "Import from GitHub"
   - Enter your repository URL
   - Select "Node.js" as the language

3. **Configure Replit**
   ```toml
   # Create .replit file
   modules = ["nodejs-18"]
   
   [nix]
   channel = "stable-22_11"
   
   [deployment]
   build = ["npm", "run", "build"]
   deploymentTarget = "static"
   publicDir = "frontend/dist"
   
   [[ports]]
   localPort = 5173
   externalPort = 80
   ```

4. **Environment Variables in Replit**
   - Go to Secrets tab
   - Add your environment variables:
     - `VITE_SUI_NETWORK`: `devnet`
     - `VITE_PACKAGE_ID`: `your_deployed_package_id`

### Option 2: Deploy to Bold.new
1. **Create bold.config.js**
   ```javascript
   module.exports = {
     framework: 'vite',
     buildCommand: 'npm run build',
     outputDirectory: 'frontend/dist',
     environmentVariables: {
       VITE_SUI_NETWORK: 'devnet',
       VITE_PACKAGE_ID: process.env.PACKAGE_ID,
     },
   };
   ```

2. **Deploy**
   - Push to GitHub
   - Connect GitHub to Bold.new
   - Deploy automatically on push

## 🔧 Configuration

### Environment Variables
```bash
# Frontend (.env)
VITE_SUI_NETWORK=devnet
VITE_PACKAGE_ID=0x...
VITE_CHESS_GAME_MODULE=chess_game::game
VITE_TOURNAMENT_MODULE=chess_tournament::tournament
VITE_NFT_MODULE=chess_nft::trophy
VITE_AI_MODULE=chess_ai::agent
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "npm run dev --prefix frontend",
    "build": "npm run build --prefix frontend",
    "preview": "npm run preview --prefix frontend",
    "contracts:build": "cd sui-contracts && sui move build",
    "contracts:test": "cd sui-contracts && sui move test",
    "contracts:publish": "cd sui-contracts && sui client publish --gas-budget 100000000",
    "install:all": "npm install && cd frontend && npm install"
  }
}
```

## ✨ Features Implemented

### ✅ Core Features
- **Smart Contracts**: Move contracts for chess games, NFT trophies, tournaments, AI agents
- **Game Modes**: PvP, PvAI, AIvAI with Sui randomness integration
- **Wallet Integration**: Sui Wallet, Nautilus, and other Sui-compatible wallets
- **AI Engine**: Minimax algorithm with blockchain randomness injection

### ✅ Advanced Features
- **Wager System**: SUI token betting with smart contract escrow
- **NFT Trophy System**: Dynamic achievement NFTs with on-chain metadata
- **Tournament Engine**: Multi-player tournaments with bracket generation
- **Live Spectator**: Real-time match watching and AI vs AI spectating
- **Daily Missions**: Gamification with XP, rewards, and progression
- **AI NFT Fighters**: Trainable, rentable AI agents as NFTs
- **Leaderboard**: ELO-based ranking system

## 🧪 Testing

### Run All Tests
```bash
# Test smart contracts
npm run contracts:test

# Test frontend (when implemented)
cd frontend && npm test

# Integration tests
npm run test:integration
```

### Manual Testing Checklist
- [ ] Wallet connection works
- [ ] All game modes (PvP, PvAI, AIvAI) function
- [ ] Wager system creates and distributes funds correctly
- [ ] NFT trophies mint on game completion
- [ ] Tournament creation and joining works
- [ ] Live spectator shows active games
- [ ] Daily missions can be claimed
- [ ] Leaderboard updates correctly

## 🔥 Going Live

### Production Deployment
1. **Deploy to Sui Mainnet**
   ```bash
   sui client switch --env mainnet
   sui client publish --gas-budget 100000000
   ```

2. **Update Environment**
   ```bash
   VITE_SUI_NETWORK=mainnet
   VITE_PACKAGE_ID=<mainnet_package_id>
   ```

3. **Domain Setup**
   - Configure custom domain
   - Set up SSL certificates
   - Update CORS settings

### Monitoring and Analytics
- Set up error tracking (Sentry)
- Add analytics (Google Analytics)
- Monitor blockchain transactions
- Set up uptime monitoring

## 🎮 User Experience

Your users can now:
1. **Connect** their Sui wallets
2. **Play** chess in multiple modes
3. **Wager** SUI tokens on matches
4. **Earn** NFT trophies for achievements
5. **Compete** in tournaments
6. **Watch** live AI vs AI battles
7. **Complete** daily missions for rewards
8. **Rent/Train** AI fighter NFTs
9. **Climb** the global leaderboard

## 🚨 Troubleshooting

### Common Issues
1. **Sui CLI not found**: Reinstall Sui CLI
2. **Gas budget too low**: Increase gas budget to 200000000
3. **Package not found**: Check VITE_PACKAGE_ID in environment
4. **Wallet not connecting**: Clear browser cache and reconnect
5. **Transactions failing**: Check wallet balance and network status

### Support
- Check [Sui Documentation](https://docs.sui.io)
- Join [Sui Discord](https://discord.gg/sui)
- Review smart contract code for debugging

---

🎉 **Congratulations!** You now have a fully functional Web3 Chess Game running on the Sui blockchain with all advanced features implemented! 