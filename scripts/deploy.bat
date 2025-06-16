@echo off
echo 🚀 Deploying Web3 Chess Game contracts...

REM Build contracts
echo 📦 Building Move contracts...
cd sui-contracts
sui move build

REM Deploy to devnet
echo 🌐 Deploying to Sui devnet...
sui client publish --gas-budget 100000000

REM Save deployment addresses
echo 💾 Saving deployment addresses...
REM Parse deployment output and save contract addresses

echo ✅ Deployment completed! 