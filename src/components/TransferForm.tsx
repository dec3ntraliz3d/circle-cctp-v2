import { useState, useEffect } from 'react'
import { parseUnits } from 'viem'
import { useAccount, useChainId } from 'wagmi'
import { useCCTP } from '../hooks/useCCTP'
import { NetworkSelector } from './NetworkSelector'
import { TransferStatus } from './TransferStatus'
import { ManualRecovery } from './ManualRecovery'
import type { CCTPTransfer } from '../types/cctp'
import type { ChainId } from '../config/cctp'

export function TransferForm() {
  const { address, isConnected } = useAccount()
  const currentChainId = useChainId()
  const { transferUSDC, transferStatus, clearError, redeemTransfer } = useCCTP()
  
  const [sourceChain, setSourceChain] = useState<ChainId>(currentChainId as ChainId || 1)
  const [destinationChain, setDestinationChain] = useState<ChainId>(8453) // Base
  const [amount, setAmount] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [useFastTransfer, setUseFastTransfer] = useState(false)
  const [formError, setFormError] = useState('')

  // Keep source chain in sync with wallet connection
  useEffect(() => {
    if (currentChainId) {
      setSourceChain(currentChainId as ChainId)
    }
  }, [currentChainId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear any previous error when starting a new transfer
    if (transferStatus.status === 'error') {
      clearError()
    }
    setFormError('')
    
    if (!isConnected || !address) {
      setFormError('Please connect your wallet')
      return
    }

    if (!amount || !destinationAddress) {
      setFormError('Please fill in all required fields')
      return
    }

    if (sourceChain === destinationChain) {
      setFormError('Source and destination chains must be different')
      return
    }

    try {
      const transfer: CCTPTransfer = {
        amount: parseUnits(amount, 6), // USDC has 6 decimals
        sourceChain,
        destinationChain,
        destinationAddress,
        useFastTransfer,
      }

      await transferUSDC(transfer)
    } catch (error) {
      console.error('Transfer failed:', error)
    }
  }

  const handleClearError = () => {
    clearError()
  }

  const handleRedeem = async () => {
    if (!transferStatus.burnTxHash || !transferStatus.attestation) {
      return
    }

    try {
      await redeemTransfer(transferStatus.burnTxHash, destinationChain, transferStatus.attestation)
    } catch (error) {
      console.error('Redeem failed:', error)
    }
  }

  const handleSourceChainChange = (chainId: number) => {
    // TypeScript-safe way to update the source chain
    setSourceChain(chainId as ChainId)
  }

  const handleDestinationChainChange = (chainId: number) => {
    // TypeScript-safe way to update the destination chain  
    setDestinationChain(chainId as ChainId)
  }

  if (!isConnected) {
    return (
      <div className="transfer-form">
        <p>Please connect your wallet to use CCTP transfers</p>
      </div>
    )
  }

  return (
    <div className="transfer-form">
      <h2>Circle CCTP v2 Transfer</h2>
      
      <TransferStatus status={transferStatus} onReset={handleClearError} />

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <NetworkSelector
            value={sourceChain}
            onChange={handleSourceChainChange}
            label="From Network"
            isSourceChain={true}
          />
        </div>

        <div className="form-group">
          <NetworkSelector
            value={destinationChain}
            onChange={handleDestinationChainChange}
            label="To Network"
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount (USDC)</label>
          <input
            id="amount"
            type="number"
            step="0.000001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            disabled={transferStatus.status !== 'idle' && transferStatus.status !== 'error'}
          />
        </div>

        <div className="form-group">
          <label htmlFor="destination">Destination Address</label>
          <input
            id="destination"
            type="text"
            value={destinationAddress}
            onChange={(e) => setDestinationAddress(e.target.value)}
            placeholder={address || '0x...'}
            disabled={transferStatus.status !== 'idle' && transferStatus.status !== 'error'}
          />
          <button
            type="button"
            onClick={() => setDestinationAddress(address || '')}
            disabled={!address || (transferStatus.status !== 'idle' && transferStatus.status !== 'error')}
            className="use-connected-address"
          >
            Use Connected Address
          </button>
        </div>

        <div className="form-group">
          <label className="fast-transfer-option">
            <input
              type="checkbox"
              checked={useFastTransfer}
              onChange={(e) => setUseFastTransfer(e.target.checked)}
              disabled={transferStatus.status !== 'idle' && transferStatus.status !== 'error'}
            />
            <span className="checkbox-label">
              Fast Transfer (2-15 minutes)
            </span>
          </label>
          <div className="transfer-info">
            <div className="transfer-time">
              {useFastTransfer ? (
                <span className="fast-option">⚡ Fast: 2-15 minutes • Fee: ~0.01% (varies by network)</span>
              ) : (
                <span className="standard-option">🔒 Standard: 15-20 minutes • FREE</span>
              )}
            </div>
          </div>
        </div>

        {formError && (
          <div style={{
            padding: '0.75rem',
            background: '#fed7d7',
            border: '1px solid #feb2b2',
            borderRadius: '6px',
            color: '#c53030',
            fontSize: '0.875rem',
            marginBottom: '1rem'
          }}>
            {formError}
          </div>
        )}

        <div className="form-actions">
          {transferStatus.status === 'attestation_ready' ? (
            <button 
              type="button"
              onClick={handleRedeem}
              className="transfer-btn"
              disabled={false}
              style={{ background: '#38a169' }}
            >
              ⚡ Redeem Now
            </button>
          ) : (
            <button 
              type="submit" 
              className="transfer-btn"
              disabled={transferStatus.status !== 'idle' && transferStatus.status !== 'error'}
            >
              {transferStatus.status === 'idle' || transferStatus.status === 'error' ? 'Transfer USDC' : 'Transfer in Progress...'}
            </button>
          )}
        </div>
      </form>

      <ManualRecovery />
    </div>
  )
}