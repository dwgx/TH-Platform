# THP-DEBUGKIT-20261002 — report

Lane: DebugKit
Scope: `D:/Project/TH-Platform/tools/th-debug/**`, this report.
Out of scope and untouched: `D:/Project/TH08-Platform/**`, `D:/Project/TH-Platform/src`,
`D:\Game\Touhou\**`, and the originals in `%TEMP%\thp\`.
No git add / commit / push was run. No game executable was launched.

## STATUS: DONE

---

## 1. What was delivered

```
tools/th-debug/
  README.md                      bilingual, covers everything the brief asked for
  .gitignore                     ignores thp_input.exe
  ThDebug.psm1                   shared Win32 P/Invoke + the single th08.cfg writer
  force_windowed.ps1
  launch_windowed.ps1
  verify_gate_live.ps1
  verify_gate_human.ps1
  input_helper/
    THPInput.cs
    build.ps1
    thp_input.exe                built, not committed
```

Originals in `%TEMP%\thp\` were **copied, not moved**. `cmp` confirmed
`THPInput.cs` was byte-identical to the source before I edited it.

---

## 2. Acceptance evidence

### 2.1 The build (the brief's named command)

```
$ pwsh -NoProfile -File D:/Project/TH-Platform/tools/th-debug/input_helper/build.ps1

csc   : C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\Roslyn\csc.exe
src   : D:\Project\TH-Platform\tools\th-debug\input_helper\THPInput.cs
out   : D:\Project\TH-Platform\tools\th-debug\input_helper\thp_input.exe
refs  : C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8

Microsoft (R) Visual C# Compiler version 4.14.0-3.26364.8 (3f384626)
Copyright (C) Microsoft Corporation. All rights reserved.

BUILD OK: D:\Project\TH-Platform\tools\th-debug\input_helper\thp_input.exe (9728 bytes)
EXITCODE=0
```

### 2.2 Parse check (no script was executed)

```
$ [System.Management.Automation.Language.Parser]::ParseFile(...)

force_windowed.ps1                 parse errors = 0
input_helper\build.ps1             parse errors = 0
launch_windowed.ps1                parse errors = 0
ThDebug.psm1                       parse errors = 0
verify_gate_human.ps1              parse errors = 0
verify_gate_live.ps1               parse errors = 0

files parsed: 6   TOTAL PARSE ERRORS: 0
```

The three game-launching scripts were **never executed**. To show the
parameter blocks are real without running the bodies I used `Get-Command`
(which parses but does not invoke); it exposed `-ConfirmWindows` on all three
launching scripts, plus every machine-specific path as a named parameter.

---

## 3. Two real defects found, both pre-existing

### 3.1 The `%TEMP%` source did not compile

The first build of the copied source failed:

```
tools\th-debug\input_helper\THPInput.cs(139,14): error CS1061:
  'THPInput.INPUT' does not contain a definition for 'ki'
