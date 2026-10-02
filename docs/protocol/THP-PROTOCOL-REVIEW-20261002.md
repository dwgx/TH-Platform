# THP Protocol v1 — adversarial design review

**Reviewer:** `ProtoReview` (board `THP-PROTO-REVIEW`)
**Date:** 2026-10-02
**Subject:** `D:/Project/TH-Platform/docs/protocol/THP-PROTOCOL-v1.md`,
`D:/Project/TH08-Platform/protocol/{thp_wire.h,thp_profile.h,thp_profile_th06.h,thp_profile_th08.h,ADAPTERS.md}`
**Method:** static read of every line, plus ten executable probes compiled against the
real headers. **No service was started. No game was launched.** No header was edited.

**Companion evidence:** `D:/Project/TH08-Platform/docs/research/THP-UPSTREAM-20261002.md`
is cited below by section. Per its Appendix A, only its `[CODE]`-marked findings are
treated as verified here; its README-sourced claims are not relied on.

---

## 0. Summary

The protocol is not bad. It is unusually honest — §8.6 exists precisely because this
project retracted a synchronisation claim once, and writing that section is worth more
than most of the rest of the document combined. The wire format itself is well made,
the redundancy window is right, the deferred-hash `PENDING` branch is correct, and
splitting `VERSION_MISMATCH` from `BUILD_MISMATCH` is the kind of detail that only
matters to people who have shipped the merged version and regretted it.

But there are three structural problems, and they are the ones that matter:

1. **The repair mechanism cannot repair what the detector detects.** §8.7 adopts TH06's
   re-cut. The upstream report is explicit that TH06's re-cut resets *only* the RNG and
   the receive maps — "Explicitly NOT reset: player positions, velocities, hitboxes,
   lives, bombs, power, score, item entities, bullet tables, enemy tables and ECL
   program counters" (§4.3, `[CODE]`). THP gives itself a detector far richer than
   TH06's one-`u16` compare and then bolts on a repair that only fixes the narrow class
   of divergence TH06's weak detector could see. **The repair is narrower than the
   detection.** That is not an inherited limitation; it is a new mismatch the design
   introduced.
2. **The protocol has no way to say "this frame cannot advance."** Both references stall
   the simulation when input is missing — TH08 returns `CHAIN_CALLBACK_RESULT_BREAK`
   (`src/Supervisor.cpp:157-158`, upstream §2.1 `[CODE]`). THP models starvation as a
   boolean someone else is supposed to notice. Stall is the *mechanism* lockstep runs on;
   THP models its consequences and none of its causes.
3. **A green state hash can be green without a comparison ever happening.** The
   reference API returns `THP_HASH_MATCH` when no peer hash was pending (probe F1) and
   silently discards a pending hash when a second one arrives (probe F2), after which
   the discarded frame reports `MATCH`. Given this project's stated dominant failure
   mode — *"the tests call the session API directly and never touch the seam"* and a
   fully green build surviving eight runtime bugs — shipping an API whose return value
   cannot distinguish "verified" from "not looked at" is the single most dangerous
   thing in the tree.

Fifteen concrete flaws follow, each with a proposed fix. Nine reproduce by execution.

**No header was modified.** Three of the findings (F1, F3, F4) are, in my judgement,
genuine correctness fixes rather than preferences, and I have written exact patches for
them in §10 — but I did not apply them, because sibling lanes are mid-flight on the
consumer of this API and a semantic change to a return value is exactly the kind of
change that lands as a phantom failure in someone else's lane. That is a judgement
call and it is the owner's to reverse.

---

## 1. Verification performed

Ten probes, compiled against the unmodified headers with the DLL's own toolchain
(`cl` 19.51.36256 for x86 — 32-bit output, `/W4 /std:c11`).

```
$ cl /nologo /W4 /std:c11 /I"D:\Project\TH08-Platform\protocol" thp_review_probe.c
thp_review_probe.c
BUILD_EXIT=0
```

Zero warnings, zero errors. gcc was not used: WSL was locked by another process for
the whole session (`Wsl/Service/CreateInstance/MountDisk/HCS/ERROR_SHARING_VIOLATION`),
so the gcc half of the original lane's evidence stands unre-verified by me.

Run output, verbatim:

```
---- probe 1 ----
THP protocol adversarial probes
--------------------------------
[DEFECT] F1     thp_store_local_hash(frame,hash) with no peer hash pending returns THP_HASH_MATCH (the 'peer agreed' verdict), not a distinct 'nothing to compare' value
--------------------------------
0 probe(s) did NOT reproduce
PROBE_1_EXIT=0
---- probe 2 ----
THP protocol adversarial probes
--------------------------------
[DEFECT] F2a    first future hash is held PENDING
[DEFECT] F2b    pending slot holds only ONE (frame,hash); the frame-1000 comparison is silently overwritten by frame 1030
[DEFECT] F2c    reaching frame 1000 after its hash was discarded returns MATCH, so a never-performed comparison is indistinguishable from a real one
--------------------------------
0 probe(s) did NOT reproduce
PROBE_2_EXIT=0
---- probe 3 ----
THP protocol adversarial probes
--------------------------------
[DEFECT] F3a    thp_resync_apply clears remote_inputs but leaves progress.remote_latest and progress.remote_acked pointing at frames it just erased
[DEFECT] F3b    after the cut, thp_get_remote_input(5000) returns 0 while progress.remote_latest still claims 5000 arrived -- the starvation rule in spec 5.4 evaluates against erased data
--------------------------------
0 probe(s) did NOT reproduce
PROBE_3_EXIT=0
---- probe 4 ----
THP protocol adversarial probes
--------------------------------
[clean ] F4a    header_check ACCCEPTS a v1.1 CONTROL whose body grew by 4 trailing bytes
[DEFECT] F4b    thp_decode_control then REJECTS it, because thp_r_ok() demands pos == len -- so a v1.0 peer cannot 'keep working' against v1.1
--------------------------------
1 probe(s) did NOT reproduce
PROBE_4_EXIT=1
---- probe 5 ----
THP protocol adversarial probes
--------------------------------
[DEFECT] F5     thp_header_check drops a ver_major=2 HELLO, so the host never reads the body and can never send the NEGOTIATE{VERSION_MISMATCH, min, max} that spec 3.3 promises
--------------------------------
0 probe(s) did NOT reproduce
PROBE_5_EXIT=0
---- probe 6 ----
THP protocol adversarial probes
--------------------------------
[DEFECT] F6     thp_encode_welcome happily emits a 700-byte profile blob (limit is 512) and thp_header_check accepts the packet; nothing in the codec enforces THP_PROFILE_BLOB_MAX
--------------------------------
0 probe(s) did NOT reproduce
PROBE_6_EXIT=0
---- probe 7 ----
THP protocol adversarial probes
--------------------------------
[DEFECT] F7     thp_decode_input accepts samples whose frames descend and repeat, despite the MUST written on thp_packet_input
--------------------------------
0 probe(s) did NOT reproduce
PROBE_7_EXIT=0
---- probe 8 ----
THP protocol adversarial probes
--------------------------------
  [f8 enter]
[DEFECT] F8     a TH08 profile with different input_bits, hash_period and required_caps negotiates ACCEPT against the stock TH08 peer, because profile_id identifies the game and nothing carries a profile revision
  [f8 done]
--------------------------------
0 probe(s) did NOT reproduce
PROBE_8_EXIT=0
---- probe 9 ----
THP protocol adversarial probes
--------------------------------
         spec 8.2 quotes ~3e-7; pairwise model gives 5.588e-07, birthday model gives 6.703e-04 (1 in 1492 sessions)
[DEFECT] F9     the spec's 3e-7 is the per-comparison model; an undetected desync anywhere in a session is the birthday bound, ~2000x larger
--------------------------------
0 probe(s) did NOT reproduce
PROBE_9_EXIT=0
---- probe 10 ----
THP protocol adversarial probes
--------------------------------
         margin at delay  1 = 6 frames = 100 ms
         margin at delay 12 = 28 frames = 467 ms
         one RTT of 600 ms = 36 frames at 60 Hz -- larger than the delay-1 margin
[DEFECT] F10    thp_delay_change_frame returns a frame COUNT; nothing in the negotiation consults the RTT that KEEPALIVE already measures
--------------------------------
0 probe(s) did NOT reproduce
PROBE_10_EXIT=0
```

`F4a` printing `clean` is correct and intended: that assertion states the *header*
validator behaves properly. The defect is F4b, in the decoder. `PROBE_4_EXIT=1` is the
non-zero count of assertions that did not reproduce.

Probe source is preserved beside this document as
`docs/protocol/THP-PROTO-REVIEW-PROBES-20261002.c`, so every claim above can be
re-run by whoever picks it up:

```
cl /nologo /W4 /std:c11 /I D:\Project\TH08-Platform\protocol THP-PROTO-REVIEW-PROBES-20261002.c
```

That document and this one are the only files this review wrote anywhere. No header,
no spec, no game, no service was touched.

---

## 2. Axis 1 — Determinism

### Verdict: **UNSOUND as specified.** Three blockers, one of them unfixable within the
### current profile model.

**Sound, and genuinely good:** §2.6 (byte arrays as network-order storage, alignment-1
members, no padding, no `#pragma pack`) is the right call and the reasoning is
correct. §8.5's raw-IEEE-754-bits rule is right, and the stated reason — hashing bits
makes FMA contraction and x87 excess precision *visible* — is the correct instinct even
though §4 below argues the response to visibility is wrong.

### Blocker D1 — the profile models the RNG as one scalar width

`thp_profile` carries `uint8_t seed_bits;` (`thp_profile.h:158`) — one number, meaning
"how many bits of the 32-bit session seed reach the game's generator." §7.3 and
`ADAPTERS.md` §4 both assert that adding a game requires no core change.

TH07 falsifies this. Per upstream §7.3 `[CODE]`, TH07 has **at least six RNG-ish
globals**, not one:

