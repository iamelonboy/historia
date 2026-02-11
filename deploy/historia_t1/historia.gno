// HISTORIA: Decentralized Ledger of Collective Memory
// Commit-reveal blind voting with stake redistribution.
// One wallet, one vote. Less is more.
package historia

import (
	"crypto/sha256"
	"encoding/hex"
	"time"

	"chain"
	"chain/banker"
	"chain/runtime"

	"gno.land/p/melonboy314/avl"
	"gno.land/p/melonboy314/ufmt"
)

const (
	StatusCommit   = 0
	StatusReveal   = 1
	StatusResolved = 2
	StatusVoided   = 3

	MaxTotalMinutes   = 43200   // 30 days in minutes
	MinPhaseMinutes   = 1       // 1 minute minimum
	MinStakeAmount    = 1000000 // 1 GNOT minimum (prevents spam)
	MaxDescriptionLen = 280     // Max characters for description
)

var (
	founder address = "g1caam202v07etgtvk79wcv6m0k2uzjqqqkwrkln" // Founder address for fee distribution
)

// Event represents a historical entry submitted to the timeline.
type Event struct {
	Description  string
	Proposer     address
	StakeAmount  int64 // ugnot per voter
	CommitEnd    time.Time
	RevealEnd    time.Time
	Status       int
	Version      int
	ParentID     string // "" for v1
	VotesFor     int
	VotesAgainst int
	Commits      int
	Reveals      int
	Outcome      int // -1=pending, 0=against wins, 1=for wins, 2=tie
}

// Commit stores a voter's sealed ballot.
type Commit struct {
	Hash     string // hex sha256
	Revealed bool
	Vote     bool // valid only after Revealed
}

// --- Persistent state ---

var (
	events  *avl.Tree // eventID -> *Event
	commits *avl.Tree // "eventID:addr" -> *Commit
	nextID  uint64
)

func init() {
	events = avl.NewTree()
	commits = avl.NewTree()
}

// --- Helpers ---

func eid(id uint64) string {
	return ufmt.Sprintf("%d", id)
}

func getEvent(id string) *Event {
	v, ok := events.Get(id)
	if !ok {
		panic("event not found")
	}
	return v.(*Event)
}

func ckey(eventID string, addr address) string {
	return eventID + ":" + string(addr)
}

func computeHash(addr address, vote bool, secret string) string {
	v := "0"
	if vote {
		v = "1"
	}
	h := sha256.Sum256([]byte(string(addr) + ":" + v + ":" + secret))
	return hex.EncodeToString(h[:])
}

func assertStake(expected int64) {
	sent := banker.OriginSend()
	if sent.AmountOf("ugnot") != expected {
		panic("incorrect stake amount")
	}
}

// --- Core functions ---

// Submit creates a new historical event. Caller is the first voter and must
// send exactly stakeAmount ugnot with the transaction.
// commitHash = hex(sha256("callerAddr:0or1:secret"))
func Submit(cur realm, description string, stakeAmount int64, commitMinutes int, revealMinutes int, commitHash string) string {
	caller := runtime.PreviousRealm().Address()

	if len(description) == 0 {
		panic("empty description")
	}
	if len(description) > MaxDescriptionLen {
		panic("description too long (max 280 characters)")
	}
	if stakeAmount < MinStakeAmount {
		panic("stake must be >= 1 GNOT")
	}
	if commitMinutes < MinPhaseMinutes || revealMinutes < MinPhaseMinutes {
		panic("each phase must be >= 1 minute")
	}
	if commitMinutes+revealMinutes > MaxTotalMinutes {
		panic("total duration exceeds 30 days")
	}
	if len(commitHash) != 64 {
		panic("invalid hash length")
	}

	assertStake(stakeAmount)

	nextID++
	id := eid(nextID)
	now := time.Now()

	ev := &Event{
		Description: description,
		Proposer:    caller,
		StakeAmount: stakeAmount,
		CommitEnd:   now.Add(time.Duration(commitMinutes) * time.Minute),
		RevealEnd:   now.Add(time.Duration(commitMinutes+revealMinutes) * time.Minute),
		Status:      StatusCommit,
		Version:     1,
		Outcome:     -1,
		Commits:     1,
	}
	events.Set(id, ev)
	commits.Set(ckey(id, caller), &Commit{Hash: commitHash})

	chain.Emit("SubmitEvent", "id", id, "proposer", string(caller))
	return id
}

// CommitVote registers a sealed vote during the commit phase.
// Caller must send exactly the event's stakeAmount in ugnot.
func CommitVote(cur realm, eventID string, commitHash string) {
	caller := runtime.PreviousRealm().Address()
	ev := getEvent(eventID)

	if time.Now().After(ev.CommitEnd) {
		panic("commit phase ended")
	}

	key := ckey(eventID, caller)
	if _, exists := commits.Get(key); exists {
		panic("already committed")
	}

	if len(commitHash) != 64 {
		panic("invalid hash length")
	}

	assertStake(ev.StakeAmount)

	commits.Set(key, &Commit{Hash: commitHash})
	ev.Commits++

	chain.Emit("CommitVote", "eventID", eventID, "voter", string(caller))
}

