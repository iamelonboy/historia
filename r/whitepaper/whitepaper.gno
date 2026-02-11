// HISTORIA White Paper - On-chain version
// Immutable documentation stored on Gno.land blockchain
package whitepaper

const (
	version = "1.0"
	date    = "December 2025"
)

// Render returns the white paper content
func Render(path string) string {
	out := "# HISTORIA\n"
	out += "## White Paper v" + version + ": The Registry of Epistemological Truth\n"
	out += "### Decentralized Protocol for Collective Memory on Gno.land\n\n"
	out += "**Version**: " + version + " | **Date**: " + date + "\n\n"
	out += "---\n\n"

	out += "## 1. Philosophy & Vision\n\n"
	out += "### The Distinction Between Reality and Truth\n\n"
	out += "The foundation of HISTORIA rests on an essential philosophical nuance: "
	out += "the distinction between **Reality** and **Truth**.\n\n"
	out += "**Reality** is a factual, immutable, absolute state.\n\n"
	out += "**Truth** is a human construction—a version of reality validated by knowledge, "
	out += "evidence, and the consensus of a given era.\n\n"

	out += "### The Example of the Earth's Shape\n\n"
	out += "The **Reality** of the Earth's shape has never changed. Yet, the **Truth** about it "
	out += "has radically evolved. During the Renaissance, the collective conviction in a flat Earth "
	out += "was as unshakeable as our current certainty of its sphericity.\n\n"
	out += "**HISTORIA does not claim to capture absolute Reality, but to archive the Truth of the Moment.**\n\n"

	out += "### Our Vision\n\n"
	out += "HISTORIA serves as a **timeline of the evolution of human thought**. "
	out += "By archiving economic and social consensus at a moment T, the protocol protects "
	out += "each stage of our understanding against forgetting or retroactive revisionism.\n\n"
	out += "We create a system where:\n\n"
	out += "- **Truth is verified, not dictated.**\n"
	out += "- **Economic alignment ensures honesty.**\n"
	out += "- **Epistemological humility is the rule**: we accept that today's truth may be tomorrow's historical curiosity.\n\n"

	out += "---\n\n"

	out += "## 2. Problem Statement\n\n"
	out += "### Centralized Revisionism\n\n"
	out += "Current databases (Wikipedia, state servers) are mutable. "
	out += "A past truth can be erased to match present needs.\n\n"
	out += "### Crisis of Trust\n\n"
	out += "The absence of \"skin in the game\" in information verification "
	out += "allows the proliferation of artificial consensus (bots, propaganda).\n\n"
	out += "### Loss of Historical Context\n\n"
	out += "We lose track of what we once believed, preventing us from understanding "
	out += "the evolution of our own logic.\n\n"

	out += "---\n\n"

	out += "## 3. The Solution: The HISTORIA Protocol\n\n"
	out += "HISTORIA introduces a **Commit-Reveal Voting Mechanism** with **One Wallet, One Vote** consensus.\n\n"
	out += "### Consensus Mechanism\n\n"
	out += "**1. PROPOSAL**: A user submits a historical claim with a stake in GNOT.\n\n"
	out += "**2. COMMIT**: Voters deposit a stake and a cryptographically sealed vote (SHA256). "
	out += "No one can see the vote trend.\n\n"
	out += "**3. REVEAL**: Voters open their vote. Those who fail to reveal lose their stake.\n\n"
	out += "**4. RESOLUTION**: The majority defines the \"Archived Truth.\" "
	out += "Winners split the losers' stakes.\n\n"

	out += "---\n\n"

	out += "## 4. Technical Architecture (Gno.land)\n\n"
	out += "The protocol uses **AVL Tree** data structures to guarantee O(log n) lookups "
	out += "and predictable gas costs.\n\n"
	out += "### Key Parameters\n\n"
	out += "- **One wallet = One vote**: Prevents plutocracy (the wealthy don't decide truth).\n"
	out += "- **Minimum stake (1 GNOT)**: Makes bot attacks (Sybil) economically suicidal.\n"
	out += "- **2% fee**: 1% for the proposer (incentivizes quality), 1% for protocol maintenance.\n\n"
	out += "### Smart Contract\n\n"
	out += "**Realm**: gno.land/r/melonboy314/historiav10\n"
	out += "**Chain**: Gno.land (staging) then (mainnet)\n\n"
	out += "**Core Functions**:\n\n"
	out += "- Submit(description, stake, commitTime, revealTime, hash)\n"
	out += "- CommitVote(eventID, hash)\n"
	out += "- RevealVote(eventID, vote, secret)\n"
	out += "- Resolve(eventID)\n\n"

	out += "---\n\n"

	out += "## 5. Economic Model (Game Theory)\n\n"
	out += "The protocol creates a **Nash equilibrium** where honesty is the dominant strategy:\n\n"
	out += "- If you vote against the majority consensus (the accepted truth), you lose your stake.\n"
	out += "- Since votes are hidden during the Commit phase, you cannot opportunistically follow the crowd.\n"
	out += "- You must vote according to your conviction and available evidence.\n\n"
	out += "### Stake Redistribution Example\n\n"
	out += "```\n"
	out += "Event: 10 voters × 1 GNOT = 10 GNOT pool\n"
	out += "Outcome: 7 FOR, 3 AGAINST\n"
	out += "Losers pool: 3 GNOT\n"
	out += "Fee (2%): 0.06 GNOT\n"
	out += "  - Proposer: 0.03 GNOT\n"
	out += "  - Founder: 0.03 GNOT\n"
	out += "Distributable: 2.94 GNOT\n"
	out += "Per winner: (2.94 / 7) + 1 GNOT = 1.42 GNOT\n"
	out += "Winner profit: +42% ROI\n"
	out += "```\n\n"

	out += "---\n\n"

	out += "## 6. Security Considerations\n\n"
	out += "### Sybil Attack Resistance\n\n"
	out += "**Cost to create 1000 fake wallets**:\n\n"
	out += "- 1000 wallets × 1 GNOT = 1000 GNOT (~$5,000+)\n"
	out += "- If attack fails, entire stake is lost\n"
	out += "- Makes botting economically irrational\n\n"
	out += "### Vote Buying Resistance\n\n"
	out += "**Commit-reveal prevents verification**:\n\n"
	out += "- Briber cannot verify how you voted\n"
	out += "- Voters can take bribe and defect\n"
	out += "- No way to prove vote direction during commit\n\n"
	out += "### Collusion Resistance\n\n"
	out += "**Blind commitment prevents coordination**:\n\n"
	out += "- Must commit before seeing others' votes\n"
	out += "- Cannot adjust strategy based on trends\n"
	out += "- Pre-coordination without information is difficult\n\n"
	out += "### Immutability\n\n"
	out += "- No admin keys\n"
	out += "- Cannot pause, upgrade, or modify contracts\n"
	out += "- Cannot change parameters or seize funds\n\n"

	out += "---\n\n"

	out += "## Conclusion\n\n"
	out += "**HISTORIA is not merely a technological tool—it is a philosophical bulwark.**\n\n"
	out += "It is the mirror of our understanding of the world, captured block by block, "
	out += "transaction by transaction.\n\n"
	out += "By accepting that truth is a changing quest, we give it, for the first time, "
	out += "an immutable foundation.\n\n"
	out += "In archiving not just facts, but the **evolution of human consensus**, HISTORIA becomes:\n\n"
	out += "- A **defense against historical revisionism**\n"
	out += "- A **record of epistemological progress**\n"
	out += "- A **foundation for future understanding**\n\n"
	out += "We do not claim to capture absolute Reality. We archive the Truth of the Moment—"
	out += "and in doing so, we preserve the intellectual honesty of our era for future generations "
	out += "to study, learn from, and transcend.\n\n"

	out += "---\n\n"

	out += "## \"Truth is verified, not dictated.\"\n\n"

	out += "---\n\n"

	out += "**Document Version**: " + version + "\n"
	out += "**Last Updated**: " + date + "\n\n"
	out += "*Stored immutably on Gno.land blockchain*\n"

	return out
}
