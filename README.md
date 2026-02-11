# HISTORIA

**Decentralized Truth Protocol on Gno.land**

Truth is verified, not dictated.

---

## Overview

HISTORIA is a decentralized protocol for verifying historical claims through stake-based consensus. Built on Gno.land blockchain, it uses a commit-reveal voting mechanism to establish collective truth without gatekeepers.

**Key Features:**
- One wallet, one vote (prevents plutocracy)
- Commit-reveal blind voting (prevents manipulation)
- Economic alignment (stake redistribution)
- Immutable historical record

---

## Project Structure

```
HISTORIA/
├── web/                          # Frontend (Next.js + React)
│   ├── src/
│   │   ├── app/                  # Pages (home, archive, profile, etc.)
│   │   ├── components/           # React components
│   │   ├── contexts/             # Wallet context
│   │   └── lib/                  # Gno.land integration
│   ├── .env.local                # Environment configuration
│   └── package.json
│
├── deploy/
│   └── historiav11/              # Clean realm deployment (no tests)
│       ├── historia.gno          # Main smart contract
│       └── gnomod.toml           # Module configuration
│
├── r/
│   └── whitepaper/               # On-chain whitepaper realm
│       ├── whitepaper.gno
│       └── gnomod.toml
│
├── DEPLOY_HISTORIA_V11.bat       # Deploy historia realm
├── DEPLOY_WHITEPAPER.bat         # Deploy whitepaper
└── WHITEPAPER_EN.md              # Full whitepaper documentation
```

---

## Quick Start

### 1. Deploy the Realm (Optional)

If you want to deploy your own instance:

```bash
# Deploy HISTORIA realm v11
.\DEPLOY_HISTORIA_V11.bat

# Deploy whitepaper (optional)
.\DEPLOY_WHITEPAPER.bat
```

**Requirements:**
- `gnokey` CLI installed
- Account with GNOT tokens on staging network
- Account name: `melonboy314` (or modify scripts)

### 2. Configure Frontend

Edit `web/.env.local`:

```env
NEXT_PUBLIC_REALM_PATH=gno.land/r/melonboy314/historiav11
NEXT_PUBLIC_GNO_RPC=https://rpc.gno.land:443
NEXT_PUBLIC_CHAIN_ID=staging
```

### 3. Install Dependencies

```bash
cd web
npm install
```

### 4. Run Frontend

```bash
npm run dev
```

Open **http://localhost:3000**

---

## How It Works

### Submitting a Claim

1. **Connect Wallet** - Connect Adena wallet
2. **Submit Claim** - Propose a historical statement with stake (≥1 GNOT)
3. **Set Phases** - Define commit and reveal phase durations

### Voting Process

#### Phase 1: COMMIT (Blind Voting)
- Voters stake GNOT and submit a sealed vote (cryptographic hash)
- No one can see how others voted
- Prevents vote manipulation and coordination

#### Phase 2: REVEAL
- Voters reveal their vote with the secret used during commit
- Contract verifies the hash matches
- Non-revealers lose their stake

#### Phase 3: RESOLUTION
- Majority wins (FOR vs AGAINST)
- Winners split losers' stakes proportionally
- 2% fee: 1% to proposer, 1% to protocol

### Special Cases

- **Tie**: All revealers get refunds, non-revealers lose stake
- **Unanimous**: All revealers get refunds
- **No reveals**: Event voided, proposer forfeits stake

---

## Smart Contract

**Deployed on:** Gno.land (staging)
**Realm Path:** `gno.land/r/melonboy314/historiav11`
**Language:** Gno (Go-based blockchain language)

### Core Functions

```go
Submit(description, stakeAmount, commitMinutes, revealMinutes, commitHash)
CommitVote(eventID, commitHash)
RevealVote(eventID, vote, secret)
Resolve(eventID)
```

### Security Features

- **Sybil Resistance**: Minimum 1 GNOT stake per vote
- **Vote Buying Resistance**: Blind commitment prevents verification
- **Collusion Resistance**: Cannot see others' votes before committing
- **Immutability**: No admin keys, cannot pause or upgrade

---

## Frontend Features

### Pages

- **Home** - Active events, stats (Total GNOT Staked, Resolved, Users)
- **Archive** - Historical record of all resolved claims
- **Event Detail** - Full event info, voting interface
- **Profile** - User statistics and voting history
- **Submit** - Create new historical claim

### Components

- **WalletConnect** - Adena wallet integration
- **EventCard** - Event summary display
- **CommitForm** - Blind vote submission with hash generation
- **RevealForm** - Vote reveal with secret verification

---

## Technology Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Adena Wallet** - Gno.land wallet integration

### Blockchain
- **Gno.land** - Blockchain platform
- **AVL Trees** - O(log n) performance
- **Commit-Reveal** - Cryptographic voting scheme

---

## Documentation

- **Whitepaper**: `WHITEPAPER_EN.md` - Full technical and philosophical documentation
- **On-chain Whitepaper**: https://gno.land/r/melonboy314/v1_whitepaper_historia
- **Gno.land Docs**: https://docs.gno.land

---

## Security Considerations

⚠️ **Important**:
- Always save your secret after committing a vote
- Never share your secret before the reveal phase
- Verify transaction details before signing
- This is experimental software on a staging network

---

## Contributing

HISTORIA is open for contributions:
- Report bugs and issues
- Suggest improvements
- Submit pull requests
- Test and provide feedback

---

## License

See individual files for license information.

---

## Contact & Links

- **Gno.land**: https://gno.land
- **Adena Wallet**: https://adena.app
- **Realm**: https://gno.land/r/melonboy314/historiav11
- **Whitepaper**: https://gno.land/r/melonboy314/v1_whitepaper_historia

---

**"Truth is verified, not dictated."**
