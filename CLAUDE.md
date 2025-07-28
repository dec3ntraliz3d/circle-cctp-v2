# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Circle CCTP (Cross-Chain Transfer Protocol) v2 React application that enables cross-chain USDC transfers between Ethereum, Base, Optimism, and Arbitrum using wagmi and viem.

## Architecture

- **Frontend**: React with TypeScript and Vite
- **Web3 Integration**: wagmi (built on viem) for wallet connections and blockchain interactions
- **Cross-Chain Protocol**: Circle CCTP v2 for USDC transfers
- **Supported Networks**: Ethereum (1), Base (8453), Optimism (10), Arbitrum (42161)

### Key Components

- `src/config/wagmi.ts`: wagmi configuration with supported chains and connectors
- `src/config/cctp.ts`: CCTP contract addresses and domain mappings for each network
- `src/hooks/useCCTP.ts`: Main hook for CCTP transfer operations (approve, burn, attestation, mint)
- `src/components/TransferForm.tsx`: Main transfer interface
- `src/components/WalletConnect.tsx`: Wallet connection component
- `src/types/cctp.ts`: TypeScript interfaces for CCTP transfers

## Development Commands

- Start development server: `npm run dev`
- Build for production: `npm run build`
- Type checking: `npm run typecheck`
- Preview production build: `npm run preview`

## Environment Setup

1. Copy `.env.example` to `.env`
2. Get a WalletConnect Project ID from https://cloud.walletconnect.com/
3. Set `VITE_WALLET_CONNECT_PROJECT_ID` in your `.env` file

## CCTP Transfer Flow

1. **Approval**: Approve USDC spending on source chain
2. **Burn**: Call `depositForBurn` on TokenMessenger contract
3. **Attestation**: Wait for Circle's attestation service to verify the burn
4. **Mint**: Call `receiveMessage` on destination chain's MessageTransmitter

## Contract Addresses

The app uses mainnet CCTP contracts. Contract addresses are defined in `src/config/cctp.ts`:
- TokenMessenger: Handles burn operations
- MessageTransmitter: Handles mint operations  
- USDC: Native USDC token contracts

## Important Notes

- Always use mainnet contract addresses (defined in cctp.ts)
- USDC has 6 decimal places - use `parseUnits(amount, 6)` for conversions
- Attestation polling uses Circle's production API at `https://iris-api.circle.com`
- Fast transfers use `minFinalityThreshold: 1000` in depositForBurn calls