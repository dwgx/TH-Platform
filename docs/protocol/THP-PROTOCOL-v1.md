# THP Protocol v1 — specification

**Status:** design frozen for v1.0. Reference implementation:
`D:/Project/TH08-Platform/protocol/`.
**Scope:** the wire format of a lockstep battle session for Touhou STG games.

---

## 0. What this document is for, and what it deliberately is not

THP is a **strict deterministic lockstep** protocol. Two peers run the same
game build, feed each other the same per-frame inputs from the same starting
seed, and are required to arrive at bit-identical simulation state. It is not a
rollback protocol, not a state-streaming protocol, and not a lockstep protocol
with optional rollback.

That choice is forced by the games, not preferred for elegance.
`RUEEE/th06_multi_net` draws its spirit-mode drift vector from the shared RNG
(`src/Player.cpp:452-472`) and a shared item's spawn position from the same RNG
(`src/GameManager.cpp:203`). A rollback netcode that speculates past a random
draw cannot undo the draw, so it would have to serialise every RNG touch or lose
those features. THP does not take that trade. Section 8 (state hashing) is the
mechanism for *detecting* divergence; lockstep is the mechanism for *preventing*
it.

THP also is **not** a general-purpose netcode library, and not a rollback
framework for other genres.

### Provenance and licensing

| Upstream | Commit | License | Use |
|---|---|---|---|
| `koishikois259/th08-multi` | `934977483e7d64f8b192b86d43d21886c318eaa9` | **MIT** | Adapted. Input sample shape, redundancy window, hash construction, deferred comparison, monotonic-frame keying, BUILD_MISMATCH. |
| `RUEEE/th06_multi_net` | `fd64f9f01698ca336de803d753baa2ca4e7d9131` | **CC0 1.0** (`LICENSE:1-3`, waiver `LICENSE:63-78`) | Adapted. Resync/repair model, bounded resync plausibility, gameplay-over-wire analysis. |

TH06's CC0 is a public-domain dedication: **strictly more permissive than MIT**
for our purposes — no attribution obligation, no copyleft, nothing viral. The one
carve-out is that CC0 grants no patent rights (`LICENSE:104-105`), which does not
affect a protocol specification. Both are safe to copy from.

### What this document deliberately does NOT claim

This project retracted a "proof of synchronization" once because the evidence was
the game's own unattended attract demo. The standard here is that a claim states
its own limits. Section 8.6 is the load-bearing section of this document, and it
is written to be quoted, not skimmed.

---

## 1. Design goals

1. **Game-agnostic core, per-game profile.** Framing, handshake, lifecycle,
   keepalive and the error model are shared. Input bit layout, state-hash
   coverage and start conditions are not, and must never leak into the core.
2. **Versioned, and rejectable cleanly.** A peer of a different major version
   must be told so in one round trip, not fed to a body decoder.
3. **Survive packet loss without retransmission logic.**
4. **Prove synchronisation, or say plainly that we did not.** Section 8.
5. **Recover.** A protocol that can only detect desync is a debug tool. Section 8.7.
6. **Layout changes must fail the build, not the session.**

### 1.1 Non-goals

- Authentication. TH06 has none (`src/ConnectionUI.cpp` handshake is a bare
  version int in a `CtrlPack`) and th08-multi has none. THP v1 does not pretend
  to; the address channel is closed in this project (§6 of `AGENTS.md`), so the
  peer endpoint is established out of band.
- Spectators, more than two peers per session, or any mesh topology. The packet
  format does not forbid them; v1 does not specify them.
- Reliable ordered delivery. THP assumes lossy, reorderable UDP and builds
  redundancy into every input packet instead (§5).

---

## 2. Framing

### 2.1 Datagram = exactly one packet

Every THP datagram carries exactly one packet. UDP's datagram boundary *is* the
packet boundary, so there is no length prefix above the header; `body_length`
inside the header exists to catch truncation and contradiction, not to frame.

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+---------------------------------------------------------------+
|                    magic  'T' 'H' 'P' 0x00                    |  4
+---------------------------------------------------------------+
| ver_major | ver_minor |   type    |   flags   |               |  2
+-------------------------------+-------------------------------+
|          body_length           |          reserved            |  4
+---------------------------------------------------------------+
|                           session                              |  4
+---------------------------------------------------------------+
|                              seq                               |  4
+---------------------------------------------------------------+
|                      body (body_length bytes)                  |  n
+---------------------------------------------------------------+
                            total: 20 + n