// RevealVote opens a previously committed vote during the reveal phase.
// The contract verifies sha256(callerAddr:vote:secret) matches the commit.
func RevealVote(cur realm, eventID string, vote bool, secret string) {
	caller := runtime.PreviousRealm().Address()
	ev := getEvent(eventID)
	now := time.Now()

	if now.Before(ev.CommitEnd) {
		panic("commit phase not ended")
	}
	if now.After(ev.RevealEnd) {
		panic("reveal phase ended")
	}

	key := ckey(eventID, caller)
	v, ok := commits.Get(key)
	if !ok {
		panic("no commit found")
	}
	c := v.(*Commit)

	if c.Revealed {
		panic("already revealed")
	}

	if computeHash(caller, vote, secret) != c.Hash {
		panic("hash mismatch")
	}

	c.Revealed = true
	c.Vote = vote
	ev.Reveals++
	if vote {
		ev.VotesFor++
	} else {
		ev.VotesAgainst++
	}

	if ev.Status == StatusCommit {
		ev.Status = StatusReveal
	}

	chain.Emit("RevealVote", "eventID", eventID, "voter", string(caller))
}

// Resolve finalizes an event after the reveal deadline. Anyone can call this.
func Resolve(cur realm, eventID string) {
	ev := getEvent(eventID)

	if time.Now().Before(ev.RevealEnd) {
		panic("reveal phase not ended")
	}
	if ev.Status == StatusResolved || ev.Status == StatusVoided {
		panic("already resolved")
	}

	if ev.Reveals == 0 {
		ev.Status = StatusVoided
		ev.Outcome = -1
		chain.Emit("Resolve", "eventID", eventID, "outcome", "voided")
		return
	}

	if ev.VotesFor > ev.VotesAgainst {
		ev.Outcome = 1
	} else if ev.VotesAgainst > ev.VotesFor {
		ev.Outcome = 0
	} else {
		ev.Outcome = 2
	}
	ev.Status = StatusResolved

	distribute(eventID, ev)

	chain.Emit("Resolve", "eventID", eventID,
		"outcome", ufmt.Sprintf("%d", ev.Outcome),
		"for", ufmt.Sprintf("%d", ev.VotesFor),
		"against", ufmt.Sprintf("%d", ev.VotesAgainst))
}

// distribute sends stakes to winners and fees to proposer/founder.
func distribute(eventID string, ev *Event) {
	bnk := banker.NewBanker(banker.BankerTypeRealmSend)
	realmAddr := runtime.CurrentRealm().Address()
	stake := ev.StakeAmount

	prefix := eventID + ":"
	stop := eventID + ";" // ";" is next ASCII char after ":"

	// Tie or unanimous: refund all revealers, non-revealers forfeit.
	if ev.Outcome == 2 || ev.VotesFor == 0 || ev.VotesAgainst == 0 {
		commits.Iterate(prefix, stop, func(key string, val any) bool {
			c := val.(*Commit)
			if c.Revealed {
				addr := address(key[len(prefix):])
				bnk.SendCoins(realmAddr, addr, chain.Coins{chain.NewCoin("ugnot", stake)})
			}
			return false
		})
		return
	}

	// Normal: majority wins, minority + non-revealers lose stake.
	winVote := ev.Outcome == 1 // true = FOR wins
	var winners []address
	var losersPool int64

	commits.Iterate(prefix, stop, func(key string, val any) bool {
		c := val.(*Commit)
		addr := address(key[len(prefix):])
		if !c.Revealed {
			losersPool += stake
		} else if c.Vote == winVote {
			winners = append(winners, addr)
		} else {
			losersPool += stake
		}
		return false
	})

	// 2% fee on losers pool: 1% proposer + 1% founder
	proposerFee := losersPool / 100
	founderFee := losersPool / 100
	distributable := losersPool - proposerFee - founderFee

	if proposerFee > 0 {
		bnk.SendCoins(realmAddr, ev.Proposer, chain.Coins{chain.NewCoin("ugnot", proposerFee)})
	}
	if founderFee > 0 {
		bnk.SendCoins(realmAddr, founder, chain.Coins{chain.NewCoin("ugnot", founderFee)})
	}

	n := int64(len(winners))
	if n == 0 {
		// No winners: all stakes go to fees (already distributed above)
		return
	}

	perWinner := distributable / n
	dust := distributable % n

	for i, w := range winners {
		payout := stake + perWinner
		if i == 0 {
			payout += dust
		}
		bnk.SendCoins(realmAddr, w, chain.Coins{chain.NewCoin("ugnot", payout)})
	}
}

// --- Render ---

