import { useState, useCallback } from 'react'
import { useAccount, usePublicClient, useWalletClient, useChainId } from 'wagmi'
import { encodeFunctionData } from 'viem'
import axios from 'axios'
import { getContractsForChain, type ChainId } from '../config/cctp'
import { type CCTPTransfer, type TransferStatus, type AttestationResponse } from '../types/cctp'
import { transferStorage, type StoredTransfer } from '../utils/transferStorage'

const USDC_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

const TOKEN_MESSENGER_ABI = [
  {
    type: 'function',
    name: 'depositForBurn',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'destinationDomain', type: 'uint32' },
      { name: 'mintRecipient', type: 'bytes32' },
      { name: 'burnToken', type: 'address' },
      { name: 'destinationCaller', type: 'bytes32' },
      { name: 'maxFee', type: 'uint256' },
      { name: 'minFinalityThreshold', type: 'uint32' },
    ],
    outputs: [],
  },
] as const

const MESSAGE_TRANSMITTER_ABI = [
  {
    type: 'function',
    name: 'receiveMessage',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'message', type: 'bytes' },
      { name: 'attestation', type: 'bytes' },
    ],
    outputs: [],
  },
] as const

export const useCCTP = () => {
  const { address } = useAccount()
  const currentChainId = useChainId()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [transferStatus, setTransferStatus] = useState<TransferStatus>({ status: 'idle' })
  const [currentTransferId, setCurrentTransferId] = useState<string | null>(null)

  // Fast transfer fee rates (in basis points)
  const FAST_TRANSFER_FEES: Record<number, number> = {
    1: 1,      // Ethereum: 1 bps (0.01%)
    8453: 1,   // Base: 1 bps (0.01%)
    10: 1,     // Optimism: 1 bps (0.01%)
    42161: 1,  // Arbitrum: 1 bps (0.01%)
    43114: 1,  // Avalanche: 1 bps (0.01%)
    137: 1,    // Polygon: 1 bps (0.01%)
    59144: 14, // Linea: 14 bps (0.14%)
    130: 1,    // Unichain: 1 bps (0.01%)
    480: 1,    // World Chain: 1 bps (0.01%)
    1329: 1,   // Sei: 1 bps (0.01%)
    146: 1,    // Sonic: 1 bps (0.01%)
  }

  const calculateFastTransferFee = useCallback((amount: bigint, chainId: number): bigint => {
    const feeRateBps = FAST_TRANSFER_FEES[chainId] || 1
    return (amount * BigInt(feeRateBps)) / BigInt(10000) // Convert basis points to percentage
  }, [])

  const formatAddressToBytes32 = useCallback((address: string): `0x${string}` => {
    return `0x000000000000000000000000${address.slice(2).toLowerCase()}` as `0x${string}`
  }, [])

  // Save transfer state to localStorage
  const saveTransferState = useCallback((transferId: string, transfer: CCTPTransfer, status: TransferStatus) => {
    if (!address) return

    const storedTransfer: StoredTransfer = {
      id: transferId,
      walletAddress: address,
      sourceChain: transfer.sourceChain,
      destinationChain: transfer.destinationChain,
      amount: transfer.amount.toString(),
      destinationAddress: transfer.destinationAddress,
      burnTxHash: status.burnTxHash,
      mintTxHash: status.mintTxHash,
      status: status.status,
      error: status.error,
      attestation: status.attestation,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    transferStorage.saveTransfer(storedTransfer)
  }, [address])

  // Update transfer status and save to localStorage
  const updateTransferStatus = useCallback((newStatus: TransferStatus) => {
    setTransferStatus(newStatus)
    
    if (currentTransferId && address) {
      const existing = transferStorage.getTransfer(currentTransferId)
      if (existing) {
        const updated: StoredTransfer = {
          ...existing,
          status: newStatus.status,
          error: newStatus.error,
          burnTxHash: newStatus.burnTxHash || existing.burnTxHash,
          mintTxHash: newStatus.mintTxHash || existing.mintTxHash,
          attestation: newStatus.attestation || existing.attestation,
          updatedAt: Date.now(),
        }
        transferStorage.saveTransfer(updated)
      }
    }
  }, [currentTransferId, address])

  const checkAllowance = useCallback(async (
    chainId: ChainId,
    amount: bigint
  ): Promise<boolean> => {
    if (!address || !publicClient) return false

    const contracts = getContractsForChain(chainId)
    
    try {
      const allowance = await publicClient.readContract({
        address: contracts.usdc as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: [address, contracts.tokenMessenger as `0x${string}`],
      })
      
      return allowance >= amount
    } catch (error) {
      console.error('Error checking allowance:', error)
      return false
    }
  }, [address, publicClient])

  const approveUSDC = useCallback(async (
    chainId: ChainId,
    amount: bigint
  ): Promise<string> => {
    if (!walletClient || !address) throw new Error('Wallet not connected')

    const contracts = getContractsForChain(chainId)
    
    const hash = await walletClient.sendTransaction({
      to: contracts.usdc as `0x${string}`,
      data: encodeFunctionData({
        abi: USDC_ABI,
        functionName: 'approve',
        args: [contracts.tokenMessenger as `0x${string}`, amount],
      }),
    })

    return hash
  }, [walletClient, address])

  const burnUSDC = useCallback(async (transfer: CCTPTransfer): Promise<string> => {
    if (!walletClient || !address) throw new Error('Wallet not connected')

    const sourceContracts = getContractsForChain(transfer.sourceChain as ChainId)
    const destinationContracts = getContractsForChain(transfer.destinationChain as ChainId)
    
    const destinationAddressBytes32 = formatAddressToBytes32(transfer.destinationAddress)
    const destinationCallerBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`

    const hash = await walletClient.sendTransaction({
      to: sourceContracts.tokenMessenger as `0x${string}`,
      data: encodeFunctionData({
        abi: TOKEN_MESSENGER_ABI,
        functionName: 'depositForBurn',
        args: [
          transfer.amount,
          destinationContracts.domain,
          destinationAddressBytes32,
          sourceContracts.usdc as `0x${string}`,
          destinationCallerBytes32,
          transfer.useFastTransfer ? calculateFastTransferFee(transfer.amount, transfer.sourceChain) : 0n, // maxFee
          transfer.useFastTransfer ? 1000 : 2000, // minFinalityThreshold
        ],
      }),
    })

    return hash
  }, [walletClient, address, formatAddressToBytes32, calculateFastTransferFee])

  const retrieveAttestation = useCallback(async (
    transactionHash: string,
    sourceDomain: number
  ): Promise<AttestationResponse> => {
    const url = `https://iris-api.circle.com/v2/messages/${sourceDomain}?transactionHash=${transactionHash}`
    
    while (true) {
      try {
        const response = await axios.get(url)
        
        const message = response.data?.messages?.[0]
        if (message?.status === 'complete') {
          return {
            message: message.message,
            attestation: message.attestation,
            status: 'complete',
            eventNonce: message.eventNonce,
            cctpVersion: message.cctpVersion,
            delayReason: message.delayReason,
          }
        }
        
        // Handle pending_confirmations status for v2
        if (message?.status === 'pending_confirmations') {
          console.log('Transfer pending confirmations, delay reason:', message.delayReason)
        }
        
        await new Promise(resolve => setTimeout(resolve, 60000)) // Check every minute
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          await new Promise(resolve => setTimeout(resolve, 60000)) // Check every minute
          continue
        }
        throw error
      }
    }
  }, [])

  const mintUSDC = useCallback(async (
    chainId: ChainId,
    attestation: AttestationResponse
  ): Promise<string> => {
    if (!walletClient) throw new Error('Wallet not connected')

    // Verify we're on the correct destination chain
    if (currentChainId !== chainId) {
      throw new Error(`Please switch to the destination chain (${chainId}) before minting`)
    }

    const contracts = getContractsForChain(chainId)
    
    const hash = await walletClient.sendTransaction({
      to: contracts.messageTransmitter as `0x${string}`,
      data: encodeFunctionData({
        abi: MESSAGE_TRANSMITTER_ABI,
        functionName: 'receiveMessage',
        args: [attestation.message as `0x${string}`, attestation.attestation as `0x${string}`],
      }),
    })

    return hash
  }, [walletClient, currentChainId])

  const transferUSDC = useCallback(async (transfer: CCTPTransfer) => {
    const transferId = transferStorage.generateId()
    setCurrentTransferId(transferId)
    
    try {
      // Verify we're on the correct source chain
      if (currentChainId !== transfer.sourceChain) {
        throw new Error('Please switch to the source chain first using the "From Network" selector.')
      }

      updateTransferStatus({ status: 'approving' })
      // Don't save to history yet - wait until burn transaction succeeds

      // Calculate total amount needed (transfer amount + fee for fast transfers)
      const feeAmount = transfer.useFastTransfer ? calculateFastTransferFee(transfer.amount, transfer.sourceChain) : 0n
      const totalAmountNeeded = transfer.amount + feeAmount

      // Check if approval is needed
      const hasAllowance = await checkAllowance(transfer.sourceChain as ChainId, totalAmountNeeded)
      
      if (!hasAllowance) {
        const approveTx = await approveUSDC(transfer.sourceChain as ChainId, totalAmountNeeded)
        updateTransferStatus({ status: 'approving', txHash: approveTx })
        
        // Wait for approval confirmation
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: approveTx as `0x${string}` })
        }
      }

      // Burn USDC on source chain
      updateTransferStatus({ status: 'burning' })
      const burnTx = await burnUSDC(transfer)
      updateTransferStatus({ status: 'burning', burnTxHash: burnTx })

      // Wait for burn confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: burnTx as `0x${string}` })
      }

      // Now save to history - we have a concrete burn transaction to track
      saveTransferState(transferId, transfer, { status: 'waiting_attestation', burnTxHash: burnTx })

      // Wait for attestation (this can take up to 20 minutes)
      updateTransferStatus({ status: 'waiting_attestation', burnTxHash: burnTx })
      const sourceContracts = getContractsForChain(transfer.sourceChain as ChainId)
      const attestation = await retrieveAttestation(burnTx, sourceContracts.domain)
      
      // Show attestation ready state briefly
      updateTransferStatus({ 
        status: 'attestation_ready', 
        burnTxHash: burnTx, 
        attestation 
      })

      // Auto-trigger minting after brief delay to show ready state
      await new Promise(resolve => setTimeout(resolve, 2000))

      try {
        // Mint USDC on destination chain
        updateTransferStatus({ status: 'minting', burnTxHash: burnTx, attestation })
        const mintTx = await mintUSDC(transfer.destinationChain as ChainId, attestation)
        
        updateTransferStatus({ 
          status: 'completed', 
          burnTxHash: burnTx, 
          mintTxHash: mintTx, 
          attestation 
        })

        // Update stored transfer
        transferStorage.updateTransfer(burnTx, {
          status: 'completed',
          mintTxHash: mintTx,
          completedAt: new Date().toISOString()
        })
      } catch (mintError) {
        console.error('Auto-minting failed:', mintError)
        updateTransferStatus({ 
          status: 'attestation_ready', 
          burnTxHash: burnTx, 
          attestation,
          error: 'Auto-redemption failed. Use "Redeem Now" to complete manually.'
        })
        
        // Store the ready state so user can manually redeem later
        transferStorage.updateTransfer(burnTx, {
          status: 'attestation_ready',
          attestation: attestation,
          error: 'Auto-redemption failed'
        })
        return // Don't throw, let user manually redeem
      }

    } catch (error) {
      let userFriendlyError = 'Unknown error occurred'
      
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        
        if (errorMessage.includes('user rejected') || errorMessage.includes('user denied')) {
          userFriendlyError = 'Transaction was cancelled by user'
        } else if (errorMessage.includes('insufficient funds')) {
          userFriendlyError = 'Insufficient funds for transaction'
        } else if (errorMessage.includes('network')) {
          userFriendlyError = 'Network connection error. Please try again.'
        } else if (errorMessage.includes('allowance')) {
          userFriendlyError = 'Token approval failed. Please try again.'
        } else if (errorMessage.includes('attestation')) {
          userFriendlyError = 'Attestation retrieval failed. Please wait and try again.'
        } else {
          userFriendlyError = 'Transaction failed. Please try again.'
        }
      }
      
      setTransferStatus({ 
        status: 'error', 
        error: userFriendlyError 
      })
      
      // Don't throw if user cancelled
      if (!userFriendlyError.includes('cancelled')) {
        throw error
      }
    }
  }, [currentChainId, checkAllowance, approveUSDC, burnUSDC, retrieveAttestation, mintUSDC, publicClient, calculateFastTransferFee])

  const resumeTransfer = useCallback(async (
    transferId: string,
    burnTxHash: string,
    sourceChain: number,
    destinationChain: number
  ) => {
    setCurrentTransferId(transferId)
    
    try {
      updateTransferStatus({ status: 'waiting_attestation', burnTxHash })
      
      // Get attestation using the burn transaction hash
      const sourceContracts = getContractsForChain(sourceChain as ChainId)
      const attestation = await retrieveAttestation(burnTxHash, sourceContracts.domain)
      
      updateTransferStatus({ 
        status: 'waiting_attestation', 
        burnTxHash, 
        attestation 
      })

      // Mint USDC on destination chain
      updateTransferStatus({ status: 'minting', burnTxHash, attestation })
      const mintTx = await mintUSDC(destinationChain as ChainId, attestation)
      
      updateTransferStatus({ 
        status: 'completed', 
        burnTxHash, 
        mintTxHash: mintTx, 
        attestation 
      })

    } catch (error) {
      let userFriendlyError = 'Resume failed'
      
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        
        if (errorMessage.includes('user rejected') || errorMessage.includes('user denied')) {
          userFriendlyError = 'Transaction was cancelled by user'
        } else if (errorMessage.includes('switch to the destination chain')) {
          userFriendlyError = error.message
        } else {
          userFriendlyError = `Resume failed: ${error.message}`
        }
      }
      
      updateTransferStatus({ 
        status: 'error', 
        error: userFriendlyError,
        burnTxHash 
      })
      
      throw error
    }
  }, [retrieveAttestation, mintUSDC, updateTransferStatus])

  const clearError = useCallback(() => {
    if (transferStatus.status === 'error' || transferStatus.status === 'completed') {
      setTransferStatus({ status: 'idle' })
    }
  }, [transferStatus.status])

  const manualMint = useCallback(async (
    burnTxHash: string,
    sourceChain: number,
    destinationChain: number
  ) => {
    try {
      setTransferStatus({ status: 'waiting_attestation' })
      
      // Get attestation using the burn transaction hash
      const sourceContracts = getContractsForChain(sourceChain as ChainId)
      const attestation = await retrieveAttestation(burnTxHash, sourceContracts.domain)
      
      if (attestation.status !== 'complete') {
        throw new Error('Attestation not ready yet. Please wait and try again.')
      }

      // Verify we're on the correct destination chain before minting
      if (currentChainId !== destinationChain) {
        throw new Error(`Please switch to the destination chain first. Expected chain: ${destinationChain}, current chain: ${currentChainId}`)
      }

      setTransferStatus({ 
        status: 'minting', 
        burnTxHash,
        attestation 
      })

      // Mint USDC on destination chain
      const mintTx = await mintUSDC(destinationChain as ChainId, attestation)
      
      setTransferStatus({ 
        status: 'completed', 
        burnTxHash, 
        mintTxHash: mintTx, 
        attestation 
      })

      return mintTx
    } catch (error) {
      let userFriendlyError = 'Recovery failed'
      
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        
        if (errorMessage.includes('user rejected') || errorMessage.includes('user denied')) {
          userFriendlyError = 'Transaction was cancelled by user'
        } else if (errorMessage.includes('not ready')) {
          userFriendlyError = 'Attestation not ready yet. Please wait and try again.'
        } else if (errorMessage.includes('already minted') || errorMessage.includes('message already received')) {
          userFriendlyError = 'This transfer has already been completed'
        } else if (errorMessage.includes('switch to the destination chain')) {
          userFriendlyError = error.message
        } else {
          userFriendlyError = `Recovery failed: ${error.message}`
        }
      }
      
      setTransferStatus({ 
        status: 'error', 
        error: userFriendlyError,
        burnTxHash 
      })
      
      throw error
    }
  }, [retrieveAttestation, mintUSDC, currentChainId])

    const redeemTransfer = useCallback(async (burnTxHash: string, destinationChain: number, attestation: AttestationResponse) => {
    try {
      setCurrentTransferId(burnTxHash)
      updateTransferStatus({ 
        status: 'minting', 
        burnTxHash, 
        attestation 
      })

      const mintTx = await mintUSDC(destinationChain as ChainId, attestation)
      
      updateTransferStatus({ 
        status: 'completed', 
        burnTxHash, 
        mintTxHash: mintTx, 
        attestation 
      })

      // Update stored transfer
      transferStorage.updateTransfer(burnTxHash, {
        status: 'completed',
        mintTxHash: mintTx,
        completedAt: new Date().toISOString()
      })

      return mintTx
    } catch (error) {
      updateTransferStatus({ 
        status: 'attestation_ready', 
        burnTxHash, 
        attestation,
        error: error instanceof Error ? error.message : 'Redemption failed'
      })
      throw error
    }
  }, [mintUSDC, updateTransferStatus])

return {
    transferUSDC,
    transferStatus,
    clearError,
    checkAllowance,
    manualMint,
    resumeTransfer,
    redeemTransfer,
  }
}