```

| Offset | Size | Field | Notes |
|---|---|---|---|
| 0 | 4 | `magic` | `'T' 'H' 'P' 0x00` — byte 3 is NUL so the magic reads as a C string |
| 4 | 1 | `ver_major` | `1` |
| 5 | 1 | `ver_minor` | `0` |
| 6 | 1 | `type` | `thp_packet_type`, §2.3 |
| 7 | 1 | `flags` | `THP_FLAG_*`, §2.4 |
| 8 | 2 | `body_length` | big endian; bytes of body following the header |
| 10 | 2 | `reserved` | big endian; **must be zero in v1** |
| 12 | 4 | `session` | big endian; `0` until WELCOME is accepted, then stable |
| 16 | 4 | `seq` | big endian; per-sender monotonic |

**Byte order is big endian (network byte order) everywhere.** See §2.6 for how
that is made structural rather than conventional.

**The 20-byte prefix is frozen for the lifetime of major version 1.** Everything
after it may grow within a major.

### 2.2 Header validation

A receiver MUST reject a datagram unless all of the following hold, and MUST do
so *before* reading a single body byte:

- length ≥ 20;
- `magic` equals `THP_MAGIC_0..3`;
- `ver_major` equals `THP_VERSION_MAJOR`;
- `type` is the expected type for this state machine position;
- reserved flag bits (§2.4) are zero;
- `reserved` is zero;
- `body_length` equals the bytes actually present.

Checking the version in the fixed prefix is what makes a clean version
rejection possible (§3.3).

### 2.3 Packet types

Core types occupy `0x01`–`0x1F`. **Profile-specific behaviour does not get its
own packet type**; it rides in `THP_PKT_GAMEPLAY` under a profile-defined
enumerator (§9.3). This keeps the core type table closed, so a future profile
cannot collide with a future core type.

| Value | Type | Direction | Purpose |
|---|---|---|---|
| `0x01` | `HELLO` | guest → host | Open a session attempt |
| `0x02` | `NEGOTIATE` | host → guest | Accept or reject, with a reason |
| `0x03` | `WELCOME` | host → guest | Session established; seed, delay, profile blob |
| `0x04` | `START` | host → guest | Run begins at a common frame |
| `0x05` | `INPUT` | both | Per-frame inputs + state hash |
| `0x06` | `CONTROL` | both | Out-of-band session control |
| `0x07` | `GAMEPLAY` | both | Profile-defined frame-bound intent |
| `0x08` | `KEEPALIVE` | both | Liveness and RTT |
| `0x09` | `RESYNC` | host → guest | Re-establish state at a future frame |
| `0x0A` | `DISCONNECT` | both | Terminal, with a reason |

### 2.4 Header flags

| Bit | Name | Meaning |
|---|---|---|
| `0x01` | `ACK` | this CONTROL/GAMEPLAY message confirms a prior one |
| `0x02` | `NAK` | … and refuses it |
| `0x04` | `FINAL` | no further packet of this exchange will follow |
| `0x07` | — | reserved, must be transmitted as zero in v1 |

### 2.5 Packet sizes

| Packet | Fixed part | Variable | Max total |
|---|---|---|---|
| `HELLO` | 76 | — | 76 |
| `NEGOTIATE` | 42 | — | 42 |
| `WELCOME` | 56 | `profile_blob_length` ≤ 512 | 568 |
| `START` | 36 | — | 36 |
| `INPUT` | 40 | `6 × sample_count`, `sample_count` ∈ [1,15] | **130** |
| `CONTROL` | 36 | — | 36 |
| `GAMEPLAY` | 36 | profile-defined tail | 36 + profile tail |
| `KEEPALIVE` | 40 | — | 40 |
| `RESYNC` | 36 | — | 36 |
| `DISCONNECT` | 32 | — | 32 |

The worst case, a full-redundancy `INPUT`, is **130 bytes** — comfortably inside
a 1500-byte IPv4 datagram and a 1200-byte IPv6 minimum MTU. A full session
control exchange is under 700 bytes per frame at 60 Hz.

### 2.6 Byte order is structural, not conventional

Every multi-byte scalar inside a THP struct is stored as a `uint8_t b[N]` array
holding the value in network byte order **exactly as it appears on the wire**.
Three consequences, which are the reason for the choice:

1. **A struct's in-memory image *is* its wire image**, byte for byte, on a
   little-endian x86-64, a big-endian host, or the 32-bit x86 target the DLL
   builds for. There is no conversion step to forget.
2. **No struct can acquire padding.** Every member has alignment 1, so no
   `#pragma pack` is needed and `sizeof` is exact and identical everywhere. This
   is what makes the `static_assert` size checks load-bearing rather than
   decorative.
3. **Endianness is a type-level property**, visible in the struct declaration,
   not a runtime convention.

The alternative — native integers in the struct plus a conversion step — is
correct only if nobody ever forgets the conversion. This project has already
shipped one byte-exact wire header, and "only if" is not a good place to hold a
protocol invariant.

`thp_octetNN` types are named **by width in bytes**, not by element count:
`thp_octet8` is 8 bytes, `thp_octet32` is a 32-byte SHA-256 digest,
`thp_octet64` is 64 bytes. A field that merely needs a wide integer uses
`thp_be16/be32/be64`. Confusing the two is not hypothetical: it is how the first
draft of `HELLO` silently grew to 132 bytes, and the only reason it was caught
is that a `static_assert` fired.

---

## 3. Versioning

### 3.1 The policy

| Field | Rule |
|---|---|
| **MAJOR** | A change an older peer cannot parse at all. Bump on: removing or reordering a field, changing a field's width, changing the meaning of an existing value, changing the magic, changing the header layout. |
| **MINOR** | Additive only. A MINOR bump may add a packet type, add an enumerator, or grow a packet's trailing `reserved` tail or a profile blob — never re-interpret or remove anything. |

A v1.0 peer that receives v1.7 traffic it does not recognise **must** keep
working, and must ignore packet types and enumerators it does not know.

### 3.2 Ranges, not points

Peers agree on a version *range*, not a version. `HELLO` carries the joining
peer's minimum supported version in an opaque 8-byte descriptor
(`client_version`); `NEGOTIATE` carries the intersection, as
`[min_major.min_minor, max_major.max_minor]`.

A peer that speaks only `{1.0..1.0}` meeting one that speaks `{1.0..2.3}` gets
range 1.0 and proceeds.

### 3.3 When an old peer meets a new one

Because the version lives in the fixed 20-byte prefix, a v1 peer can reject a
major-2 peer having read 4 bytes. The flow is:

