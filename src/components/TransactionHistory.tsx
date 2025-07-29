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
  43114: { name: 'Avalanche', color: '#E84142', icon: '🔺' },
  137: { name: 'Polygon', color: '#8247E5', icon: '🟣' },
  59144: { name: 'Linea', color: '#121212', icon: '◼️' },
  130: { name: 'Unichain', color: '#FF007A', icon: '🦄' },
  480: { name: 'World Chain', color: '#000000', icon: '🌍' },
  1329: { name: 'Sei', color: '#D42222', icon: '🔴' },
  146: { name: 'Sonic', color: '#6366F1', icon: '💫' },
} as const

const STATUS_INFO = {
  idle: { color: '#a0aec0', text: 'Idle' },
  switching_chain: { color: '#667eea', text: 'Switching Chain' },
  approving: { color: '#667eea', text: 'Approving USDC' },
  burning: { color: '#667eea', text: 'Burning on Source' }, 
  waiting_attestation: { color: '#ed8936', text: 'Awaiting Attestation (~20min)' },
  attestation_ready: { color: '#38a169', text: 'Ready to Redeem!' },
  minting: { color: '#667eea', text: 'Minting on Destination' },
  completed: { color: '#38a169', text: 'Transfer Complete' },
  error: { color: '#e53e3e', text: 'Transfer Failed' },
} as const

