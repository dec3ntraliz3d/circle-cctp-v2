# Circle CCTP v2 - Cross-Chain Transfer Protocol

⚠️ **Educational Purpose Only** - This application is for educational and demonstration purposes. Use at your own risk.

A modern React application for seamless cross-chain USDC transfers using Circle's CCTP v2 protocol. Transfer USDC across 11 supported chains with fast transfer options and comprehensive transaction history.

![Circle CCTP v2 Interface](https://img.shields.io/badge/React-18.2.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Circle CCTP](https://img.shields.io/badge/Circle-CCTP%20v2-green)

## ✨ Features

- 🌐 **11 Supported Networks**: Ethereum, Base, Optimism, Arbitrum, Avalanche, Polygon, Linea, Unichain, World Chain, Sei, Sonic
- ⚡ **Fast Transfers**: 2-15 minute transfers with small fees vs 15-20 minute free transfers
- 📱 **Modern UI**: Beautiful, responsive interface with real-time status updates
- 🔄 **Transaction History**: Persistent transfer tracking with automatic recovery
- 🔗 **Smart Chain Switching**: Automatic wallet chain switching for seamless UX
- 💰 **Balance Display**: Real-time USDC balance with MAX button functionality
- 🎯 **One-Click Redemption**: Simple redeem process when attestations are ready

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Web3 wallet (MetaMask, WalletConnect, etc.)
- USDC tokens on supported networks

### Installation

```bash
# Clone the repository
git clone https://github.com/dec3ntraliz3d/circle-cctp-v2.git
cd circle-cctp-v2

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Add your WalletConnect Project ID
# Get one from: https://cloud.walletconnect.com/
echo "VITE_WALLET_CONNECT_PROJECT_ID=your_project_id_here" >> .env

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

## 🛠 Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Web3**: wagmi v2 + viem + RainbowKit
- **Styling**: Custom CSS with responsive design
- **Protocol**: Circle CCTP v2 mainnet contracts
- **Storage**: LocalStorage for transfer persistence

## 🔗 Supported Networks

| Network | Chain ID | Domain | Fast Transfer Fee |
|---------|----------|---------|-------------------|
| Ethereum | 1 | 0 | 0.01% |
| Base | 8453 | 6 | 0.01% |
| Optimism | 10 | 2 | 0.01% |
| Arbitrum | 42161 | 3 | 0.01% |
| Avalanche | 43114 | 1 | 0.01% |
| Polygon | 137 | 7 | 0.01% |
| Linea | 59144 | 11 | 0.14% |
| Unichain | 130 | 10 | 0.01% |
| World Chain | 480 | 14 | 0.01% |
| Sei | 1329 | 16 | 0.01% |
| Sonic | 146 | 13 | 0.01% |

## 📖 How It Works

### Transfer Process

1. **Connect Wallet**: Connect your Web3 wallet using RainbowKit
2. **Select Networks**: Choose source and destination chains
3. **Enter Details**: Input amount and destination address
4. **Choose Speed**: Fast (2-15 min, small fee) or Standard (15-20 min, free)
5. **Execute Transfer**: Approve → Burn → Wait for Attestation → Redeem

### Key Components

- **TransferForm**: Main interface for initiating transfers
- **TransactionHistory**: Persistent tracking of all transfers
- **NetworkSelector**: Chain selection with visual indicators
- **WalletConnect**: Web3 wallet integration

## 🔧 Configuration

### Environment Variables

```bash
VITE_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
```

### Contract Addresses

All contract addresses are configured in `src/config/cctp.ts` using official Circle CCTP v2 mainnet contracts.

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run typecheck    # Run TypeScript checks
```

### Project Structure

```
src/
├── components/          # React components
│   ├── TransferForm.tsx
│   ├── TransactionHistory.tsx
│   ├── NetworkSelector.tsx
│   └── WalletConnect.tsx
├── config/             # Configuration files
│   ├── wagmi.ts       # wagmi configuration
│   └── cctp.ts        # CCTP contracts & domains
├── hooks/             # Custom React hooks
│   └── useCCTP.ts     # Main CCTP logic
├── types/             # TypeScript definitions
├── utils/             # Utility functions
└── App.tsx           # Main application
```

## ⚠️ Important Notes

- **Mainnet Contracts**: Uses real CCTP v2 mainnet contracts
- **Transaction Fees**: Users pay network gas fees + optional fast transfer fees
- **Attestation Time**: Standard transfers take 15-20 minutes for Circle attestation
- **Educational Use**: This is for learning and demonstration purposes

## 🐛 Known Issues & Limitations

- Attestation times may vary based on network congestion
- Some wallets may require manual chain switching
- Transaction history is stored locally (not synced across devices)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Circle** for the CCTP protocol
- **wagmi** team for excellent Web3 React hooks
- **RainbowKit** for beautiful wallet connection
- **Vite** for fast development experience

## 💡 Support the Project

If this project helped you or you'd like to support development:

**ENS:** `sabbir.eth` (works on all EVM chains)

*All tips are greatly appreciated and help fund continued development! 🚀*

---

**Built with ❤️ by [dec3ntraliz3d](https://github.com/dec3ntraliz3d)**

*Educational project - Use at your own risk*