```
guest                                   host
  |---- HELLO {ver_major=2, ...} ------>|   host: prefix check fails at ver_major
  |<--- NEGOTIATE {accepted=0,
  |              reason=VERSION_MISMATCH,
  |              min=1.0 max=1.9} ------|   host states what it DOES speak
```

The guest can then say something actionable: "update your client" or "you are
too new". This is strictly better than either reference: th08-multi compares its
version for exact equality inside header validation, so an incompatible peer is
silently dropped on the floor with no reason transmitted; TH06 compares a `ver`
int buried in a `CtrlPack` and shows a `MessageBox`
(`src/ConnectionUI.cpp:447-448`, `:521-522`).

### 3.4 Build fingerprint — named separately, on purpose

The version field and the build fingerprint fail for **different reasons with
different user actions**, so THP gives them different names:

| | `VERSION_MISMATCH` | `BUILD_MISMATCH` |
|---|---|---|
| Cause | protocol major/minor differs | the game build is not byte-identical |
| User action | update the client | install the matching game build |
| THP enum | `THP_REJECT_VERSION_MISMATCH` / `THP_DISC_VERSION_MISMATCH` | `THP_REJECT_BUILD_MISMATCH` / `THP_DISC_BUILD_MISMATCH` |

th08-multi reports a fingerprint disagreement as `BUILD_MISMATCH`
(`src/MultiNetSession.cpp:424-431`) and has no separate protocol-version
rejection at all. Merging them produces one error string for two different
actions. THP keeps them apart.

The fingerprint itself is a **32-byte SHA-256** over the game executable plus
the decomp build identity. It is compared in constant time.

This check is load-bearing in a way that is easy to underrate: if the two peers
are not running byte-identical game code, **every determinism guarantee in this
document is void** and no amount of hashing will tell you why.

---

## 4. Session lifecycle

```
 guest                                   host
   |------- HELLO ---------------------->|   version, build, caps, profile, delay
   |<- NEGOTIATE (accepted=1) -----------|   caps = AND, delay = max(), blob
   |<------- WELCOME --------------------|   session id, seed, delay, start_frame
   |------- START (echoes seed+delay) -->|   guest refuses if either disagrees
   |                                     |
   |<====== INPUT / CONTROL / GAMEPLAY ===>|   steady state, §5–§9
   |                                     |
   |<------ RESYNC (optional) ----------->|   §8.7 repair
   |------- DISCONNECT ----------------->|   §10
```

| State | Entered when | Meaning |
|---|---|---|
| `IDLE` | start | no session |
| `HANDSHAKE` | HELLO sent/received | awaiting NEGOTIATE |
| `NEGOTIATED` | accepted | WELCOME in flight |
| `SYNCING` | START agreed | waiting for the common boundary |
| `RUNNING` | boundary reached | inputs flowing, hashes compared |
| `RESYNCING` | RESYNC armed | waiting for the re-cut frame |
| `ERROR` | any fatal condition | terminal |
| `CLOSED` | DISCONNECT sent or received | terminal |

### 4.1 START is a commitment, not a notification

`START` echoes `random_seed` and `input_delay` back to the host. If **any** of
`run_id`, `start_frame`, `random_seed` or `input_delay` disagrees with what the
guest computed, the guest MUST refuse to start and send
`THP_DISC_NEGOTIATION_FAILED`. Beginning a run the two peers cannot agree on is
strictly worse than not beginning it: it burns a stage and produces a desync
report that misattributes the fault.

---

## 5. Input synchronisation

### 5.1 The sample

```c
typedef struct {
    thp_be32 frame;    /* session-monotonic frame id, NEVER the per-run counter */
    thp_be16 buttons;  /* profile-defined bit layout, opaque to the core        */
} thp_input_sample;    /* 6 bytes */
```

Adopted verbatim in shape from th08-multi's `MultiNetInputSample`
(`src/MultiNetProtocol.hpp`). This is the single most battle-tested decision
available to us and there is no reason to improve on it.

### 5.2 Redundancy: 15 historical samples per packet

Every `INPUT` packet carries `sample_count ∈ [1,15]` samples: the frames ending
at `latestFrame`, oldest first, as far back as the local history is contiguous.

This is what makes THP survive packet loss with **no retransmission request at
all**. If one `INPUT` packet is lost, the next re-carries the frames it held.
The window is 15 frames — 250 ms at 60 Hz — which covers any single loss with
room to spare.

Window size adopted verbatim from th08-multi
(`MULTI_NET_MAX_REDUNDANT_INPUTS = 15`). History depth is 256 slots
(`MULTI_NET_INPUT_HISTORY_SIZE = 256`), a power of two so the ring index is a
mask rather than a modulo.

**Contiguity rule:** the window stops at the first gap. Emitting a sample for a
frame the sender no longer has would be a fabricated input.

### 5.3 Acknowledgement

`INPUT` carries `ack_frame`: the highest frame **of the receiver's** inputs that
the sender knows have arrived. The receiver updates it from
`ack_frame` in each inbound packet and echoes the highest frame of its own
inputs it has seen confirmed.

This is TH06's design (`acknowledgedFrame` in th08-multi,
`g_ctrl_bits_rcved` in TH06) and it is correct: a sender that sees its
acknowledgement stop advancing knows it is not being heard.

### 5.4 Input starvation

The receiver is starved when `remote_latest < local_latest − window`. The
protocol does not silently substitute zero input — a fabricated frame is a
desync with a fabricated cause. Instead:

1. Hold at the last confirmed frame, report `starved = 1` in
   `thp_input_progress`.
