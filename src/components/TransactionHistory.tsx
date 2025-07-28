import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { transferStorage, type StoredTransfer } from '../utils/transferStorage'
import { useCCTP } from '../hooks/useCCTP'

const CHAIN_INFO = {
  1: { name: 'Ethereum', color: '#627EEA', icon: '⟠' },
  8453: { name: 'Base', color: '#0052FF', icon: '🔵' }, 
  10: { name: 'Optimism', color: '#FF0420', icon: '🔴' },
  42161: { name: 'Arbitrum', color: '#2D374B', icon: '🔷' },
} as const

const STATUS_INFO = {
  idle: { color: '#a0aec0', text: 'Idle' },
  switching_chain: { color: '#667eea', text: 'Switching' },
  approving: { color: '#667eea', text: 'Approving' },
  burning: { color: '#667eea', text: 'Burning' }, 
  waiting_attestation: { color: '#ed8936', text: 'Waiting (~20min)' },
  minting: { color: '#667eea', text: 'Minting' },
  completed: { color: '#38a169', text: 'Completed' },
  error: { color: '#e53e3e', text: 'Failed' },
} as const

export function TransactionHistory() {
  const { address } = useAccount()
  const { resumeTransfer, transferStatus } = useCCTP()
  const [transfers, setTransfers] = useState<StoredTransfer[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (address) {
      const userTransfers = transferStorage.getTransfers(address)
      setTransfers(userTransfers)
      
      // Cleanup old transfers
      transferStorage.cleanup()
    }
  }, [address])

  const handleResumeTransfer = async (transfer: StoredTransfer) => {
    if (!transfer.burnTxHash) {
      alert('Cannot resume transfer: No burn transaction hash found')
      return
    }

    try {
      await resumeTransfer(transfer.id, transfer.burnTxHash, transfer.sourceChain, transfer.destinationChain)
    } catch (error) {
      console.error('Failed to resume transfer:', error)
      alert(`Failed to resume transfer: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const getChainExplorer = (chainId: number, txHash: string) => {
    const explorers = {
      1: 'https://etherscan.io/tx/',
      8453: 'https://basescan.org/tx/',
      10: 'https://optimistic.etherscan.io/tx/',
      42161: 'https://arbiscan.io/tx/',
    }
    return `${explorers[chainId as keyof typeof explorers] || 'https://etherscan.io/tx/'}${txHash}`
  }

  const pendingTransfers = transfers.filter(t => 
    t.status !== 'completed' && t.status !== 'error'
  )
  const completedTransfers = transfers.filter(t => 
    t.status === 'completed' || t.status === 'error'
  )

  if (!address) {
    return null
  }

  return (
    <div className="transaction-history">
      <button 
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="history-toggle"
      >
        <span className="history-icon">📜</span>
        Transaction History ({transfers.length})
        <span className={`toggle-arrow ${isExpanded ? 'expanded' : ''}`}>▶</span>
      </button>
      
      {isExpanded && (
        <div className="history-panel">
          {transfers.length === 0 ? (
            <div className="no-transfers">
              <div className="no-transfers-icon">🔄</div>
              <p>No transfers found</p>
              <span>Your CCTP transfers will appear here</span>
            </div>
          ) : (
            <>
              {pendingTransfers.length > 0 && (
                <div className="transfers-section">
                  <div className="section-header">
                    <h4>🟡 Active Transfers</h4>
                    <span className="section-count">{pendingTransfers.length}</span>
                  </div>
                  {pendingTransfers.map(transfer => (
                    <div key={transfer.id} className="transfer-card active">
                      <div className="transfer-main">
                        <div className="transfer-route">
                          <div className="chain-info">
                            <span className="chain-icon" style={{ color: CHAIN_INFO[transfer.sourceChain as keyof typeof CHAIN_INFO]?.color }}>
                              {CHAIN_INFO[transfer.sourceChain as keyof typeof CHAIN_INFO]?.icon}
                            </span>
                            <span className="chain-name">
                              {CHAIN_INFO[transfer.sourceChain as keyof typeof CHAIN_INFO]?.name}
                            </span>
                          </div>
                          <div className="route-arrow">→</div>
                          <div className="chain-info">
                            <span className="chain-icon" style={{ color: CHAIN_INFO[transfer.destinationChain as keyof typeof CHAIN_INFO]?.color }}>
                              {CHAIN_INFO[transfer.destinationChain as keyof typeof CHAIN_INFO]?.icon}
                            </span>
                            <span className="chain-name">
                              {CHAIN_INFO[transfer.destinationChain as keyof typeof CHAIN_INFO]?.name}
                            </span>
                          </div>
                        </div>
                        
                        <div className="transfer-amount">
                          <span className="usdc-icon">💰</span>
                          <span className="amount-value">{formatUnits(BigInt(transfer.amount), 6)}</span>
                          <span className="amount-currency">USDC</span>
                        </div>
                      </div>

                      <div className="transfer-details">
                        <div className="status-row">
                          <div className="status-badge-container">
                            <div 
                              className="status-dot"
                              style={{ backgroundColor: STATUS_INFO[transfer.status]?.color }}
                            />
                            <span className="status-text">{STATUS_INFO[transfer.status]?.text}</span>
                          </div>
                          <span className="transfer-time">{formatTime(transfer.updatedAt)}</span>
                        </div>

                        {transfer.status === 'waiting_attestation' && transfer.burnTxHash && (
                          <div className="transfer-actions">
                            <button
                              onClick={() => handleResumeTransfer(transfer)}
                              disabled={transferStatus.status !== 'idle'}
                              className="resume-btn"
                            >
                              ▶ Resume Transfer
                            </button>
                          </div>
                        )}

                        {transfer.burnTxHash && (
                          <div className="tx-links">
                            <a 
                              href={getChainExplorer(transfer.sourceChain, transfer.burnTxHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="tx-link"
                            >
                              🔗 View burn tx
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {completedTransfers.length > 0 && (
                <div className="transfers-section">
                  <div className="section-header">
                    <h4>📋 Recent Transfers</h4>
                    <span className="section-count">{completedTransfers.length}</span>
                  </div>
                  {completedTransfers.slice(0, 5).map(transfer => (
                    <div key={transfer.id} className={`transfer-card ${transfer.status}`}>
                      <div className="transfer-main">
                        <div className="transfer-route">
                          <div className="chain-info">
                            <span className="chain-icon" style={{ color: CHAIN_INFO[transfer.sourceChain as keyof typeof CHAIN_INFO]?.color }}>
                              {CHAIN_INFO[transfer.sourceChain as keyof typeof CHAIN_INFO]?.icon}
                            </span>
                            <span className="chain-name">
                              {CHAIN_INFO[transfer.sourceChain as keyof typeof CHAIN_INFO]?.name}
                            </span>
                          </div>
                          <div className="route-arrow">→</div>
                          <div className="chain-info">
                            <span className="chain-icon" style={{ color: CHAIN_INFO[transfer.destinationChain as keyof typeof CHAIN_INFO]?.color }}>
                              {CHAIN_INFO[transfer.destinationChain as keyof typeof CHAIN_INFO]?.icon}
                            </span>
                            <span className="chain-name">
                              {CHAIN_INFO[transfer.destinationChain as keyof typeof CHAIN_INFO]?.name}
                            </span>
                          </div>
                        </div>
                        
                        <div className="transfer-amount">
                          <span className="usdc-icon">💰</span>
                          <span className="amount-value">{formatUnits(BigInt(transfer.amount), 6)}</span>
                          <span className="amount-currency">USDC</span>
                        </div>
                      </div>

                      <div className="transfer-details">
                        <div className="status-row">
                          <div className="status-badge-container">
                            <div 
                              className="status-dot"
                              style={{ backgroundColor: STATUS_INFO[transfer.status]?.color }}
                            />
                            <span className="status-text">{STATUS_INFO[transfer.status]?.text}</span>
                          </div>
                          <span className="transfer-time">{formatTime(transfer.updatedAt)}</span>
                        </div>

                        <div className="tx-links">
                          {transfer.burnTxHash && (
                            <a 
                              href={getChainExplorer(transfer.sourceChain, transfer.burnTxHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="tx-link"
                            >
                              🔗 Burn tx
                            </a>
                          )}
                          {transfer.mintTxHash && (
                            <a 
                              href={getChainExplorer(transfer.destinationChain, transfer.mintTxHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="tx-link"
                            >
                              🔗 Mint tx
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}