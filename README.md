# 🏆 Prediction Royale (PR)

**Predict. Compete. Survive.** — A gamified prediction market where players stake ETH, predict BTC price movements, and compete in elimination rounds until one winner takes the pot.

---

## ✨ Features

- **Multi-round tournaments** — 3–20 rounds per game with progressive elimination
- **Commit-reveal scheme** — Prevents front-running of predictions using on-chain hashed commitments
- **Oracle-powered** — Chainlink price feeds for BTC/USD and ETH/USD resolution
- **Real-time eliminations** — Bottom players eliminated each round
- **70/20/10 payout** — Winner takes 70%, 2nd gets 20%, 3rd gets 10%
- **ERC-721 badges** — Participation NFTs with on-chain SVG metadata
- **Live leaderboard** — Real-time score updates via Supabase Realtime
- **Wallet-first** — No email/password. Connect MetaMask, WalletConnect, or Coinbase Wallet

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Contract Architecture               │
│                                                     │
│  ┌─────────────┐      ┌──────────────────────────┐  │
│  │  GameFactory│─────▶│    GameLobby (per game)  │  │
│  │  (Solidity) │      │    (Solidity)            │  │
│  └─────────────┘      └──────────┬───────────────┘  │
│                                  │                   │
│              ┌───────────────────┼──────────────┐    │
│              │                   │              │    │
│              ▼                   ▼              ▼    │
│  ┌──────────────────┐  ┌──────────────┐  ┌─────────┐│
│  │  ScoreEngine     │  │  PrizeVault  │  │ Oracle  ││
│  │  (Solidity)      │  │  (Solidity)  │  │Adapter  ││
│  └──────────────────┘  └──────────────┘  └─────────┘│
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │         ParticipationNFT (ERC-721)           │   │
│  │              (Solidity)                      │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Data Flow

```
User → Frontend (Next.js) → RainbowKit/wagmi → Smart Contracts (Arbitrum Sepolia)
                                   ↓
                            Event Indexer (ethers.js)
                                   ↓
                            PostgreSQL (Supabase)
                                   ↓
                            Realtime WebSocket → Frontend
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.x |
| Framework | Foundry (forge, cast, anvil) |
| L2 Network | Arbitrum Sepolia |
| Oracle | Chainlink Price Feeds |
| Frontend | Next.js 16 + TypeScript + Tailwind CSS |
| Web3 | wagmi v2 + viem + RainbowKit |
| State | Zustand + React Query |
| Charts | Recharts |
| Animations | Framer Motion |
| Backend | Node.js + Express |
| Database | PostgreSQL (Supabase) |
| Realtime | Supabase Realtime (WebSocket) |

---

## 📁 Project Structure

```
pr/
├── contracts/           # Foundry project (Smart Contracts)
│   ├── src/
│   │   ├── GameFactory.sol      # Lobby factory & registry
│   │   ├── GameLobby.sol        # Core game logic
│   │   ├── ScoreEngine.sol      # Scoring & ranking
│   │   ├── PrizeVault.sol       # Prize pool management
│   │   ├── ParticipationNFT.sol # ERC-721 badges
│   │   ├── OracleAdapter.sol    # Chainlink feed wrapper
│   │   ├── interfaces/          # Solidity interfaces
│   │   └── mocks/               # Test mocks
│   ├── test/                    # Foundry tests
│   ├── script/                  # Deployment scripts
│   └── foundry.toml
│
├── frontend/            # Next.js application
│   ├── src/
│   │   ├── app/                # Pages (landing, lobby, game, profile)
│   │   ├── components/         # Reusable UI components
│   │   ├── lib/                # Utilities, ABI, contracts config
│   │   └── store/              # Zustand state
│   └── package.json
│
├── backend/             # Express API + Supabase
│   ├── src/
│   │   ├── routes/             # REST endpoints
│   │   ├── db/                 # Schema + queries
│   │   └── server.ts
│   └── package.json
│
├── indexer/             # Blockchain event indexer
│   ├── src/
│   │   └── eventListener.ts
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Foundry (forge, cast, anvil)
- Git

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd pmbr

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install

# Install indexer dependencies
cd ../indexer && npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
# Required for deployment
ARB_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
PRIVATE_KEY=your_deployer_private_key
ARBISCAN_API_KEY=your_arbiscan_api_key

# Required for frontend
NEXT_PUBLIC_ARB_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
NEXT_PUBLIC_GAME_FACTORY_ADDRESS=deployed_factory_address
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Required for backend
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

### Run Tests

```bash
cd contracts
forge test -vvv
```

### Deploy Contracts

```bash
cd contracts
forge script script/DeployAll.s.sol \
  --rpc-url $ARB_SEPOLIA_RPC \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

### Run Frontend (Dev)

```bash
cd frontend
npm run dev
```

### Run Backend

```bash
cd backend
npm run dev
```

### Run Indexer

```bash
cd indexer
npm run start
```

---

## 🎮 Game Flow

1. **Connect Wallet** — MetaMask / WalletConnect on Arbitrum Sepolia
2. **Browse/Create Lobby** — Set stake, max players, rounds
3. **Join & Wait** — Pay stake, wait for players or countdown
4. **Commit Phase (30s)** — Submit hashed prediction (YES/NO on price move)
5. **Reveal Phase (60s)** — Reveal prediction with salt
6. **Oracle Resolution** — Chainlink fetches real price
7. **Elimination** — Bottom players removed per round
8. **Repeat** — Until 1 player remains or all rounds complete
9. **Payout** — Winner 70%, 2nd 20%, 3rd 10% (3% protocol fee)

---

## 📜 Smart Contract Overview

### GameFactory.sol
Factory contract that deploys and tracks all GameLobby instances.

| Function | Description |
|----------|-------------|
| `createGame()` | Deploy new game lobby with params |
| `getActiveGames()` | List all open lobbies |
| `getGamesByPlayer()` | Player's game history |

### GameLobby.sol
Core game logic — round management, commit-reveal, scoring, elimination, payouts.

| Function | Description |
|----------|-------------|
| `joinGame()` | Pay stake to join |
| `submitCommitment()` | Commit hashed prediction |
| `revealPrediction()` | Reveal value + salt |
| `resolveRound()` | Fetch oracle price, compute scores |
| `eliminatePlayers()` | Remove bottom scorers |
| `claimPayout()` | Withdraw winnings |

### ScoreEngine.sol
Scoring: accuracy % + time bonus. Rankings via bubble sort.

### PrizeVault.sol
Isolated escrow with non-reentrant claims.

### ParticipationNFT.sol
ERC-721 badges with on-chain SVG showing rank, game ID, rounds survived.

### OracleAdapter.sol
Chainlink `AggregatorV3Interface` wrapper with staleness check (5 min).

---

## 🔒 Security

- **ReentrancyGuard** on all payable functions
- **Commit-reveal** prevents front-running
- **No admin rug** — PrizeVault has no owner withdrawal
- **Oracle staleness check** — rejects prices >5 minutes old
- **Max 100 players** — prevents gas griefing
- **Solidity 0.8.x** — built-in overflow protection

---