2. Surface it to the UI immediately. A stalled session must be visible.
3. If it persists past `THP_STARVATION_TIMEOUT` (recommended 5 s), disconnect
   with `THP_DISC_INPUT_STARVATION`, `detail` = the starved frame.

TH06 blocks in a `Sleep(1)` loop for up to 5 seconds
(`src/Controller.cpp:764-792`) before giving up. THP keeps the 5 s budget —
it is battle-tested — but requires the stall to be *reported*, not merely
survived.

### 5.5 Contradictory input is a protocol error

If a receiver is offered a different button value for a frame it already holds,
it MUST treat it as `THP_DISC_PROTOCOL_ERROR`. Silently keeping either value
means one peer is running inputs the other never sent, and no hash will
localise it cleanly.

TH06's `RcvPacks` overwrites unconditionally
(`src/Controller.cpp:652`: `g_ctrl_bits_rcved[frame - i] = pack.ctrl.keys[i]`).
THP rejects instead.

---

## 6. Input delay negotiation

### 6.1 Range

`THP_INPUT_DELAY_MIN = 1`, `THP_INPUT_DELAY_MAX = 12`, adopted verbatim from
th08-multi (`MULTI_NET_MIN_INPUT_DELAY`, `MULTI_NET_MAX_INPUT_DELAY`).

A profile may narrow this range. TH06 clamps its runtime M/N adjustment to
`[0, 10]` (`src/Supervisor.cpp:212-229`); THP keeps the core range because a
delay of 0 makes the redundant-input window meaningless and 12 is already the
proven ceiling.

### 6.2 At connect

The host proposes a delay in `WELCOME`; the guest echoes it in `START`.

The negotiated value is `max(host_request, guest_request)`, clamped to the
intersection of the core range and the profile's range.

**`max` is deterministic and commutative**, so both peers reach the same answer
with no extra round trip. Adopted verbatim from
`src/MultiNetSession.cpp:436-438`:

```cpp
inputDelay = requestedInputDelay > packet.requestedInputDelay
                 ? requestedInputDelay : packet.requestedInputDelay;
```

### 6.3 At runtime — two-phase, and this is where TH06 is defective

**The problem with TH06's M/N.** TH06 adjusts a **process-local** `g_delay` the
instant M or N is pressed (`src/Supervisor.cpp:212-229`), *independently on each
peer*, with a 40-frame key-repeat cooldown and no communication whatsoever. It
then reads both the local and the remote input buffer at `frame - g_delay`
(`src/Controller.cpp:743` and `:767`).

If the host settles at delay 4 and the guest at delay 2, the host consumes its
own input for frame F−4 while the guest consumes the host's input for frame F−2.
The two simulations advance on different input lags. That is a desync by
definition. TH06 does not notice promptly because its only sync check compares
16-bit RNG states (`src/Controller.cpp:771`), which agree for a long time before
the consequence becomes visible.

**THP's rule.** A delay change is a negotiated exchange, and both peers must
agree on the value *and on the frame at which it takes effect*.

```
initiator                                    peer
   |---- CONTROL {SET_INPUT_DELAY,            |
   |        value=N, arg=change_frame} ------>|   flags = 0
   |                                           |   validate: N in range,
   |                                           |   change_frame >= now + 2*delay + 4
   |<--- CONTROL {SET_INPUT_DELAY, value=N, ---|   flags = ACK  (or NAK if refused)
   |        arg=change_frame}                  |
   |  both switch at change_frame              |
```

Rules:

1. The initiator computes `change_frame = now + 2*delay + 4`
   (`thp_delay_change_frame`). The margin guarantees the exchange completes
   before the frame arrives.
2. The peer clamps `N` to its own range. If it cannot accept `N`, it replies
   `NAK` and states the largest value it can; the initiator may re-propose.
3. The initiator switches **only** on an `ACK` whose `value` and `arg` both match
   what it sent. A mismatched `ACK` is ignored, not applied.
4. Neither side switches until `change_frame`. An `INPUT` packet for a frame
   before `change_frame` is interpreted with the old delay; from
   `change_frame` onward, with the new one.
5. The change is refused outright if `THP_CAP_RUNTIME_DELAY` was not negotiated.

A delay change while a resync is armed MUST be refused; the two mechanisms both
manipulate the frame/delay relationship and allowing them to interleave is a
source of bugs with no upside.

---

## 7. RNG seeding

### 7.1 Authority

The **host** draws the seed, and only the host. It MUST be nonzero. The guest
draws only a nonce.

Adopted from th08-multi: the seed is drawn exclusively under the host role
(`src/MultiPlayerCoordinator.cpp:176-178`) using a CSPRNG with a retry-to-avoid-
zero loop (`src/SecureRandom.hpp:25-40`), and the guest adopts it
(`src/MultiNetSession.cpp:460`).

TH06 has no seed exchange at all — the RNG is hard-reset to 0 at game init
(`src/GameManager.cpp:479`, `:486-487`). That is defensible for lockstep (nothing
to negotiate, nothing to disagree about) but it means every TH06 run is
identical unless the player changes something. THP exchanges a real seed so two
runs can differ, and so a resync can land on an agreed non-trivial value.

### 7.2 The boundary

**The seed is installed once, at the first simulation frame of a run, and never
again for that run.**

The boundary is identified by `(run_id, start_frame)`, and each peer installs it
under a one-shot guard:

```
if (run_is_running && !rng_installed_for_this_run) {
    game_rng.seed = (uint16_t)(session.random_seed & 0xFFFF);
    game_rng.generationCount = 0;
    rng_installed_for_this_run = true;
}
```

