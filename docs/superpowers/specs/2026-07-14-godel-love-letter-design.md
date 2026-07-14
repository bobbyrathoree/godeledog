# The Hole in Every Map — Love-Letter Upgrade (Design Spec)

**Date:** 2026-07-14
**Status:** awaiting owner approval
**Owner's brief:** striking, mesmerizing, a bit unsettling — "blow me away." Intuitive and visually
easy to understand; text simple but not too simple. The whole repo a love letter to Kurt Gödel.
Trees as the guiding motif. His life story woven in naturally.

---

## 1. Thesis

The page already *argues* the theorem. The upgrade makes the visitor **touch** it (instruments that
really compute), **see** it (trees — which formulas, proofs, and axiom systems literally are), and
**feel** it (Gödel's life told as a single tree that grows down the page and cannot close its own
crown). The tree is the theorem *and* the biography: a consistent line trying to grow tall enough
to contain everything, and never quite able to.

Design language is unchanged: ink `#07070a`, bone `#eee9dc`, cyan `#77e6ef`, ember `#ff3f54`,
sulfur `#d9ff57`; condensed sans display, old-style serif body, mono labels. Ember is reserved for
self-reference and rupture.

## 2. Final page arc

| # | Section | Status | Life-tree chapter |
|---|---------|--------|-------------------|
| 1 | Hero | existing + dedication line | **ROOTS — 1906 · Brünn** |
| 2 | Orientation | existing, copy simplified | **1924 · Vienna** |
| 3 | **The Numbering Table** | NEW instrument | **Sept 1930 · Königsberg** (ember) |
| 4 | The Self-Reference Engine (7 steps) | existing + Two Mirrors (step 03), copy simplified | **1931 · The Sentence** (step 02), **1940 · Eastward** (step 06), **Princeton · The Walks** (step 07) — opened by `updateStep`, not scroll |
| 5 | **The Proof Grove** (MIU engine) | NEW instrument | **1947 · The Loophole** |
| 6 | **The Room With No Door** | NEW pinned descent | **1949 · A Universe With No Door** (ember) |
| 7 | Epilogue | existing + **The Self-Audit** | **CROWN — 1978 · The Last Winter** (ember; crown left unfinished, one branch curling back to the trunk) |
| 8 | Footer | + dedication | — |

Chapter years run monotonically down the page: 1906 → 1924 → 1930 → 1931 → 1940 → 1947 → 1949 → 1978.

## 3. Features

### 3.1 The Life-Thread — biography as a growing tree

**Concept.** One continuous trunk runs the full page height in a fixed left rail. Branches are life
chapters, each placed beside the mathematics it rhymes with. Roots splay at the top (hero). The
crown at the bottom is deliberately unfinished — two open branches and one that curls back to touch
the trunk (self-reference), with an ember gap-dot pulsing where the closing branch should be.

**Placement.**
- Desktop (≥1050px): `<aside class="life-thread">`, fixed, left, ~64–76px wide, `z-index:3`
  (above the background canvas, below the masthead). SVG `viewBox="0 0 120 2400"`,
  `preserveAspectRatio="xMidYMin meet"`.
- Chapter labels (year chip + 1–3 sentences) are **real HTML**, absolutely positioned alongside
  their branch, so site typography applies and text wraps. On desktop they sit in the left gutter;
  hover/focus expands the full text (year chip always visible).
- Mobile (<1050px): rail collapses to a 3px trunk line; chapters render **inline** as
  `<aside class="life-node">` blocks between sections (year chip + text + 24px branch glyph).
  These inline nodes are also the semantic/screen-reader source of the story on all viewports.

**Mechanics.**
- Trunk draws with scroll: `strokeDasharray = strokeDashoffset = getTotalLength()`, then a passive
  scroll listener inside `requestAnimationFrame` maps page scroll progress → dashoffset.
- Branches open via one IntersectionObserver on the host sections
  (`rootMargin: '-30% 0px -30% 0px'`) toggling `.is-open`: twig dash-draws (900ms, `--ease-out`),
  leaf dot and label fade in.
