import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base, optimism, arbitrum, mainnet, polygon, avalanche, linea, sei } from 'wagmi/chains'
import { defineChain } from 'viem'

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'your-project-id'

// Define custom chains not available in wagmi/chains
const unichain = defineChain({
  id: 130,
  name: 'Unichain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.unichain.org'] },
  },
  blockExplorers: {
    default: { name: 'Uniscan', url: 'https://uniscan.xyz' },
  },
})

const worldchain = defineChain({
  id: 480,
  name: 'World Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://worldchain-mainnet.rpc.thirdweb.com'] },
  },
  blockExplorers: {
    default: { name: 'World Chain Explorer', url: 'https://worldscan.org' },
  },
})

const sonic = defineChain({
  id: 146,
  name: 'Sonic',
  nativeCurrency: { name: 'Sonic', symbol: 'S', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.soniclabs.com'] },
  },
  blockExplorers: {
    default: { name: 'Sonic Explorer', url: 'https://sonicscan.org' },
  },
})

export const config = getDefaultConfig({
  appName: 'Circle CCTP v2',
  projectId,
  chains: [mainnet, base, optimism, arbitrum, avalanche, polygon, linea, unichain, worldchain, sei, sonic],
  ssr: false,
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}