The guard matters. Two peers that load at different wall-clock times will reach
the boundary at different wall-clock times; without a one-shot flag keyed to the
run, a peer that re-entered the state would re-seed mid-run and desync. This is
the "common load boundary" that th08-multi implements as
`IsGameplaySimulationReady() && !gameplayRngSynchronized`
(`src/MultiPlayerCoordinator.cpp:493-499`).

### 7.3 Effective seed width is a declared profile property

th08-multi puts a `u32` on the wire and installs only the **low 16 bits**
(`src/MultiPlayerCoordinator.cpp:495-497`). TH06's `Rng::seed` is a `u16`
(`src/Rng.hpp:10`) and its generator is a 16-bit LCG (`src/Rng.cpp:7-14`).

A profile therefore declares `seed_bits`. THP keeps 32 bits on the wire so a
future 32-bit RNG needs no protocol change, and requires both peers to agree on
how many bits are actually consumed. Without that declaration, "why do the top
16 bits not matter" is a question somebody has to answer by reading the other
implementation's source.

### 7.4 Consequence, stated plainly

A seed mismatch does not desync the game *immediately* — nothing consumes the RNG
until the first draw. It diverges at the first draw, and the state hash (§8)
reports it within one hash window (≤ 30 frames). The seed is therefore covered
by the hash directly (§8.4), which turns a silent future divergence into a
detected present one.

---

## 8. State hashing

**This is the section that decides whether the protocol works.**

### 8.1 What hashing is for

Every other signal available at runtime is compatible with a desynced session:

| Signal | What it actually proves |
|---|---|
| Both processes are running | nothing |
| `peer connected` | a UDP packet arrived once |
| Ghost/position packets flowing | one direction of a telemetry channel works |
| Both HUDs look the same | both are rendering something |
| Both score the same | one integer agreed, once |
| **State hash matches at frame F** | **the profile's declared state was bit-identical at F** |

Only the last is evidence. It is still not proof, and §8.6 says exactly where it
stops.

### 8.2 Mechanism

Every `INPUT` packet carries `hash_frame` and `state_hash`:

- `hash_frame` — the frame the digest describes, or `THP_INVALID_FRAME` when this
  packet carries no hash.
- `state_hash` — a 32-bit FNV-1a digest over the profile's declared field list.

Cadence: every 30 simulation frames — 2 Hz at 60 fps. Adopted verbatim from
`src/MultiPlayerCoordinator.cpp:505-506`. 30 frames of divergence can occur
before the first report; that is the accepted detection latency and it is stated
here so nobody later mistakes a clean 29-frame window for synchronisation.

The digest function is FNV-1a with th08-multi's exact mixing order
(`src/MultiPlayerState.cpp:12-23`):

```
hash = 2166136261
for each field, for each of its 4 bytes from low to high:
    hash ^= byte
    hash *= 16777619        (mod 2^32)
```

Adopting the same function means a THP implementation and a th08-multi
implementation produce the same digest for the same field list, which makes the
two systems cross-checkable. FNV-1a is not collision-resistant against an
adversary and does not need to be: both peers are honest, so the only risk is an
accidental collision. At 32 bits and 2 Hz, that is about 3·10⁻⁷ over a 20-minute
run, and a collision can only ever cause a **missed detection**, never a false
alarm.

### 8.3 The frame identifier is the SESSION counter

`hash_frame` MUST be the **session-monotonic** frame counter, never the per-run
gameplay counter.

th08-multi hit this exact trap and documented it
(`src/MultiPlayerCoordinator.cpp:508-511`):

> `// networkFrame is monotonic for the whole connection.  The gameplay counter`
> `// resets for a new run, so using it here can collide with a stale hash from`
> `// the previous run.`

A new run resets the gameplay counter, so a ring indexed by it aliases onto stale
entries from the previous run and compares a fresh state against an old digest —
which reports a desync that did not happen, or misses one that did. THP makes
this structural: the frame id on the wire is always the session counter.

### 8.4 Deferred comparison is mandatory

**A peer routinely reports a hash for a frame we have not reached yet.** With a
non-zero input delay this is the normal case, not an edge case. A receiver that
simply drops such a comparison **silently disables desync detection under exactly
the latency conditions it exists to catch.**

The receiver MUST hold the pair and compare it when it computes that frame:

```
on receiving (frame, hash):
    entry = local_hashes[frame & 255]
    if entry unoccupied or entry.frame != frame:
        pending = (frame, hash)          # HOLD, do not drop
        return PENDING
    if entry.hash != hash:
        desync_frame = frame
        return MISMATCH
    return MATCH

on computing local (frame, hash):
    store into local_hashes[frame & 255]
    if pending.frame == frame:
        resolve; clear pending
```

th08-multi implements exactly this (`src/MultiNetSession.cpp:617-634` and
`:596-615`). THP inherits it, and adds one hardening: the pending slot is
validated against the ring's generation so a hash arriving more than 256 frames
stale expires rather than comparing against a recycled slot.

### 8.5 Coverage is per-profile, published, and compile-time

The core defines the comparison schedule, the frame identity, the transport, and
the verdict. It does **not** define what is hashed. A profile must publish its
coverage as a string constant, printed into the log at connect and quoted
verbatim in bug reports.

> A desync checker whose coverage can be changed at runtime by configuration is
> a desync checker nobody can reason about after the fact. Changing coverage is a
> build change, which is the ceremony the decision deserves.

