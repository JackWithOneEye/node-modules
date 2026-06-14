# Plan 003: Clear disconnected worklet inputs

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report - do not improvise. When done, update the status row for this plan in `plans/README.md` - unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 231e15b..HEAD -- audio-processors/processors/helpers/heap-audio-buffer.js audio-processors/processors/adsr.js audio-processors/processors/envelope-generator.js audio-processors/processors/graindr.js audio-processors/processors/fm-voice.js audio-processors/package.json`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/001-establish-verification-baseline.md`
- **Category**: bug
- **Planned at**: commit `231e15b`, 2026-06-13

## Why This Matters

AudioWorklet input arrays are empty when an upstream connection is removed. The shared heap-buffer helper currently returns without writing anything when a channel is missing, so WASM keeps seeing the previous render quantum's data. For gates, retriggers, frequency inputs, and audio inputs, that can create stuck notes, phantom modulation, or stale audio after a user disconnects a cable.

## Current State

- `audio-processors/processors/helpers/heap-audio-buffer.js` copies JS input buffers into WASM memory.
- `audio-processors/processors/adsr.js` and `envelope-generator.js` pass gate/retrigger/velocity channels directly to the helper.
- `audio-processors/processors/graindr.js` maps missing audio inputs through `input[Math.min(...)]`, which can be undefined when there are no channels.
- `audio-processors/processors/fm-voice.js` skips absent voice channels instead of clearing them.

Current excerpts:

```js
// audio-processors/processors/helpers/heap-audio-buffer.js:68-72
setChannelData(buffer, channelIndex) {
    if (!buffer) {
        return;
    }
    this.#data[channelIndex].set(buffer);
}
```

```js
// audio-processors/processors/adsr.js:79-80
this.#triggerInputBuffer.setChannelData(inputList[0][0], 0);
this.#retriggerInputBuffer.setChannelData(inputList[1][0], 0);
```

```js
// audio-processors/processors/graindr.js:135-139
const input = inputList[0];
const inputChannels = input.length - 1;
for (let channel = 0; channel < CHANNELS; channel++) {
    this.#inputBuffer.setChannelData(input[Math.min(channel, inputChannels)], channel);
}
```

```js
// audio-processors/processors/fm-voice.js:381-390
for (let voice = 0; voice < 8; voice++) {
  if (inputList[0]?.[voice]) {
    this.#frequencyInputBuffer.setChannelData(inputList[0][voice], voice);
  }
  if (inputList[1]?.[voice]) {
    this.#triggerInputBuffer.setChannelData(inputList[1][voice], voice);
  }
  if (inputList[2]?.[voice]) {
    this.#retriggerInputBuffer.setChannelData(inputList[2][voice], voice);
  }
}
```

Repo conventions to match:

- Audio processor files are plain JavaScript with JSDoc type annotations and semicolons.
- Constants such as render quantum size live in `audio-processors/processors/helpers/constants.js`.
- Processor cleanup frees WASM objects and unregisters memory listeners in `#destroy()` methods.

## Commands You Will Need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Audio JS typecheck | `cd audio-processors && bun run typecheck` | exit 0, no type errors |
| Audio Rust tests | `cd audio-processors && bun run test:rust` | exit 0 |
| Audio build smoke | `cd audio-processors && bun run build` | exit 0; worklet bundle produced at configured output path |

## Scope

**In scope** (the only files you should modify):

- `audio-processors/processors/helpers/heap-audio-buffer.js`
- `audio-processors/processors/adsr.js`
- `audio-processors/processors/envelope-generator.js`
- `audio-processors/processors/graindr.js`
- `audio-processors/processors/fm-voice.js`
- `audio-processors/processors/helpers/heap-audio-buffer.test.js` or equivalent if Plan 001 added a JS test runner for audio processors
- `plans/README.md`

**Out of scope** (do NOT touch, even though they look related):

- Rust DSP algorithms under `audio-processors/wasm/src`; this bug is the JS-to-WASM input-copy boundary.
- Module UI components in `app/app/components/modules`.
- Generated `audio-processors/pkg`, `target`, or final bundled output except as produced by the verification build.

## Git Workflow

- Branch: `advisor/003-clear-worklet-inputs`.
- Commit message style observed in recent history is conventional commits. Use `fix: clear disconnected worklet inputs`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Make missing channel behavior explicit in the helper

Update `HeapAudioBuffer.setChannelData(buffer, channelIndex)` so a missing buffer clears the destination channel rather than returning. Target behavior:

- If `channelIndex` is outside `this.#data`, throw or return consistently with existing helper expectations. Prefer a clear throw only if all callers pass fixed valid indexes; otherwise return.
- If `buffer` is missing, call `this.#data[channelIndex].fill(0)`.
- If `buffer` exists but is shorter than the render quantum, copy it and fill the remainder with zero.
- If `buffer` exists and is full length, keep the current `.set(buffer)` behavior.

Avoid adding a new helper unless it simplifies all call sites.

**Verify**: `cd audio-processors && bun run typecheck` -> exit 0.

### Step 2: Remove caller-side skip patterns that preserve stale channels

Update processors so they always write each expected channel once per render quantum:

- In `adsr.js`, use optional chaining for potentially missing input lists: `inputList[0]?.[0]`, `inputList[1]?.[0]`.
- In `envelope-generator.js`, do the same for trigger, retrigger, and velocity inputs. Missing velocity should become `0` through the helper.
- In `graindr.js`, handle zero input channels. If `input.length === 0`, pass `undefined` for each channel so the helper clears both channels. If one channel exists, duplicate that mono channel into both stereo channels as today.
- In `fm-voice.js`, remove the `if` guards and call `setChannelData(inputList[n]?.[voice], voice)` for frequency, trigger, and retrigger buffers for all 8 voices.

Do not invent non-zero defaults in this plan. If a processor truly needs a non-zero disconnected default later, add a named helper method in a separate plan.

**Verify**: `cd audio-processors && bun run typecheck` -> exit 0.

### Step 3: Add focused helper tests if the audio JS test runner exists

If Plan 001 added or can cheaply support a JS test runner for `audio-processors`, add a helper-level test for `HeapAudioBuffer` behavior. Mocking `cachedF32Memory` may be difficult because `memory.js` imports generated WASM files; do not perform a broad test-runner refactor in this plan.

Preferred tests:

- Existing data is overwritten with zeros when `setChannelData(undefined, 0)` is called.
- Short buffers zero-fill the remainder.
- Full buffers copy unchanged.

If those tests require invasive module mocking or generated WASM artifacts, skip automated JS tests and document the gap in the PR summary. The build/typecheck gates still apply.

**Verify**: if tests were added, run the relevant audio JS test command and confirm all pass.

### Step 4: Run audio verification

Run the non-mutating checks first, then the build smoke if the operator allows artifact-producing verification.

**Verify**:

- `cd audio-processors && bun run typecheck` -> exit 0.
- `cd audio-processors && bun run test:rust` -> exit 0.
- `cd audio-processors && bun run build` -> exit 0.

## Test Plan

- Preferred: helper-level JS tests for missing, short, and full input buffers.
- Required: audio JS typecheck and audio build pass.
- Manual regression checklist in the browser after building: create an ADSR or Envelope Generator, connect a gate/retrigger input, trigger it, disconnect the input, and confirm the output does not stay latched from the last input block.

## Done Criteria

- [ ] `HeapAudioBuffer.setChannelData(undefined, channel)` clears that channel to zeros.
- [ ] `adsr.js`, `envelope-generator.js`, `graindr.js`, and `fm-voice.js` write every expected input channel every render quantum.
- [ ] `cd audio-processors && bun run typecheck` exits 0.
- [ ] `cd audio-processors && bun run test:rust` exits 0.
- [ ] `cd audio-processors && bun run build` exits 0, or the reviewer explicitly waived artifact-producing verification.
- [ ] No files outside the in-scope list are modified, except generated ignored artifacts from the build.
- [ ] `plans/README.md` status row for 003 updated.

## STOP Conditions

Stop and report back (do not improvise) if:

- You find a documented requirement that disconnected frequency or velocity inputs should hold their last value rather than clear.
- Fixing the bug appears to require changing Rust DSP state machines.
- The audio build fails because Go, wasm-pack, or required env vars are missing from the environment; report the missing prerequisite rather than changing build tooling.
- A step's verification fails twice after reasonable local fixes.

## Maintenance Notes

- Future processors should call `setChannelData` for every expected input each render quantum; caller-side `if (input) set` guards are a stale-buffer smell.
- If a processor needs a disconnected default other than zero, add an explicit helper such as `setChannelDataOrFill(buffer, channel, defaultValue)` and tests.
- Reviewers should scrutinize mono-to-stereo behavior in `graindr.js`; the intended behavior is to keep duplicating mono input, not to silence the right channel.