func Render(path string) string {
	if path == "" {
		return renderHome()
	}
	// Support "stats:address" to get user statistics
	if len(path) > 6 && path[:6] == "stats:" {
		return renderUserStats(path[6:])
	}
	return renderEvent(path)
}

func renderHome() string {
	out := "# HISTORIA\n\n*Decentralized Ledger of Collective Memory*\n\n"

	// Calculate unique voters
	uniqueVoters := make(map[string]bool)
	commits.Iterate("", "", func(key string, val any) bool {
		// Extract address from key format "eventID:address"
		for i := len(key) - 1; i >= 0; i-- {
			if key[i] == ':' {
				addr := key[i+1:]
				uniqueVoters[addr] = true
				break
			}
		}
		return false
	})

	out += ufmt.Sprintf("**Total Events:** %d\n\n", nextID)
	out += ufmt.Sprintf("**Unique Voters:** %d\n\n", len(uniqueVoters))

	if nextID == 0 {
		return out + "No events yet.\n"
	}

	count := 0
	for i := nextID; i >= 1 && count < 20; i-- {
		id := eid(i)
		v, ok := events.Get(id)
		if !ok {
			continue
		}
		ev := v.(*Event)
		poolGnot := (ev.StakeAmount * int64(ev.Commits)) / 1000000
		out += ufmt.Sprintf("- **#%s** [%s] %s | Pool: %d GNOT (v%d)\n",
			id, statusLabel(ev.Status), ev.Description, poolGnot, ev.Version)
		count++
	}
	return out
}

func renderEvent(id string) string {
	v, ok := events.Get(id)
	if !ok {
		return "Event not found."
	}
	ev := v.(*Event)

	out := ufmt.Sprintf("# Event #%s\n\n", id)
	out += ufmt.Sprintf("**Description:** %s\n\n", ev.Description)
	out += ufmt.Sprintf("**Status:** %s\n\n", statusLabel(ev.Status))
	out += ufmt.Sprintf("**Proposer:** %s\n\n", string(ev.Proposer))
	out += ufmt.Sprintf("**Stake:** %d ugnot\n\n", ev.StakeAmount)
	out += ufmt.Sprintf("**Version:** %d", ev.Version)
	if ev.ParentID != "" {
		out += ufmt.Sprintf(" (contests #%s)", ev.ParentID)
	}
	out += "\n\n"
	out += ufmt.Sprintf("**Commits:** %d | **Reveals:** %d\n\n", ev.Commits, ev.Reveals)
	out += ufmt.Sprintf("**Commit End:** %d | **Reveal End:** %d\n\n", ev.CommitEnd.Unix(), ev.RevealEnd.Unix())

	if ev.Status >= StatusResolved {
		out += ufmt.Sprintf("**Votes For:** %d | **Against:** %d\n\n", ev.VotesFor, ev.VotesAgainst)
		out += ufmt.Sprintf("**Outcome:** %s\n", outcomeLabel(ev.Outcome))
	}
	return out
}

func renderUserStats(userAddr string) string {
	if userAddr == "" {
		return "STATS|0|0|0|0|0|0"
	}

	addr := address(userAddr)
	var totalVotes int
	var totalReveals int
	var wonVotes int
	var totalStaked int64
	var proposedEvents int

	// Iterate through all events
	events.Iterate("", "", func(key string, val any) bool {
		ev := val.(*Event)

		// Count proposals
		if ev.Proposer == addr {
			proposedEvents++
		}

		// Check if user voted on this event
		ck := ckey(key, addr)
		if commitVal, ok := commits.Get(ck); ok {
			c := commitVal.(*Commit)
			totalVotes++
			totalStaked += ev.StakeAmount

			if c.Revealed {
				totalReveals++

				// If event is resolved, check if vote won
				if ev.Status == StatusResolved && ev.Outcome != -1 && ev.Outcome != 2 {
					winVote := ev.Outcome == 1 // true = FOR wins
					if c.Vote == winVote {
						wonVotes++
					}
				}
			}
		}

		return false // Continue iteration
	})

	winRate := 0
	if totalReveals > 0 {
		winRate = (wonVotes * 100) / totalReveals
	}

	// Return in parseable format: STATS|totalVotes|wonVotes|totalReveals|totalStaked|proposedEvents|winRate
	return ufmt.Sprintf("STATS|%d|%d|%d|%d|%d|%d",
		totalVotes, wonVotes, totalReveals, totalStaked, proposedEvents, winRate)
}

func statusLabel(s int) string {
	switch s {
	case StatusCommit:
		return "COMMIT"
	case StatusReveal:
		return "REVEAL"
	case StatusResolved:
		return "RESOLVED"
	default:
		return "VOIDED"
	}
}

func outcomeLabel(o int) string {
	switch o {
	case 1:
		return "ACCEPTED"
	case 0:
		return "REJECTED"
	case 2:
		return "TIED"
	default:
		return "PENDING"
	}
}