Floors are hashed as **raw IEEE-754 bits**, never rounded or epsilon-compared.
That is not pedantry. Two peers running identical source can produce different
bits for the "same" float through FMA contraction, x87 excess precision on 32-bit
x86 (the DLL's target), or a different SIMD path. Hashing bits makes those
differences **visible**; quantising them hides a real determinism bug behind a
green hash, which is the worst possible failure for a tool whose entire job is
not to lie. th08-multi does the same (`FloatBits`, `src/MultiPlayerState.cpp:25-34`).

#### TH06 coverage (`thp_profile_th06.h`)

TH06 has **no state hash at all**. Its entire desync check is one line
(`src/Controller.cpp:771`):

```cpp
g_is_sync = (g_ctrl_rng_rcved[frame-g_delay] == g_ctrl_rng_self[frame-g_delay]);
```

That compares a `u16` RNG seed. It proves the two machines consumed the RNG
stream identically. It does **not** prove the game states match — the seed is 16
bits, so two peers can hold identical seeds with completely different player
positions, HP and bullet arrays. It is also blind for 15 frames per lost packet,
because `g_is_sync` keeps its previous value when the lookup at `:767` misses.

So the TH06 coverage list below is **new work, not transcription**:

```
rng.seed(u16)                        <- src/Rng.hpp:10
rng.generationCount(u32)             <- src/Rng.hpp:11, NEVER sent by TH06
frameCounter(u32)
p1.posX, p1.posY  (f32 bits)
p2.posX, p2.posY  (f32 bits)
p1.lives, p1.bombs, p1.power, p1.playerState
p2.lives, p2.bombs, p2.power, p2.playerState
score, livesRemaining, livesRemaining2
activeItemCount
difficulty, rank, minRank, maxRank
insaneMode, currentStage, currentSpellCard
```

`generationCount` is a free, strictly stronger signal that costs nothing: it is a
monotonic draw counter TH06 already maintains and never transmits. Hashing it
distinguishes "same seed value" from "same seed value after the same *number* of
draws" — precisely the case the seed-only check is blind to.

#### TH08 coverage (`thp_profile_th08.h`)

Derived from `ComputeStateHash` (`src/MultiPlayerState.cpp:322-364`, 46 `u32`
values) plus the fields fed to it (`src/MultiPlayerRuntime.cpp:482-513`), with
three deliberate changes:

1. **Counts are labelled as counts.** th08-multi mixes `activeEnemyCount` and
   `activeBulletCount` — integer counts (`src/MultiPlayerRuntime.cpp:500-501`).
   A count says "N bullets exist", not "they are in the same place". THP's rule:
   a profile either hashes a collection's *content* or does not claim coverage of
   it. Writing the hole down is the difference between a detector with a known
   blind spot and a detector that will one day claim to have caught a desync it
   structurally cannot catch.
2. **`stageRngSeed` is covered.** th08-multi sets it from the synced seed
   (`src/MultiPlayerCoordinator.cpp:497`) and then never hashes it. It is synced
   state; if it differs, the peers are drawing different bullet patterns.
3. **`generationCount` is omitted, not faked.** TH08's RNG has no draw counter.
   A profile whose RNG lacks one states that fact rather than inventing a
   substitute.

### 8.6 What a hash match proves, and what it does not

**A match proves:** at frame F, every quantity in the profile's published
coverage list was bit-identical on both peers — positions, resources, the RNG
state, and (where covered) the draw counter. Given FNV-1a's diffusion and
bit-exact float comparison, that is strong evidence the simulations agree on
everything the hash observes.

**A match does NOT prove any of the following.** Each is a real gap, not a
hedge.

- **That the games stay identical afterwards.** A hash is a snapshot. Divergence
  introduced at F+1 is invisible until F+30 — half a second of visibly wrong
  play. A run can match at every check and still be wrong in between.
- **That the coverage is sufficient.** Coverage is a *human decision*, and it is
  currently incomplete. Absent from both profiles today: bullet positions,
  velocities, types and angles; per-enemy ECL program counters; player velocity
  and movement direction; option sprite positions; the player shot table;
  anything presentation-side. A desync in any of those is structurally
  undetectable by this mechanism, no matter how many hashes match.
- **That the two builds compute the same function.** The hash detects that they
  did not; it does not prevent it. Reccmp/objdiff byte-exact matching against the
  original executable is a *separate* and strictly stronger guarantee. THP's hash
  does not substitute for it.
- **That the inputs were identical.** Only if the profile hashes them. TH08's
  does (`slot.input.current`/`previous`); TH06's must.
- **Anything at all, if no hash is exchanged.** The check is opportunistic: it
  rides on `INPUT` packets. A session with no `INPUT` flow has no hash flow, and
  "no mismatch reported" becomes indistinguishable from "nothing checked".
- **That a future divergence is not a collision.** FNV-1a 32-bit is not
  collision-resistant. ~3·10⁻⁷ over a 20-minute run at 2 Hz. This can only cause
  a *missed* detection.

**A mismatch proves:** the observed state differed, and `desync_frame` localises
the first hashed frame at which it did. There are no false mismatches — identical
inputs produced two different digests.

**So the failure mode of this mechanism is "we detect it late, or not at all",
never "we wrongly accuse the player".** The one exception is a *benign*
difference — a fixed-timestep or frame-boundary mismatch between two peers that
produces a genuine state difference. That is a real bug to be fixed, not
tolerated, and it will surface as a mismatch.

### 8.7 Repair: THP detects AND recovers

This is the largest gap between the two references, and it is the difference
between a debug tool and a battle platform.

| | Detects | On detection |
|---|---|---|
| th08-multi | Yes, real FNV-1a hash | `MULTI_NET_STATE_ERROR` (`src/MultiNetSession.cpp:609-610`) then **exits the process** (`src/Supervisor.cpp:131-146`). No resync exists anywhere in its game source; the only reconnect is in the launcher layer, a different thing. |
| TH06 | Weakly (RNG seed proxy) | **auto-repairs**: host schedules a future re-cut (`src/Supervisor.cpp:142-163`), both reset RNG and buffers at that frame (`:128-140`), play continues. |
| **THP** | Yes | **repairs**, using TH06's model and TH08's detection. |

THP separates two events that th08-multi conflates into one terminal error:

- **DETECT** — verdict `MISMATCH`. The session is not valid for scoring and the
  UI **must** say so. Never silently ignored, never auto-dismissed.
- **REPAIR** — the host proposes `THP_PKT_RESYNC` at a future frame; both peers
  re-cut there and continue.

Repair rules:

1. **Only the host may initiate.** (TH06: `if(g_is_host && !g_is_sync)`,
   `src/Supervisor.cpp:142`.)
2. **The frame must be plausible**: strictly in the future and within
   `now + 2*delay + 4`. Anything else is ignored, not acted on — this bounds
   what a replayed or fabricated packet can do. Adopted from TH06's
   plausibility bound (`src/Controller.cpp:658-659`).
3. **Repeat until reached.** The host re-sends `RESYNC` every frame until
   `resync_frame` passes. (TH06: `src/Supervisor.cpp:151-162`.)
4. **At the frame, both peers**: install the agreed seed, clear the hash ring,
   clear the pending hash, clear the remote input history, reset
   `desync_frame`, return to `RUNNING`.
5. **The frame counter is not rewound.** TH06 explicitly comments out
   `s->calcCount = 0` on this path (`src/Supervisor.cpp:132`) so the resync is a
   clean cut at an agreed frame. THP does the same.
6. **The local input history is deliberately NOT cleared.** Frames before the cut
   were legitimately played and the peer still needs them for acknowledgement
   bookkeeping. Clearing it would strand `remote_acked_by_remote` and manufacture
   a false starvation report.
7. **Repair is bounded.** At most `THP_RESYNC_ATTEMPTS` (recommended 3). After
   that, `THP_DISC_DESYNC`. Three failures in a row means the cause is not
   transient, and looping forever hides that from the user.
8. **Repair requires `THP_CAP_RESYNC`**, negotiated.

**The honest limit of repair, inherited from TH06 and stated here rather than
hidden:** recovery works only because the game is deterministic given identical
inputs from the re-cut frame forward. **Recovery is impossible for a divergence
whose cause is still present in the input stream.** A resync re-synchronises two
deterministic simulations; it cannot fix a build where the two peers compute the
same function differently. For that case the correct answer is a
`BUILD_MISMATCH` at connect — and if that was somehow missed, a disconnect with
the desync frame attached. §8.7 rule 7 exists because a repair loop that cannot
succeed must not pretend to be trying.

---

## 9. Capability negotiation

### 9.1 A 32-bit mask, split in half

```
  bits  0..15   core capabilities   — defined in thp_wire.h, forever
  bits 16..31   profile capabilities — defined per game
```

The split is what lets "a TH06 peer and a TH08 peer share a session model while
differing in payload" mean something concrete: the low half is comparable across
games, the high half is not, and no TH06 feature bit can ever be mistaken for a
core one.

**Core capabilities**

| Bit | Name | Meaning |
|---|---|---|
| `0x00000001` | `INPUT_REDUNDANCY` | sender honours `sample_count` / `ack_frame` |
| `0x00000002` | `STATE_HASH` | `INPUT` carries a comparable hash |
| `0x00000004` | `RUNTIME_DELAY` | delay may be renegotiated mid-run (§6.3) |
| `0x00000008` | `RESYNC` | host may issue `THP_PKT_RESYNC` (§8.7) |
| `0x00000010` | `RECONNECT` | peers tolerate a bounded outage |
| `0x00000020` | `GAMEPLAY_EVENTS` | `THP_PKT_GAMEPLAY` is in use |
| `0x00000040` | `KEEPALIVE_RTT` | `THP_PKT_KEEPALIVE` used for RTT |
| `0x00000080` | `PROFILE_BLOB` | `WELCOME` carries `profile_blob` |

**Profile capabilities** — e.g. TH06: `SHARED_ITEMS`, `LIFE_TRANSFER`,
`SPIRIT_MODE`, `INSANE_MODE`; TH08: `SAVED_GAME`, `SPIRIT_MODE`, `TITLE_SYNC`.

### 9.2 Negotiation

`negotiated = host_offer & guest_offer`. A bit absent from the intersection is
**off on both sides**. There is no per-side asymmetry: a feature that only one
peer has is a feature neither has.

`INPUT_REDUNDANCY` and `KEEPALIVE_RTT` are **mandatory**; a session that cannot
negotiate them is rejected (`THP_REJECT_CAPABILITY_MISMATCH`) rather than run
degraded. A profile may declare additional required capabilities.

Negotiation lives in one pure function, `thp_negotiate()`, so the guest side
cannot grow a second, subtly different rule. The order of checks is deliberate —
version, build, profile, capability — so a rejection names the most fundamental
problem first rather than the last one checked.

### 9.3 Gameplay events carry only what cannot be derived

`THP_PKT_GAMEPLAY` exists for **frame-bound intents with no per-frame input
encoding**: "drop a 1-up on frame N", "toggle insane mode on frame N", "abort the
run on frame N".

It does **not** exist to carry gameplay state that both peers can compute. TH06's
entire feature set — spirit mode, life transfer, shared items, insane mode,
hitbox display — costs **zero dedicated wire bytes**, because all of it is a
deterministic function of the merged input stream plus the shared RNG. Sending
any of it would create two authorities for one fact, which is the exact failure
state hashing exists to eliminate.

Those features are therefore covered by the **hash** (§8.5), not by packets.

TH06 smuggles its frame-bound intents through `CtrlPack::igc_type[15]`, one `u32`
per frame of the 15-frame window (`src/Connection.hpp:123`), so they arrive
already positionally bound to a frame. THP gives them an explicit `event_frame`,
which removes the positional coupling. See `ADAPTERS.md` §4.

---

## 10. Error model

### 10.1 Rejection reasons (at connect, in `NEGOTIATE`)

| Value | Name | Meaning |
|---|---|---|
| 0 | `NONE` | — |
| 1 | `VERSION_MISMATCH` | no common `[major.minor]` |
| 2 | `BUILD_MISMATCH` | build fingerprints differ |
| 3 | `CAPABILITY_MISMATCH` | no common mandatory capability |
| 4 | `PROFILE_MISMATCH` | peers are on different games |
| 5 | `SESSION_FULL` | no free seat |
| 6 | `MALFORMED` | unparseable |

A rejection ALWAYS carries the version range the host does speak, so the guest
can tell the user something actionable.

### 10.2 Disconnect reasons (terminal, in `DISCONNECT`)

| Value | Name | `detail` |
|---|---|---|
| 1 | `LOCAL_QUIT` | — |
| 2 | `REMOTE_QUIT` | — |
| 3 | `TIMEOUT` | ms since last valid packet |
| 4 | `PROTOCOL_ERROR` | offending field offset |
| 5 | `VERSION_MISMATCH` | the peer's version |
| 6 | `BUILD_MISMATCH` | first differing fingerprint byte |
| 7 | `CAPABILITY_MISMATCH` | the missing bit |
| 8 | `PROFILE_MISMATCH` | the two profile ids |
| 9 | `DESYNC` | **first frame whose digest differed** |
| 10 | `INPUT_STARVATION` | the starved frame |
| 11 | `SESSION_FULL` | — |
| 12 | `NEGOTIATION_FAILED` | which field of `START` disagreed |
| 13 | `PROTOCOL_LIMIT` | frame/packet outside this version's range |

`DESYNC` carries the frame in `detail`, so a bug report names the exact frame
rather than "it desynced somewhere". th08-multi logs `desyncFrame` and exits;
THP transmits it.

### 10.3 Liveness

`KEEPALIVE` is sent every 1 s (TH06's cadence,
`src/ConnectionUI.cpp:365`) and echoes the header `seq` plus the sender's
monotonic microseconds. Clocks are **not** synchronised; RTT is computed as
`local_recv − echoed_sender_time` on the answering side, so no clock agreement is
assumed.

`TIMEOUT` fires after no valid packet for 5 s — TH06's budget, which is
battle-tested (`src/Connection.cpp` read loop plus
`src/Controller.cpp:764-792`).

---

## 11. Reference implementation

`D:/Project/TH08-Platform/protocol/`

| File | Contents |
|---|---|
| `thp_wire.h` | All core packet layouts, enums, bounds-checked codecs. C11 + C++11. |
| `thp_profile.h` | Profile abstraction, hash ring, deferred comparison, negotiation, resync. |
| `thp_profile_th06.h` | TH06 profile, input bits, gameplay events, start blob, coverage. |
| `thp_profile_th08.h` | TH08 profile, input bits, start blob, coverage. |
| `thp_selftest.c` | Compile-time size assertions plus round-trip checks. |

Guarantees the header makes **structurally** rather than by convention:

- every wire struct is a static assertion on its size;
- no struct can acquire padding (all members are byte arrays, alignment 1);
- no `#pragma pack` exists and adding one is a protocol break;
- encode/decode are bounds-checked on both sides, so a truncated or hostile
  datagram cannot become a buffer overrun;
- a `thp_profile` (which holds host pointers) can never appear in a packet.

### 11.1 Verification performed

`thp_selftest.c` compiles clean under `gcc -std=c11 -Wall -Wextra` and under
`g++ -std=c++11 -Wall -Wextra`, and under MSVC `/W4 /std:c11` targeting **x86**
(the DLL's ABI). It runs 60+ checks including full encode/decode round-trips,
header rejection paths, ring wrap-around, deferred hash resolution, resync
clearing, and negotiation outcomes. Verbatim output is in
`THP-PROTO-BUILD-20261002.md` in this directory.

The size assertions earned their keep during development: they caught a
`HELLO` that had silently grown to 132 bytes from an octet-type mix-up, a
`thp_profile` assertion that was LP64-only and failed the 32-bit DLL build, and
four wrong hand-computed sizes. All were real, and none would have been caught by
review alone.

### 11.2 What has NOT been verified

- **No game was launched.** Not once, for this lane. No `th06.exe`, no
  `th08.exe`, nothing in `D:\Game\Touhou`.
- **No two peers have been run against each other.** Everything here is a
  specification plus a codec that round-trips its own output. Whether two real
  games synchronise under THP is **unproven** and is the next lane's job.
- The `compute_state_hash`, `blob_encode` and `blob_decode` function pointers in
  both profiles are deliberately `NULL`. They are game-adapter code and belong
  to the DLL lane; `ADAPTERS.md` says what each one must do.

---

## 12. Change log

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-10-02 | Initial specification. |