# THP-PROTO-BUILD-20261002 — verification receipt for the THP protocol lane

**Verdict: ok.** Compiles clean under three toolchains, 624 runtime checks pass.

**No game was launched.** Not once, in this lane. No `th06.exe`, no `th08.exe`,
nothing read from or written to `D:\Game\Touhou`. No window was opened on the
owner's desktop.

---

## 1. Deliverables

| Path | What |
|---|---|
| `D:/Project/TH-Platform/docs/protocol/THP-PROTOCOL-v1.md` | The specification. 12 sections, 44 KB. |
| `D:/Project/TH-Platform/docs/protocol/THP-PROTO-BUILD-20261002.md` | This file. |
| `D:/Project/TH08-Platform/protocol/thp_wire.h` | Core packet layouts, enums, bounds-checked codecs. 43 static asserts. |
| `D:/Project/TH08-Platform/protocol/thp_profile.h` | Profile abstraction, hash ring, deferred comparison, negotiation, resync. 9 static asserts. |
| `D:/Project/TH08-Platform/protocol/thp_profile_th06.h` | TH06 profile. 1 static assert. |
| `D:/Project/TH08-Platform/protocol/thp_profile_th08.h` | TH08 profile. 3 static asserts. |
| `D:/Project/TH08-Platform/protocol/thp_selftest.c` | The translation unit that fires every assert, plus 624 runtime checks. |
| `D:/Project/TH08-Platform/protocol/ADAPTERS.md` | Packet-by-packet TH06 and TH08 mapping. |

No existing file was modified. No git write of any kind.

---

## 2. Acceptance, verified

### 2.1 `gcc -std=c11 -Wall -Wextra -c`, zero warnings

Run under WSL Ubuntu 24.04 (`clang` is not installed on this machine; the brief
permits gcc in that case).

```
$ wsl -d Ubuntu-24.04 -- bash -lc "cd /mnt/d/Project/TH08-Platform/protocol && \
    gcc -std=c11 -Wall -Wextra -c thp_selftest.c -o /tmp/thp_selftest.o"

### gcc --version
gcc (Ubuntu 13.3.0-6ubuntu2~24.04.1) 13.3.0

### COMMAND: gcc -std=c11 -Wall -Wextra -c thp_selftest.c -o thp_selftest.o
EXIT=0
```

**No output between the command line and `EXIT=0`.** Zero warnings, zero errors,
with `-Wall -Wextra`.

### 2.2 Linking and running the self-test

```
$ wsl -d Ubuntu-24.04 -- bash -lc "cd /mnt/d/Project/TH08-Platform/protocol && \
    gcc -std=c11 -Wall -Wextra -o /tmp/thp_selftest thp_selftest.c && /tmp/thp_selftest"

COMPILE_EXIT=0
THP selftest: all 624 checks passed
RUN_EXIT=0
```

### 2.3 `g++ -std=c++11 -Wall -Wextra`, zero warnings

The 32-bit MSVC DLL consumes these headers as C++20, so a C++ build is not
optional.

```
$ g++ -std=c++11 -Wall -Wextra -I. -c /tmp/thp_cpp.cpp -o /tmp/thp_cpp.o
CPP_OK
```

### 2.4 MSVC x86 `/W4 /std:c11` — the DLL's actual ABI

```
$ cl /nologo /W4 /std:c11 /c /I"D:\Project\TH08-Platform\protocol" \
      /Fo"sel32.obj" msvc_selftest.c
msvc_selftest.c
MSVC_EXIT=0
```

Clean at `/W4`. `cl.exe` is
`VS 18 Community \VC\Tools\MSVC\14.51.36231\bin\Hostx64\x86\cl.exe`, i.e.
genuinely 32-bit output, which is the only shape the DLL cares about.

### 2.5 Every struct carries a size assertion