| object | where | type |
|---|---|---|
| `g_TargetRng49FE20` | `src/EclRun.cpp:114`, `src/EclOperands.cpp:75` | overlay, `0x0049FE20` `[CONFIG]` |
| `g_EnemyRng` | `src/EnemyLifecycle.cpp:84` | overlay |
| `g_EnemyTimelineRng` | `src/EnemyTimeline.cpp:95` | `Rng` |
| `g_BulletSpawnRng` | `src/BulletSpawn.cpp:127` | struct |
| `g_AnmRng` | `src/AnmExecute.cpp:115` | struct |
| `g_ReplayAddedRng0/1` | `src/ReplayAdded.cpp:11-12` | `0x00575C10`/`0x00575C14` `[CONFIG]` |

`g_TargetRng49FE20` alone has 23 draw sites, six of them the ECL `rnd` opcodes
(`src/EclRun.cpp:1209,1229,1244,1262,1275,1282`) `[CODE]`. It is zero-initialised in
the retail binary and nothing in the decomp seeds it (`config/reccmp-relocations.csv:140`
`[CONFIG]`), so a TH07 profile must *find the retail seeding site*, which is not in the
tree.

Upstream's own framing is the one that matters: the ECL RNG's position after frame *N*
"is a **running count of script activity**" (§7.2 `[CODE]`) — not merely "another 16
bits to sync." Seeding one of six streams makes the other five draw from whatever the
retail binary left in `.bss`, which is zero on both peers only by luck, and only until
the first draw on one side that the other did not make.

**Fix.** Replace `uint8_t seed_bits` with an ordered slot list:

```c
typedef struct { uint8_t offset; uint8_t bits; } thp_seed_slot;   /* into random_seed */

typedef struct {
    ...
    const thp_seed_slot *seed_slots;   /* N streams carved out of the be32 seed */
    uint8_t               seed_slot_count;
    ...
} thp_profile;
```

TH06 and TH08 both become `{ {0,16}, 1 }` — unchanged on the wire. TH07 becomes six
slots. This also fits 32 bits: six 16-bit streams do not, which is the point — the
honest answer is that TH07 needs a seed-derivation callback (a KDF over a 32-bit
session nonce expanded into per-stream state), not a wider wire field. Add
`thp_seed_expand_fn` to the profile alongside `compute_state_hash`. **This is a change
to `thp_profile.h`, which is a host-side struct and never serialised — the wire is
unaffected and `ADAPTERS.md` §4's claim survives.**

### Blocker D2 — one input word per peer per frame is not the shape the games have

`thp_input_sample` is `{ frame, buttons }` — one `u16` per sender per frame. The
profile comment in `thp_profile_th08.h:49-59` justifies this: "a sample is
`(frame, buttons)` for ONE slot, and the slot is implied by the sender."

That is right for TH08 and wrong for TH06, and the TH06 profile header says the wrong
thing. `thp_profile_th06.h:48-53` states:

> TH06 merges two players into ONE u16 through the TH_ISDOWN remapping … Both peers
> therefore compute the same merged word from the same two input streams

and then defines **11** one-player bits (`TH06_INPUT_SHOT` … `TH06_INPUT_SKIP`,
`0x0001`–`0x0400`) with `input_bits = 11`. Those two statements contradict each other.
Per upstream §1.2 `[CODE]`, TH06's real word is split — bits 0–8 are P1, bits 9–15 are
P2 (`src/Controller.hpp:49-87`) — and `GetKeys` (`src/Controller.cpp:811-837`) merges
the *local* and *remote* words into it. So TH06's wire sample must be the **unmerged
per-player** word; the merge is an adapter-side computation, and the "merged word" is
what reaches the game, not what travels. As written, a TH06 adapter that follows the
header comment needs the peer's input for frame F before it can produce its own sample
for frame F — circular, and satisfiable only by accident of delay scheduling.

TH08 has the mirror problem, in the other direction. Upstream §2.1 `[CODE]`: P1's input
goes straight into the retail global `g_CurFrameInput` (`src/Supervisor.cpp:160`) with
no redirector, but **P2's gameplay input never enters `g_CurFrameInput` at all** —
only `MENU` and `SKIP` are OR'd in (`:162`), and P2 is read through a redirector
(`src/MultiPlayerRuntime.cpp:56-72`). So "one word per peer" is the right *wire* shape
and the wrong *game-visible* shape, and the profile has no vocabulary for the
difference.

**Fix.** (a) Correct the TH06 header comment: the wire carries the per-player word; the
merged word is an output of the adapter, not an input. (b) Add to `thp_profile`:

```c
uint8_t input_slots;        /* 1 = host word is P1 verbatim; 2 = P2 needs a side channel */
uint8_t input_merge;        /* 0 = disjoint halves in one u16 (TH06), 1 = per-slot (TH08) */
```

(c) Add a per-slot control word to the hash coverage. `thp_input_sample` is 6 bytes and
the worst-case INPUT packet is 130 bytes of a 1200-byte budget; there is room for a
`u16 per-slot word` alongside, but that is a wire change and should be a MINOR bump
under a new packet type, not a silent growth of `thp_input_sample`.

### Blocker D3 — nothing states what `thp_input_sample.frame` *means*

This is small and it is fatal. TH06 applies its delay offset **at read time**
(`frame - g_delay`, `src/Controller.cpp:739,743,767`); TH08 applies it **at write time**
(`scheduledFrame = simulationFrame + inputDelay`, `src/MultiNetSession.cpp:558-559`,
read without offset at `:576-582`) — upstream §3.1/§3.2, both `[CODE]`.

So in TH06 a sample labelled *N* is *consumed* at frame *N + delay*. In TH08 a sample
labelled *N* is *consumed* at frame *N*. THP adopts TH08's sample shape "verbatim"
(`ADAPTERS.md:172`) and its whole frame-identity discipline is written about the
session counter — and never once says which convention it uses.

Consequences, all real:
- §5.2's contiguity rule and §5.4's starvation bound (`remote_latest < local_latest −
  window`) are computed in *storage* frame space and compared against a *consumption*
  need. Under TH06's convention the two differ by exactly the delay.
- §6.3's delay change changes the meaning of every in-flight label. Rule 4 says "an
  INPUT packet for a frame before `change_frame` is interpreted with the old delay" —
  but a packet's 15 samples *straddle* `change_frame` routinely, so "interpreted with
  the old delay" has no defined meaning for a packet, only for a sample.
- §8.7's plausibility bound `now + 2*delay + 4` is arithmetic in an undefined space.

**Fix.** One sentence in §5.1 and one field name change would do it: state that
`thp_input_sample.frame` is the **simulation frame at which the sample is consumed**,
that the *producer* is responsible for the write-side offset (TH08's model, which is
the right one because it makes labels directly comparable, upstream §3.2), and rename
the accessor `thp_build_redundant(s, latest, …)`'s parameter to `latest_consumed_frame`.
Then §6.3 rule 4 becomes expressible: "the switch is at *consumption* frame
`change_frame`."

### Non-determinism sources THP cannot see

These are worth writing into §1 as explicit non-claims, because they are not fixable at
the protocol layer and a reader will otherwise assume they are handled:

- **FMA contraction and x87 excess precision.** §8.5 hashes raw bits, which makes these
  *visible*. That is the right detection but the wrong response: a hash cannot prevent
  divergence, so on a 32-bit x86 target with two different optimisation settings the
  protocol's answer is "report a desync every 30 frames and enter the §8.7 repair loop
  that F11 shows cannot converge." The protocol should *mandate* the FP environment
  (`/fp:strict` for MSVC, `-ffp-contract=off -fexcess-precision=standard` for gcc) as a
  peer-agreed property, not merely detect its absence.
- **Frame-skip.** Upstream §2.4 `[CODE]`: TH08's synchronising build has a *deliberately
  empty* branch for skipped frames, with a comment explaining that consuming a lockstep
  input frame on a skipped render frame "would make each process apply a different
  subset of the otherwise synchronized inputs." THP assumes one network frame per
  simulation frame and never mentions render frames at all. Add a §1.3 non-goal and a
  hash field for the simulation-frame counter distinct from the render-frame counter.

---

## 3. Axis 2 — The state hash

### Verdict: **MECHANISM SOUND, COVERAGE INADEQUATE, AND THE REPORTING API IS UNSOUND.**

**Genuinely sound, and I want to be explicit about it because it is the best part of the
document:** §8.4's deferred comparison. `thp_compare_remote_hash` holds a hash for a
frame we have not reached and returns `THP_HASH_PENDING` rather than dropping it, and
`thp_store_local_hash` resolves it. This is correct, it is load-bearing, and an
implementation that dropped those comparisons would silently disable desync detection
under exactly the latency conditions it exists to catch. §8.1's table of "what each
other signal actually proves" is also correct and unusually well-judged. If this
protocol has one thing a reviewer would fight to keep unchanged, it is these two.

**Not sound:** everything downstream of the mechanism.

### F1 — `thp_store_local_hash` returns `MATCH` when no comparison happened *(reproduced)*

`thp_profile.h:435-459`. `verdict` is initialised to `THP_HASH_MATCH` and only
overwritten inside `if (pending_remote.occupied && …)`. An adapter that writes the
natural thing —

```c
if (thp_store_local_hash(&s, frame, h) == THP_HASH_MISMATCH) { desync(frame); }
checks_passed++;
```

— increments its match counter on every frame, including the ~29 in 30 where the peer
said nothing. §8.6's last bullet ("Anything at all, if no hash is exchanged") is
honest about the *limit*, but the API actively reports the opposite of the limit: it
reports a verdict.

**Fix.** Add `THP_HASH_NOT_CHECKED` to `thp_hash_verdict` (value 0, so existing `== 0`
tests for `THP_HASH_ABSENT` keep working if the caller checks explicitly) and return it
from the no-pending path. Separately — and this is the more important half — add a
counter to `thp_session`:

```c
uint32_t hashes_computed;   /* local digests produced   */
uint32_t hashes_compared;   /* comparisons actually run */
uint32_t hashes_dropped;    /* pending overwritten      */
```

and surface all three in the UI and in the disconnect detail. **"0 mismatches" with
`hashes_compared == 0` must be visually distinct from `2400/2400`.** Without that, the
green-hash claim this whole document is built to protect is not actually observable.

### F2 — one pending slot, silently overwritten, and the victim then reports MATCH *(reproduced)*

`thp_session.pending_remote` is a single `thp_hash_entry` (`thp_profile.h:404`).
`thp_compare_remote_hash` overwrites it unconditionally. Probe F2 puts us 30 frames
behind and shows the frame-1000 comparison being discarded by the frame-1030 one; then
`thp_store_local_hash(&s, 1000, 0x99999999)` returns `THP_HASH_MATCH` for a comparison
that never ran.

Reachable in practice: whenever we stall for more than one hash period (250 ms), which
is precisely when a stall is worth diagnosing. The spec's §8.4 claim that "the pending
slot is validated against the ring's generation so a hash arriving more than 256 frames
stale expires" is **not implemented anywhere** — there is no generation check in the
code, and there is no field to hold one.

**Fix.** Make `pending_remote` a 4-slot ring keyed by frame; on overwrite, bump
`hashes_dropped` (above) rather than losing the comparison; expire any pending entry
whose frame is more than `2 * hash_period` behind the local watermark. Drop the
"generation" language from §8.4 until it exists.

### F9 — the collision arithmetic is wrong by three orders of magnitude *(reproduced)*

§8.2: *"At 32 bits and 2 Hz, that is about 3·10⁻⁷ over a 20-minute run."* 20 minutes at
2 Hz is 2400 digests. `2400 / 2³² = 5.6·10⁻⁷` — that is the probability of one
*specified pair* colliding. The probability that *any* pair among 2400 digests collides,
which is the number that answers "could a session finish green while desynced," is the
birthday bound: `2400·2399/2 / 2³² = 6.7·10⁻⁴`, about **1 in 1500 sessions**.

1 in 1500 is still small. But it is small enough that quoting the per-pair figure as if
it were the session figure is the kind of thing that ends up in a press release, and
the spec writes in a register where that matters.

**Fix.** Quote the birthday bound. If the number is unacceptable for a ranked platform,
the fix is not more arithmetic — it is a wider digest. `thp_octet32` already exists in
the tree (a 32-byte type used for SHA-256), so widening `state_hash` from `thp_be32` to
`thp_octet16` costs 12 bytes per INPUT packet (130 → 142) and drops the rate to
~10⁻²⁵. That is a wire change under the MAJOR/MINOR policy as written, so it is a
decision, not a fix.

### F13 — the TH06 coverage list violates the spec's own rule

§8.6 states: *"That the inputs were identical. Only if the profile hashes them. TH08's
does (`slot.input.current`/`previous`); **TH06's must**."*

`TH06_HASH_COVERAGE` (`thp_profile_th06.h:154-165`) contains no input field. Not one
line. The shipped profile violates a MUST that the same document states eleven pages
earlier, and `ADAPTERS.md` §2.3 asserts that spirit mode, life transfer, shared items and
insane mode are "free only because they ride on the input stream" and "must therefore be
covered by the state hash" — which, for a profile that hashes no inputs, means they are
covered by nothing at all.

**Fix.** Add `p1.input.current(u16) p1.input.previous(u16)` and the P2 pair to
`TH06_HASH_COVERAGE`, and add a `thp_selftest.c` assertion that every profile whose
`hash_coverage` mentions "input" — i.e. a static string search, which is crude but this
document's whole ethos is that coverage is a compile-time constant, so a compile-time
check on the coverage constant is in keeping.

### F8 — the coverage string is not linked to the digest that is computed *(reproduced)*

`thp_profile.hash_coverage` is a `const char *`. `thp_profile_th06.h:154` and
`thp_profile_th08.h:166` are string literals. `thp_profile_th07.h` does not exist. There
is **no compile-time or run-time link** between the literal and what `compute_state_hash`
actually mixes — and `compute_state_hash` is `NULL` in both profiles today, so the two
lists currently describe nothing at all.

Meanwhile `thp_profile.h:81-118` defines `thp_hash_field`, a full published vocabulary
of 27 ordered field ids, **and nothing in the tree uses it.** `grep` over
`thp_profile_th06.h`, `thp_profile_th08.h` and `thp_selftest.c` finds `hash_coverage`
referenced only as a pointer that must be non-NULL. The mechanism that would make the
string and the digest impossible to drift apart was written and then left disconnected.

**Fix.** Make the coverage list an array of `thp_hash_field` and derive the string:

```c
static const thp_hash_field TH06_COVERAGE[] = {
    THP_FIELD_RNG_STATE, THP_FIELD_RNG_GENERATIONS, THP_FIELD_FRAME, ...
};
static const thp_hash_field TH08_COVERAGE[] = { ... };
```

`hash_coverage` becomes a `const thp_hash_field *` plus a count, and the printable
string is generated from `thp_hash_field_name(id)` at connect time. `thp_hash_field`
stops being documentation and becomes the contract. (Note the enum's *declaration order*
is currently wrong for this purpose — `THP_FIELD_RNG_GENERATIONS = 26` sits between 3 and
22 in the source — so reordering is part of the fix, and it is safe because the enum is
currently unused.) This is a change to a non-wire struct; the 32-bit digest layout is
unchanged as long as the mixing order matches the array order.

`ADAPTERS.md` §6's checklist item — *"Did the coverage **string** change with it? They
must not drift"* — is an admission that they *will* drift, mitigated by a human
remembering. Replace it with the array and the checklist item deletes itself.

---

## 4. What a matching state hash does NOT prove

§8.6 is a good section and I am not asking for it to be deleted. I am asking for six
items to be added, three of which are new and three of which sharpen what is there.
Every item below is a real gap, not a hedge.

1. **It does not prove a comparison took place.** See F1 and F2. This is the most
   important addition, and it is not a philosophical caveat — it is a reproduced
   behaviour of the reference API. A digest that was never compared produces the same
   `THP_HASH_MATCH` as one that was.
2. **It does not prove the two peers used the same profile.** `profile_id` names the
   *game* (probe F8). Two TH08 builds with different `hash_period`, different
   `input_bits` and different `required_caps` negotiate `ACCEPT` against each other.
   Different `hash_period` alone means the two peers hash on *different frames*
   permanently — every comparison is either a false match or a spurious mismatch, and
   neither is distinguishable from a real bug.
3. **It does not prove the inputs were identical, unless the profile says so.** §8.6
   says this; the shipped TH06 profile does not hash inputs (F13), so for TH06 it is
   currently true that a match says nothing about whether the two peers played the same
   inputs.
4. **It does not prove agreement on anything the list omits — and the list omits the
   two quantities that decide a Touhou match.** Both coverage strings contain bullet and
   enemy *counts*. Neither contains a bullet position, velocity, type or angle, nor an
   ECL program counter. Per the upstream report, TH07's ECL interpreter is 22.71 %
   resynchronised (`config/functions.csv:93` `[CONFIG]`) — the least-understood part of
   the game, and the part that draws from a second RNG with 23 call sites. A desync in
   an ECL opcode's *argument* changes nothing a count can see.
5. **It does not prove the two builds compute the same function.** §8.6 says this and
   points at reccmp/objdiff as the stronger guarantee. That is right and it should be
   promoted out of a bullet list: **byte-exact matching is a precondition of a THP
   session, not a nice-to-have that the hash happens to substitute for.** Right now
   `BUILD_MISMATCH` compares a SHA-256 of the game executable, which does not cover the
   netcode DLL — the component most likely to differ between two players' machines
   (compiler version, `/W4` vs `/O2`, host x86 vs x64). Two peers with byte-identical
   `th08.exe` and different builds of our own injected module pass the fingerprint check
   and can desync. **The fingerprint must cover the netcode module.**
6. **It does not prove the run was fair or that either peer is honest.** Authentication
   is a declared non-goal (§1.1), which is fine. But a peer that lies about its *own*
   inputs produces a hash mismatch at some frame, and `THP_DISC_DESYNC` carries only that
   frame. A cheater and a float-contraction bug produce the same report. Say so.
7. **It does not prove the peers advance at the same wall-clock rate.** Nothing ties
   "frame" to a period. Two peers running 60.0 and 58.5 fps stay bit-identical forever
   while their latency grows without bound; the 5 s `TIMEOUT` never fires because
   packets keep arriving.
8. **A mismatch is definitive; a match is not.** §8.6 gets this exactly right and it is
   the best sentence in the document. Keep it verbatim.

---

## 5. Axis 3 — Repair feasibility

### Verdict: **UNSOUND. This is the most serious finding in the review.**

The spec is admirably candid in §8.7's closing paragraph. It is also, on inspection,
candid about the wrong thing.

> recovery works only because the game is deterministic given identical inputs from the
> re-cut frame forward.

That is a tautology wearing the costume of a justification. Determinism *forward from
equality* is trivially true and says nothing about **getting** the two states equal at
the cut. The proof obligation for a repair is:

> the two simulations hold **the same state** at `resync_frame`.

Nothing in THP establishes that, and the wire carries no state.

### F11 — the re-cut resets the RNG and the receive buffers; it does not reset the game

`thp_resync_apply` (`thp_profile.h:868-903`) clears `local_hashes`, `remote_inputs`,
`pending_remote` and `desync_frame`, installs a seed, sets `start_frame`, and sets
`RUNNING`. Per `ADAPTERS.md:148` and spec §8.7 rule 6, that is a deliberate,
well-documented transcription of TH06.

