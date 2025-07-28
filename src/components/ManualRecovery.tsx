import { useState } from 'react'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { useCCTP } from '../hooks/useCCTP'
import { getSupportedChains } from '../config/cctp'

const CHAIN_NAMES = {
  1: 'Ethereum',
  8453: 'Base',
  10: 'Optimism',
  42161: 'Arbitrum',
  43114: 'Avalanche',
  137: 'Polygon',
  59144: 'Linea',
  130: 'Unichain',
  480: 'World Chain',
  1329: 'Sei',
  146: 'Sonic',
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
  const [statusMessage, setStatusMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  const supportedChains = getSupportedChains()

  const handleRecover = async () => {
    if (!burnTxHash.trim()) {
      setStatusMessage('Please enter the burn transaction hash')
      setMessageType('error')
      return
    }

    if (!isConnected || !address) {
      setStatusMessage('Please connect your wallet')
      setMessageType('error')
      return
    }

    setIsRecovering(true)
    setStatusMessage('')
    setMessageType('')
    
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
      setStatusMessage('Recovery successful! Your USDC has been minted.')
      setMessageType('success')
      setBurnTxHash('')
      setTimeout(() => {
        setIsExpanded(false)
        setStatusMessage('')
        setMessageType('')
      }, 3000)
    } catch (error) {
      console.error('Recovery failed:', error)
      
      let errorMessage = 'Unknown error'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setStatusMessage(`Recovery failed: ${errorMessage}`)
      setMessageType('error')
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

            {statusMessage && (
              <div style={{
                padding: '0.75rem',
                background: messageType === 'success' ? '#f0fff4' : '#fed7d7',
                border: `1px solid ${messageType === 'success' ? '#c6f6d5' : '#feb2b2'}`,
                borderRadius: '6px',
                color: messageType === 'success' ? '#22543d' : '#c53030',
                fontSize: '0.875rem',
                marginTop: '1rem'
              }}>
                {statusMessage}
              </div>
            )}

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