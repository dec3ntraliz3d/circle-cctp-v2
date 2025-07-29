import '@rainbow-me/rainbowkit/styles.css'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { config } from './config/wagmi'
import { WalletConnect } from './components/WalletConnect'
import { TransferForm } from './components/TransferForm'
import { TransactionHistory } from './components/TransactionHistory'
import './App.css'

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <div className="app">
            <div className="disclaimer-banner">
              <div className="disclaimer-content">
                <span className="disclaimer-icon">⚠️</span>
                <span className="disclaimer-text">
                  <strong>Educational Purpose Only:</strong> This application is for educational and demonstration purposes. 
                  Use at your own risk. Always verify transactions and contract addresses before proceeding.
                </span>
              </div>
            </div>

            <header className="app-header">
              <div className="header-content">
                <div className="header-text">
                  <h1>Circle CCTP v2</h1>
                  <p>Cross-Chain Transfer Protocol</p>
                </div>
                <WalletConnect />
              </div>
            </header>

            <main className="app-main">
              <TransferForm />
              <TransactionHistory />
            </main>

            <footer className="app-footer">
              <div className="footer-content">
                <p>Powered by Circle CCTP, RainbowKit, wagmi, and viem</p>
                <div className="footer-links">
                  <a 
                    href="https://github.com/dec3ntraliz3d/circle-cctp-v2" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="footer-link"
                  >
                    ⭐ Star on GitHub
                  </a>
                  <span className="footer-separator">•</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('sabbir.eth')
                      alert('ENS address copied to clipboard! 🙏')
                    }}
                    className="footer-link tip-button"
                    title="Copy ENS address for tips"
                  >
                    💝 sabbir.eth
                  </button>
                </div>
                <p className="built-by">
                  Built with ❤️ by{' '}
                  <a 
                    href="https://github.com/dec3ntraliz3d" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="author-link"
                  >
                    dec3ntraliz3d
                  </a>
                </p>
              </div>
            </footer>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App