And TH06's re-cut, per upstream §4.3 `[CODE]`, resets exactly: `g_Rng.seed = 0`,
three receive maps, `g_cur_ctrl`. The report then lists what it does **not** reset:
"player positions, velocities, hitboxes, lives, bombs, power, score, item entities,
bullet tables, enemy tables and ECL program counters."

So the peer that had 40 bullets and the peer that had 38 still have 40 and 38 bullets at
the re-cut frame. Re-seeding the RNG aligns the *stream*, not the *state*. From
`resync_frame` forward both peers draw the same numbers, but they draw them for
different things, and the divergence is permanent. §8.7 rule 7 bounds the loop at three
attempts and then disconnects — which is a correct way to stop lying about a repair that
cannot succeed, but the honest verdict is that **there was never a repair**.

TH06 gets away with this because its detector is one `u16` RNG-seed comparison
(`src/Controller.cpp:771` `[CODE]`), so the only divergence it can *see* is the one its
repair *can* fix. Upstream §4.5 states the consequence plainly: *"TH06's argument only
holds because the RNG is the sole synchronised quantity. For THP, which will have a
richer hash, TH08's conclusion is the safer one: detect is not repair."*

THP took TH06's repair and TH08's detector. **That combination was never valid.**

**Fix — pick one of two, and do not ship the current state of affairs:**

*(a) Restrict repair to what it can actually fix, and name the class.* Say: a RESYNC
re-synchronises the RNG stream and the input timeline only. It repairs divergence
originating in the RNG or in the input stream. It cannot repair divergence in game state.
Every other mismatch is `THP_DISC_DESYNC`. This costs nothing, is true, and removes the
loop.

*(b) Make repair a rewind to a state both peers can regenerate — and the wire already
carries everything needed.* A stage's initial state is a deterministic function of
`(seed, stage id, start blob)` — `random_seed` and `profile_blob` are both in `WELCOME`.
So: define the RESYNC target as **the current attempt's first frame**, not an arbitrary
future one. Both peers then re-run the attempt from its start using the agreed seed, the
agreed blob, and the input log they already exchange. That is a *provably* convergent
repair, it needs no state blob, and it fits inside "THP is not a state-streaming
protocol."

*(b) is my recommendation and it is strictly better than what is in the spec. The cost
is that the whole attempt is replayed, so the RESYNC packet needs to name the attempt
origin — and `thp_packet_resync` has a `reserved0` `thp_be16` plus a `run_id` and the
existing `random_seed` field, so this fits today's layout without a wire change. The
input log requirement is real and is a separate finding (F16 below).

**Two corollaries the spec does not currently state:**

- **A resync is not the same event as a stage restart, and the spec conflates them.**
  `thp_resync_apply` sets `s->start_frame = resync_frame`. `start_frame` is defined
  (WELCOME, §4.1) as the *common load boundary* for a run, and §8.7 rule 5 says "the
  frame counter is not rewound." Assigning the re-cut point to `start_frame` makes one
  field mean two things and directly contradicts rule 5. Under fix (b) it is coherent —
  the attempt genuinely does restart — but then it must be stated, and `run_id` must be
  bumped, because the game will have been re-entered.
- **The guest has no repair right and no obligation.** Rule 1 says only the host may
  initiate. The guest can *detect* (it owns half the hash comparisons) and has no state
  to move to. There is no `THP_STATE_DESYNCED` — the enum jumps `RUNNING → RESYNCING →
  RUNNING`, and a guest that sees a mismatch has nowhere to go. Add
  `THP_STATE_DESYNCED` (non-terminal, not valid for scoring, cleared only by a RESYNC or
  a DISCONNECT) and require both peers to enter it on any MISMATCH.

### F3 — `thp_resync_apply` leaves `thp_input_progress` pointing at erased frames *(reproduced)*

Probe F3. The function clears every `remote_inputs[i].occupied` flag and leaves
`progress.remote_latest` and `progress.remote_acked` at their pre-cut values. Spec §5.4's
starvation rule evaluates `remote_latest < local_latest − window`. After a cut, that
rule is being asked about frames whose data was just deleted, so the receiver will not
report starvation while being unable to supply a single input — the exact opposite of
what §5.4 is for. Spec rule 6 is right that the *local* history must be kept; it says
nothing about the progress block, which is the other half of the same bookkeeping.

**Fix.** In `thp_resync_apply`, either zero `progress.remote_latest` /
`progress.remote_acked` and set `progress.starved = 1` for one frame, or rebase them to
`resync_frame`. The first is honest: after a cut we genuinely do not know what the peer
has.

---

## 6. Axis 4 — Versioning and capability negotiation

### Verdict: **UNSOUND.** The version policy is stated well and contradicted by the code
### in three places, one of which makes the spec's headline feature unreachable.

**Sound:** §3.4's separation of `VERSION_MISMATCH` from `BUILD_MISMATCH`, with the
"one error string, two different user actions" reasoning, is correct and is the right
kind of care. §9.1's core/profile capability split is the right structural move.

### F5 — §3.3's version-mismatch dialogue cannot happen *(reproduced)*

§3.3 draws this:

```
guest  |---- HELLO {ver_major=2, ...} ------>|  host: prefix check fails at ver_major
       |<--- NEGOTIATE {accepted=0, reason=VERSION_MISMATCH, min=1.0 max=1.9} ---|
```

and calls it "strictly better than either reference." Probe F5 confirms it cannot
happen. §2.2 requires a receiver to reject unless `ver_major == THP_VERSION_MAJOR`,
**before reading a single body byte**, and `thp_header_check` (`thp_wire.h:910-913`)
does exactly that. The host drops the datagram. It never learns the guest's version. It
therefore cannot distinguish "you are too old" from "you are too new" — the two cases
§3.3 explicitly promises the guest can tell apart — and it can never send the `NEGOTIATE`
at all.

This also makes `thp_negotiate`'s own version branch (`thp_profile.h:717-720`, which
inspects `hello->client_version.b[0]`) **dead code on any real path**: to reach it, a
packet must already have passed a check that rejects major ≠ 1.

**Fix.** Exempt `HELLO` from the major-version check while in `IDLE`/`HANDSHAKE` — the
version is at byte 4, before the body, so the host can read it *and* answer:

```
if (want_type != THP_PKT_HELLO || in_handshake) {
    if (data[4] != THP_VERSION_MAJOR) return REJECT_VERSION_UNANSWERABLE;  /* steady state */
}
```

and then send the `NEGOTIATE` the spec already describes. Add `min_major`/`max_major`
computation to `thp_negotiate` so the four fields `thp_packet_negotiate` already carries
are actually filled by something. While there: `thp_negotiate` returns
`THP_NEGOTIATION_REJECT_VERSION` when `host_profile == 0` — a NULL argument is a
*programming* error being reported to a remote peer as a *protocol* rejection. Add a
distinct `THP_NEGOTIATION_ERROR_LOCAL` so a bug cannot present to a user as "wrong
version."

### F4 — "a v1.0 peer must keep working against v1.7" is false for every fixed-size packet *(reproduced)*

§3.1: *"A v1.0 peer that receives v1.7 traffic it does not recognise **must keep
working**."* A MINOR bump may "grow a packet's trailing `reserved` tail."

Probe F4: `thp_header_check` accepts a CONTROL whose body grew by 4 trailing bytes
(F4a, correct). `thp_decode_control` then **rejects it** (F4b), because
`thp_r_ok(r)` is `r->ok && r->pos == r->len` (`thp_wire.h:864-867`) and every decoder in
`thp_wire.h` returns it. Every fixed-size packet — CONTROL, GAMEPLAY, START, RESYNC,
DISCONNECT, NEGOTIATE — has this property. The promise holds only for the two
variable-length packets, INPUT and WELCOME.

This is the worst kind of bug for a versioning policy: the *document* promises
forward compatibility, the *codec* delivers backward rejection, and a v1.0 peer will
fail a v1.1 `SET_INPUT_DELAY` as a protocol error and disconnect, having told nobody
why.

**Fix.** Split the predicates:

```c
THP_INLINE int thp_r_ok(const thp_reader *r)        { return r->ok && r->pos <= r->len; }  /* extensible */
THP_INLINE int thp_r_exact(const thp_reader *r)     { return r->ok && r->pos == r->len; }  /* where required */
```

`thp_r_exact` stays for `thp_decode_input` (where `sample_count` must consume the body
exactly, or a truncated packet would decode as a short-but-valid one) and for
`thp_decode_welcome`. Everything else takes `thp_r_ok`. This is a one-line change with a
large behavioural consequence, which is why it should be a deliberate MINOR bump rather
than a quiet fix.

### F19 — the guest's mandatory capabilities are never checked

`thp_negotiate` checks `(caps & host_profile->required_caps) == host_profile->required_caps`
(`thp_profile.h:743`). The **guest's** `required_caps` never reach the host — `HELLO`
carries only the guest's *offer*. A guest whose build requires a capability the host
lacks is admitted into a session where it is silently off, and `START` echoes only seed
and delay (§4.1), so nothing catches it.

Today this is latent because both peers run the same profile literal, so
`required_caps` is symmetric. It becomes live the moment two revisions of the TH08
profile exist — which is exactly what F8 says is undetectable.