| File | `THP_STATIC_ASSERT` count |
|---|---|
| `thp_wire.h` | 43 |
| `thp_profile.h` | 9 |
| `thp_profile_th06.h` | 1 |
| `thp_profile_th08.h` | 3 |
| `thp_selftest.c` | 24 |
| **total** | **80** |

### 2.6 Spec sections required by the brief

`THP-PROTOCOL-v1.md` contains, as named sections:

- **§2 Framing** (+ byte-order structure, §2.6)
- **§3 Versioning** (+ what happens when an old peer meets a new one, §3.3)
- **§5 Input synchronisation** (+ redundancy window, §5.2; acknowledgement
  model, §5.3)
- **§6 Input delay negotiation** (host proposal §6.2, guest accept/negotiate
  §6.2, range §6.1, runtime two-phase §6.3)
- **§7 RNG seeding** (authority §7.1, boundary §7.2, effective width §7.3)
- **§8 State hashing** (+ **§8.6 what a match does and does not prove**)
- **§9 Capability negotiation**

Plus §4 session lifecycle, §8.7 repair, §10 error model.

### 2.7 `ADAPTERS.md` maps both games packet-by-packet

`ADAPTERS.md` §2.1 is an 18-row TH06 concept→THP table, every row with a
`file:line` citation into the pinned clone. §3.1 is a 17-row TH08 table, same.
Both sections state what is verbatim, what is adapted, and what is genuinely new.

---

## 3. The assertions earned their keep

Not decorative. During development they caught six real defects:

| # | Caught | How |
|---|---|---|
| 1 | `HELLO` had silently grown to **132 bytes** | `thp_octet32`/`thp_octet64` are fixed-width arrays, so using them where a 4-byte integer was meant added 85 bytes. Found by measuring, not by reading. |
| 2 | `thp_profile` size assertion was **LP64-only** | It failed the 32-bit MSVC DLL build. Now asserted per ABI (80 / 52). |
| 3 | Four hand-computed sizes were wrong | `HELLO` 47→76, `START` body 36→16, `resync_block` 16→14, `th06_start_blob` 30→48. |
| 4 | `THP_INPUT_MAX_SIZE` asserted 150, actually 130 | The comment and the arithmetic disagreed. |
| 5 | **`thp_header_check` read 24 bytes of a 20-byte header** | It walked the prefix as three 32-bit words instead of `4+2+2+2+2+4+4`. Found by the round-trip test asserting a *valid* header is accepted — not by the rejection tests, which all passed. |
| 6 | `_Alignof` is not C++ | Caught by the `g++` build. Now `THP_ALIGNOF`. |

Defect 5 is the argument for keeping the positive assertion. Every "reject the
bad packet" test passed while the validator was wrong, because a validator that
rejects everything also rejects bad packets.

---

## 4. What the self-test actually exercises

624 runtime checks, in 13 groups:

| Group | Checks | Covers |
|---|---|---|
| header round-trip | 8 | encode → byte-level wire inspection → decode |
| header rejection | 8 | short, wrong magic, wrong major, wrong type, non-zero reserved, length mismatch, and **one valid header accepted** |
| `INPUT` round-trip | 12 | full encode/decode, big-endian byte inspection, **truncated datagram rejected** |
| `DISCONNECT` + `RESYNC` | 9 | round-trip of both, desync frame carried in `detail` |
| hash ring | 8 | deferred `PENDING` resolution, `MISMATCH`, `ABSENT`, 256-frame wrap non-aliasing |
| input history | 12 | redundancy window order, contiguity stop, idempotent re-insert, contradictory re-insert rejected |
| delay negotiation | 10 | `max()` commutativity, clamping, change-frame margin, resync plausibility window |
| capabilities | 6 | mandatory sufficiency, core/profile mask separation |
| negotiation | 6 | accept, `BUILD` / `PROFILE` / `VERSION` / `CAPABILITY` rejections |
| resync | 8 | clears hash ring, clears remote inputs, clears desync frame, installs seed, returns to `RUNNING` |
| hash primitive | 7 | FNV-1a four-fold multiply, determinism, bit-exact float hashing |
| profiles | 12 | delay ranges legal, coverage published, profile ids, capability halves, blob size |
| hash cadence | 5 | cadence holds near the `u32` frame wrap |

