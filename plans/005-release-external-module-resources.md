# Plan 005: Release external module resources on teardown

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report - do not improvise. When done, update the status row for this plan in `plans/README.md` - unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 231e15b..HEAD -- app/app/components/modules/AudioSourceModule.client.vue app/app/components/modules/MidiInputModule.client.vue app/package.json app/vitest.config.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: `plans/001-establish-verification-baseline.md`
- **Category**: bug
- **Planned at**: commit `231e15b`, 2026-06-13

## Why This Matters

Two modules acquire external resources: microphone media tracks and WebMIDI event listeners. Their unmount handlers disconnect audio nodes, but they do not fully release those external resources. After deleting modules or navigating away, the browser can keep capturing audio or dispatching MIDI events into stale handlers, causing privacy/resource leaks and duplicate note handling after repeated add/remove cycles.

## Current State

- `AudioSourceModule.client.vue` requests a microphone stream and wraps it in `MediaStreamAudioSourceNode`.
- `AudioSourceModule.client.vue` unmount cleanup disconnects the audio node and unregisters the module, but does not stop tracks.
- `MidiInputModule.client.vue` watcher removes listeners when switching from one input to another.
- `MidiInputModule.client.vue` unmount cleanup stops ConstantSourceNodes but does not remove listeners from the current MIDI input.

Current excerpts:

```ts
// app/app/components/modules/AudioSourceModule.client.vue:13-23
const mediaStream = await window.navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: false,
    autoGainControl: false,
    noiseSuppression: false,
    // @ts-expect-error [no idea why]
    latency: 0,
  },
})

const audioSourceNode = new MediaStreamAudioSourceNode(store.getAudioContext(), { mediaStream })
```

```ts
// app/app/components/modules/AudioSourceModule.client.vue:45-48
onUnmounted(() => {
  audioSourceNode.disconnect()
  store.unregisterModule(props.id)
})
```

```ts
// app/app/components/modules/MidiInputModule.client.vue:256-268
const currentInput = computed(() => midiStore.midiInputs.find(({ id }) => id === selectedMidiInput.value))
watch(currentInput, (curr, prev) => {
  if (prev) {
    prev.removeListener('noteon', onNoteOn)
    prev.removeListener('noteoff', onNoteOff)
    prev.removeListener('pitchbend', onPitchBend)
  }
  if (curr) {
    curr.addListener('noteon', onNoteOn)
    curr.addListener('noteoff', onNoteOff)
    curr.addListener('pitchbend', onPitchBend)
  }
}, { immediate: true })
```

```ts
// app/app/components/modules/MidiInputModule.client.vue:270-292
onUnmounted(() => {
  for (const gn of gateNodes) {
    gn.disconnect()
    gn.stop()
  }
  // ... other node cleanup ...
  store.unregisterModule(props.id)
})
```

Repo conventions to match:

- Vue components use `<script lang="ts" setup>` and Composition API lifecycle hooks.
- Non-critical cleanup errors should be guarded or logged with `console.warn()` only if needed.
- Module unmount handlers already unregister from `useAudioContextStore()` at the end.

## Commands You Will Need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| App tests | `cd app && bun run test` | exit 0 |
| App typecheck | `cd app && bun run typecheck` | exit 0, no type errors |
| App lint | `cd app && bun run lint` | exit 0, no lint errors |
| App build | `cd app && bun run build` | exit 0 |

## Scope

**In scope** (the only files you should modify):

- `app/app/components/modules/AudioSourceModule.client.vue`
- `app/app/components/modules/MidiInputModule.client.vue`
- Optional test files under `app/app/components/modules/*.test.ts` only if the test harness from Plan 001 supports component/lifecycle tests without broad new dependencies.
- `plans/README.md`

**Out of scope** (do NOT touch, even though they look related):

- MIDI store device discovery logic in `app/app/stores/midi.ts`.
- Audio context store connection semantics in `app/app/stores/audio-context.ts`.
- Removing debug `console.log` calls in MIDI/audio stores; that is a separate polish/performance finding.
- UI redesign of the Audio Source or MIDI Input modules.

## Git Workflow

- Branch: `advisor/005-release-module-resources`.
- Commit message style observed in recent history is conventional commits. Use `fix: release module resources on teardown`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Stop microphone tracks on audio source unmount

Update `AudioSourceModule.client.vue` unmount cleanup:

- Keep `audioSourceNode.disconnect()`.
- Add `for (const track of mediaStream.getTracks()) { track.stop() }`.
- Keep `store.unregisterModule(props.id)`.
- If you guard cleanup with `try/catch`, use `console.warn()` and still attempt `store.unregisterModule(props.id)`.

Target shape:

```ts
onUnmounted(() => {
  audioSourceNode.disconnect()
  for (const track of mediaStream.getTracks()) {
    track.stop()
  }
  store.unregisterModule(props.id)
})
```

**Verify**: `cd app && bun run typecheck` -> exit 0.

### Step 2: Remove MIDI listeners on unmount

Update `MidiInputModule.client.vue` so the listener-removal logic is shared and invoked both when the selected input changes and when the component unmounts.

Recommended shape:

```ts
function removeMidiListeners(input: typeof currentInput.value) {
  if (!input) {
    return
  }
  input.removeListener('noteon', onNoteOn)
  input.removeListener('noteoff', onNoteOff)
  input.removeListener('pitchbend', onPitchBend)
}
```

Then:

- In the watcher, replace the inline `prev.removeListener(...)` block with `removeMidiListeners(prev)`.
- In `onUnmounted`, call `removeMidiListeners(currentInput.value)` before stopping audio/control nodes.

Do not change MIDI note allocation, voice priority, or parameter-setting behavior.

**Verify**: `cd app && bun run typecheck` -> exit 0.

### Step 3: Add tests if component lifecycle testing exists after Plan 001

If Plan 001 or later repo state includes Vue component test support, add focused tests that mock:

- `mediaStream.getTracks()` returning tracks with `stop` spies, then unmount `AudioSourceModule` and assert each stop was called.
- A fake MIDI input with `addListener`/`removeListener` spies, then unmount `MidiInputModule` and assert all three listeners were removed.

If adding component tests requires introducing `@vue/test-utils`, DOM environment, or complex Nuxt auto-import mocking not already present, skip tests and rely on typecheck/lint/build plus manual verification. Do not expand this small cleanup plan into broad test harness work.

**Verify**: if tests were added, `cd app && bun run test` -> exit 0.

### Step 4: Run app verification and manual checks

Run automated checks, then manually verify in the browser if a dev environment is available.

**Verify**:

- `cd app && bun run test` -> exit 0.
- `cd app && bun run typecheck` -> exit 0.
- `cd app && bun run lint` -> exit 0.
- `cd app && bun run build` -> exit 0.

Manual checks:

- Add an Audio Source module, allow microphone access, then delete the module. Browser microphone capture indicator should turn off after deletion if no other module/page is using it.
- Add a MIDI Input module, select a device, delete the module, add a new MIDI Input module, and confirm a note is handled once rather than duplicated.

## Test Plan

- Preferred automated component tests for track stopping and MIDI listener removal if the harness supports them without broad new setup.
- Required automated verification: app tests/typecheck/lint/build pass.
- Required manual checks for microphone indicator and duplicate MIDI events when browser/device access is available.

## Done Criteria

- [ ] `AudioSourceModule.client.vue` stops every track from its own `mediaStream` on unmount.
- [ ] `MidiInputModule.client.vue` removes `noteon`, `noteoff`, and `pitchbend` listeners from the active input on unmount.
- [ ] Existing listener removal on input switch still works.
- [ ] `cd app && bun run test` exits 0.
- [ ] `cd app && bun run typecheck` exits 0.
- [ ] `cd app && bun run lint` exits 0.
- [ ] `cd app && bun run build` exits 0.
- [ ] No files outside the in-scope list are modified.
- [ ] `plans/README.md` status row for 005 updated.

## STOP Conditions

Stop and report back (do not improvise) if:

- Another part of the app intentionally shares the same `MediaStream` across modules. Current code creates the stream inside this module, so no sharing was found.
- WebMIDI listener removal requires a different API than `removeListener(eventName, handler)` for the installed `webmidi` version.
- Component tests require broad Nuxt/Vue test infrastructure changes beyond this plan's scope.
- A step's verification fails twice after reasonable local fixes.

## Maintenance Notes

- Any future module that opens external resources should have teardown in the same file as acquisition.
- Reviewers should check cleanup ordering: listener/track cleanup should happen even if audio node disconnect throws.
- Debug MIDI logs remain out of scope; they can be removed in a separate polish/performance plan.