- The three machine chapters are opened by the engine, not scroll — in `updateStep`:
  `{1:'paper', 5:'escape', 6:'walks'}` → `.branch-node[data-chapter=…].is-open`. The math beat and
  the life beat land on the same click.
- Motion-off / reduced-motion: trunk fully drawn, all branches open, no scroll coupling.

**Bridge caption** near the roots (mono, dim) — the honest justification for the motif, no invented
quote: `A FORMULA IS A TREE. A PROOF IS A TREE. A SYSTEM GROWS FROM ITS AXIOMS LIKE ROOTS.`

**Chapter copy (final, verified — see §5):**

- **ROOTS — 1906 · BRÜNN** — "A boy asks *why?* so often his family calls him **der Herr Warum** —
  Mr. Why. A childhood fever leaves him certain, for life, that his own body can't be trusted.
  Both roots are here."
- **1924 · VIENNA** — "He sits with the sharpest logicians alive. By 1929 he has proved logic can
  reach every truth its models share — then turns to the truths a system can never prove about
  itself."
- **SEPT 1930 · KÖNIGSBERG** *(ember)* — "He remarks, almost in passing, that arithmetic holds
  truths it can never prove. Almost no one hears it. The next morning, in the same city, Hilbert
  tells the world: *'We must know — we will know.'* He has already been answered. The trick behind
  it is the one in your hands now: **give every sentence a number.**"
- **1931 · THE SENTENCE** *(machine step 02)* — "He writes it down. A sentence learns to say *no
  proof of me exists.* The map now shows its own hole."
- **1940 · EASTWARD, TO GO WEST** *(machine step 06)* — "With Adele — a dancer he loved against
  his family's wishes — he flees the war the long way: across Siberia, across the Pacific, to a
  quiet town called Princeton."
- **PRINCETON · THE WALKS** *(machine step 07)* — "Einstein says he comes to the Institute mostly
  'for the privilege of walking home with Gödel.' Down paths lined with trees, the two of them
  argue about time."
- **1947 · THE LOOPHOLE** *(Proof Grove)* — "Studying for his citizenship test, he finds a flaw in
  the U.S. Constitution — a legal path to dictatorship no one meant to leave open. At the hearing,
  Einstein beside him, the judge gently changes the subject."
- **1949 · A UNIVERSE WITH NO DOOR** *(Room With No Door; ember)* — "As a birthday gift to
  Einstein, he finds a universe allowed by relativity where time curves back to its own past — a
  room with no exit. Around him, quietly, the doors of his own world begin to close."
- **CROWN — 1978 · THE LAST WINTER** *(epilogue; ember)* — "The man who proved no system can vouch
  for its own soundness could no longer trust what fed him. When Adele — who had tasted his food
  for years — went to hospital, he stopped eating. He died in January, weighing sixty-five pounds,
  at the edge of his own theorem." Followed in mono, dim:
  `DEATH CERTIFICATE / "MALNUTRITION AND INANITION CAUSED BY PERSONALITY DISTURBANCE"` and the
  honesty line: *It is not a theorem. It only rhymes with one.*

### 3.2 The Numbering Table — type a sentence, watch it become a number, factor it back

New standalone section between Orientation and the machine, section-label **FIRST, MAKE CONTACT**.

- **Input:** mono text input + tappable symbol palette over a frozen 16-symbol alphabet with codes
  1..16: `0→1, S→2, +→3, ·→4, =→5, ¬→6, ∧→7, ∨→8, →→9, ∀→10, ∃→11, (→12, )→13, x→14, y→15, z→16`.
  ASCII aliases on type: `A.→∀ E.→∃ ->→→ ~→¬ &→∧ *→·`. Palette inserts at caret. Cap 120 symbols.
  Seeded on load with `∀x(x+0=x)`.
- **Live readouts** (debounced ~120ms): (1) the symbol row with each code beneath it; (2) the
  encoding `2^c₀ · 3^c₁ · 5^c₂ · …` in cyan mono; (3) the **full decimal expansion** of the real
  BigInt, digit-grouped, with a live headline: "THIS SENTENCE IS A 412-DIGIT NUMBER." Display cap
  ~2000 digits with a "+N more digits" expander; complete BigInt kept in memory.