---

## 5. Claims about upstream projects — provenance

Every upstream claim in the spec and in `ADAPTERS.md` cites `file:line` into a
clone pinned by commit. Both trees were cloned read-only into
`%TEMP%/thp/`; neither was modified; no game was launched from either.

| Project | Commit | Verified by reading source |
|---|---|---|
| `RUEEE/th06_multi_net` | `fd64f9f01698ca336de803d753baa2ca4e7d9131` | yes — `Connection.hpp`, `Controller.cpp`, `Supervisor.cpp`, `ConnectionUI.cpp`, `Rng.hpp/.cpp`, `GameManager.cpp`, `Player.cpp`, `LICENSE`, `README.md` |
| `koishikois259/th08-multi` | `934977483e7d64f8b192b86d43d21886c318eaa9` | yes — `MultiNetProtocol.hpp/.cpp`, `MultiNetSession.cpp`, `MultiPlayerState.cpp`, `MultiPlayerRuntime.cpp`, `MultiPlayerCoordinator.cpp`, `AGENTS.md` |

Two claims I verified in source rather than taking from a report, because they
load the design:

- **TH06's desync check is one line** — `src/Controller.cpp:771`, read in full
  context. It compares a `u16` seed. There is no hash, CRC or checksum anywhere
  in TH06's sync path.
- **th08-multi exits the process on desync** — `src/MultiNetSession.cpp:609-610`
  followed through to `src/Supervisor.cpp:131-146`. No resync exists in the game
  source.

Cross-checked against the two capability inventories that landed mid-task
(`THP-TH06-CAPABILITIES-20261002.md`, `THP-TH08-CAPABILITIES-20261002.md`) and
against the parent agent's independent re-verification. Where the inventories
flagged something as an inference rather than code, this spec says so too.

---

## 6. What is NOT verified — stated plainly

- **No game was launched.** No `th06.exe`. No `th08.exe`. No `D:\Game\Touhou`
  access of any kind.
- **No two peers have been run against each other.** Everything here is a
  specification plus a codec that round-trips its own output. **Whether two real
  games synchronise under THP is unproven.** That is the next lane's job, and
  its evidence must be a state-hash log from a real two-instance run — not a
  green test suite, not a `peer connected` line, not an attract demo.
- `compute_state_hash`, `blob_encode` and `blob_decode` are deliberately `NULL`
  in both profiles. They are game-adapter code belonging to the DLL lane;
  `ADAPTERS.md` §2.4 and §3.4 specify exactly what each must read and write.
- The `thp_session` transport side (UDP, retry, RTT) is **not** implemented. The
  header is the wire contract and a reference state machine; no socket code was
  written in this lane.

---

## 7. Notes for the next lane

1. **`thp_profile` is host-ABI dependent** (80 bytes LP64, 52 ILP32) because it
   holds function pointers. It is never serialised. If you ever find yourself
   wanting to put one in a packet, that is the bug.
2. **`hash_coverage` is a string constant**, not a runtime option. If you change
   what is hashed, change the string with it. They are a pair and they will drift
   silently otherwise — that is the whole reason the string exists.
3. **Measure struct sizes, do not compute them.** Four of the six defects in §3
   were hand-computed sizes.
4. **The TH06 profile's advantage is `Rng::generationCount`** — a `u32` draw
   counter TH06 maintains and never sends (`src/Rng.hpp:11`). It costs nothing to
   hash and catches what the seed alone cannot. TH08 has no equivalent, so its
   coverage string omits it rather than faking one.
5. **Read spec §8.6 before claiming anything about synchronisation.** This
   project retracted one such claim already. The section exists so the next claim
   does not have to be retracted.