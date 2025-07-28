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
  const { transferUSDC, transferStatus, clearError } = useCCTP()
  
  const [sourceChain, setSourceChain] = useState<ChainId>(currentChainId as ChainId || 1)
  const [destinationChain, setDestinationChain] = useState<ChainId>(8453) // Base
  const [amount, setAmount] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')

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
    
    if (!isConnected || !address) {
      alert('Please connect your wallet')
      return
    }

    if (!amount || !destinationAddress) {
      alert('Please fill in all required fields')
      return
    }

    if (sourceChain === destinationChain) {
      alert('Source and destination chains must be different')
      return
    }

    try {
      const transfer: CCTPTransfer = {
        amount: parseUnits(amount, 6), // USDC has 6 decimals
        sourceChain,
        destinationChain,
        destinationAddress,
      }

      await transferUSDC(transfer)
    } catch (error) {
      console.error('Transfer failed:', error)
    }
  }

  const handleClearError = () => {
    clearError()
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


        <div className="form-actions">
          <button 
            type="submit" 
            className="transfer-btn"
            disabled={transferStatus.status !== 'idle' && transferStatus.status !== 'error'}
          >
            {transferStatus.status === 'idle' || transferStatus.status === 'error' ? 'Transfer USDC' : 'Transfer in Progress...'}
          </button>
        </div>
      </form>

      <ManualRecovery />
    </div>
  )
}