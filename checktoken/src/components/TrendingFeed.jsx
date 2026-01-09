import { useState, useEffect } from 'react';
import { tokenAPI } from '../services/api';
import './TrendingFeed.css';

function TrendingFeed() {
  const [activeTab, setActiveTab] = useState('trending');
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTokens();
  }, [activeTab]);

  const loadTokens = async () => {
    setLoading(true);
    setError(null);

    if (!tokenAPI.isConfigured()) {
      setTimeout(() => {
        setTokens(getMockTokens(activeTab));
        setLoading(false);
      }, 800);
      return;
    }

    const result = activeTab === 'trending' 
      ? await tokenAPI.getTrendingTokens()
      : await tokenAPI.getNewTokens();

    if (result.success) {
      setTokens(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const formatNumber = (num) => {
    if (!num) return '$0';
    if (num >= 1e9) return '$' + (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return '$' + (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return '$' + (num / 1e3).toFixed(2) + 'K';
    return '$' + num.toFixed(2);
  };

  const formatPrice = (price) => {
    if (!price) return '$0';
    if (price < 0.00001) return '$' + price.toExponential(2);
    if (price < 0.01) return '$' + price.toFixed(6);
    if (price < 1) return '$' + price.toFixed(4);
    return '$' + price.toFixed(2);
  };

  return (
    <div className="trending">
      <div className="trending-header">
        <h1 className="trending-title">
          {activeTab === 'trending' ? 'Trending' : 'New Listings'}
          <span className="accent">.</span>
        </h1>
        <p className="trending-subtitle">
          {activeTab === 'trending' 
            ? 'Most popular tokens by volume and activity.'
            : 'Recently launched tokens on Solana.'}
        </p>

        <div className="trending-tabs">
          <button 
            className={`tab-btn ${activeTab === 'trending' ? 'active' : ''}`}
            onClick={() => setActiveTab('trending')}
          >
            🔥 Trending
          </button>
          <button 
            className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            ✨ New
          </button>
        </div>

        {!tokenAPI.isConfigured() && (
          <p className="demo-notice">Demo mode — Add API keys for live data</p>
        )}
      </div>

      {loading ? (
        <div className="loading-state">
          <span className="spinner large"></span>
          <p>Loading tokens...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <span className="error-icon">!</span>
          <p>{error}</p>
          <button className="retry-btn" onClick={loadTokens}>Retry</button>
        </div>
      ) : (
        <div className="tokens-grid">
          {tokens.map((token, i) => (
            <a 
              key={i}
              href={`https://birdeye.so/token/${token.address}?chain=solana`}
              target="_blank"
              rel="noopener noreferrer"
              className="token-card"
            >
              <div className="token-card-header">
                <div className="token-rank">#{token.rank || i + 1}</div>
                <div className="token-identity">
                  {token.image ? (
                    <img src={token.image} alt="" className="token-img" />
                  ) : (
                    <div className="token-img-placeholder">
                      {token.symbol?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="token-names">
                    <span className="token-name">{token.name}</span>
                    <span className="token-symbol">${token.symbol}</span>
                  </div>
                </div>
              </div>

              <div className="token-card-body">
                <div className="token-price-row">
                  <span className="token-price">{formatPrice(token.price)}</span>
                  {token.priceChange24h !== undefined && (
                    <span className={`token-change ${token.priceChange24h >= 0 ? 'positive' : 'negative'}`}>
                      {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h?.toFixed(1)}%
                    </span>
                  )}
                </div>

                <div className="token-stats">
                  {token.marketCap > 0 && (
                    <div className="token-stat">
                      <span className="stat-label">MCap</span>
                      <span className="stat-value">{formatNumber(token.marketCap)}</span>
                    </div>
                  )}
                  {token.liquidity > 0 && (
                    <div className="token-stat">
                      <span className="stat-label">Liq</span>
                      <span className="stat-value">{formatNumber(token.liquidity)}</span>
                    </div>
                  )}
                  {token.volume24h > 0 && (
                    <div className="token-stat">
                      <span className="stat-label">Vol</span>
                      <span className="stat-value">{formatNumber(token.volume24h)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="token-card-footer">
                <span className="view-link">View details →</span>
              </div>
            </a>
          ))}
        </div>
      )}

      <div className="refresh-section">
        <button className="refresh-btn" onClick={loadTokens} disabled={loading}>
          {loading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>
    </div>
  );
}

function getMockTokens(type) {
  const trending = [
    { rank: 1, name: 'Bonk', symbol: 'BONK', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', price: 0.00002847, priceChange24h: 12.5, marketCap: 1847000000, liquidity: 24500000, volume24h: 89000000 },
    { rank: 2, name: 'dogwifhat', symbol: 'WIF', address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', price: 2.34, priceChange24h: -5.2, marketCap: 2340000000, liquidity: 45000000, volume24h: 234000000 },
    { rank: 3, name: 'Popcat', symbol: 'POPCAT', address: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', price: 0.89, priceChange24h: 34.2, marketCap: 890000000, liquidity: 12000000, volume24h: 67000000 },
    { rank: 4, name: 'Gigachad', symbol: 'GIGA', address: '63LfDmNb3MQ8mw9MtZ2To9bEA2M71kZUUGq5tiJxcqj9', price: 0.0234, priceChange24h: 8.7, marketCap: 234000000, liquidity: 5600000, volume24h: 23000000 },
    { rank: 5, name: 'Moo Deng', symbol: 'MOODENG', address: 'ED5nyyWEzpPPiWimP8vYm7sD7TD3LAt3Q3gRTWHzPJBY', price: 0.156, priceChange24h: -2.1, marketCap: 156000000, liquidity: 3400000, volume24h: 12000000 },
    { rank: 6, name: 'Fwog', symbol: 'FWOG', address: 'A8C3xuqscfmyLrte3VmTqrAq8kgMASius9AFNANwpump', price: 0.0456, priceChange24h: 67.3, marketCap: 45600000, liquidity: 2300000, volume24h: 8900000 },
  ];

  const newTokens = [
    { rank: 1, name: 'New Gem', symbol: 'GEM', address: 'abc123...', price: 0.00012, priceChange24h: 234.5, marketCap: 120000, liquidity: 45000, volume24h: 89000 },
    { rank: 2, name: 'Moon Shot', symbol: 'MOON', address: 'def456...', price: 0.00089, priceChange24h: 45.2, marketCap: 89000, liquidity: 23000, volume24h: 34000 },
    { rank: 3, name: 'Degen Play', symbol: 'DEGEN', address: 'ghi789...', price: 0.000034, priceChange24h: -12.3, marketCap: 34000, liquidity: 12000, volume24h: 23000 },
    { rank: 4, name: 'Ape In', symbol: 'APE', address: 'jkl012...', price: 0.00067, priceChange24h: 89.4, marketCap: 67000, liquidity: 18000, volume24h: 45000 },
  ];

  return type === 'trending' ? trending : newTokens;
}

export default TrendingFeed;
