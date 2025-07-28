# Circle CCTP v2 - Cross-Chain USDC Transfer

A React application that enables seamless cross-chain USDC transfers using Circle's Cross-Chain Transfer Protocol (CCTP) v2. Transfer USDC between 11 supported EVM networks with native burn-and-mint functionality.

![Circle CCTP v2](https://img.shields.io/badge/Circle-CCTP%20v2-blue)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vite](https://img.shields.io/badge/Vite-7-purple)

## ✨ Features

- **11 Supported Networks**: Ethereum, Base, Optimism, Arbitrum, Avalanche, Polygon, Linea, Unichain, World Chain, Sei, and Sonic
- **Native USDC Transfers**: True cross-chain transfers using Circle's burn-and-mint mechanism
- **Modern UI**: Clean interface with network icons and intuitive design
- **Wallet Integration**: Connect with MetaMask, WalletConnect, and other popular wallets
- **Real-time Status**: Track transfer progress with detailed status updates
- **Manual Recovery**: Built-in tools for completing failed transfers
- **Fast Transfers**: Optimized for speed with minimal finality thresholds

## 🌐 Supported Networks

| Network | Chain ID | Domain | Native USDC |
|---------|----------|---------|-------------|
| Ethereum | 1 | 0 | ✅ |
| Base | 8453 | 6 | ✅ |
| Optimism | 10 | 2 | ✅ |
| Arbitrum | 42161 | 3 | ✅ |
| Avalanche | 43114 | 1 | ✅ |
| Polygon | 137 | 7 | ✅ |
| Linea | 59144 | 11 | ✅ |
| Unichain | 130 | 10 | ✅ |
| World Chain | 480 | 14 | ✅ |
| Sei | 1329 | 16 | ✅ |
| Sonic | 146 | 13 | ✅ |

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn
- A Web3 wallet (MetaMask recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd circle-cctp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Add your WalletConnect Project ID to `.env`:
   ```
   VITE_WALLET_CONNECT_PROJECT_ID=your_project_id_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📦 Environment Setup

### WalletConnect Project ID

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy your Project ID
4. Add it to your `.env` file

## 🛠️ How It Works

### CCTP Transfer Flow

1. **Approval**: Approve USDC spending on the source chain
2. **Burn**: Call `depositForBurn` on the TokenMessenger contract
3. **Attestation**: Wait for Circle's attestation service to verify the burn
4. **Mint**: Call `receiveMessage` on the destination chain's MessageTransmitter

### Key Components

- **TokenMessenger**: Handles burn operations on source chain
- **MessageTransmitter**: Handles mint operations on destination chain
- **Circle Attestation Service**: Provides cryptographic proof of burns

## 📋 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run typecheck    # Run TypeScript type checking
npm run lint         # Run ESLint (if configured)

# Deployment
npm run build        # Build for Vercel deployment
```

## 🔧 Project Structure

```
src/
├── components/           # React components
│   ├── TransferForm.tsx     # Main transfer interface
│   ├── NetworkSelector.tsx  # Network selection with icons
│   ├── TransferStatus.tsx   # Transfer progress tracking
│   ├── WalletConnect.tsx   # Wallet connection
│   └── ManualRecovery.tsx  # Manual transfer completion
├── config/              # Configuration files
│   ├── cctp.ts             # CCTP contract addresses
│   └── wagmi.ts            # Wagmi/wallet configuration
├── hooks/               # Custom React hooks
│   └── useCCTP.ts          # Main CCTP transfer logic
├── types/               # TypeScript type definitions
│   └── cctp.ts             # CCTP-related types
├── utils/               # Utility functions
│   └── transferStorage.ts  # Local storage for transfers
└── App.tsx              # Main application component
```

## 🔐 Security

- **Mainnet Contracts**: Uses official Circle CCTP v2 mainnet contracts
- **No Private Keys**: Uses standard Web3 wallet connections
- **Attestation Verification**: All transfers verified by Circle's attestation service
- **Open Source**: Full transparency with public codebase

## 🌍 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   - Push your code to GitHub
   - Connect your repository to Vercel
   - Vercel will auto-detect the Vite configuration

2. **Environment Variables**
   - Add `VITE_WALLET_CONNECT_PROJECT_ID` in Vercel's environment settings
   - All other environment variables are optional for production

3. **Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Manual Deployment

```bash
# Build the application
npm run build

# The built files will be in the `dist` directory
# Deploy the contents of `dist` to your hosting service
```

## 🔗 Links

- [Circle CCTP Documentation](https://developers.circle.com/cctp)
- [Circle CCTP Smart Contracts](https://developers.circle.com/cctp/evm-smart-contracts)
- [USDC Contract Addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses)
- [Wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This application facilitates USDC transfers using Circle's CCTP protocol. While the protocol is secure and battle-tested, always:

- Verify recipient addresses carefully
- Start with small test amounts
- Understand the networks you're transferring between
- Keep transaction hashes for reference

## 🆘 Support

If you encounter issues:

1. Check the [Manual Recovery](#-manual-recovery) section
2. Verify your wallet is connected to the correct network
3. Ensure you have sufficient gas fees
4. Open an issue on GitHub for bugs or feature requests

---

**Built with ❤️ using Circle CCTP v2, React, and TypeScript**