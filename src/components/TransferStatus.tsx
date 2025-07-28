import type { TransferStatus as TransferStatusType } from '../types/cctp'

interface TransferStatusProps {
  status: TransferStatusType
  onReset?: () => void
  sourceChain?: number
  destinationChain?: number
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

export function TransferStatus({ status, onReset, sourceChain, destinationChain }: TransferStatusProps) {
  if (status.status === 'idle') {
    return null
  }

  const getStatusMessage = () => {
    switch (status.status) {
      case 'switching_chain':
        return 'Switching to source chain...'
      case 'approving':
        return 'Approving USDC spend...'
      case 'burning':
        return 'Burning USDC on source chain...'
      case 'waiting_attestation':
        return 'Waiting for attestation from Circle... This typically takes 15-20 minutes. You can safely close this page and resume the transfer later using the Transaction History below.'
      case 'attestation_ready':
        return 'Attestation received! Auto-redemption starting...'
      case 'minting':
        return 'Minting USDC on destination chain...'
      case 'completed':
        return 'Transfer completed successfully!'
      case 'error':
        return status.error || 'An error occurred'
      default:
        return 'Processing...'
    }
  }

  const getProgressPercentage = () => {
    switch (status.status) {
      case 'switching_chain':
        return 10
      case 'approving':
        return 25
      case 'burning':
        return 50
      case 'waiting_attestation':
        return 70
      case 'attestation_ready':
        return 85
      case 'minting':
        return 90
      case 'completed':
        return 100
      case 'error':
        return 0
      default:
        return 0
    }
  }

  return (
    <div className={`transfer-status ${status.status}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>Transfer Status</h3>
        {(status.status === 'error' || status.status === 'completed') && onReset && (
          <button 
            onClick={onReset}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: '0.25rem'
            }}
            title="Close"
          >
            ×
          </button>
        )}
      </div>
      
      <div className="status-message">
        {getStatusMessage()}
      </div>

      {status.status !== 'error' && (
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      )}

      {status.txHash && sourceChain && (
        <div className="tx-info">
          <p>Approval Tx: 
            <a 
              href={getChainExplorer(sourceChain, status.txHash)} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {status.txHash.slice(0, 10)}...
            </a>
          </p>
        </div>
      )}

      {status.burnTxHash && sourceChain && (
        <div className="tx-info">
          <p>Burn Tx: 
            <a 
              href={getChainExplorer(sourceChain, status.burnTxHash)} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {status.burnTxHash.slice(0, 10)}...
            </a>
          </p>
        </div>
      )}

      {status.mintTxHash && destinationChain && (
        <div className="tx-info">
          <p>Mint Tx: 
            <a 
              href={getChainExplorer(destinationChain, status.mintTxHash)} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {status.mintTxHash.slice(0, 10)}...
            </a>
          </p>
        </div>
      )}

      {status.attestation && (
        <div className="attestation-info">
          <p>✅ Attestation received from Circle</p>
        </div>
      )}
    </div>
  )
}