export interface CCTPTransfer {
  amount: bigint
  sourceChain: number
  destinationChain: number
  destinationAddress: string
  maxFee?: bigint
  useFastTransfer?: boolean
}

export interface AttestationResponse {
  message: string
  attestation: string
  status: 'pending' | 'complete' | 'pending_confirmations'
  eventNonce?: string
  cctpVersion?: number
  delayReason?: string
}

export interface TransferStatus {
  txHash?: string
  burnTxHash?: string
  mintTxHash?: string
  status: 'idle' | 'switching_chain' | 'approving' | 'burning' | 'waiting_attestation' | 'attestation_ready' | 'minting' | 'completed' | 'error'
  error?: string
  attestation?: AttestationResponse
}