import { useChainId, useSwitchChain } from 'wagmi'
import { getSupportedChains } from '../config/cctp'

const CHAIN_DATA = {
  1: { name: 'Ethereum', icon: 'https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg' },
  8453: { name: 'Base', icon: 'https://icons.llamao.fi/icons/chains/rsz_base.jpg' },
  10: { name: 'Optimism', icon: 'https://icons.llamao.fi/icons/chains/rsz_optimism.jpg' },
  42161: { name: 'Arbitrum', icon: 'https://icons.llamao.fi/icons/chains/rsz_arbitrum.jpg' },
  43114: { name: 'Avalanche', icon: 'https://icons.llamao.fi/icons/chains/rsz_avalanche.jpg' },
  137: { name: 'Polygon', icon: 'https://icons.llamao.fi/icons/chains/rsz_polygon.jpg' },
  59144: { name: 'Linea', icon: 'https://icons.llamao.fi/icons/chains/rsz_linea.jpg' },
  130: { name: 'Unichain', icon: 'https://icons.llamao.fi/icons/chains/rsz_unichain.jpg' },
  480: { name: 'World Chain', icon: 'https://icons.llamao.fi/icons/chains/rsz_worldcoin.jpg' },
  1329: { name: 'Sei', icon: 'https://icons.llamao.fi/icons/chains/rsz_sei.jpg' },
  146: { name: 'Sonic', icon: 'https://icons.llamao.fi/icons/chains/rsz_sonic.jpg' },
} as const

interface NetworkSelectorProps {
  value: number
  onChange: (chainId: number) => void
  label: string
  isSourceChain?: boolean
}

export function NetworkSelector({ value, onChange, label, isSourceChain = false }: NetworkSelectorProps) {
  const currentChainId = useChainId()
  const { switchChain } = useSwitchChain()
  const supportedChains = getSupportedChains()

  const handleChange = (chainId: number) => {
    onChange(chainId)
    
    // If this is the source chain selector, switch wallet to this chain
    if (isSourceChain && chainId !== currentChainId) {
      switchChain({ chainId: chainId as any })
    }
  }

  return (
    <div className="network-selector">
      <label>{label}</label>
      <div className="network-select-container">
        <div className="selected-network">
          <img 
            src={CHAIN_DATA[value as keyof typeof CHAIN_DATA]?.icon} 
            alt={CHAIN_DATA[value as keyof typeof CHAIN_DATA]?.name}
            className="network-icon"
          />
          <span className="network-name">
            {CHAIN_DATA[value as keyof typeof CHAIN_DATA]?.name}
          </span>
        </div>
        <select 
          value={value} 
          onChange={(e) => handleChange(Number(e.target.value))}
          className="network-select"
        >
          {supportedChains.map((chainId) => {
            const chainData = CHAIN_DATA[chainId as keyof typeof CHAIN_DATA]
            return chainData ? (
              <option key={chainId} value={chainId}>
                {chainData.name}
              </option>
            ) : null
          })}
        </select>
      </div>
    </div>
  )
}