tools\th-debug\input_helper\THPInput.cs(141,14): error CS1061: (same)
```

I checked this was not something I introduced, by building the untouched
original:

```
$ pwsh -NoProfile -File "C:\Users\dwgx1\AppData\Local\Temp\thp\input_helper\build.ps1"
C:\...\THPInput.cs(136,14): error CS1061: 'THPInput.INPUT' does not contain a definition for 'ki'
C:\...\THPInput.cs(138,14): error CS1061: 'THPInput.INPUT' does not contain a definition for 'ki'
Exception: csc failed: 1
EXITCODE=1
```

**The original is broken too.** `THPInput.cs` calls `d[0].ki`, but the keyboard
payload lives in the union: it must be `d[0].u.ki`. The `thp_input.exe` sitting
in `%TEMP%` was built from an *earlier revision* of the source; the source was
edited afterwards and the edit broke it. Anyone rebuilding from source in `%TEMP%`
today would have hit this and probably concluded the tooling was unrecoverable.

Fixed at lines 139-141 of the repo copy. The rebuilt binary is **9728 bytes,
byte-for-byte the same size as the known-good `%TEMP%` exe**, which is what you
would expect if the one-character-class fix restores the original.

### 3.2 The "confirm we did not disturb anything else" check was a tautology

`force_windowed.ps1` ended with:

```powershell
$b[$OFFSET] = 1
[System.IO.File]::WriteAllBytes($cfg, $b)
$rb = [System.IO.File]::ReadAllBytes($cfg)
...
for ($i=0; $i -lt $SIZE; $i++) { if ($b[$i] -ne $rb[$i]) { $diff++ } }
Write-Host "bytes differing after write: $diff (must be 0 -- already written in memory)"
```

It compared `$b` — **already mutated in memory** — against the file, so the
count could only ever be 0 and the check could never fail. It was a safety
check that reported success unconditionally.

Now the pre-write bytes are snapshotted and the assertion is real: exactly one
byte may differ from what was on disk, and it must be offset 34. This is the
WORKFLOW §6 lesson ("仪器坏了报成结论" / a broken instrument reported as a
conclusion) reproduced inside a verification step.

---

## 4. Cleanup performed on each moved script

### Hardcoded paths → parameters

| Script | Was | Now |
|---|---|---|
| `force_windowed.ps1` | `D:\Game\Touhou\[th08] 东方永夜抄 (日文版)\th08.cfg` inline | `-CfgPath` (default = that value, documented as machine-specific) |
| `launch_windowed.ps1` | same cfg, `$exe`, `$peerExe`, both working dirs, loader, log dir, port `7480`, title filter inline | `-CfgPath -HostExe -PeerExe -HostWorkDir -PeerWorkDir -Loader -LogDir -ListenPort -TitleLike` |
| `verify_gate_live.ps1` | same cfg, game exe, work dir, dll path (with a hardcoded temp fallback), loader, log dir, port, 25×2 s watch loop inline | `-CfgPath -GameExe -GameWorkDir -DllPath -Loader -LogDir -ListenPort -WatchSeconds` |
| `verify_gate_human.ps1` | same, plus `TH08_PLATFORM_TEST_INPUT = '0x0001'` hardcoded and `0x017CE8B4` hardcoded inline | adds `-Input` and `-CurStateAddr` |
| `input_helper/build.ps1` | `$env:TEMP\thp\input_helper` hardcoded, csc and reference paths hardcoded | builds next to the script by default; `-Csc -FrameworkDir -OutputExe` |

The CJK install path was the brief's named concern and is now a parameter whose
default is documented as a machine-specific fact.

### Comments describing superseded approaches — deleted

- `force_windowed.ps1`: the "the earlier attempt wrote byte 17, that was wrong"
  narrative. The *fact* that the layout is validated so the offset is proven
  survives; the archaeology does not.
- `launch_windowed.ps1`: "Previous attempts moved a window handle but never
  checked the mode", and the six-line byte-34 essay that duplicated
  `force_windowed.ps1` verbatim. It now calls the shared function.
- `verify_gate_human.ps1`: the claim that `SendInput` "would steal focus, which
  the owner forbids". That was true before `thp_input.exe` existed. Rewritten to
  state the current arrangement: two input paths exist, this script uses the DLL
  override precisely because it takes no focus, and `thp_input.exe` is the
  real-key path.
- `verify_gate_live.ps1`: "The owner authorised driving the game with Z / arrows
  this session" — session state, not documentation.

### Duplication removed

The same `user32`/`kernel32` P/Invoke block was copy-pasted into three scripts
under three different namespaces (`W9.D`, `PG.W`, `PB.W`), and the byte-34 write
was copy-pasted into four. That is four copies of the exact logic whose offset-17
version was silently wrong, which is how the offset-17 bug survived.

Both now have exactly one home: `ThDebug.psm1`. Every script calls it.

### A latent bug removed

`verify_gate_human.ps1` declared `Add-Type -Namespace PB -Name M` **twice** —
once at line 71 before `Read-CurState`, then again verbatim at line 103 after
the watch loop. The second call always errors with "type name already exists";
it survived only because `$ErrorActionPreference` was `'Continue'`. Removed.

### Added, deliberately

`-ConfirmWindows` is now **mandatory** on all three game-launching scripts, per
`AGENTS.md` §7b ("要跑游戏冒烟必须过 `-ConfirmWindows`"). None of the originals
had it. Each throws with a clear message if omitted. Focus is never taken: all
window moves use `SWP_NOACTIVATE` and the owner's foreground handle is captured
before launch and restored after.

---

## 5. Verification beyond the acceptance command

The acceptance gate can return a failing result, and it does. Evidence:

**The compiled binary has the correct 40-byte `INPUT`.** Read out of the built
exe by reflection, so this is a property of the shipped binary, not of my
reading of the source:

```
Struct sizes read out of the COMPILED binary:
  INPUT          = 40 bytes (expect 40)  OK
  INPUTUNION     = 32 bytes (expect 32)  OK
  KEYBDINPUT     = 24 bytes (expect 24)  OK
  MOUSEINPUT     = 32 bytes (expect 32)  OK
  HARDWAREINPUT  =  8 bytes (expect  8)  OK