**Fix.** `START` must echo the negotiated `capabilities` and `profile_id` alongside the
seed and delay, and the guest must re-verify `thp_capabilities_sufficient()` plus its
own `required_caps` against it before entering `SYNCING`. `thp_packet_start` has
`reserved0` (`thp_be16`) — not enough for a `u32` capabilities field, so this is either a
MINOR bump with a grown tail (which F4's fix enables) or a new packet type. The `run_id`
field is already there and the added check is 4 bytes.

### F18 — a session can be negotiated with no synchronisation evidence at all

`THP_CAP_MANDATORY` is `INPUT_REDUNDANCY | KEEPALIVE_RTT` (`thp_wire.h:289`).
`STATE_HASH` is optional. A session therefore runs with no hash exchange, and §8.6's own
list says such a session's "no mismatch reported" is "indistinguishable from 'nothing
checked.'" §1 goal 4 says "prove synchronisation, **or say plainly that we did not**" —
and there is no state, flag, packet or UI surface anywhere in the protocol that says it.

**Fix.** Add a first-class session property rather than a bit:

```c
typedef enum thp_verification {
    THP_VERIFY_ABSENT = 0,   /* no STATE_HASH negotiated; synchronicity UNVERIFIED */
    THP_VERIFY_PENDING,      /* negotiated; no comparison has completed yet          */
    THP_VERIFY_ACTIVE,       /* comparisons are happening                             */
    THP_VERIFY_FAILED        /* a mismatch was seen; session is invalid for scoring  */
} thp_verification;
```

in `thp_session`, gated on `hashes_compared` from F1, rendered in the UI, and required
to reach `THP_VERIFY_ACTIVE` before a run counts for score. This is the single change
that most directly serves the project's stated standard.

---

## 7. Axis 5 — Latency and the delay window

### Verdict: **UNSOUND.** The range is right, the negotiation arithmetic is right at
### connect and wrong at runtime, and the protocol has no notion of a stall.

**Sound:** §6.2's `max()` at connect is correct, deterministic, commutative, and
genuinely adopted verbatim — and it is a real improvement on TH06, whose guest adopts
the host's value outright with no max (`src/ConnectionUI.cpp:544`, upstream §3.1
`[CODE]`). §6.3 rule 1's insistence on agreeing on *both* the value and the frame it
takes effect at is the right fix for TH06's independent-M/N defect, which upstream
confirms is worse than the spec claims — TH06's guest M press mutates the host's
`g_delay` on the same frame on both peers (`src/Supervisor.cpp:212-229`, upstream §3.1
`[CODE]`). Credit where due.

### F10 — the margin is a frame count standing in for a time *(reproduced)*

`thp_delay_change_frame(now, delay) = now + 2*delay + 4`. Probe F10: 6 frames (100 ms)
at delay 1, 28 frames (467 ms) at delay 12. A 600 ms RTT is 36 frames. §10.3 already
measures RTT via `KEEPALIVE` and §8.7 rule 3 re-sends `RESYNC` every frame — but
**nothing anywhere consults the measured RTT before computing a margin.** A delay change
over a 600 ms link lands mid-flight: one peer has switched, the other has not, and both
are now consuming remote input at different lags. That is precisely the desync §6.3 was
written to prevent, reintroduced through the margin.

**Fix.**

```c
THP_INLINE uint32_t thp_delay_change_frame(uint32_t now, uint16_t delay,
                                           uint32_t rtt_frames)
{
    uint32_t need = (uint32_t)delay * 2u + 4u;
    uint32_t net  = rtt_frames + 2u;
    return now + (need > net ? need : net);
}
```

and refuse the change outright when `rtt_frames > some_bound`, with the bound named in
§6.3.

### F12 — the change-frame arithmetic is wrong for every decrease, under either reading

§6.3 rule 1: "The initiator computes `change_frame = now + 2*delay + 4`." It does not
say *which* delay. Under the write-side offset model THP inherits from TH08
(`scheduledFrame = simulationFrame + inputDelay`, upstream §3.2 `[CODE]`), the peer's
newest stored label at frame `now` is `now + A` for old delay `A`. At `change_frame` the
consumer needs remote input at `change_frame − N` for new delay `N`. Requiring that to
already exist:

$$\texttt{change\_frame} - N \le \texttt{now} + A$$

- with `change_frame = now + 2A + 4`: needs $N \ge A + 4$ — so **any increase of less
  than 4 frames fails, and every decrease fails**;
- with `change_frame = now + 2N + 4`: needs $N \le A - 4$ — which only ever holds for a
  *decrease*, contradicting the intent.

Either reading stalls the session for `A + B` frames on most changes. The stall is
survivable (it is a lockstep stall, not a desync) but it is a multi-hundred-millisecond
freeze the user did not ask for, triggered by pressing M.

**Fix.** State the constraint in the spec and implement it:
`change_frame = now + old_delay + new_delay`, with the additional requirement that it
clear one RTT (§F10). Say which delay is which in the parameter names — `old_delay` and
`new_delay` instead of one `delay`.

### F12b — the two-phase exchange has no timeout, no retry, and no convergence rule

§6.3 rule 3: the initiator "switches **only** on an `ACK` whose `value` and `arg` both
match." There is no retransmission, no expiry, and no rule for a lost ACK — the initiator
sits in `THP_DELAY_PROPOSED` indefinitely while the peer has already armed, because the
peer commits on receiving the *proposal*. Two peers, one armed and one waiting, with no
event that reconciles them. `RESYNC` handles this correctly (§8.7 rule 3: re-send every
frame until the frame passes); `SET_INPUT_DELAY` does not. A duplicate or reordered
`CONTROL` also re-enters `THP_DELAY_PROPOSED` after the change already took effect,
because nothing binds an `ACK` to the `seq` of the proposal it answers.

**Fix.** Mirror the RESYNC pattern: re-send the proposal every frame until
`change_frame`, ignore any proposal whose `change_frame < now + 2*delay + 4` as expired
rather than re-arming, and bind the ACK to the proposal's header `seq`. Also state what
the *non-initiator* does if it never sees confirmation: it is already committed, and
that must be written down rather than left to the adapter.

### The ends of the range

