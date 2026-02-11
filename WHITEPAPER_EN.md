# HISTORIA
## White Paper v1: The Registry of Epistemological Truth
### Decentralized Protocol for Collective Memory on Gno.land

---

## 1. Philosophy & Vision

### The Distinction Between Reality and Truth

The foundation of HISTORIA rests on an essential philosophical nuance: the distinction between **Reality** and **Truth**.

**Reality** is a factual, immutable, absolute state.

**Truth** is a human construction—a version of reality validated by knowledge, evidence, and the consensus of a given era.

#### The Example of the Earth's Shape

The **Reality** of the Earth's shape has never changed. Yet, the **Truth** about it has radically evolved. During the Renaissance, the collective conviction in a flat Earth was as unshakeable as our current certainty of its sphericity.

**HISTORIA does not claim to capture absolute Reality, but to archive the Truth of the Moment.**

### Our Vision

HISTORIA serves as a **timeline of the evolution of human thought**. By archiving economic and social consensus at a moment $T$, the protocol protects each stage of our understanding against forgetting or retroactive revisionism.

We create a system where:

- **Truth is verified, not dictated.**
- **Economic alignment ensures honesty.**
- **Epistemological humility is the rule**: we accept that today's truth may be tomorrow's historical curiosity.

---

## 2. Problem Statement

### Centralized Revisionism

Current databases (Wikipedia, state servers) are mutable. A past truth can be erased to match present needs.

### Crisis of Trust

The absence of "skin in the game" in information verification allows the proliferation of artificial consensus (bots, propaganda).

### Loss of Historical Context

We lose track of what we once believed, preventing us from understanding the evolution of our own logic.

---

## 3. The Solution: The HISTORIA Protocol

HISTORIA introduces a **Commit-Reveal Voting Mechanism** with **One Wallet, One Vote** consensus.

### Consensus Mechanism

**1. PROPOSAL**: A user submits a historical claim with a stake in GNOT.

**2. COMMIT**: Voters deposit a stake and a cryptographically sealed vote ($SHA256$). No one can see the vote trend.

**3. REVEAL**: Voters open their vote. Those who fail to reveal lose their stake.

**4. RESOLUTION**: The majority defines the "Archived Truth." Winners split the losers' stakes.

---

## 4. Technical Architecture (Gno.land)

The protocol uses **AVL Tree** data structures to guarantee $O(\log n)$ lookups and predictable gas costs.

### Code Extract

```go
type Event struct {
    Description  string    // The historical claim
    Outcome      int       // FOR, AGAINST, TIE
    Status       int       // COMMIT, REVEAL, RESOLVED
    VotesFor     int
    VotesAgainst int
}
```

### Key Parameters

