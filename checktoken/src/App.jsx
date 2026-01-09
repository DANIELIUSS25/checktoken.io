import { useState } from 'react';
import TokenScanner from './components/TokenScanner';
import WalletAnalyzer from './components/WalletAnalyzer';
import TrendingFeed from './components/TrendingFeed';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('scanner');

  return (
    <div className="app">
      {/* Ambient background effects */}
      <div className="bg-gradient"></div>
      <div className="bg-grid"></div>
      
      <header className="header">
        <div className="header-inner">
          <a href="/" className="logo">
            <div className="logo-mark">
              <svg viewBox="0 0 32 32" fill="none">
                <rect x="2" y="2" width="28" height="28" rx="6" stroke="currentColor" strokeWidth="2"/>
                <path d="M10 16L14 20L22 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="logo-text">CheckToken</span>
          </a>
          
          <nav className="nav">
            <button 
              className={`nav-btn ${activeTab === 'scanner' ? 'active' : ''}`}
              onClick={() => setActiveTab('scanner')}
            >
              <span className="nav-icon">◎</span>
              Scanner
            </button>
            <button 
              className={`nav-btn ${activeTab === 'wallet' ? 'active' : ''}`}
              onClick={() => setActiveTab('wallet')}
            >
              <span className="nav-icon">◈</span>
              Wallet
            </button>
            <button 
              className={`nav-btn ${activeTab === 'trending' ? 'active' : ''}`}
              onClick={() => setActiveTab('trending')}
            >
              <span className="nav-icon">↗</span>
              Trending
            </button>
          </nav>

          <div className="header-right">
            <div className="network-badge">
              <span className="network-dot"></span>
              Solana
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="main-inner">
          {activeTab === 'scanner' && <TokenScanner />}
          {activeTab === 'wallet' && <WalletAnalyzer />}
          {activeTab === 'trending' && <TrendingFeed />}
        </div>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <span>CheckToken.io</span>
          <span className="footer-divider">·</span>
          <span>Not financial advice</span>
          <span className="footer-divider">·</span>
          <span>DYOR</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