Field offsets that decide the layout:
  INPUT.type@ 0   INPUT.u@8
  UNION.mi@0 UNION.ki@0 UNION.hi@0  (all zero => overlaid)

SendInput will reject INPUT unless size == 40. mismatches = 0
VERDICT: INPUT is exactly 40 bytes; SendInput cannot fail with error 87 on this struct.
```

**The exe loads and runs.** Invoked with no args and with an unknown subcommand
only — neither reaches `SendInput`, so no keystroke was sent to the owner's
desktop:

```
$ thp_input.exe
usage: thp_input focus|tap|seq|click ...
EXITCODE=2
$ thp_input.exe zzz
unknown command zzz
EXITCODE=2
```

**`Set-Th08Windowed` refuses bad input.** Run against synthetic 60-byte files in
a scratch directory — the real `D:\Game\Touhou\th08.cfg` was never opened or
written:

```
--- NEGATIVE 1: wrong version magic ---
  REFUSED: th08.cfg layout does not validate against the game defaults. Refusing to write: offset 34 would be a guess.
  byte34 = 0 (must be 0)
--- NEGATIVE 2: padXAxis 601 instead of 600 ---
  REFUSED: th08.cfg layout does not validate against the game defaults. ...
  byte34 = 0 (must be 0)
--- NEGATIVE 3: already windowed but layout invalid (early return must NOT bypass validation) ---
  REFUSED: th08.cfg layout does not validate against the game defaults. ...
--- POSITIVE: valid + windowed=0 writes exactly one byte ---
  changed=True bytes differing=1 at [34] (expect True, 1, 34)
```

The byte-diff assertion in §3.2 fired for real during development: before the
fix it reported `write changed 0 bytes, expected exactly 1` on the valid path.
That is the check working.

**Wrong-size file refused:**

```
  REFUSED: th08.cfg is 59 bytes, not 60. The game rejects any other size, so every offset here would be a guess. Refusing to write.
```

**`build.ps1` parameters work, and a bad toolchain path fails loudly:**

```
$ ... build.ps1 -OutputExe "$TEMP/thp_paramtest/thp_input.exe"
BUILD OK: C:\...\Temp\thp_paramtest\thp_input.exe (9728 bytes)   EXITCODE=0

$ ... build.ps1 -Csc 'C:\nope\csc.exe'
missing: C:\nope\csc.exe                                          EXITCODE=1
```

**Module wiring resolves for all four scripts** (`Import-Module (Join-Path
$PSScriptRoot 'ThDebug.psm1')` — checked statically, scripts not executed):
all `True`.

---

## 6. Explicitly NOT verified

- **`launch_windowed.ps1`, `verify_gate_live.ps1`, `verify_gate_human.ps1` were
  never executed.** Forbidden in this lane, and they launch the game. Their
  syntax, parameter blocks and module wiring are verified; their runtime
  behaviour against a live th08 is `[UNVERIFIED]`.
- **`force_windowed.ps1` was not executed** either, per the brief. The function it
  wraps is fully verified in §5; the wrapper's own glue is parse- and
  parameter-verified only.
- **No claim is made here that th08 multiplayer is synchronized.** Nothing in this
  lane bears on that question, and per §7 of the README, connecting proves
  nothing.
- `thp_input.exe tap` / `seq` / `click` were **not** run. Those send real
  keystrokes to whatever window is focused; the owner is at this machine.

---

## 7. Open items for the owner

1. **The junction story is stale.** `C:\th08game` and `C:\th08game_p` exist only
   because the loader could not read a CJK path. `docs/WORKFLOW-20261002.md`
   §1.1 says the loader's wide-char entry point is fixed. The defaults in these
   scripts still point at the junctions. They are documented as scaffolding; if
   the loader really is fixed, the defaults should move to the real path and the
   junctions should be deleted. That is a decision, not a cleanup.
2. **The README claims 6 parsed files, 0 errors.** True at the time of writing;
   re-run §2.2 if you add scripts.
3. `%TEMP%\thp\` still holds the old tooling, including the broken
   `THPInput.cs`. Nothing was deleted, per the brief. Once this lane is
   accepted, that directory is the thing most likely to be cleaned up by
   someone — and it is now fully superseded by `tools/th-debug/`.