- **One wallet = One vote**: Prevents plutocracy (the wealthy don't decide truth).
- **Minimum stake (1 GNOT)**: Makes bot attacks (Sybil) economically suicidal.
- **2% fee**: 1% for the proposer (incentivizes quality), 1% for protocol maintenance.

---

## 5. Economic Model (Game Theory)

The protocol creates a **Nash equilibrium** where honesty is the dominant strategy:

- If you vote against the majority consensus (the accepted truth), you lose your stake.
- Since votes are hidden during the Commit phase, you cannot opportunistically follow the crowd. You must vote according to your conviction and available evidence.

### Cryptographic Integrity

**Commit Phase**:
```
hash = SHA256(voterAddress + ":" + vote + ":" + secret)
```

**Reveal Phase**:
```
contract verifies: SHA256(address:vote:secret) == stored_hash
```

This ensures:
- **Vote privacy**: No one can determine your vote from the hash
- **Immutability**: Cannot change vote after commitment
- **Verifiability**: Anyone can verify revealed votes
- **No coordination**: Cannot see others' votes until reveal

---

## 6. Use Cases

### Fact Verification
Establish a permanent registry of election results, scientific discoveries, or sporting events.

### Anti-Revisionism
Archive public statements so they cannot be denied later.

### Knowledge Markets
Create financial incentive for historical accuracy research.

### Educational Resource
Provide verifiable historical consensus for academic purposes.

### Legal Evidence
Create immutable records for dispute resolution and court cases.

---

## 7. Technical Specifications

### Smart Contract (Gno.land Realm)

**State Management**:
- `events`: AVL tree mapping eventID → Event
- `commits`: AVL tree mapping "eventID:address" → Commit
- Persistent on-chain storage

**Core Functions**:

```go
// Write functions (transactions)
func Submit(description string, stakeAmount int64,
            commitMinutes int, revealMinutes int,
            commitHash string) string

func CommitVote(eventID string, commitHash string)

func RevealVote(eventID string, vote bool, secret string)

func Resolve(eventID string)

// Read functions (queries)
func Render(path string) string
func RenderUserStats(userAddr string) string
```

### Phase System

**Phase 1: COMMIT** (proposer-defined duration)
- Proposer submits claim with stake
- Voters submit sealed votes
- Votes are cryptographically hidden
- Prevents manipulation and coordination

**Phase 2: REVEAL** (proposer-defined duration)
- Voters reveal their vote + secret
- Contract verifies hash matches
- Non-revealers forfeit stake
- Real-time vote tallying

**Phase 3: RESOLVED** (permanent)
- Majority determines outcome
- Stakes redistributed to winners
- 2% fee collected
- Event becomes permanent record

**Special Case: VOIDED**
- No reveals = event voided
- All stakes refunded
- Prevents spam attacks

---

## 8. Security Considerations

### Sybil Attack Resistance

**Cost to create 1000 fake wallets**:
- 1000 wallets × 1 GNOT = 1000 GNOT (~$5,000+)
- If attack fails, entire stake is lost
- Makes botting economically irrational

### Vote Buying Resistance

**Commit-reveal prevents verification**:
- Briber cannot verify how you voted
- Voters can take bribe and defect
- No way to prove vote direction during commit

### Collusion Resistance

**Blind commitment prevents coordination**:
- Must commit before seeing others' votes
- Cannot adjust strategy based on trends
- Pre-coordination without information is difficult

### No Admin Keys

- Cannot pause contracts
- Cannot upgrade contracts
- Cannot change parameters
- Cannot seize funds

**HISTORIA is immutable by design.**

---

## 9. Economic Analysis

### Stake Redistribution

**Example**:
```
Event: 10 voters × 1 GNOT = 10 GNOT pool
Outcome: 7 FOR, 3 AGAINST
Losers pool: 3 GNOT
Fee (2%): 0.06 GNOT
  - Proposer: 0.03 GNOT
  - Founder: 0.03 GNOT
Distributable: 2.94 GNOT
Per winner: (2.94 / 7) + 1 GNOT original stake
           = 1.42 GNOT per winner
Winner profit: 0.42 GNOT (+42% ROI)
```

### Incentive Structure

**For Proposers**:
- Earn 1% fee on resolved events
- Incentive to propose quality claims
- Economic reward for curation

**For Voters**:
- Earn share of losers' stakes if in majority
- Lose stake if in minority or fail to reveal
- Incentive to vote honestly and on time

**For Protocol**:
- 1% fee funds development
- Sustainable without external funding
- Aligned with protocol usage

---

## 10. Philosophical Implications

### The Humility of Knowledge

HISTORIA embodies **epistemological humility**—the recognition that our current understanding is provisional.

By archiving the consensus of each era, we create a record not just of facts, but of **how human understanding evolves**.

### The Antidote to Revisionism

In 1984, Orwell wrote:
> "Who controls the past controls the future. Who controls the present controls the past."

HISTORIA inverts this dynamic. By making the past **immutable and cryptographically verified**, we prevent retroactive manipulation of historical consensus.

### The Truth as a Market

Traditional epistemology asks: "What is true?"

HISTORIA asks: "What do economically aligned participants believe to be true, given current evidence?"

This shift from metaphysical truth to **social consensus with skin in the game** creates a pragmatic foundation for collective knowledge.

---

## 11. Governance

### Current Model: No Governance

The protocol is a **public utility**. Like Bitcoin, the rules are fixed and predictable.

**Immutable Rules**:
- Fee structure: 2% (1% proposer + 1% founder)
- Min stake: 1 GNOT
- Vote weight: 1 per wallet
- Changes require new contract deployment

**What Should Never Be Governed**:
- Individual event outcomes
- User stakes or rewards
- Censorship of events
- Vote weights

---

## 12. Roadmap

### Phase 1: Core Protocol ✅ (Current)
- [x] Commit-reveal voting mechanism
- [x] Stake redistribution
- [x] On-chain user statistics
- [x] Frontend (Next.js + Adena)

### Phase 2: Enhanced Features (Q2 2025)
- [ ] Event categories and tags
- [ ] Search and advanced filtering
- [ ] Evidence attachment (IPFS)
- [ ] Notifications system

### Phase 3: Social Layer (Q3 2025)
- [ ] User reputation system
- [ ] Discussion threads per event
- [ ] Leaderboards
- [ ] Following mechanism

### Phase 4: Ecosystem (Q4 2025)
- [ ] Developer API
- [ ] Third-party integrations
- [ ] Academic partnerships
- [ ] Cross-chain bridges

---

## 13. Protocol Parameters

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Min Stake | 1 GNOT | Anti-spam, accessible |
| Max Description | 280 chars | Forces clarity |
| Max Duration | 30 days | Prevents squatting |
| Min Phase | 1 minute | Allows testing |
| Proposer Fee | 1% | Incentivizes curation |
| Founder Fee | 1% | Sustainability |
| Vote Weight | 1 per wallet | Democratic |

---

## 14. Comparison to Alternatives

| Feature | HISTORIA | Polymarket | Wikipedia | Prediction Markets |
|---------|----------|------------|-----------|-------------------|
| **Focus** | Historical truth | Future events | Encyclopedia | Future outcomes |
| **Economic Stakes** | ✅ | ✅ | ❌ | ✅ |
| **One-Person-One-Vote** | ✅ | ❌ | ✅ | ❌ |
| **Immutable Record** | ✅ | ✅ | ❌ | ✅ |
| **Decentralized** | ✅ | ✅ | ❌ | ⚠️ |
| **No Oracles** | ✅ | ❌ | N/A | ❌ |
| **Sybil Resistant** | ✅ | ✅ | ❌ | ✅ |

---

## 15. Technical Deep Dive

### Hash Generation (JavaScript)

```javascript
import { sha256 } from 'js-sha256';

function generateCommitHash(
  address: string,
  vote: boolean,
  secret: string
): string {
  const voteStr = vote ? "1" : "0";
  const preimage = `${address}:${voteStr}:${secret}`;
  return sha256(preimage);
}

// Example
const address = "g1abc123...";
const vote = true;
const secret = "my_random_secret";

const hash = generateCommitHash(address, vote, secret);
// Output: "a3f5e8d9c2b1..." (64 hex chars)
```

### Stake Distribution Formula

```
losersPool = lostVotes × stakeAmount
totalFees = losersPool × 0.02
proposerFee = totalFees × 0.5
founderFee = totalFees × 0.5
distributablePool = losersPool - totalFees
perWinnerProfit = distributablePool / winnerCount
perWinnerPayout = stakeAmount + perWinnerProfit
```

---

## 16. Future Research Directions

### Reputation-Weighted Voting

Future versions may explore:
- Accuracy-based reputation scores
- Weighted voting based on historical performance
- Delegation mechanisms for expertise

### Cross-Chain Consensus

Potential for:
- IBC integration with Cosmos chains
- Cross-chain event verification
- Multi-chain truth consensus

### AI Integration

Exploring:
- AI-assisted fact-checking
- Automated evidence gathering
- Semantic claim analysis

---

## 17. Conclusion

**HISTORIA is not merely a technological tool—it is a philosophical bulwark.**

It is the mirror of our understanding of the world, captured block by block, transaction by transaction.

By accepting that truth is a changing quest, we give it, for the first time, an immutable foundation.

In archiving not just facts, but the **evolution of human consensus**, HISTORIA becomes:

- A **defense against historical revisionism**
- A **record of epistemological progress**
- A **foundation for future understanding**

We do not claim to capture absolute Reality. We archive the Truth of the Moment—and in doing so, we preserve the intellectual honesty of our era for future generations to study, learn from, and transcend.

---

## "Truth is verified, not dictated."

---

## Resources

**Smart Contract**:
- Realm: `gno.land/r/melonboy314/historiav10`
- Chain: Gno.land (staging)
- Explorer: https://gnoscan.io

**Links**:
- Website: https://historia.app (coming soon)
- GitHub: https://github.com/historia (coming soon)
- Docs: https://docs.historia.app (coming soon)
- Discord: https://discord.gg/historia (coming soon)

---

## Legal Disclaimer

HISTORIA is experimental software. Use at your own risk.

By participating, you acknowledge:
- Smart contracts may contain bugs
- Stakes can be lost if you vote with minority
- No refunds for user error
- No expectation of profit
- Protocol is provided "as is"

---

## Appendix A: Mathematical Formalization

### Nash Equilibrium Analysis

Let $n$ be the number of voters, $s$ be the stake amount, and $p_i$ be player $i$'s belief about the truth.

**Payoff function**:
$$
U_i(v_i, v_{-i}) = \begin{cases}
s + \frac{(n-k)s \cdot 0.98}{k} & \text{if } v_i = \text{majority} \\
0 & \text{if } v_i \neq \text{majority}
\end{cases}
$$

where $k$ = number of majority voters.

**Dominant strategy**: Vote according to true belief $p_i$, since you cannot observe $v_{-i}$ during commit phase.

This creates a **truthful Nash equilibrium** where honesty maximizes expected utility.

---

## Appendix B: Code Repository Structure

```
HISTORIA/
├── r/historia/              # Gno.land realm (smart contract)
│   ├── historia.gno        # Core logic
│   ├── historia_test.gno   # Test suite
│   └── gnomod.toml         # Dependencies
├── web/                     # Frontend (Next.js)
│   ├── src/
│   │   ├── app/            # Pages
│   │   ├── components/     # React components
│   │   ├── contexts/       # Wallet context
│   │   └── lib/            # Gno client
│   └── package.json
├── WHITEPAPER.md           # This document
└── README.md               # Quick start guide
```

---

**Document Version**: 1.0
**Last Updated**: February 2025
**License**: CC BY-SA 4.0

---

*In memory of all the truths we once believed, and in anticipation of those we have yet to discover.*