- **Delay 1.** The redundancy window is 15 frames, so the *loss* budget is
  `window − delay` = 14 frames (233 ms). At delay 1 that is generous. The problem is
  elsewhere: with a 1-frame input delay, **any** jitter above one frame stalls the
  simulation every time, and THP's answer to a stall (§5.4) is to hold and report.
  §6.1 justifies rejecting delay 0 ("it would make the redundant-input window
  meaningless") but never justifies why 1 is a usable floor over a real internet. A
  1-frame floor makes the protocol a LAN protocol while presenting a range that reads
  like a general one.
  **Fix.** Add the invariant the range actually depends on and assert it:
  `THP_STATIC_ASSERT(THP_MAX_REDUNDANT_SAMPLES > THP_INPUT_DELAY_MAX + 2, ...)`, and
  write the recovery budget into §6.1 as `window − delay` frames, so a reader can see
  that delay 12 buys 3 frames (50 ms) of loss tolerance and delay 1 buys 14 (233 ms) —
  the latency you pick is the tolerance you lose, and the spec does not say so.

- **Delay 12.** The recovery budget of 3 frames is 50 ms. Two consecutive losses on a
  congested link exceed it and the session stalls. This is survivable by design but it
  is not stated, and the profile has no way to say "this game needs more than 12"
  without violating §6.1's "12 is already the proven ceiling." That sentence should be
  deleted: 12 is TH08's ceiling, not a property of lockstep.

### F16 — the protocol cannot say "this frame cannot advance"

This is the axis's biggest hole and it is structural.

THP models starvation as an outcome: §5.4 says hold, set `starved = 1`, report it,
disconnect after 5 s. `thp_input_progress.starved` is a byte in a host-side struct.
There is no packet, field, or return value anywhere in THP that says **the simulation
cannot advance this frame** — which is the thing both references actually do. TH08
returns `CHAIN_CALLBACK_RESULT_BREAK` and the frame is not advanced
(`src/Supervisor.cpp:157-158`, upstream §2.1 `[CODE]`); TH06 blocks in a `do { } while`
loop on `g_ctrl_bits_rcved.find(frame - g_delay)` (`src/Controller.cpp:766-792`,
upstream §3.1 `[CODE]`). In both, the stall **is** the mechanism. THP has specified the
mechanism's timeout and its UI obligation and none of its semantics.

That omission has a concrete consequence inside THP's own logic: `thp_hash_due(s, frame)`
(`thp_profile.h:606-615`) is a pure function of the frame number, so it returns true on
schedule whether or not the frame advanced. A stalled peer hashes frames the running peer
skipped. The two hash streams desynchronise in *cadence*, and with a single pending slot
(F2) the comparisons are then silently lost.

**Fix.** Make stall a protocol concept. Add to `thp_input_progress` a monotonic
`sim_frames_advanced` counter distinct from `session_frame`, and:

- require `hash_frame` to be the count of **advanced simulation frames**, not wall-clock
  or render frames — which also gives the render-vs-simulation distinction D3 needs;
- define `THP_HASH_SKIPPED` for a local frame that was never simulated;
- add a one-line spec rule stating that the receiver **MUST NOT** substitute zero input
  for a missing frame and **MUST** hold the simulation, cross-referenced from §5.4
  rather than implied by it.

**Fix, second half — the frame-skip trap.** Upstream §2.4 `[CODE]` documents that
TH08's synchronising build has a *deliberately empty* branch for skipped frames, with
the rationale that consuming a lockstep input frame on a skipped render frame "would
make each process apply a different subset of the otherwise synchronized inputs." THP
assumes one network frame per simulation frame and never mentions render frames. Add a
§1.3 non-goal stating that a THP session runs with frame skipping disabled, and hash the
simulation-frame counter so a violation is visible rather than silent.

---

## 8. Axis 6 — The per-game profile abstraction

### Verdict: **PARTIALLY SOUND.** The core/game split is the right architecture and is
### enforced structurally. The `thp_profile` struct carries four per-game properties and
### two of them are unused, and the struct cannot express three differences that must be
### negotiated.

**Sound, and worth keeping:** `thp_wire.h`'s discipline is genuinely excellent. The
`thp_octetNN`-by-width rule exists *because* a real bug happened, and the
`thp_static_assert(sizeof(thp_profile) > THP_MAX_PACKET)` — "a wire struct can never
smuggle a host pointer" — is the kind of check that costs one line and forecloses a
whole category of mistake. `ADAPTERS.md` §1's demolition of the retired 152-byte
`protocol.h` is the correct argument and the right reason (it was size-identical and
semantically incompatible, not merely "different"). Keep all of it.

### F14 — `input_bits` and `seed_bits` are declared, documented at length, and never read

`grep` over the whole protocol directory: `input_bits` appears in the `thp_profile`
struct definition, in both profile literals, and in `thp_selftest.c`'s assertion list
**not at all**. `seed_bits` likewise. Neither field is read by any function in
`thp_wire.h` or `thp_profile.h`. `thp_decode_input` accepts any `u16`; nothing masks it;
nothing compares the two peers' `input_bits`; nothing uses `seed_bits` to truncate or
verify `random_seed`.

So §7.3's requirement that "both peers agree on how many bits are actually consumed" is
satisfied by *both peers loading the same header*, not by anything on the wire or in the
protocol. For a header whose stated design principle is "make it structural rather than
conventional," two of the four properties the file's own header comment enumerates as
what a profile supplies are, today, documentation.

**Fix.** Make them structural, which is cheap:

- `thp_decode_input` gains a profile parameter and rejects `buttons` with any bit at or
  above `input_bits` set — turning a typo in a bit assignment into a rejected packet
  rather than a silent behaviour change;
- `WELCOME`/`START` echo `input_bits` (there is room in the reserved tails), and the
  guest refuses to start on disagreement, exactly as §4.1 already does for the seed;
- `random_seed` is masked to `seed_bits` on install by a helper, so "the top 16 bits do
  not matter" is a line of code rather than a sentence in a comment.

### F8 — `profile_id` names the game, not the profile *(reproduced)*

Covered in §3. Probe F8 shows a TH08 profile with `input_bits = 16`,
`hash_period = 7` and `required_caps = 0` negotiating `ACCEPT` against a stock TH08
peer. The consequences compound: different `hash_period` means the two peers hash on
different frames forever (F8 → §4 item 2); different `input_bits` means the same bit has
a different meaning (F14); different `required_caps` means the guest's requirements are
never enforced (F19).

`thp_profile.h:61-65` says ids are "assigned centrally and never reused … so an old
HELLO can always be answered with PROFILE_MISMATCH." That is careful, and it protects
against the wrong failure while leaving the right one open.

**Fix.** `thp_packet_hello` has `reserved0` (`uint8_t`); `thp_packet_negotiate` has
`reserved0[4]`. Put a `u16 profile_revision` in each, require equality alongside
`profile_id`, and add a `THP_REJECT_PROFILE_REVISION` so the failure is one string for
one problem. That is 2 bytes in HELLO and 2 in NEGOTIATE, both inside existing reserved
space — no MAJOR bump.

### What the profile cannot express

| difference | expressible today? | what is missing |
|---|---|---|
| TH06 splits its input word P1 bits 0–8 / P2 bits 9–15 (upstream §1.2 `[CODE]`) | no | an `input_merge` mode; today `input_bits = 11` describes one player's bits and the header comment describes a merged word |
| TH08's P1 reaches the game via one global store, P2 via a per-slot redirector, and P2 never enters `g_CurFrameInput` (upstream §2.1 `[CODE]`) | no | an `input_slots` count; "one word per peer" is the right wire shape and the wrong game shape |
| TH07's six RNG streams (upstream §7.3 `[CODE]`) | no | a seed-slot list (D1) |
| whether a frame is a simulation frame or a render frame (upstream §2.4 `[CODE]`) | no | a second, hashed counter (F16) |
| TH08's title barrier and its `localTitleInputArmed` zero-frame release gate (upstream §5.1 `[CODE]`) | no | an in-band readiness bit *and* a rule for the one-frame release; THP's TH08 profile declares `input_bits = 10` and defines `TH08_INPUT_TITLE_READY 0x0200` but never says which frame both peers start applying real input |
| TH08's stage-entry frame barrier (upstream §5.1 Barrier C `[CODE]`) | partly | `WELCOME.start_frame` exists; nothing says how a peer signals "my stage has loaded" |
| frame-skip policy | no | see F16 |

The last two are worth calling out because they are **not** optional polish: upstream §5.1
documents that TH08 needed three stacked barriers, and that the character-select barrier
runs its readiness confirmation off *lockstep input frames* and starts the run
"from the lockstep frame, explicitly not from the loading thread" (`[CODE]`). A protocol
with no barrier concept and no notion of a render thread has no place to put any of it.

---

## 9. Axis 7 — Gameplay over the wire

### Verdict: **MOSTLY SOUND IN PRINCIPLE, UNSOUND IN MECHANISM.** The
### "if a peer can compute it, do not send it" rule is right and should be kept. The
### transport for the things that genuinely must be sent is not covered by the
### redundancy window, which turns a 4-byte event into an unrecoverable desync.

**Sound:** §9.3's rule is correct and the reasoning is correct — *"Sending any of it
would create two authorities for one fact, which is the exact failure state hashing
exists to eliminate."* That is the right principle and it generalises beyond TH06. The
`required_caps` treatment is also good: TH06 requires
`SHARED_ITEMS | LIFE_TRANSFER | SPIRIT_MODE` (profile, `:204`), so a TH06 session cannot
be negotiated into a configuration where a "feature" is half-present.

**Assessment of each named feature**, against upstream §4.3/§2 and the TH06 header:

| feature | needs wire bytes? | THP's answer | verdict |
|---|---|---|---|
| spirit mode | no — drift vector from the shared RNG (`src/Player.cpp:452-472`) | hash `playerState`, `lives`, `power` | correct, and TH06's `generationCount` addition makes it genuinely strong |
| life transfer | no — pure function of positions + focus | hash positions | correct |
| shared items | no — spawn position from the shared RNG (`src/GameManager.cpp:203`) | hash `activeItemCount` | **partially correct** — the *count* is hashed but not the spawn position, so two peers with the same item count at different positions pass. See F13 |
| insane mode | **yes, once** — a toggle | `GAMEPLAY{TH06_EV_INSANE_MODE}` | **contradictory in three places**, see F20 |
| hitbox display | no — local render | nothing | correct |

### F20 — insane mode is specified three ways and they do not agree

- `thp_profile_th06.h:86-88`: *"These must NOT become packets. They are deterministic
  functions of the merged input stream … spirit mode, life transfer, shared items,
  insane mode, hitbox display. They belong in the hash."*
- `thp_profile_th06.h:96`: `TH06_EV_INSANE_MODE = 4, /* Insane_Mode -- toggle rank lock at 64 */`
- `ADAPTERS.md:102`: insane mode is "local toggle, then both set rank locally
  (`src/Supervisor.cpp:249-259`)", wire cost **4**.
- `ADAPTERS.md:110`: "**if a peer can compute it, do not send it.**"

If both peers set rank from their own local toggle, the toggle is not on the wire and
the `GAMEPLAY` event is dead. If the toggle is on the wire, then the local toggle is
dead and §9.3's rule is violated. Worse, TH06's `insaneMode` *is* in `TH06_HASH_COVERAGE`
(`:165`) and `rank`/`minRank`/`maxRank` are too (`:164`), so the hash will catch the
disagreement — at the next 30-frame boundary, followed by an unfixable repair (F11).

**Fix.** Decide. The recommendation is to put the toggle in the button word, not in
`GAMEPLAY`: TH06 declares `input_bits = 11` out of 16, so five bits are unallocated, and
TH08 already sets the precedent by carrying its title-ready handshake as an in-band bit
(`MULTI_INPUT_TITLE_READY`, upstream §5.1 `[CODE]`). One bit, inside the redundancy
window, frame-exact by construction. Then delete `TH06_EV_INSANE_MODE` and fix
`ADAPTERS.md:102`.

### F21 — `THP_PKT_GAMEPLAY` rides outside the redundancy window, so a lost event is an
### unrecoverable desync *(the significant finding on this axis)*

§5.2's guarantee is explicit: redundancy "is what makes THP survive packet loss with
**no retransmission request at all**." §5.3's `ack_frame` covers INPUT. **Neither covers
`GAMEPLAY`.** `THP_PKT_GAMEPLAY` is a separate packet type with a single
`event_frame`/`event`/`value`/`arg`, sent once. Lose it and:

- the peer that missed it never applies the intent;
- §5.5 does not apply (no contradiction was observed — there was simply nothing);
- the peer's input history has no record that the event existed, because it was never in
  an input sample;
- the next `GAMEPLAY` packet, if any, is for a *later* frame;
- the divergence is permanent, and per F11 unrepairable.

There is also no rule for an event that arrives **after** its `event_frame` has passed.
TH06's `igc_type[15]` is positionally bound to a frame inside the redundant window
(`src/Connection.hpp:123`, upstream §3.3 `[CODE]`), so it cannot be late in this way;
THP's decoupling from position is presented as an improvement
(`thp_profile_th06.h:77`: *"removes the positional coupling"*), and it removes the
coupling **and the guarantee together**.

**Fix (recommended).** Make events ride the input window. Widen `thp_input_sample` from
6 bytes to 8 by adding a `thp_be16 event` field — worst-case INPUT goes 130 → 140
bytes, still 12 % of an IPv6 minimum MTU — and let `THP_PKT_GAMEPLAY` exist only for
out-of-band, non-frame-bound control (abort, restart request). Events then inherit
redundancy, frame-exactness, idempotent re-insert, and the contiguity rule, all for free.
Add the missing rule in the same stroke: *"an event for a frame already advanced is a
protocol error, not a late delivery."*

Cheaper alternative if the wire change is unwelcome: give `GAMEPLAY` its own redundancy
and an `ack_frame`, i.e. treat it as a second `INPUT` channel. That is more code for a
worse guarantee. I recommend the 2-byte sample growth.

---

## 10. Axis 8 — What the protocol cannot express

Engaging with upstream §8's gap table rather than re-deriving it, plus what I found that
the table does not list. Ordered by how expensive the omission is to discover later.

| # | cannot express | why it matters | smallest honest fix |
|---|---|---|---|
| 1 | **A result.** No `RESULT` packet, no final agreed hash, no attestation of any kind. §8.7 says a desynced session "is not valid for scoring" and the protocol has no representation of a valid one either. | A battle platform's output is a result. Two players who disagree about who won have nothing to point at. | Add `THP_PKT_RESULT { run_id, final_frame, final_state_hash, both_nonces }` sent by both peers at the end of a run; the host publishes the pair. Verifiable offline against the input log. |
| 2 | **A replay.** The wire carries every input, so the *data* for a replay exists — but nothing records it durably, nothing commits to the coverage-string version, and there is no format. | The only defence against a "we definitely didn't desync" claim. | Persist `(session seed, profile blob, input log, coverage string)` per run; add a `thp_replay_verify()` that re-runs and compares final hashes. |
| 3 | **N-player input authority.** `sender_slot` and `assigned_slot` exist; the slot→player-index binding is never stated, and `assigned_slot` is never checked anywhere. Upstream §1.6 `[CODE]`: both upstreams are 2-player only and neither gives a precedent. TH08 checks its slot in **two** places — the encoder refuses to emit a WELCOME whose slot is not 1 (`src/MultiNetProtocol.cpp:130`) and the decoder independently requires 1 (`:216`) — precisely so a buggy host and a buggy guest cannot disagree about who is P1. | A guest that adopts the wrong slot is P1 on one peer and P2 on the other: every frame inverted, detected only by the hash, unrepairable. | State the rule in §5.1 (host ≡ P1, guest ≡ P2, host-assigned, fixed at `WELCOME`, never re-derived). Check `assigned_slot` in `thp_decode_welcome` and refuse in `thp_encode_welcome` — two checks, mirroring TH08. Also validate `sender_slot` against the assigned seat on every `INPUT`. |
| 4 | **Per-slot input reaching the game.** See D2. | If only `g_CurFrameInput` is patched, TH08's P2 is completely inert (upstream §2.3 `[CODE]`). | `input_slots`/`input_merge` on the profile (D2). |
| 5 | **A stall / "cannot advance".** See F16. | Stall is the mechanism; the protocol models only its timeout. | `sim_frames_advanced`; hash on advanced frames. |
| 6 | **Frame-skip and render-vs-simulation.** See F16. | A consumed-but-skipped frame is a silent, irreproducible desync — upstream's words (`[CODE]`). | §1.3 non-goal; hash the simulation-frame counter. |
| 7 | **Stage-entry / title barriers.** Upstream §5.1 `[CODE]`: three stacked barriers, one of them needing a *frame* barrier rather than a time barrier, another needing the one-frame zero-input release gate. | Without a barrier, the two peers enter the stage at different wall-clock instants and the first divergent frame is inside the stage load. | An in-band readiness bit (the title-ready precedent) plus a `START` precondition that the stage has loaded on both sides. |
| 8 | **Reconnect / resume.** `THP_CAP_RECONNECT` and `THP_CTRL_RECONNECT_REQUEST` are *names*. There is no state machine and, decisively, no way to reconstruct a peer's state at frame F — same wall as repair (F11). `THP_HISTORY_SLOTS = 256` is 4.27 s of input log at 60 Hz; a 6-minute run cannot be replayed from it. | The capability bit advertises a feature that cannot be delivered, which is worse than not having it. | Define `RECONNECT` precisely as **restart the current attempt from its first frame** by replaying the retained input log, and state the retention requirement (attempt length ≤ `THP_HISTORY_SLOTS` frames, or checkpoint). Or delete the capability until it is implementable. |
| 9 | **Late join.** `WELCOME.start_frame` exists; nothing acquires state at that frame. | Same wall as 8. | Out of scope for v1, but say so explicitly rather than leaving `start_frame` looking like an invitation. |
| 10 | **Host migration.** Both references are host-centric; THP has no `TRANSFER_HOST`. | A host crash ends the run with no recovery path at all. | Declared non-goal for v1; write it down. |
| 11 | **Match structure.** Rounds, best-of-N, character or side swap between stages, per-stage seed rollover. TH08's `stageRngSeed` implies a per-stage seed; THP has one seed per run and only `RESYNC` changes it. | A Touhou *match* is not a run, and the platform's noun is a match. | New runs already exist (`run_id`, `START`); state that a match is a sequence of runs and that stage rollover is a new `START`, not a seed update. |
| 12 | **Multi-stream RNG seeding.** D1. | TH07. | `seed_slots` + a KDF callback. |
| 13 | **Frame-rate drift.** Nothing ties a frame to a period (§4 item 7). | Two peers at 60.0 and 58.5 fps stay bit-identical while their latency grows without bound and no timeout fires. | A `THP_KEEPALIVE`-carried nominal frame period, and a UI warning on divergence between offered and confirmed rate. |
| 14 | **Authentication / endpoint pinning.** Declared a non-goal (§1.1) and correctly so — the address channel is closed in this project. But `client_nonce` / `host_nonce` are exchanged, echoed, and then **never used for anything**; there is no transcript binding. | A field that looks like a defence and is not one is worse than no field. | Either use the nonce pair to bind the session (echo `host_nonce` in every packet, reject mismatches — which also fixes stale packets from a previous session, currently unvalidated) or delete it. |

---

## 11. Consolidated flaw list

Fifteen flaws. Nine reproduce by execution (F1, F2, F3, F4, F5, F6, F7, F8, F9); six are
derived from reading plus upstream citations (F10–F15, F20–F21, F12, F18, F19).

| # | flaw | where | fix | reproduced |
|---|---|---|---|---|
| F1 | `thp_store_local_hash` returns `MATCH` when nothing was pending | `thp_profile.h:435-459` | add `THP_HASH_NOT_CHECKED`; add `hashes_computed/compared/dropped` and surface them | yes |
| F2 | single pending slot, silently overwritten; the victim then reports MATCH; the "generation" hardening in §8.4 does not exist | `thp_profile.h:404,463-490` | 4-slot pending ring; expire by watermark; bump a dropped counter; delete the claim from §8.4 | yes |
| F3 | `thp_resync_apply` clears `remote_inputs` but not `progress` | `thp_profile.h:868-903` | zero or rebase `remote_latest`/`remote_acked`; set `starved` for one frame | yes |
| F4 | "a v1.0 peer must keep working against v1.7" is false for every fixed-size packet | `thp_wire.h:864-867` + all decoders | split `thp_r_ok` (extensible) from `thp_r_exact` (INPUT, WELCOME) | yes |
| F5 | §3.3's version-mismatch dialogue is unreachable; `thp_negotiate`'s version branch is dead code | `thp_wire.h:910-913`, `thp_profile.h:717-720` | exempt `HELLO` in `HANDSHAKE` from the major check; fill the four range fields; add `THP_NEGOTIATION_ERROR_LOCAL` | yes |
| F6 | `THP_PROFILE_BLOB_MAX` is documented as a cap and enforced nowhere | `thp_wire.h:146,1064-1120` | check in both `thp_encode_welcome` and `thp_decode_welcome` | yes |
| F7 | "samples MUST be strictly increasing" is written on the struct and unenforced | `thp_wire.h:517-521,1187-1211` | validate order and duplicates in `thp_decode_input` | yes |
| F8 | `profile_id` names the game, not the profile revision | `thp_profile.h:66-69`, `thp_wire.h:405,431` | `profile_revision` in the existing reserved bytes of HELLO and NEGOTIATE | yes |
| F9 | collision figure is the per-pair model, ~2000× smaller than the birthday bound | spec §8.2 | quote the birthday bound (6.7e-4, ~1 in 1500 sessions); consider a wider digest | yes (arithmetically) |
| F10 | delay margin is a frame count used as a time; measured RTT is never consulted | `thp_wire.h:1437-1440` | `max(2*delay+4, rtt_frames+2)`; refuse beyond a named bound | yes |
| F11 | **repair cannot repair what the detector detects** | spec §8.7; `thp_profile.h:868-903` | restrict RESYNC to RNG/input-stream divergence, or redefine the cut as the attempt's first frame | no — derived from upstream §4.3 `[CODE]` |
| F12 | change-frame arithmetic fails for every decrease; no timeout, retry or convergence rule | `thp_wire.h:1437-1440`; spec §6.3 | `now + old_delay + new_delay`, clearing one RTT; re-send like RESYNC; expire stale proposals; bind ACK to `seq` | no — derived |
| F13 | TH06's coverage list hashes no inputs, violating §8.6's own "TH06's must" | `thp_profile_th06.h:154-165` | add `p{1,2}.input.current/previous`; assert it in the self-test | no — reading |
| F14 | `input_bits` and `seed_bits` are declared and never read by anything | `thp_profile.h:157-158` | enforce in `thp_decode_input`; echo in `START`; mask the seed on install | no — `grep` |
| F15 | FNV coverage `THP_FIELD_*` vocabulary exists, is complete, and is unused; the string and the digest can drift silently | `thp_profile.h:81-118` | coverage becomes an array of `thp_hash_field`; string generated from it | no — `grep` |
| F18 | a session can be negotiated with no synchronisation evidence and nothing says so | `thp_wire.h:289` | `thp_verification` enum on the session; `THP_VERIFY_ACTIVE` required before scoring | no |
| F19 | the guest's `required_caps` never reach the host | `thp_profile.h:743`; `thp_packet_start` | echo capabilities + profile revision in `START`; guest re-verifies | no |
| F20 | insane mode is specified three mutually contradictory ways | `thp_profile_th06.h:86-96`; `ADAPTERS.md:102,110` | one in-band button bit; delete `TH06_EV_INSANE_MODE`; fix `ADAPTERS.md` | no |
| F21 | `GAMEPLAY` rides outside the redundancy window; a lost event is an unrecoverable desync; late events are unspecified | `thp_wire.h:561-574`; spec §5.2 | widen `thp_input_sample` to 8 bytes with a `be16 event`; restrict `GAMEPLAY` to out-of-band control | no |
| D1 | the profile models the RNG as one scalar width; TH07 has ≥6 streams | `thp_profile.h:158` | `thp_seed_slot[]` + a KDF callback | no — upstream §7.3 `[CODE]` |
| D2 | "one word per peer" is not TH06's or TH08's shape; the TH06 header comment describes a merged word that cannot be produced | `thp_profile_th06.h:48-53,193` | correct the comment; add `input_slots`/`input_merge` | no — upstream §1.2, §2.1 `[CODE]` |
| D3 | nothing says whether `thp_input_sample.frame` is a write-time or read-time label; the two references differ | spec §5.1 | state it is the **consumption** frame; producer applies the offset | no — upstream §3.1/§3.2 `[CODE]` |
| F16 | the protocol cannot say "this frame cannot advance"; no render-vs-simulation distinction | whole spec | `sim_frames_advanced`; hash on advanced frames; §1.3 non-goal on frame skip | no — upstream §2.4 `[CODE]` |

### Three patches I am not applying

F1, F3 and F4 are, in my judgement, correctness fixes rather than preferences. I am
withholding them because sibling lanes are mid-flight on the consumer of this API
(`InjectAuth` is editing `dll/src/net/lockstep.cpp` as of this dispatch) and a change to
a return value's meaning or to a decoder's acceptance set is exactly the kind of change
that lands as a phantom failure in someone else's lane. Exact patches, for whoever owns
the call sites:

```c
/* F1 — thp_profile.h. Add to the enum, value 0 so an existing == 0 test keeps
 * working only if the caller distinguishes it explicitly, which is the point. */
typedef enum thp_hash_verdict
{
    THP_HASH_NOT_CHECKED = 0,   /* no peer hash was pending; nothing was compared */
    THP_HASH_ABSENT,            /* STATE_HASH was not negotiated                  */
    THP_HASH_MATCH,
    THP_HASH_PENDING,
    THP_HASH_MISMATCH
} thp_hash_verdict;

THP_INLINE thp_hash_verdict thp_store_local_hash(thp_session *s, uint32_t frame,
                                                 uint32_t hash)
{
    uint32_t idx;
    thp_hash_verdict verdict = THP_HASH_NOT_CHECKED;   /* was THP_HASH_MATCH */
    ...
}

/* F3 — thp_profile.h, thp_resync_apply. */
    thp_be32_zero(&s->progress.remote_latest);
    thp_be32_zero(&s->progress.remote_acked);
    s->progress.starved = 1;   /* we genuinely do not know what the peer has */

/* F4 — thp_wire.h. */
THP_INLINE int thp_r_ok(const thp_reader *r)    { return r->ok && r->pos <= r->len; }
THP_INLINE int thp_r_exact(const thp_reader *r) { return r->ok && r->pos == r->len; }
/* thp_decode_input  and thp_decode_welcome  keep using thp_r_exact. */
/* Every other decoder switches to thp_r_ok. */
```

F4 in particular should ship as a MINOR bump with a changelog line, because it changes
which packets a v1.0 peer accepts.

---
## 11a. Spec-internal contradictions

Cheap to fix, expensive to discover, because an implementer following the document and
an implementer following the headers will build different protocols.

| # | contradiction | where | consequence |
|---|---|---|---|
| C1 | **`START`'s direction is stated three ways.** §2.3's table says `START` is `host → guest`. §4's lifecycle diagram draws it guest → host, annotated "guest refuses if either disagrees". §4.1 says "START echoes … back to the host" and "**the guest** MUST refuse to start." | spec `:148`, `:288-289`, `:309-314` | Two of the three say guest→host, and the payload (`run_id`/`start_frame`/`random_seed`/`input_delay`) is a commitment, not a notification. Follow §2.3 and you build a host-initiated START with no refusal path. The header's own comment — "START is the guest's commitment" (`thp_wire.h:469`) — sides with §4. Fix §2.3. |
| C2 | **`GAMEPLAY` size.** §2.5 lists the fixed part as **36**. `sizeof(thp_packet_gameplay)` is **40**, asserted at `thp_wire.h:1381`. | spec `:175` vs `thp_wire.h:573` | A 4-byte error in the one packet whose size is profile-extensible, in the table an implementer sizes buffers from. |
| C3 | **Flags table.** §2.4 lists `0x07` as "reserved, must be transmitted as zero." `0x07` is `ACK`, `NAK` and `FINAL` combined — all three defined bits. The header's `THP_FLAG_RESERVED` is `0xF8`. | spec `:163` vs `thp_wire.h:241` | The spec describes a reserved range containing three live flags. `thp_header_check` correctly rejects `0x07` set (`thp_wire.h:918`), which directly contradicts the flag table's meaning of the same value. |
| C4 | **"Under 700 bytes per frame at 60 Hz"** (§2.5) is not derivable from its own table — the per-frame packets total ~242 bytes — and `KEEPALIVE` is specified at **1 s** cadence (§10.3), not 60 Hz, so it is not a per-frame packet at all. | spec `:182` vs `:913` | Harmless numerically, misleading as a budget derivation. |
| C5 | **`RESYNCING` is not representable.** The state table says `RESYNCING` is entered when "RESYNC armed". `thp_resync_state` distinguishes `PROPOSED` from `ARMED` — host-sent vs both-committed — and `thp_resync_block` (`:824-834`) holds that, but **`thp_resync_block` is not a member of `thp_session`** (`:383-407`) and `thp_session_init` never touches one. | spec `:303`; `thp_profile.h:383-407,824-834` | The resync state machine §8.7 describes cannot be stored in the reference session block. An adapter must invent the storage and two adapters will invent different ones. Add `thp_resync_block resync;` to `thp_session` — 14 bytes of a host-side struct that is never serialised. |
| C6 | **`ADAPTERS.md` overstates completion.** The work inventory lists "Session state machine — **Done**" for `thp_profile.h`, while the same file's §5 says transport does not exist and §8.7's state machine is unrepresentable (C5). It is *partial*. | `ADAPTERS.md:277` | Given this project's history with over-optimistic status, an inventory reading "Done" for something structurally incomplete is worth correcting on its own. |
| C7 | **`thp_resync_plausible`'s comment misdescribes its own comparison.** It says THP "uses the same expression with a slightly larger margin" than TH06 — true, but TH06's is `+2` and THP's is `+4`, while the comment reads as though the two expressions are identical. | `thp_profile.h:836-845` | Low. Worth one clarifying clause. |

---

## 12. What is genuinely sound, and should not be touched

A review that lists only defects misrepresents the design. These parts are right, the
reasoning is right, and I would argue against changing any of them:

- **§2.6, byte arrays as network-order storage.** Correct, and the three consequences it
  draws are all genuinely true. The `thp_octetNN`-named-by-width rule exists because a
  real `HELLO` grew to 132 bytes, and the rule is the fix.
- **`THP_STATIC_ASSERT(sizeof(thp_session) > THP_MAX_PACKET)`** — "a `thp_profile`
  (which holds host pointers) can never appear in a packet" — is one line that forecloses
  a whole category of mistake.
- **§8.4's deferred comparison.** Correct, load-bearing, and correctly argued. An
  implementation that dropped those comparisons would disable desync detection under
  exactly the latency conditions it exists to catch.
- **§8.1's table of what each other signal proves.** Correctly judged. "Both HUDs look
  the same → both are rendering something" is the right level of contempt.
- **§3.4, `VERSION_MISMATCH` vs `BUILD_MISMATCH`.** One error string for two different
  user actions is a real defect, and the fix is right.
- **§6.2, `max()` at connect.** Deterministic, commutative, one round trip, and a real
  improvement on TH06's unconditional adopt (`src/ConnectionUI.cpp:544`).
- **§6.3, agreeing on the delay *and the frame it takes effect at*.** The right fix for
  TH06's independent per-peer M/N, which upstream confirms is host-precedence rather than
  merely unsynchronised — so it desyncs in a way TH06's weak detector hides for a long
  time.
- **§9.3's "if a peer can compute it, do not send it."** The rule is right (the
  mechanism carrying it is not — F21).
