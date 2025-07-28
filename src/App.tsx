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
              <p>Powered by Circle CCTP, RainbowKit, wagmi, and viem</p>
            </footer>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App