import type { TransferStatus as TransferStatusType } from '../types/cctp'

interface TransferStatusProps {
  status: TransferStatusType
  onReset?: () => void
}

export function TransferStatus({ status, onReset }: TransferStatusProps) {
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

      {status.txHash && (
        <div className="tx-info">
          <p>Approval Tx: 
            <a 
              href={`https://etherscan.io/tx/${status.txHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {status.txHash.slice(0, 10)}...
            </a>
          </p>
        </div>
      )}

      {status.burnTxHash && (
        <div className="tx-info">
          <p>Burn Tx: 
            <a 
              href={`https://etherscan.io/tx/${status.burnTxHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {status.burnTxHash.slice(0, 10)}...
            </a>
          </p>
        </div>
      )}

      {status.mintTxHash && (
        <div className="tx-info">
          <p>Mint Tx: 
            <a 
              href={`https://etherscan.io/tx/${status.mintTxHash}`} 
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