export function TransactionHistory() {
  const { address } = useAccount()
  const { resumeTransfer, transferStatus, redeemTransfer } = useCCTP()
  const [transfers, setTransfers] = useState<StoredTransfer[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  const getDomainId = (chainId: number): string => {
    const domainMap: Record<number, string> = {
      1: '0',      // Ethereum
      43114: '1',  // Avalanche  
      10: '2',     // Optimism
      42161: '3',  // Arbitrum
      8453: '6',   // Base
      137: '7',    // Polygon
      130: '10',   // Unichain
      59144: '11', // Linea
      146: '13',   // Sonic
      480: '14',   // World Chain
      1329: '16'   // Sei
    }
    return domainMap[chainId] || '0'
  }

  useEffect(() => {
    if (address) {
      const userTransfers = transferStorage.getTransfers(address)
      setTransfers(userTransfers)
      
      // Cleanup old transfers
      transferStorage.cleanup()
      
      // Auto-recover stuck transfers
      recoverStuckTransfers(userTransfers)
    }
  }, [address])

  const recoverStuckTransfers = async (transfers: StoredTransfer[]) => {
    const stuckTransfers = transfers.filter(t => {
      const ageInHours = (Date.now() - t.updatedAt) / (1000 * 60 * 60)
      
      // Consider transfers stuck if they're in intermediate states for >30 minutes
      const isStuck = (
        (t.status === 'approving' || t.status === 'burning' || t.status === 'switching_chain') &&
        ageInHours > 0.5
      ) || (
        // Or waiting for attestation for >2 hours (should normally take ~20 min)
        t.status === 'waiting_attestation' && ageInHours > 2
      )
      
      return isStuck && t.burnTxHash // Only try recovery if we have a burn transaction
    })

    for (const transfer of stuckTransfers) {
      try {
        // Try to get attestation for stuck transfers
        const domainId = getDomainId(transfer.sourceChain)
        const response = await fetch(`https://iris-api.circle.com/v2/messages/${domainId}?transactionHash=${transfer.burnTxHash}`)
        
        if (response.ok) {
          const data = await response.json()
          const message = data?.messages?.[0]
          
          if (message?.status === 'complete' && message.attestation) {
            // Attestation is ready - update status for manual redemption
            const attestationData = {
              message: message.message,
              attestation: message.attestation,
              status: 'complete' as const,
              eventNonce: message.eventNonce,
              cctpVersion: message.cctpVersion,
            }

            // Set attestation ready - user will need to be on correct chain to redeem
            transferStorage.updateTransfer(transfer.burnTxHash!, {
              status: 'attestation_ready',
              attestation: attestationData
            })

            // Refresh UI to show attestation ready for manual redemption
            setTransfers(transferStorage.getTransfers(address!))
          } else if (message?.status === 'pending_confirmations') {
            // Still waiting - update to waiting_attestation
            transferStorage.updateTransfer(transfer.burnTxHash!, {
              status: 'waiting_attestation'
            })
          } else if (!message) {
            // No message found - likely failed
            const ageInHours = (Date.now() - transfer.updatedAt) / (1000 * 60 * 60)
            if (ageInHours > 4) {
              transferStorage.updateTransfer(transfer.burnTxHash!, {
                status: 'error',
                error: 'Transfer appears to have failed or was not found on Circle\'s network'
              })
            }
          }
        }
      } catch (error) {
        console.error('Failed to recover stuck transfer:', transfer.id, error)
      }
    }

    // Refresh transfers if any were updated
    if (stuckTransfers.length > 0) {
      setTransfers(transferStorage.getTransfers(address!))
    }
  }

  // Check for attestations on pending transfers
  useEffect(() => {
    if (!address) return

    const checkPendingAttestations = async () => {
      const pendingTransfers = transfers.filter(t => 
        t.burnTxHash && 
        !t.attestation &&
        t.status !== 'completed' && 
        t.status !== 'error'
      )

      for (const transfer of pendingTransfers) {
        try {
          const domainId = getDomainId(transfer.sourceChain)
          const response = await fetch(`https://iris-api.circle.com/v2/messages/${domainId}?transactionHash=${transfer.burnTxHash}`)
          
          if (response.ok) {
            const data = await response.json()
            const message = data?.messages?.[0]
            
            if (message?.status === 'complete' && message.attestation) {
              // Update stored transfer with attestation
              const attestationData = {
                message: message.message,
                attestation: message.attestation,
                status: 'complete' as const,
                eventNonce: message.eventNonce,
                cctpVersion: message.cctpVersion,
              }

              transferStorage.updateTransfer(transfer.burnTxHash!, {
                status: 'attestation_ready',
                attestation: attestationData
              })
              
              // Refresh UI to show attestation ready for manual redemption
              setTransfers(transferStorage.getTransfers(address))
            }
          }
        } catch (error) {
          console.error('Failed to check attestation for transfer:', transfer.id, error)
        }
      }
    }

    // Check immediately and then every 2 minutes for waiting transfers
    if (transfers.some(t => t.status === 'waiting_attestation')) {
      checkPendingAttestations()
      const interval = setInterval(checkPendingAttestations, 30000) // Check every 30 seconds for faster response
      return () => clearInterval(interval)
    }

    // Also run recovery check every 5 minutes for stuck transfers
    const hasStuckTransfers = transfers.some(t => {
      const ageInHours = (Date.now() - t.updatedAt) / (1000 * 60 * 60)
      return (
        (t.status === 'approving' || t.status === 'burning' || t.status === 'switching_chain') &&
        ageInHours > 0.5
      ) || (
        t.status === 'waiting_attestation' && ageInHours > 2
      )
    })

    if (hasStuckTransfers) {
      const recoveryInterval = setInterval(() => recoverStuckTransfers(transfers), 300000) // 5 minutes
      return () => clearInterval(recoveryInterval)
    }
  }, [address, transfers])

  const handleResumeTransfer = async (transfer: StoredTransfer) => {
    if (!transfer.burnTxHash) {
      transferStorage.updateTransfer(transfer.id, {
        error: 'Cannot resume transfer: No transaction hash found'
      })
      setTransfers(transferStorage.getTransfers(address || ''))
      return
    }

    try {
      await resumeTransfer(transfer.id, transfer.burnTxHash, transfer.sourceChain, transfer.destinationChain)
    } catch (error) {
      console.error('Failed to resume transfer:', error)
      transferStorage.updateTransfer(transfer.burnTxHash, {
        error: `Resume failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
      setTransfers(transferStorage.getTransfers(address || ''))
    }
  }

  const handleRedeemTransfer = async (transfer: StoredTransfer) => {
    if (!transfer.burnTxHash || !transfer.attestation) {
      transferStorage.updateTransfer(transfer.id, {
        error: 'Cannot redeem: Missing transaction data'
      })
      setTransfers(transferStorage.getTransfers(address || ''))
      return
    }

    try {
      await redeemTransfer(transfer.burnTxHash, transfer.destinationChain, transfer.attestation)
      // Refresh transfers after redeeming
      setTransfers(transferStorage.getTransfers(address || ''))
    } catch (error) {
      console.error('Failed to redeem transfer:', error)
      transferStorage.updateTransfer(transfer.burnTxHash, {
        error: `Redemption failed: ${error instanceof Error ? error.message : 'Please try again'}`
      })
      setTransfers(transferStorage.getTransfers(address || ''))
    }
  }

  const handleCheckStatus = async (transfer: StoredTransfer) => {
    if (!transfer.burnTxHash) {
      transferStorage.updateTransfer(transfer.id, {
        error: 'Cannot check status: No transaction hash found'
      })
      setTransfers(transferStorage.getTransfers(address || ''))
      return
    }

    try {
      const domainId = getDomainId(transfer.sourceChain)
      const response = await fetch(`https://iris-api.circle.com/v2/messages/${domainId}?transactionHash=${transfer.burnTxHash}`)
      
      if (response.ok) {
        const data = await response.json()
        const message = data?.messages?.[0]
        
        if (message?.status === 'complete' && message.attestation) {
          // Update stored transfer with attestation
          transferStorage.updateTransfer(transfer.burnTxHash, {
            status: 'attestation_ready',
            attestation: {
              message: message.message,
              attestation: message.attestation,
              status: 'complete',
              eventNonce: message.eventNonce,
              cctpVersion: message.cctpVersion,
            },
            error: 'Attestation ready! Click "Redeem Now" to complete your transfer.'
          })
          setTransfers(transferStorage.getTransfers(address!))
        } else if (message?.status === 'pending_confirmations') {
          transferStorage.updateTransfer(transfer.burnTxHash, {
            status: 'waiting_attestation',
            error: 'Transfer confirmed on blockchain. Waiting for attestation (~20 minutes).'
          })
          setTransfers(transferStorage.getTransfers(address!))
        } else {
          transferStorage.updateTransfer(transfer.burnTxHash, {
            error: 'Transfer still processing. Please wait and check again later.'
          })
          setTransfers(transferStorage.getTransfers(address!))
        }
      } else {
        transferStorage.updateTransfer(transfer.burnTxHash, {
          error: 'Unable to check status. Please try again later.'
        })
        setTransfers(transferStorage.getTransfers(address!))
      }
    } catch (error) {
      console.error('Failed to check transfer status:', error)
      transferStorage.updateTransfer(transfer.burnTxHash, {
        error: 'Status check failed. Please try again.'
      })
      setTransfers(transferStorage.getTransfers(address!))
    }
  }

  const handleClearHistory = () => {
    if (!address) return
    
    // For now, require double-click to clear (can be improved with a modal later)
    const confirmation = confirm('Are you sure you want to clear all transaction history? This action cannot be undone.')
    if (confirmation) {
      transferStorage.clearTransfers(address)
      setTransfers([])
    }
  }

  const handleRemoveTransfer = (transferId: string) => {
    transferStorage.removeTransfer(transferId)
    if (address) {
      setTransfers(transferStorage.getTransfers(address))
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
      43114: 'https://snowtrace.io/tx/',
      137: 'https://polygonscan.com/tx/',
      59144: 'https://lineascan.build/tx/',
      130: 'https://uniscan.xyz/tx/',
      480: 'https://worldscan.org/tx/',
      1329: 'https://seitrace.com/tx/',
      146: 'https://sonicscan.org/tx/',
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
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button 
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="history-toggle"
          style={{ flex: 1 }}
        >
          <span className="history-icon">📜</span>
          Transaction History ({transfers.length})
          <span className={`toggle-arrow ${isExpanded ? 'expanded' : ''}`}>▶</span>
        </button>
        
        {transfers.length > 0 && (
          <button
            type="button"
            onClick={handleClearHistory}
            className="clear-history-btn"
            style={{
              background: '#e53e3e',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
            title="Clear all transaction history"
          >
            🗑️ Clear
          </button>
        )}
      </div>
      
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
                            <span className="chain-icon" style={{ color: CHAIN_INFO[transfer.sourceChain as keyof typeof CHAIN_INFO]?.color || '#666' }}>
                              {CHAIN_INFO[transfer.sourceChain as keyof typeof CHAIN_INFO]?.icon || '⚪'}
                            </span>
                            <span className="chain-name">
                              {CHAIN_INFO[transfer.sourceChain as keyof typeof CHAIN_INFO]?.name || `Chain ${transfer.sourceChain}`}
                            </span>
                          </div>
                          <div className="route-arrow">→</div>
                          <div className="chain-info">
                            <span className="chain-icon" style={{ color: CHAIN_INFO[transfer.destinationChain as keyof typeof CHAIN_INFO]?.color || '#666' }}>
                              {CHAIN_INFO[transfer.destinationChain as keyof typeof CHAIN_INFO]?.icon || '⚪'}
                            </span>
                            <span className="chain-name">
                              {CHAIN_INFO[transfer.destinationChain as keyof typeof CHAIN_INFO]?.name || `Chain ${transfer.destinationChain}`}
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="transfer-time">{formatTime(transfer.updatedAt)}</span>
                            <button
                              onClick={() => handleRemoveTransfer(transfer.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#e53e3e',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                fontSize: '0.875rem'
                              }}
                              title="Remove transfer"
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        {transfer.burnTxHash && transfer.status !== 'completed' && (
                          <div className="transfer-actions">
                            {transfer.status === 'attestation_ready' && transfer.attestation ? (
                              <button
                                onClick={() => handleRedeemTransfer(transfer)}
                                disabled={transferStatus.status !== 'idle'}
                                className="resume-btn redeem-btn"
                              >
                                ⚡ Redeem Now
                              </button>
                            ) : transfer.status === 'waiting_attestation' ? (
                              <button
                                onClick={() => handleResumeTransfer(transfer)}
                                disabled={transferStatus.status !== 'idle'}
                                className="resume-btn"
                              >
                                ▶ Resume Transfer
                              </button>
                            ) : (
                              <button
                                onClick={() => handleCheckStatus(transfer)}
                                disabled={transferStatus.status !== 'idle'}
                                className="resume-btn"
                                style={{ background: '#48bb78' }}
                              >
                                🔍 Check Status
                              </button>
                            )}
                          </div>
                        )}

                        {transfer.error && (
                          <div style={{
                            padding: '0.75rem',
                            background: '#fed7d7',
                            border: '1px solid #feb2b2',
                            borderRadius: '6px',
                            color: '#c53030',
                            fontSize: '0.875rem',
                            marginBottom: '1rem',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            maxHeight: '100px',
                            overflow: 'auto'
                          }}>
{transfer.error.length > 200 ? transfer.error.substring(0, 200) + '...' : transfer.error}
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
                            <span className="chain-icon" style={{ color: CHAIN_INFO[transfer.sourceChain as keyof typeof CHAIN_INFO]?.color || '#666' }}>
                              {CHAIN_INFO[transfer.sourceChain as keyof typeof CHAIN_INFO]?.icon || '⚪'}
                            </span>
                            <span className="chain-name">
                              {CHAIN_INFO[transfer.sourceChain as keyof typeof CHAIN_INFO]?.name || `Chain ${transfer.sourceChain}`}
                            </span>
                          </div>
                          <div className="route-arrow">→</div>
                          <div className="chain-info">
                            <span className="chain-icon" style={{ color: CHAIN_INFO[transfer.destinationChain as keyof typeof CHAIN_INFO]?.color || '#666' }}>
                              {CHAIN_INFO[transfer.destinationChain as keyof typeof CHAIN_INFO]?.icon || '⚪'}
                            </span>
                            <span className="chain-name">
                              {CHAIN_INFO[transfer.destinationChain as keyof typeof CHAIN_INFO]?.name || `Chain ${transfer.destinationChain}`}
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="transfer-time">{formatTime(transfer.updatedAt)}</span>
                            <button
                              onClick={() => handleRemoveTransfer(transfer.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#e53e3e',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                fontSize: '0.875rem'
                              }}
                              title="Remove transfer"
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        {transfer.error && (
                          <div style={{
                            padding: '0.75rem',
                            background: '#fed7d7',
                            border: '1px solid #feb2b2',
                            borderRadius: '6px',
                            color: '#c53030',
                            fontSize: '0.875rem',
                            marginBottom: '1rem',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            maxHeight: '100px',
                            overflow: 'auto'
                          }}>
{transfer.error.length > 200 ? transfer.error.substring(0, 200) + '...' : transfer.error}
                          </div>
                        )}

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