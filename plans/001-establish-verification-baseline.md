# Plan 001: Establish a verification baseline

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report - do not improvise. When done, update the status row for this plan in `plans/README.md` - unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 231e15b..HEAD -- app/package.json audio-processors/package.json app/app/utils/module.ts audio-processors/wasm/src/dsp/adsr_unit.rs audio-processors/wasm/tests/web.rs`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `231e15b`, 2026-06-13

## Why This Matters

The repo has no meaningful automated test entrypoint for the Nuxt app, patch persistence, AudioWorklet wrappers, or DSP. Later security/correctness plans will touch file persistence and real-time audio behavior; without a baseline, executors can only rely on build/lint and manual checks. This plan adds the smallest useful verification scaffold: app unit tests, audio JS typechecking, Rust unit tests, and package scripts that later plans can reuse.

## Current State

- `app/package.json` - app scripts only cover build/dev/generate/preview/postinstall.
- `audio-processors/package.json` - audio scripts only cover build/build:watch/postinstall.
- `app/app/utils/module.ts` - pure app utility suitable for the first Vitest smoke test.
- `audio-processors/wasm/src/dsp/adsr_unit.rs` - core DSP state machine suitable for first Rust unit tests.
- `audio-processors/wasm/tests/web.rs` - only placeholder browser WASM test.

Current excerpts:

```jsonc
// app/package.json:5-10
"scripts": {
  "build": "nuxt build",
  "dev": "nuxt dev --dotenv ../.env",
  "generate": "nuxt generate",
  "preview": "nuxt preview",
  "postinstall": "nuxt prepare"
}
```

```jsonc
// audio-processors/package.json:5-9
"scripts": {
  "build": "./builder --env=../.env --js=index.js --wasmDir=wasm",
  "build:watch": "bun run build -- --watch",
  "postinstall": "cd build && go build -o ../builder cmd/main.go"
}
```

```rust
// audio-processors/wasm/tests/web.rs:10-12
#[wasm_bindgen_test]
fn pass() {
    assert_eq!(1 + 1, 2);
}
```

Repo conventions to match:

- Package manager is Bun for JS packages; there is no root workspace package.
- App code uses Nuxt 4, TypeScript, Vue Composition API, named imports, and kebab-case filenames.
- `AGENTS.md:8-10` documents `cd app && bun eslint .` and says no test framework is configured.
- Do not manually fix lint style issues; if lint style failures appear, use `cd app && bun eslint . --fix` only when explicitly allowed by the operator. For this plan, prefer writing code that passes lint without invoking `--fix`.

## Commands You Will Need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| App dependency install after manifest edits | `cd app && bun install` | exit 0; `bun.lock` updated if needed |
| App tests | `cd app && bun run test` | exit 0; Vitest reports all tests pass |
| App typecheck | `cd app && bun run typecheck` | exit 0, no type errors |
| App lint | `cd app && bun run lint` | exit 0, no lint errors |
| Audio dependency install after manifest edits | `cd audio-processors && bun install` | exit 0; lockfile updated if needed |
| Audio JS typecheck | `cd audio-processors && bun run typecheck` | exit 0, no type errors |
| Audio Rust tests | `cd audio-processors && bun run test:rust` | exit 0; cargo reports tests pass |

## Scope

**In scope** (the only files you should modify):

- `app/package.json`
- `app/bun.lock`
- `app/vitest.config.ts` (create)
- `app/app/utils/module.test.ts` (create)
- `audio-processors/package.json`
- `audio-processors/bun.lockb`
- `audio-processors/wasm/src/dsp/adsr_unit.rs`
- `audio-processors/wasm/tests/web.rs`
- `plans/README.md`

**Out of scope** (do NOT touch, even though they look related):

- Any application behavior outside tests/scripts.
- `audio-processors/build/cmd/main.go` and `audio-processors/build.mjs`; builder cleanup is a separate deferred finding.
- Any generated directories such as `.nuxt`, `.output`, `pkg`, `target`, or `node_modules` except lockfile changes produced by install commands.

## Git Workflow

- Branch: `advisor/001-verification-baseline`.
- Commit message style observed in recent history is conventional commits, for example `feat: keyboard module` and `fix: granular algo`. Use `test: establish verification baseline`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add app test and check scripts

In `app/package.json`, add scripts:

- `lint`: `eslint .`
- `typecheck`: `nuxt typecheck`
- `test`: `vitest run`
- `test:watch`: `vitest`

Add dev dependencies needed by those scripts:

- `vitest`
- `typescript`
- `vue-tsc`

Create `app/vitest.config.ts` with a Node environment and aliases that make app imports work:

```ts
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '~~': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
})
```

Run `cd app && bun install` after editing the manifest.

**Verify**: `cd app && bun run test -- --runInBand` is not required; use `cd app && bun run test` after Step 2 instead.

### Step 2: Add first app smoke tests

Create `app/app/utils/module.test.ts`. Test existing pure behavior from `app/app/utils/module.ts`:

- `moduleCatalog` contains at least the known types `oscillator`, `gain`, and `destination`.
- `searchModuleCatalog('osc')` returns `Oscillator` before lower-scored matches.
- `searchModuleCatalog('', 'I/O')` returns only entries whose `category` is `I/O`.
- `getModuleCatalogEntry('gain')` returns an entry with label `Gain`.

Use Vitest imports:

```ts
import { describe, expect, it } from 'vitest'
import { getModuleCatalogEntry, moduleCatalog, searchModuleCatalog } from './module'
```

**Verify**: `cd app && bun run test` -> exit 0, Vitest reports the new `module.test.ts` tests pass.

### Step 3: Add audio package check scripts

In `audio-processors/package.json`, add scripts:

- `typecheck`: `tsc --noEmit`
- `test:rust`: `cargo test --workspace`
- `test`: `bun run typecheck && bun run test:rust`

If `typescript` is only a peer dependency and `bun run typecheck` cannot find `tsc`, add `typescript` to `devDependencies` using the same major version already stated in `peerDependencies`.

Run `cd audio-processors && bun install` only if you changed dependencies.

**Verify**: `cd audio-processors && bun run typecheck` -> exit 0, no type errors. If this fails because generated `pkg` files are absent, STOP and report; do not make the typecheck depend on generated artifacts without reviewer approval.

### Step 4: Add Rust ADSR characterization tests

Append a `#[cfg(test)] mod tests` block to `audio-processors/wasm/src/dsp/adsr_unit.rs`. Keep tests inside the same file so they can inspect behavior through public methods only. Cover:

- New unit is idle and returns `0.0` before `note_on()`.
- With `sample_rate = 10.0`, `attack_sec = 0.1`, `decay_sec = 0.1`, `sustain_lvl = 0.5`, `release_sec = 0.1`, the first sample after `note_on()` reaches `1.0`, the next reaches sustain `0.5`, and after `note_off()` the next sample reaches `0.0` or below and subsequent samples return `0.0`.
- Zero attack and zero decay enter sustain immediately.

Use numeric tolerances rather than exact equality except for zero-idle cases.

**Verify**: `cd audio-processors && bun run test:rust` -> exit 0, cargo reports the new ADSR tests pass.

### Step 5: Replace the placeholder WASM browser test with a real smoke or remove the misleading placeholder

Open `audio-processors/wasm/tests/web.rs`. The current test only asserts `1 + 1 == 2`, which gives false confidence.

Preferred option: replace it with a minimal exported-constructor smoke that imports the crate and constructs one exported processor with a 128-frame buffer and 48 kHz sample rate. Use an exported type that is already available from `audio-processors/wasm/src/lib.rs`.

Fallback option: if browser WASM test dependencies or exported constructors make this non-trivial, delete the placeholder test file and document in `audio-processors/package.json` that `test:rust` is the current test baseline. Do not leave the arithmetic placeholder.

**Verify**: `cd audio-processors && bun run test:rust` -> exit 0.

### Step 6: Run the full baseline

Run the package-local commands. Do not run app/audio builds unless the operator explicitly allows artifact-producing verification.

**Verify**:

- `cd app && bun run test` -> exit 0.
- `cd app && bun run typecheck` -> exit 0.
- `cd app && bun run lint` -> exit 0.
- `cd audio-processors && bun run test` -> exit 0.

## Test Plan

- New `app/app/utils/module.test.ts` covers catalog lookup/search behavior and proves app Vitest works.
- New ADSR tests in `audio-processors/wasm/src/dsp/adsr_unit.rs` cover a core DSP state machine.
- Existing `audio-processors/wasm/tests/web.rs` placeholder is replaced with a meaningful smoke or removed.
- Verification: `cd app && bun run test` and `cd audio-processors && bun run test` both pass.

## Done Criteria

- [ ] `cd app && bun run test` exits 0 and runs `module.test.ts`.
- [ ] `cd app && bun run typecheck` exits 0.
- [ ] `cd app && bun run lint` exits 0.
- [ ] `cd audio-processors && bun run typecheck` exits 0.
- [ ] `cd audio-processors && bun run test:rust` exits 0 and includes ADSR tests.
- [ ] `audio-processors/wasm/tests/web.rs` no longer contains the placeholder arithmetic-only test.
- [ ] No files outside the in-scope list are modified, except package lockfiles changed by Bun.
- [ ] `plans/README.md` status row for 001 updated.

## STOP Conditions

Stop and report back (do not improvise) if:

- `nuxt typecheck` requires a Nuxt module or generated setup not present after `bun install`.
- `audio-processors` JS typecheck requires generated `pkg` files that are not present in a clean checkout.
- The ADSR characterization test exposes a behavior bug that requires changing DSP implementation to pass. Report the failing characterization rather than fixing DSP in this baseline plan.
- Any step appears to require changing source behavior outside the in-scope files.

## Maintenance Notes

- Later plans should add focused tests under the test layout created here instead of inventing new runners.
- Reviewers should check that scripts work from clean installs, not only on a machine with existing generated folders.
- CI is intentionally deferred; once these scripts are stable, a separate plan can add GitHub Actions or another CI runner.
