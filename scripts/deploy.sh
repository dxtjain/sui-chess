#!/bin/bash

# Deploy smart contracts to Sui devnet
echo "🚀 Deploying Web3 Chess Game contracts..."

# Build contracts
echo "📦 Building Move contracts..."
cd sui-contracts
sui move build

# Deploy to devnet
echo "🌐 Deploying to Sui devnet..."
sui client publish --gas-budget 100000000

# Save deployment addresses
echo "💾 Saving deployment addresses..."
# Parse deployment output and save contract addresses

echo "✅ Deployment completed!" 