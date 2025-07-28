// Circle CCTP v2 Contract Addresses for mainnet (Official from Circle)
export const CCTP_CONTRACTS = {
  // Ethereum Mainnet
  1: {
    tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d', // TokenMessengerV2
    messageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64', // MessageTransmitterV2
    usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Official USDC
    domain: 0,
  },
  // Base
  8453: {
    tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d', // TokenMessengerV2
    messageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64', // MessageTransmitterV2
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Official USDC
    domain: 6,
  },
  // Optimism
  10: {
    tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d', // TokenMessengerV2
    messageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64', // MessageTransmitterV2
    usdc: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // Official USDC
    domain: 2,
  },
  // Arbitrum One
  42161: {
    tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d', // TokenMessengerV2
    messageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64', // MessageTransmitterV2
    usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Official USDC
    domain: 3,
  },
  // Avalanche C-Chain
  43114: {
    tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d', // TokenMessengerV2
    messageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64', // MessageTransmitterV2
    usdc: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // Official USDC
    domain: 1,
  },
  // Polygon PoS
  137: {
    tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d', // TokenMessengerV2
    messageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64', // MessageTransmitterV2
    usdc: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // Official USDC
    domain: 7,
  },
  // Linea
  59144: {
    tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d', // TokenMessengerV2
    messageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64', // MessageTransmitterV2
    usdc: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff', // Official USDC
    domain: 11,
  },
  // Unichain
  130: {
    tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d', // TokenMessengerV2
    messageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64', // MessageTransmitterV2
    usdc: '0x078D782b760474a361dDA0AF3839290b0EF57AD6', // Official USDC
    domain: 10,
  },
  // World Chain
  480: {
    tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d', // TokenMessengerV2
    messageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64', // MessageTransmitterV2
    usdc: '0x79A02482A880bCe3F13E09da970dC34dB4cD24D1', // Official USDC
    domain: 14,
  },
  // Sei
  1329: {
    tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d', // TokenMessengerV2
    messageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64', // MessageTransmitterV2
    usdc: '0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392', // Official USDC
    domain: 16,
  },
  // Sonic
  146: {
    tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d', // TokenMessengerV2
    messageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64', // MessageTransmitterV2
    usdc: '0x29219dd400f2Bf60E5a23d13Be72B486D4038894', // Official USDC
    domain: 13,
  },
} as const

export type ChainId = keyof typeof CCTP_CONTRACTS

export const getContractsForChain = (chainId: ChainId) => {
  return CCTP_CONTRACTS[chainId]
}

export const getSupportedChains = () => {
  return Object.keys(CCTP_CONTRACTS).map(Number) as ChainId[]
}