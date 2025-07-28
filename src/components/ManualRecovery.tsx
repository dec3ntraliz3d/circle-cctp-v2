import { useState } from 'react'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { useCCTP } from '../hooks/useCCTP'
import { getSupportedChains } from '../config/cctp'

const CHAIN_NAMES = {
  1: 'Ethereum',
  8453: 'Base',
  10: 'Optimism',
  42161: 'Arbitrum',
} as const

export function ManualRecovery() {
  const { address, isConnected } = useAccount()
  const currentChainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { manualMint } = useCCTP()
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [burnTxHash, setBurnTxHash] = useState('')
  const [sourceChain, setSourceChain] = useState(8453) // Default to Base
  const [destinationChain, setDestinationChain] = useState(42161) // Default to Arbitrum
  const [isRecovering, setIsRecovering] = useState(false)

  const supportedChains = getSupportedChains()

  const handleRecover = async () => {
    if (!burnTxHash.trim()) {
      alert('Please enter the burn transaction hash')
      return
    }

    if (!isConnected || !address) {
      alert('Please connect your wallet')
      return
    }

    setIsRecovering(true)
    
    try {
      // Switch to destination chain if needed
      if (currentChainId !== destinationChain) {
        console.log(`Switching from chain ${currentChainId} to destination chain ${destinationChain}`)
        switchChain({ chainId: destinationChain as any })
        
        // Wait longer for chain switch and wallet context update
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Double-check that the switch was successful
        // Note: currentChainId might not update immediately due to React state
        console.log('Chain switch completed, proceeding with recovery...')
      }

      await manualMint(burnTxHash.trim(), sourceChain, destinationChain)
      alert('Recovery successful! Your USDC has been minted.')
      setBurnTxHash('')
      setIsExpanded(false)
    } catch (error) {
      console.error('Recovery failed:', error)
      
      let errorMessage = 'Unknown error'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      // Show user-friendly message for chain mismatch
      if (errorMessage.includes('switch to the destination chain')) {
        alert(`${errorMessage}\n\nPlease manually switch to the destination chain in your wallet and try again.`)
      } else {
        alert(`Recovery failed: ${errorMessage}`)
      }
    } finally {
      setIsRecovering(false)
    }
  }

  if (!isConnected) {
    return null
  }

  return (
    <div className="manual-recovery">
      <button 
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="recovery-toggle"
      >
        {isExpanded ? '▼' : '▶'} Manual Recovery
      </button>
      
      {isExpanded && (
        <div className="recovery-panel">
          <h3>Recover Stuck Transfer</h3>
          <p className="recovery-description">
            If your transfer is stuck but the attestation is ready, you can manually complete it here.
          </p>
          
          <div className="recovery-form">
            <div className="form-group">
              <label htmlFor="burnTxHash">Burn Transaction Hash</label>
              <input
                id="burnTxHash"
                type="text"
                value={burnTxHash}
                onChange={(e) => setBurnTxHash(e.target.value)}
                placeholder="0x..."
                disabled={isRecovering}
                className="recovery-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sourceChain">Source Chain</label>
                <select 
                  id="sourceChain"
                  value={sourceChain} 
                  onChange={(e) => setSourceChain(Number(e.target.value))}
                  disabled={isRecovering}
                  className="recovery-select"
                >
                  {supportedChains.map((chainId) => (
                    <option key={chainId} value={chainId}>
                      {CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="destinationChain">Destination Chain</label>
                <select 
                  id="destinationChain"
                  value={destinationChain} 
                  onChange={(e) => setDestinationChain(Number(e.target.value))}
                  disabled={isRecovering}
                  className="recovery-select"
                >
                  {supportedChains.map((chainId) => (
                    <option key={chainId} value={chainId}>
                      {CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="recovery-actions">
              <button
                type="button"
                onClick={handleRecover}
                disabled={!burnTxHash.trim() || isRecovering || sourceChain === destinationChain}
                className="recovery-btn"
              >
                {isRecovering ? 'Recovering...' : 'Recover USDC'}
              </button>
            </div>

            {currentChainId !== destinationChain && (
              <p className="recovery-warning">
                ⚠️ You'll need to switch to {CHAIN_NAMES[destinationChain as keyof typeof CHAIN_NAMES]} to complete the recovery
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}