- **§5.2's contiguity rule** — "emitting a sample for a frame the sender no longer has
  would be a fabricated input" — is exactly right, and §5.5's refusal to overwrite a
  contradictory input is the right call even though the failure mode is harsh.
- **`ADAPTERS.md` §1's demolition of the retired 152-byte `protocol.h`** — size-identical
  and semantically incompatible — is the correct argument for the profile split, made
  from the right evidence.
- **The honesty discipline.** §8.6, §11.2 and `ADAPTERS.md` §5's "no game has been
  launched and no two peers have been run against each other" are worth more than most
  specifications of this size contain. §8.6 needs six items added (§4 above) but its
  *stance* is the thing to keep.

---

## 13. Bottom line

The protocol is a good skeleton with three missing load-bearing ideas and a reporting
API that cannot be trusted to tell the truth about whether it checked anything.

If I could make three changes and nothing else:

1. **Make a `MATCH` mean a comparison happened** (F1, F2, F18). Ship
   `hashes_compared` and put it in the UI. This is the change that most directly serves
   the standard this project set for itself after retracting a synchronisation claim.
2. **Decide what repair means** (F11). Either say plainly that RESYNC repairs RNG-stream
   divergence and nothing else, or redefine the cut as the attempt's first frame and
   make it provably convergent. Do not ship the current state, where the detector is
   strong and the repair is inherited from a design whose detector was weak enough for
   it to work.
3. **Say what a frame is and let the frame not advance** (D3, F16). One sentence in §5.1
   and a `sim_frames_advanced` counter. Without them, the two references' single most
   important mechanism — the stall — has no representation in THP, and the two things
   that most commonly cause a silent desync (frame skip, and reading the processed input
   word instead of the raw poll) are both invisible.

None of these is a redesign. All three fit inside the existing wire format. F4 and F6
are one-line fixes. F8 and F19 fit in existing reserved bytes. The rest are `thp_profile`
and `thp_session` members — host-side structs the header already promises are never
serialised, which is exactly the property that makes them cheap to change.
