// API Service for CheckToken
// Connects to Helius and Birdeye for real Solana data

const API_BASE = import.meta.env.VITE_API_URL || '';

// For development, we'll use a local proxy or direct API calls
// In production, you'll want a backend to hide API keys

class TokenAPI {
  constructor() {
    // These will be set via environment variables
    this.heliusKey = import.meta.env.VITE_HELIUS_API_KEY || '';
    this.birdeyeKey = import.meta.env.VITE_BIRDEYE_API_KEY || '';
    this.heliusRpc = `https://mainnet.helius-rpc.com/?api-key=${this.heliusKey}`;
  }

  // Check if APIs are configured
  isConfigured() {
    return this.heliusKey && this.birdeyeKey;
  }

  // Fetch token metadata and security info
  async getTokenInfo(address) {
    try {
      // Parallel fetch for speed
      const [metadata, security, price, holders] = await Promise.all([
        this.fetchTokenMetadata(address),
        this.fetchSecurityInfo(address),
        this.fetchPriceData(address),
        this.fetchHolderData(address),
      ]);

      return {
        success: true,
        data: {
          ...metadata,
          ...security,
          ...price,
          ...holders,
          address,
        }
      };
    } catch (error) {
      console.error('Token fetch error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get token metadata from Helius
  async fetchTokenMetadata(address) {
    const response = await fetch(`https://api.helius.xyz/v0/token-metadata?api-key=${this.heliusKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mintAccounts: [address] })
    });
    
    const data = await response.json();
    const token = data[0];
    
    return {
      name: token?.onChainMetadata?.metadata?.name || token?.legacyMetadata?.name || 'Unknown',
      symbol: token?.onChainMetadata?.metadata?.symbol || token?.legacyMetadata?.symbol || '???',
      image: token?.onChainMetadata?.metadata?.image || token?.legacyMetadata?.logoURI || null,
      decimals: token?.onChainMetadata?.metadata?.decimals || 9,
    };
  }

  // Get security info (mint/freeze authority) via RPC
  async fetchSecurityInfo(address) {
    const response = await fetch(this.heliusRpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getAccountInfo',
        params: [address, { encoding: 'jsonParsed' }]
      })
    });

    const data = await response.json();
    const parsed = data.result?.value?.data?.parsed?.info;

    return {
      mintAuthority: parsed?.mintAuthority || null,
      freezeAuthority: parsed?.freezeAuthority || null,
      supply: parsed?.supply || '0',
      mintAuthorityDisabled: !parsed?.mintAuthority,
      freezeAuthorityDisabled: !parsed?.freezeAuthority,
    };
  }

  // Get price and market data from Birdeye
  async fetchPriceData(address) {
    const response = await fetch(
      `https://public-api.birdeye.so/defi/token_overview?address=${address}`,
      { headers: { 'X-API-KEY': this.birdeyeKey } }
    );

    const data = await response.json();
    const info = data.data || {};

    return {
      price: info.price || 0,
      priceChange24h: info.priceChange24hPercent || 0,
      marketCap: info.mc || 0,
      liquidity: info.liquidity || 0,
      volume24h: info.v24hUSD || 0,
      holderCount: info.holder || 0,
      createdAt: info.createdAt || null,
    };
  }

  // Get holder distribution from Birdeye
  async fetchHolderData(address) {
    const response = await fetch(
      `https://public-api.birdeye.so/defi/token_holder?address=${address}&offset=0&limit=20`,
      { headers: { 'X-API-KEY': this.birdeyeKey } }
    );

    const data = await response.json();
    const holders = data.data?.items || [];

    // Calculate distribution
    const totalSupplyHeld = holders.reduce((sum, h) => sum + (h.uiAmount || 0), 0);
    const top10 = holders.slice(0, 10);
    const top10Amount = top10.reduce((sum, h) => sum + (h.uiAmount || 0), 0);
    const top20Amount = holders.reduce((sum, h) => sum + (h.uiAmount || 0), 0);

    return {
      topHolders: top10.map((h, i) => ({
        rank: i + 1,
        address: h.owner,
        addressShort: `${h.owner?.slice(0, 4)}...${h.owner?.slice(-4)}`,
        amount: h.uiAmount || 0,
        percent: totalSupplyHeld > 0 ? ((h.uiAmount || 0) / totalSupplyHeld * 100) : 0,
        label: this.getWalletLabel(h.owner),
      })),
      top10Percent: totalSupplyHeld > 0 ? (top10Amount / totalSupplyHeld * 100) : 0,
      top20Percent: totalSupplyHeld > 0 ? (top20Amount / totalSupplyHeld * 100) : 0,
    };
  }

  // Known wallet labels
  getWalletLabel(address) {
    const labels = {
      '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1': 'Raydium Authority',
      // Add more known wallets here
    };
    return labels[address] || null;
  }

  // Get wallet PnL and trades
  async getWalletInfo(address) {
    try {
      const [balances, transactions] = await Promise.all([
        this.fetchWalletBalances(address),
        this.fetchWalletTransactions(address),
      ]);

      const pnlData = this.calculatePnL(transactions, balances);

      return {
        success: true,
        data: {
          address,
          addressShort: `${address.slice(0, 4)}...${address.slice(-4)}`,
          ...balances,
          ...pnlData,
        }
      };
    } catch (error) {
      console.error('Wallet fetch error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get wallet token balances
  async fetchWalletBalances(address) {
    const response = await fetch(
      `https://api.helius.xyz/v0/addresses/${address}/balances?api-key=${this.heliusKey}`
    );
    
    const data = await response.json();
    const tokens = data.tokens || [];

    // Filter and format holdings
    const holdings = tokens
      .filter(t => t.amount > 0 && t.decimals)
      .map(t => ({
        mint: t.mint,
        symbol: t.symbol || 'Unknown',
        amount: t.amount / Math.pow(10, t.decimals),
        decimals: t.decimals,
        // Price data would need additional API call
      }))
      .slice(0, 20);

    return {
      solBalance: data.nativeBalance / 1e9,
      holdings,
    };
  }

  // Get wallet transaction history
  async fetchWalletTransactions(address) {
    const response = await fetch(
      `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${this.heliusKey}&type=SWAP`
    );
    
    const transactions = await response.json();
    
    return transactions.slice(0, 100).map(tx => ({
      signature: tx.signature,
      type: tx.type,
      timestamp: tx.timestamp,
      fee: tx.fee,
      tokenTransfers: tx.tokenTransfers || [],
      nativeTransfers: tx.nativeTransfers || [],
    }));
  }

  // Calculate PnL from transactions (simplified)
  calculatePnL(transactions, balances) {
    // This is a simplified version - real PnL needs price at time of trade
    let wins = 0;
    let losses = 0;
    
    const trades = transactions.map(tx => {
      const isBuy = tx.tokenTransfers?.some(t => t.toUserAccount === tx.feePayer);
      return {
        type: isBuy ? 'buy' : 'sell',
        signature: tx.signature,
        timestamp: tx.timestamp,
        tokens: tx.tokenTransfers,
      };
    });

    return {
      totalTrades: trades.length,
      wins,
      losses,
      winRate: trades.length > 0 ? (wins / trades.length * 100) : 0,
      recentTrades: trades.slice(0, 10),
    };
  }

  // Get trending tokens
  async getTrendingTokens() {
    try {
      const response = await fetch(
        'https://public-api.birdeye.so/defi/token_trending?sort_by=rank&sort_type=asc&offset=0&limit=20',
        { headers: { 'X-API-KEY': this.birdeyeKey } }
      );

      const data = await response.json();
      const tokens = data.data?.items || [];

      return {
        success: true,
        data: tokens.map((t, i) => ({
          rank: i + 1,
          address: t.address,
          name: t.name || 'Unknown',
          symbol: t.symbol || '???',
          price: t.price || 0,
          priceChange24h: t.priceChange24hPercent || 0,
          volume24h: t.v24hUSD || 0,
          liquidity: t.liquidity || 0,
          marketCap: t.mc || 0,
          image: t.logoURI || null,
        }))
      };
    } catch (error) {
      console.error('Trending fetch error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get new token listings
  async getNewTokens() {
    try {
      const response = await fetch(
        'https://public-api.birdeye.so/defi/token_new_listing?limit=20',
        { headers: { 'X-API-KEY': this.birdeyeKey } }
      );

      const data = await response.json();
      const tokens = data.data?.items || [];

      return {
        success: true,
        data: tokens.map(t => ({
          address: t.address,
          name: t.name || 'Unknown',
          symbol: t.symbol || '???',
          price: t.price || 0,
          liquidity: t.liquidity || 0,
          createdAt: t.createdAt,
          image: t.logoURI || null,
        }))
      };
    } catch (error) {
      console.error('New tokens fetch error:', error);
      return { success: false, error: error.message };
    }
  }
}

export const tokenAPI = new TokenAPI();
export default tokenAPI;