- **FACTOR IT BACK:** really divides successive primes out (rAF-stepped animation), extracting each
  exponent and rebuilding the original symbols one at a time — an exact inverse, performed live.
- **Math:** `encode(seq) = ∏ prime[i]^code(seq[i])` over BigInt; primes grown by trial division and
  cached. On-load round-trip self-test over ~6 fixed formulas; console.warn on mismatch.
- **Syntax-tree panel (A FORMULA IS A TREE):** beside the input, a small SVG parse tree of
  `S0 + 0 = S0` — tokens rise and snap into a tree (edges dash-draw, nodes pulse), then collapse
  into a single glowing integer; a toggle shows a tiny derivation tree ("A PROOF IS A TREE OF
  INFERENCES"). Buttons: `ASSEMBLE ▸ / SHOW ITS NUMBER ▸ / SWITCH TO PROOF ▸`. Hardcoded tree
  data, no parser; layout by depth/in-order index in the `buildProofWeb` style. This primes both
  the machine's step 02 and the life-tree motif.
- **Numeral-ladder coda** (small panel): input n → the unary numeral `SS…S0`, its Gödel number's
  digit count, and a log-scale bar against ~10^80 — for a modest system, ⌜G⌝ is a specific finite
  integer with more digits than there are atoms in the observable universe. Ends: *"Finite. Exact.
  Unwritable."*
- **Honesty caption** (mono): "This is one standard Gödel-style numbering, not the only one. It
  does not check whether your formula is well-formed or true — it shows the number your marks
  already are."
- Motion-off: instant recompute; FACTOR IT BACK reveals in one step. Perf: BigInt work one-shot on
  debounce, never per-frame; digit wall updates via textContent only. A11y: labeled input,
  `aria-describedby` → code table, digit-count in `aria-live=polite`.

### 3.3 The Two Mirrors — same diagonal machine, two predicates (machine step 03)

New branch in `renderStageAction` for step 2: a two-state toggle in `.stage-action` —
**FEED THE MIRROR: [ Prov(x) ] [ Tr(x) ]**.

- **Prov path:** the existing mirror-loop holds a steady cyan glow, G stabilizes. Result: "G ↔
  ¬Prov_T(⌜G⌝). Prov is a genuine, definable arithmetic predicate — so this is a real, consistent,
  independent sentence. It survives."
- **Tr path:** predicate token swaps to Tr; a liar glyph **L ↔ ¬Tr(⌜L⌝)** appears; the existing
  crack/shudder fracture fires and **the predicate** is destroyed (L fades to transparent).
  Result: "No arithmetical truth predicate Tr can exist. Diagonalizing truth destroys the
  predicate, not the system. (Tarski.)"
- Lesson line between states: "Same machine. One predicate is definable and gives you a theorem;
  one is not and gives you the liar. That is exactly why G is not the liar."
- Pure proof-diagram — no faked computation; reuses `.mirror-layer`, `.mirror-g`, fracture
  keyframes. Motion-off: both outcomes render as static captioned end-states; `aria-live`
  announces each outcome.

### 3.4 The Proof Grove — a real formal system whose search will not stop

New standalone section after the machine, styled as a sibling `.machine-shell` instrument. MIU is
rendered as a literal **derivation tree** — the grove.

- **Mode A — DERIVE BY HAND:** axiom `MI` at the root; the four rule buttons (I: `wI→wIU`,
  II: `Mw→Mww`, III: `III→U` anywhere, IV: `UU→ε` anywhere) enabled only when applicable; each
  click grows a real branch (reusing `.proof-node`/`.proof-edge` idiom).
- **Mode B — ASK IT TO REACH MU:** a genuine BFS with `Set` dedup; the frontier canopy explodes
  outward; live counter `STRINGS VISITED: N` climbs into the tens of thousands; MU never appears.
- **STEP OUTSIDE:** dims the canopy, lights the invariant panel: I-count starts at 1; rules I and
  IV preserve it, II doubles, III subtracts 3 — so I-count mod 3 ∈ {1,2} forever; MU has 0 ≡ 0.
  Underivable — settled in one glance. Nodes carry small mod-3 badges.
- **Honesty flag, on-screen:** "MIU is a real formal system, but it is NOT Gödel's. It is decidable
  and has no self-reference. What it shares with Gödel: some things are unreachable by the rules
  from inside, yet obvious one step outside. The endless search is the feeling; the invariant is
  the proof."
- Perf: BFS as a generator stepped by rAF (~300 strings/frame), hard caps (50k visited → "SEARCH
  SUSPENDED — NOT EXHAUSTED", 100-char strings, ~600 rendered nodes from the recent frontier);
  pause on `visibilitychange`. Motion-off: static frontier snapshot + counter + invariant. A11y:
  buttons with roving tabindex; counter announced at milestones only.

### 3.5 The Room With No Door — pinned second-person descent

New section between the Proof Grove and the epilogue. A tall scroll-pinned frame whose four border
lines slide inward (single `--walls` custom property, 0→1) as short second-person serif lines
reveal one at a time; certain words redact themselves as you pass:

"You are standing inside a system." → "Every wall is an axiom you agreed to." → "You look for the
door you came in through." → "You already wrote a sentence. It was always a number." → "The system
cannot [REDACTED] what it cannot reach." → (column at its tightest) "There was never a door. Only
more room."

The 1949 life-chapter (closed timelike curves — a universe with no exit) sits beside it; the room
and the universe rhyme. Every redacted word carries its real text to assistive tech; native scroll
never disabled; ember only on the final line. Motion-off: all lines visible, walls at a
comfortable fixed width, redactions shown as legible strike-throughs. Implementation:
IntersectionObserver per line + one rAF-throttled scroll handler for `--walls`.

### 3.6 The Self-Audit — the finale names the machine you are reading this on

Terminal-styled panel inside the epilogue, between the deck and `.last-line`, next to the crown
chapter. Prints: `SYSTEM UNDER TEST: this page · rendered on [coarse platform family] · a machine
that ultimately runs on arithmetic` — short typewriter reveal — then in ember:
**"IF THIS SYSTEM IS CONSISTENT, IT CANNOT PROVE SO FROM WITHIN."**

- States the second incompleteness theorem precisely: Con(T) := ¬Prov_T(⌜⊥⌝); a consistent,
  effectively axiomatized system strong enough for arithmetic cannot prove Con(T).
- Honesty caption (mono): "This is a framing, not a decision procedure. The audit reports a true
  theorem; it did not check anything."
- Privacy-safe: coarse `navigator.platform` family only, safe fallback, no storage. Motion-off /
  AT: conclusion prints instantly; `aria-live=polite`.
- The crown chapter beside it closes the loop: he could not certify what fed him; no system can
  certify itself.

### 3.7 Copy pass + Precision dialog + dedication

- **Simplification strategy:** one idea per sentence; verbs over nominalizations; concrete before
  formal. Rigor is *relocated*, never removed — the formula line, the mono note, and the Precision
  dialog keep the exact statements. Never touch the dialog's rigor.
  - Step 01 body → "Call the system **T**. A machine could list its axioms and check its proofs,
    and it knows enough arithmetic to talk about its own formulas. Assume it never contradicts
    itself."
  - Step 05 body → "Ruling out a proof of *not-G* originally needed an extra assumption. Rosser
    reshapes the sentence so plain consistency is enough — now **neither side** can be proved."
  - Orientation body → "Gödel didn't fail to prove anything. Standing **outside** a system, he
    proved the system has an inside edge it can't cross."
  - Epilogue deck → "Any system honest enough not to contradict itself, mechanical enough to
    check, and strong enough for arithmetic will always leave some arithmetic question it can't
    answer."
- **Precision dialog additions:** the 16-symbol code table; a Tarski card ("provability is
  definable inside arithmetic; truth is not — which is why the liar cannot be run through T");
  a sixth spine item for Con(T) distinguishing the first theorem from the second.
- **Dedication:** hero gains a small line under the kicker — "a love letter to Kurt Gödel,
  1906–1978"; footer center becomes "FOR KURT GÖDEL — WHO LOVED WALKS AMONG TREES"; README rewritten
  in the same spirit.

## 4. Architecture

- `index.html` — new sections in arc order; life-thread aside; inline life-nodes.
- `styles.css` — new components reusing existing tokens/keyframes (`pulse-dot`, `crack`,
  `core-breathe`, `rotate`, `--ease-out`).
- `app.js` — existing engine + Two Mirrors branch + `updateStep` chapter hook; shared helpers
  (`createSvg`, motion state) exposed on `window.HoleMap`.
- `instruments.js` (new, `defer`, after app.js) — Numbering Table (BigInt kernel + self-test),
  syntax-tree panel, Proof Grove (MIU BFS), Life-Thread renderer, Room descent, Self-Audit.
- No dependencies, no build, no external fonts. Runs from `python3 -m http.server 7480`.

## 5. Biography facts (verified; confidence noted)

All chapter copy above uses only these: born Apr 28, 1906, Brünn (HIGH); "der Herr Warum" (HIGH);
rheumatic fever around age six — not eight (HIGH); sat with the Vienna Circle, Hahn his advisor,
himself a Platonist (HIGH); completeness of first-order logic, dissertation 1929/doctorate 1930
(HIGH); Königsberg remark Sept 7, 1930, Hilbert's "Wir müssen wissen, wir werden wissen" Sept 8,
1930, same city; only von Neumann followed up (HIGH); 1931 paper title verified (HIGH); Adele
Porkert, dancer, six years older, family disapproved, married Sept 20, 1938 (HIGH); consistency of
AC/CH via constructible universe 1938–40 (HIGH); Jan–Mar 1940 escape via Trans-Siberian Railway →
Japan → San Francisco (arrived Mar 4, 1940) → Princeton (HIGH); Einstein's "privilege of walking
home with Gödel" — attribute via Morgenstern's report (HIGH with attribution care); citizenship
exam Dec 5, 1947, Judge Phillip Forman, Einstein & Morgenstern witnesses, the constitutional
loophole (HIGH); rotating-universe solutions with closed timelike curves, gift for Einstein's 70th,
1949 (HIGH); late-life fear of poisoning, ate only what Adele prepared (HIGH); Adele hospitalized
late 1977 (HIGH); died Jan 14, 1978, ~65 lbs, death certificate "malnutrition and inanition caused
by personality disturbance" (HIGH, verbatim).

**Trees:** no documented Gödel quote about trees exists — the "most inspiring structures" line is
NOT attributed anywhere reliable. The motif is earned honestly: formulas/proofs/systems literally
are trees, and his documented life (Vienna, the Princeton walks with Einstein) was spent walking
among them. No invented quotes anywhere on the page.

## 6. Non-negotiables

- **Mathematical honesty:** everything numeric really computes; everything theatrical is labeled a
  model; G ≠ liar; truth ≠ provability; MIU explicitly framed as not-Gödel's-system; second
  theorem stated with its hypotheses; the biography's final rhyme labeled a rhyme, not a theorem.
- **Motion:** every animation, scroll-coupling, and typewriter respects the motion toggle and
  `prefers-reduced-motion`; all content and computation intact without motion.
- **A11y:** keyboard operable throughout; aria-live for dynamic results; the life story readable
  as plain prose; redactions never withhold meaning from AT.
- **Perf:** 60fps target; rAF-stepped work; caps on BFS and DOM size; `visibilitychange` pause.

## 7. Cut list (deliberate)

Full Hilbert proof enumerator + evalClosed (honesty hazard: finite search read as a proven
negative); provability/truth split-meter (depends on it); "this page as a number" (overlaps
Self-Audit); staged fake oracle (honesty); Rosser race animation (step 05 copy already careful);
Turing halting loom, Löb/GL checker, ordinal towers (each a day, homework-flavored); sound drone
(doesn't serve the love-letter register; audio-as-motion complexity).

## 8. Verification plan

Playwright pass on every section: screenshots desktop + 390px mobile; zero console errors;
round-trip self-test passes; encoder types/factors correctly; MIU search runs, caps, and settles
via invariant; step machine + Two Mirrors + life-tree branch sync; room descent scrolls without
trapping; Self-Audit prints; motion-off strips all animation but loses no content.
