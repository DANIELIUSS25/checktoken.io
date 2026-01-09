# CheckToken.io

A clean, fast Solana token scanner and wallet analyzer. Like the Telegram bots (Rick, Trojan, BullX) but as a proper web app.

![CheckToken](https://checktoken.io/og-image.png)

## Features

### 🔍 Token Scanner
- Paste any Solana token address
- **Security Score** - Mint authority, freeze authority, LP status
- **Holder Distribution** - Top 10 holders, concentration warnings
- **Market Data** - Price, market cap, liquidity, volume
- **Quick Links** - Birdeye, DexScreener, Solscan, RugCheck

### 💰 Wallet Analyzer
- Track any wallet's performance
- **PnL Tracking** - Total profit/loss, win rate
- **Current Holdings** - Active positions with unrealized PnL
- **Trade History** - Recent buys and sells
- **Best/Worst Trades** - Performance highlights

### 🔥 Trending Feed
- Real-time trending tokens
- New token listings
- Quick stats at a glance

## Quick Start

```bash
# Clone the repo
git clone https://github.com/yourusername/checktoken.git
cd checktoken

# Install dependencies
npm install

# Run in demo mode (works without API keys)
npm run dev
```

Open http://localhost:3000

## Connect Real Data

1. **Get API Keys** (both free):
   - [Helius](https://helius.xyz) - Sign up, get key instantly
   - [Birdeye](https://birdeye.so/developers) - Request API access

2. **Create `.env` file**:
```env
VITE_HELIUS_API_KEY=your_helius_key
VITE_BIRDEYE_API_KEY=your_birdeye_key
```

3. **Restart the dev server**:
```bash
npm run dev
```

## Project Structure

```
checktoken/
├── src/
│   ├── App.jsx              # Main app, routing, layout
│   ├── App.css              # Global styles, theme
│   ├── main.jsx             # Entry point
│   ├── components/
│   │   ├── TokenScanner.jsx # Token analysis
│   │   ├── WalletAnalyzer.jsx
│   │   └── TrendingFeed.jsx
│   └── services/
│       └── api.js           # Helius/Birdeye API layer
├── public/
│   └── favicon.svg
├── index.html
├── package.json
├── vite.config.js
└── .env.example
```

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Helius API** - Transaction data, token metadata, RPC
- **Birdeye API** - Price data, trending, holder info

## Deployment

### Vercel (Recommended)

```bash
npm run build
# Deploy the `dist` folder
```

Or connect your GitHub repo to Vercel for auto-deploys.

**Environment Variables** - Add in Vercel dashboard:
- `VITE_HELIUS_API_KEY`
- `VITE_BIRDEYE_API_KEY`

### Other Platforms

Works with Netlify, Cloudflare Pages, or any static hosting.

## API Rate Limits

| Service | Free Tier |
|---------|-----------|
| Helius | 1M credits/month (~100k requests) |
| Birdeye | 100 requests/minute |

For production with high traffic, consider:
- Caching with Redis
- Backend proxy to pool API requests
- Upgrading to paid tiers

## Roadmap

- [ ] Wallet watchlists with alerts
- [ ] Telegram bot integration
- [ ] Copy trading signals
- [ ] Token comparison tool
- [ ] Portfolio tracker
- [ ] API for developers

## Contributing

PRs welcome. Please open an issue first to discuss major changes.

## License

MIT

---

Built for the trenches. Not financial advice. DYOR.

**CheckToken.io**
