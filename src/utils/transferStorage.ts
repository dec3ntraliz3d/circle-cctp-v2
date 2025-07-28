import type { TransferStatus } from '../types/cctp'

export interface StoredTransfer {
  id: string
  walletAddress: string
  sourceChain: number
  destinationChain: number
  amount: string
  destinationAddress: string
  burnTxHash?: string
  mintTxHash?: string
  status: TransferStatus['status']
  error?: string
  attestation?: any
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'cctp_transfers'
const MAX_STORED_TRANSFERS = 50

export const transferStorage = {
  // Get all transfers for a wallet address
  getTransfers(walletAddress: string): StoredTransfer[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []
      
      const allTransfers: StoredTransfer[] = JSON.parse(stored)
      return allTransfers
        .filter(t => t.walletAddress.toLowerCase() === walletAddress.toLowerCase())
        .sort((a, b) => b.createdAt - a.createdAt) // Most recent first
    } catch (error) {
      console.error('Error loading transfers from storage:', error)
      return []
    }
  },

  // Save or update a transfer
  saveTransfer(transfer: StoredTransfer): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      let allTransfers: StoredTransfer[] = stored ? JSON.parse(stored) : []
      
      // Update existing or add new
      const existingIndex = allTransfers.findIndex(t => t.id === transfer.id)
      if (existingIndex >= 0) {
        allTransfers[existingIndex] = { ...transfer, updatedAt: Date.now() }
      } else {
        allTransfers.push({ ...transfer, createdAt: Date.now(), updatedAt: Date.now() })
      }
      
      // Keep only the most recent transfers to avoid storage bloat
      allTransfers = allTransfers
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, MAX_STORED_TRANSFERS)
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allTransfers))
    } catch (error) {
      console.error('Error saving transfer to storage:', error)
    }
  },

  // Get a specific transfer by ID
  getTransfer(transferId: string): StoredTransfer | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null
      
      const allTransfers: StoredTransfer[] = JSON.parse(stored)
      return allTransfers.find(t => t.id === transferId) || null
    } catch (error) {
      console.error('Error loading transfer from storage:', error)
      return null
    }
  },

  // Remove old completed transfers (older than 7 days)
  cleanup(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return
      
      const allTransfers: StoredTransfer[] = JSON.parse(stored)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      
      const cleanedTransfers = allTransfers.filter(t => {
        // Keep if not completed or if recent
        return t.status !== 'completed' || t.updatedAt > sevenDaysAgo
      })
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedTransfers))
    } catch (error) {
      console.error('Error cleaning up storage:', error)
    }
  },

  // Generate a unique transfer ID
  generateId(): string {
    return `cctp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}