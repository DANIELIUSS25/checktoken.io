import { useState } from 'react';
import { tokenAPI } from '../services/api';
import './WalletAnalyzer.css';

const isValidSolanaAddress = (address) => {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
};

function WalletAnalyzer() {
  const [address, setAddress] = useState('');
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    const trimmed = address.trim();
    if (!trimmed) return;

    if (!isValidSolanaAddress(trimmed)) {
      setError('Invalid Solana address format');
      return;
    }

    setLoading(true);
    setError(null);
    setWalletData(null);

    if (!tokenAPI.isConfigured()) {
      setTimeout(() => {
        setWalletData(getMockWalletData(trimmed));
        setLoading(false);
      }, 1200);
      return;
    }

    const result = await tokenAPI.getWalletInfo(trimmed);
    
    if (result.success) {
      setWalletData(result.data);
    } else {
      setError(result.error || 'Failed to fetch wallet data');
    }
    
    setLoading(false);
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - timestamp * 1000;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="wallet">
      {/* Hero */}
      <div className="wallet-hero">
        <h1 className="wallet-title">
          Track any wallet<span className="accent">.</span>
        </h1>
        <p className="wallet-subtitle">
          View holdings, PnL, and trading history for any Solana wallet.
        </p>

        <div className="wallet-input-group">
          <div className="input-container">
            <input
              type="text"
              className="wallet-input"
              placeholder="Paste wallet address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              spellCheck={false}
            />
            {address && (
              <button className="input-clear" onClick={() => setAddress('')}>×</button>
            )}
          </div>
          <button 
            className="wallet-btn"
            onClick={handleAnalyze}
            disabled={loading || !address.trim()}
          >
            {loading ? <span className="spinner"></span> : 'Analyze'}
          </button>
        </div>

        {!tokenAPI.isConfigured() && (
          <p className="demo-notice">Demo mode — Add API keys to .env for live data</p>
        )}

        {error && (
          <div className="wallet-error">
            <span className="error-icon">!</span>
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {walletData && (
        <div className="wallet-results">
          {/* PnL Overview */}
          <div className="pnl-section">
            <div className="pnl-card">
              <div className="pnl-header">
                <span className="pnl-label">Total PnL</span>
                <span className="pnl-period">All Time</span>
              </div>
              <div className={`pnl-value ${walletData.totalPnl >= 0 ? 'positive' : 'negative'}`}>
                {walletData.totalPnl >= 0 ? '+' : ''}${formatNumber(walletData.totalPnl)}
              </div>
              <div className={`pnl-percent ${walletData.totalPnlPercent >= 0 ? 'positive' : 'negative'}`}>
                {walletData.totalPnlPercent >= 0 ? '+' : ''}{walletData.totalPnlPercent?.toFixed(1)}%
              </div>
            </div>

            <div className="winrate-card">
              <div className="winrate-ring">
                <svg viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="var(--bg-elevated)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="url(#winrate-gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(walletData.winRate || 0) * 2.64} 264`}
                    transform="rotate(-90 50 50)"
                  />
                  <defs>
                    <linearGradient id="winrate-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--accent)" />
                      <stop offset="100%" stopColor="var(--info)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="winrate-inner">
                  <span className="winrate-value">{walletData.winRate?.toFixed(0) || 0}%</span>
                  <span className="winrate-label">Win Rate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-label">Total Trades</span>
              <span className="stat-value">{walletData.totalTrades || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Wins</span>
              <span className="stat-value text-success">{walletData.wins || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Losses</span>
              <span className="stat-value text-danger">{walletData.losses || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">SOL Balance</span>
              <span className="stat-value">{walletData.solBalance?.toFixed(2) || 0}</span>
            </div>
          </div>

          {/* Best/Worst Trades */}
          {walletData.bestTrade && (
            <div className="extremes-row">
              <div className="extreme-card best">
                <span className="extreme-icon">🏆</span>
                <div className="extreme-info">
                  <span className="extreme-label">Best Trade</span>
                  <span className="extreme-token">${walletData.bestTrade.symbol}</span>
                </div>
                <span className="extreme-pnl positive">
                  +${formatNumber(walletData.bestTrade.pnl)}
                </span>
              </div>
              <div className="extreme-card worst">
                <span className="extreme-icon">💀</span>
                <div className="extreme-info">
                  <span className="extreme-label">Worst Trade</span>
                  <span className="extreme-token">${walletData.worstTrade?.symbol}</span>
                </div>
                <span className="extreme-pnl negative">
                  -${formatNumber(Math.abs(walletData.worstTrade?.pnl || 0))}
                </span>
              </div>
            </div>
          )}

          {/* Current Holdings */}
          <div className="card holdings-card">
            <div className="card-header">
              <span className="card-title">Current Holdings</span>
              <span className="holdings-count">{walletData.holdings?.length || 0} tokens</span>
            </div>
            <div className="holdings-list">
              {walletData.holdings?.length > 0 ? (
                walletData.holdings.map((holding, i) => (
                  <div key={i} className="holding-row">
                    <div className="holding-token">
                      <div className="token-badge">{holding.symbol?.charAt(0) || '?'}</div>
                      <span className="token-name">${holding.symbol}</span>
                    </div>
                    <span className="holding-amount mono">{formatNumber(holding.amount)}</span>
                    <span className={`holding-pnl ${(holding.pnl || 0) >= 0 ? 'positive' : 'negative'}`}>
                      {(holding.pnl || 0) >= 0 ? '+' : ''}{holding.pnlPercent?.toFixed(1) || 0}%
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty-state">No token holdings found</div>
              )}
            </div>
          </div>

          {/* Recent Trades */}
          <div className="card trades-card">
            <div className="card-header">
              <span className="card-title">Recent Activity</span>
            </div>
            <div className="trades-list">
              {walletData.recentTrades?.length > 0 ? (
                walletData.recentTrades.map((trade, i) => (
                  <div key={i} className="trade-row">
                    <span className={`trade-type ${trade.type}`}>
                      {trade.type === 'buy' ? '↗' : '↘'}
                    </span>
                    <span className="trade-token mono">
                      {trade.tokens?.[0]?.mint?.slice(0, 8) || 'Unknown'}...
                    </span>
                    <span className="trade-time">{formatTime(trade.timestamp)}</span>
                  </div>
                ))
              ) : (
                <div className="empty-state">No recent trades found</div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="quick-links">
            <a 
              href={`https://solscan.io/account/${walletData.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="quick-link"
            >
              <span className="link-icon">🔍</span>
              Solscan
            </a>
            <a 
              href={`https://birdeye.so/profile/${walletData.address}?chain=solana`}
              target="_blank"
              rel="noopener noreferrer"
              className="quick-link"
            >
              <span className="link-icon">📊</span>
              Birdeye
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// Mock data
function getMockWalletData(address) {
  return {
    address,
    addressShort: `${address.slice(0, 4)}...${address.slice(-4)}`,
    solBalance: 12.45,
    totalPnl: 4520,
    totalPnlPercent: 156.3,
    winRate: 67,
    totalTrades: 89,
    wins: 60,
    losses: 29,
    bestTrade: { symbol: 'WIF', pnl: 2340 },
    worstTrade: { symbol: 'RUG', pnl: -890 },
    holdings: [
      { symbol: 'BONK', amount: 15000000, pnl: 340, pnlPercent: 23.4 },
      { symbol: 'WIF', amount: 234, pnl: 890, pnlPercent: 67.2 },
      { symbol: 'POPCAT', amount: 1200, pnl: -120, pnlPercent: -8.5 },
    ],
    recentTrades: [
      { type: 'buy', tokens: [{ mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa' }], timestamp: Date.now() / 1000 - 120 },
      { type: 'sell', tokens: [{ mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8f' }], timestamp: Date.now() / 1000 - 3600 },
      { type: 'buy', tokens: [{ mint: '7GCihgDB8fe6KNjn2MYtkzZcRjQy' }], timestamp: Date.now() / 1000 - 7200 },
    ],
  };
}

export default WalletAnalyzer;
