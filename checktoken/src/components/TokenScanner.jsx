import { useState } from 'react';
import { tokenAPI } from '../services/api';
import './TokenScanner.css';

// Validation
const isValidSolanaAddress = (address) => {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
};

function TokenScanner() {
  const [address, setAddress] = useState('');
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async () => {
    const trimmed = address.trim();
    if (!trimmed) return;
    
    if (!isValidSolanaAddress(trimmed)) {
      setError('Invalid Solana address format');
      return;
    }

    setLoading(true);
    setError(null);
    setTokenData(null);

    // Check if API is configured
    if (!tokenAPI.isConfigured()) {
      // Use demo mode with mock data
      setTimeout(() => {
        setTokenData(getMockData(trimmed));
        setLoading(false);
      }, 1200);
      return;
    }

    // Real API call
    const result = await tokenAPI.getTokenInfo(trimmed);
    
    if (result.success) {
      setTokenData(result.data);
    } else {
      setError(result.error || 'Failed to fetch token data');
    }
    
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleScan();
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(tokenData?.address || address);
  };

  const getSecurityScore = (data) => {
    if (!data) return 0;
    let score = 100;
    if (!data.mintAuthorityDisabled) score -= 30;
    if (!data.freezeAuthorityDisabled) score -= 25;
    if (data.top10Percent > 50) score -= 20;
    if (data.top10Percent > 70) score -= 15;
    return Math.max(0, score);
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const formatPrice = (price) => {
    if (!price) return '$0';
    if (price < 0.00001) return '$' + price.toExponential(2);
    if (price < 0.01) return '$' + price.toFixed(6);
    if (price < 1) return '$' + price.toFixed(4);
    return '$' + price.toFixed(2);
  };

  const score = tokenData ? getSecurityScore(tokenData) : 0;
  const scoreClass = score >= 80 ? 'safe' : score >= 50 ? 'warning' : 'danger';

  return (
    <div className="scanner">
      {/* Hero section */}
      <div className="scanner-hero">
        <h1 className="scanner-title">
          Check any token<span className="accent">.</span>
        </h1>
        <p className="scanner-subtitle">
          Instant security analysis, holder distribution, and market data for Solana tokens.
        </p>

        <div className="scanner-input-group">
          <div className="input-container">
            <input
              type="text"
              className="scanner-input"
              placeholder="Paste token address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
            />
            {address && (
              <button className="input-clear" onClick={() => setAddress('')}>
                ×
              </button>
            )}
          </div>
          <button 
            className="scanner-btn"
            onClick={handleScan}
            disabled={loading || !address.trim()}
          >
            {loading ? <span className="spinner"></span> : 'Check'}
          </button>
        </div>

        {!tokenAPI.isConfigured() && (
          <p className="demo-notice">
            Demo mode — Add API keys to .env for live data
          </p>
        )}

        {error && (
          <div className="scanner-error">
            <span className="error-icon">!</span>
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {tokenData && (
        <div className="scanner-results">
          {/* Token header */}
          <div className="result-header">
            <div className="token-identity">
              {tokenData.image ? (
                <img src={tokenData.image} alt="" className="token-image" />
              ) : (
                <div className="token-image-placeholder">
                  {tokenData.symbol?.charAt(0) || '?'}
                </div>
              )}
              <div className="token-info">
                <h2 className="token-name">{tokenData.name}</h2>
                <span className="token-symbol">${tokenData.symbol}</span>
              </div>
            </div>
            <div className="token-price-group">
              <span className="token-price">{formatPrice(tokenData.price)}</span>
              <span className={`token-change ${tokenData.priceChange24h >= 0 ? 'positive' : 'negative'}`}>
                {tokenData.priceChange24h >= 0 ? '+' : ''}{tokenData.priceChange24h?.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="token-address-bar">
            <code className="token-address">{tokenData.address}</code>
            <button className="copy-btn" onClick={copyAddress}>Copy</button>
          </div>

          {/* Main grid */}
          <div className="result-grid">
            {/* Security score */}
            <div className="card security-card">
              <div className="card-header">
                <span className="card-title">Security Score</span>
              </div>
              <div className={`score-display ${scoreClass}`}>
                <span className="score-value">{score}</span>
                <span className="score-max">/100</span>
              </div>
              <div className="security-checks">
                <div className={`check-row ${tokenData.mintAuthorityDisabled ? 'pass' : 'fail'}`}>
                  <span className="check-icon">{tokenData.mintAuthorityDisabled ? '✓' : '✗'}</span>
                  <span>Mint Authority</span>
                  <span className="check-status">
                    {tokenData.mintAuthorityDisabled ? 'Disabled' : 'Active'}
                  </span>
                </div>
                <div className={`check-row ${tokenData.freezeAuthorityDisabled ? 'pass' : 'fail'}`}>
                  <span className="check-icon">{tokenData.freezeAuthorityDisabled ? '✓' : '✗'}</span>
                  <span>Freeze Authority</span>
                  <span className="check-status">
                    {tokenData.freezeAuthorityDisabled ? 'Disabled' : 'Active'}
                  </span>
                </div>
                <div className={`check-row ${tokenData.top10Percent < 50 ? 'pass' : 'warn'}`}>
                  <span className="check-icon">{tokenData.top10Percent < 50 ? '✓' : '!'}</span>
                  <span>Top 10 Concentration</span>
                  <span className="check-status">{tokenData.top10Percent?.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Market data */}
            <div className="card stats-card">
              <div className="card-header">
                <span className="card-title">Market Data</span>
              </div>
              <div className="stats-grid">
                <div className="stat">
                  <span className="stat-label">Market Cap</span>
                  <span className="stat-value">${formatNumber(tokenData.marketCap)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Liquidity</span>
                  <span className="stat-value">${formatNumber(tokenData.liquidity)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">24h Volume</span>
                  <span className="stat-value">${formatNumber(tokenData.volume24h)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Holders</span>
                  <span className="stat-value">{formatNumber(tokenData.holderCount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Holder distribution */}
          <div className="card holders-card">
            <div className="card-header">
              <span className="card-title">Top Holders</span>
              <span className="holder-summary">
                Top 10: {tokenData.top10Percent?.toFixed(1)}%
              </span>
            </div>
            <div className="holders-table">
              <div className="holders-header">
                <span>#</span>
                <span>Address</span>
                <span>Label</span>
                <span>Holdings</span>
              </div>
              {tokenData.topHolders?.map((holder, i) => (
                <div key={i} className="holder-row">
                  <span className="holder-rank">{holder.rank}</span>
                  <span className="holder-address mono">{holder.addressShort}</span>
                  <span className="holder-label">
                    {holder.label ? (
                      <span className="label-tag">{holder.label}</span>
                    ) : '—'}
                  </span>
                  <span className="holder-percent">{holder.percent?.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="quick-links">
            <a 
              href={`https://birdeye.so/token/${tokenData.address}?chain=solana`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="quick-link"
            >
              <span className="link-icon">📊</span>
              Birdeye
            </a>
            <a 
              href={`https://dexscreener.com/solana/${tokenData.address}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="quick-link"
            >
              <span className="link-icon">📈</span>
              DexScreener
            </a>
            <a 
              href={`https://solscan.io/token/${tokenData.address}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="quick-link"
            >
              <span className="link-icon">🔍</span>
              Solscan
            </a>
            <a 
              href={`https://rugcheck.xyz/tokens/${tokenData.address}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="quick-link"
            >
              <span className="link-icon">🛡️</span>
              RugCheck
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// Mock data for demo mode
function getMockData(address) {
  return {
    name: 'Demo Token',
    symbol: 'DEMO',
    address: address,
    image: null,
    price: 0.00234,
    priceChange24h: 12.5,
    marketCap: 2340000,
    liquidity: 456000,
    volume24h: 1230000,
    holderCount: 4521,
    mintAuthorityDisabled: true,
    freezeAuthorityDisabled: true,
    top10Percent: 24.5,
    top20Percent: 31.2,
    topHolders: [
      { rank: 1, address: 'abc...xyz1', addressShort: 'abc...xyz1', percent: 5.2, label: 'Raydium LP' },
      { rank: 2, address: 'def...xyz2', addressShort: 'def...xyz2', percent: 4.1, label: null },
      { rank: 3, address: 'ghi...xyz3', addressShort: 'ghi...xyz3', percent: 3.8, label: null },
      { rank: 4, address: 'jkl...xyz4', addressShort: 'jkl...xyz4', percent: 2.9, label: null },
      { rank: 5, address: 'mno...xyz5', addressShort: 'mno...xyz5', percent: 2.4, label: null },
      { rank: 6, address: 'pqr...xyz6', addressShort: 'pqr...xyz6', percent: 1.9, label: null },
      { rank: 7, address: 'stu...xyz7', addressShort: 'stu...xyz7', percent: 1.5, label: null },
      { rank: 8, address: 'vwx...xyz8', addressShort: 'vwx...xyz8', percent: 1.2, label: null },
      { rank: 9, address: 'yza...xyz9', addressShort: 'yza...xyz9', percent: 0.9, label: null },
      { rank: 10, address: 'bcd...xy10', addressShort: 'bcd...xy10', percent: 0.6, label: null },
    ],
  };
}

export default TokenScanner;
