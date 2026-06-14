# Plan 004: Validate patch payloads before persistence/import

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report - do not improvise. When done, update the status row for this plan in `plans/README.md` - unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 231e15b..HEAD -- app/server/api/patches/index.post.ts app/server/api/patches/[id].post.ts app/app/stores/data.ts app/package.json app/vitest.config.ts app/server/utils/patch-storage.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding. If Plan 002 already changed only path handling imports in the same route files, proceed carefully and preserve that work; if payload validation already exists, STOP and report that this plan may be obsolete.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/001-establish-verification-baseline.md`, `plans/002-constrain-patch-file-paths.md`
- **Category**: security
- **Planned at**: commit `231e15b`, 2026-06-13

## Why This Matters

Patch create/update routes trust TypeScript annotations on request bodies, but runtime clients can send any JSON. The client import path also casts parsed JSON after only checking `version`, `nodes`, and `edges`. A small runtime schema and size limits will prevent malformed or oversized patches from being persisted or loaded into the editor while keeping valid version-1 patch files working.

## Current State

- `app/server/api/patches/index.post.ts` persists `body.name`, `body.nodes`, `body.edges`, and `body.viewport` directly.
- `app/server/api/patches/[id].post.ts` does the same for updates, falling back to existing values.
- `app/app/stores/data.ts` import only checks version and that nodes/edges are arrays before casting to Vue Flow types.

Current excerpts:

```ts
// app/server/api/patches/index.post.ts:12-28
export default defineEventHandler(async (event) => {
  const body = await readBody<PatchBody>(event)
  const id = randomUUID()
  const now = new Date().toISOString()
  const patch = {
    version: 1,
    id,
    name: body.name ?? 'New patch',
    createdAt: now,
    updatedAt: now,
    nodes: body.nodes ?? [],
    edges: body.edges ?? [],
    viewport: body.viewport,
  }
```

```ts
// app/server/api/patches/[id].post.ts:28-37
const patch = {
  version: 1,
  id,
  name: body.name ?? existing.name ?? 'New patch',
  createdAt: existing.createdAt ?? now,
  updatedAt: now,
  nodes: body.nodes ?? (existing.nodes as Record<string, unknown>[]) ?? [],
  edges: body.edges ?? (existing.edges as Record<string, unknown>[]) ?? [],
  viewport: body.viewport ?? existing.viewport,
}
```

```ts
// app/app/stores/data.ts:156-170
async function importPatch(file: File) {
  const text = await file.text()
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(text)
  }
  catch {
    throw new Error('Invalid JSON')
  }
  if (parsed.version !== 1 || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
    throw new Error('Invalid patch file format')
  }
  pendingImportData.value = { nodes: parsed.nodes as Node[], edges: parsed.edges as Edge[], viewport: parsed.viewport as ViewportTransform | undefined }
```

Repo conventions to match:

- Keep TypeScript strict and avoid broad `any` casts.
- Server errors should use `createError({ statusCode: 400, statusMessage: '...' })` for bad client input.
- Client import errors currently throw user-facing `Error` messages; keep concise messages such as `Invalid patch file format`.
- Patch file version is currently `1`; do not introduce a migration framework in this plan.

## Commands You Will Need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| App tests | `cd app && bun run test` | exit 0; new patch validation tests pass |
| App typecheck | `cd app && bun run typecheck` | exit 0, no type errors |
| App lint | `cd app && bun run lint` | exit 0, no lint errors |

## Scope

**In scope** (the only files you should modify):

- `app/shared/patch-file.ts` (create)
- `app/shared/patch-file.test.ts` (create)
- `app/server/api/patches/index.post.ts`
- `app/server/api/patches/[id].post.ts`
- `app/app/stores/data.ts`
- `plans/README.md`

**Out of scope** (do NOT touch, even though they look related):

- Patch ID/path validation from Plan 002, except preserving its imports and helper usage.
- Full migration registry for future patch versions.
- Changes to the Vue Flow node/edge runtime model beyond validation and normalization.
- Authentication, authorization, or multi-user ownership.

## Git Workflow

- Branch: `advisor/004-validate-patch-payloads`.
- Commit message style observed in recent history is conventional commits. Use `fix: validate patch payloads`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create a shared patch-file validator

Create `app/shared/patch-file.ts`. Use dependency-free TypeScript; do not add a schema library for this small v1 shape.

Export types and functions:

- `PatchFileV1`: version 1, optional id/timestamps, name, nodes, edges, optional viewport.
- `PatchBodyInput`: name/nodes/edges/viewport accepted by create/update routes.
- `validatePatchBody(input: unknown): PatchBodyInput`: for server request bodies.
- `validateImportedPatch(input: unknown): { name: string, nodes: Record<string, unknown>[], edges: Record<string, unknown>[], viewport?: Record<string, unknown> }`: for client imports.
- `validateExistingPatch(input: unknown): Partial<PatchFileV1>`: for update route fallback after reading an existing file.

Validation rules for this first pass:

- `name`: optional string, trim to a maximum of 120 characters; fallback handled by caller.
- `nodes`: optional array for server body, required array for imported patch; maximum 500 entries.
- `edges`: optional array for server body, required array for imported patch; maximum 1000 entries.
- Each node/edge must be a non-null plain object. Do not deeply validate Vue Flow internals in this plan.
- `viewport`: optional plain object with finite numeric `x`, `y`, and `zoom` if present; reject non-object or non-finite values.
- Reject payloads whose JSON string length is above a clear constant such as `MAX_PATCH_BYTES = 2_000_000` when validation receives a string or when callers pass raw text.

Return normalized plain objects; do not mutate caller input.

**Verify**: `cd app && bun run typecheck` -> exit 0.

### Step 2: Add validator tests

Create `app/shared/patch-file.test.ts` with Vitest tests for:

- Valid minimal server body normalizes to empty or provided arrays.
- Valid imported patch with version 1, name, nodes, edges, viewport passes.
- Invalid version, non-array nodes, non-array edges, non-object node entry, non-finite viewport zoom, too many nodes, too many edges, and oversized raw text are rejected.
- Names longer than the maximum are trimmed/truncated consistently.

Use only safe synthetic patch objects; do not read local patch data or `.env`.

**Verify**: `cd app && bun run test` -> exit 0.

### Step 3: Validate server create and update bodies

Update `app/server/api/patches/index.post.ts`:

- Replace `await readBody<PatchBody>(event)` with `validatePatchBody(await readBody<unknown>(event))`.
- Use the normalized result when constructing `patch`.
- Keep ID creation with `randomUUID()`.
- Return 400 for validation failures. If `validatePatchBody` throws ordinary `Error`s, catch them at the route boundary and convert to `createError({ statusCode: 400, statusMessage: error.message })`.

Update `app/server/api/patches/[id].post.ts`:

- Preserve Plan 002's `assertPatchId`/safe path work if present.
- Validate the request body before constructing the patch.
- When reading existing file content, use `validateExistingPatch(JSON.parse(raw))` before trusting fallback fields.
- Keep backward-compatible fallback behavior: missing body fields can use existing values or defaults.

**Verify**: `cd app && bun run test` -> exit 0.

### Step 4: Validate client import through the shared helper

Update `app/app/stores/data.ts` import logic:

- Parse JSON as today.
- Call `validateImportedPatch(parsed)`.
- Use the validated return value for `pendingImportData`, `currentPatchName`, and optional `viewport`.
- Preserve the current public error messages where possible: invalid JSON -> `Invalid JSON`, invalid shape -> `Invalid patch file format` or the validator's concise message.

Import from `../../shared/patch-file` relative to `app/app/stores/data.ts` unless the repo's Nuxt aliases make a cleaner tested import available.

**Verify**: `cd app && bun run typecheck` -> exit 0.

### Step 5: Run app checks

Run all app verification.

**Verify**:

- `cd app && bun run test` -> exit 0.
- `cd app && bun run typecheck` -> exit 0.
- `cd app && bun run lint` -> exit 0.

## Test Plan

- New `app/shared/patch-file.test.ts` covers validation success, malformed payloads, bounds, viewport, and oversized input.
- Existing Plan 001 app tests continue to pass.
- Manual browser check: import a valid exported patch and confirm the editor navigates to `/patches/new` with nodes/edges loaded; try importing malformed JSON and confirm the UI reports an error instead of loading a broken graph.

## Done Criteria

- [ ] Server create/update routes no longer trust `readBody<PatchBody>` as runtime validation.
- [ ] Client import no longer casts parsed nodes/edges directly after only array checks.
- [ ] `app/shared/patch-file.test.ts` exists and passes.
- [ ] `cd app && bun run test` exits 0.
- [ ] `cd app && bun run typecheck` exits 0.
- [ ] `cd app && bun run lint` exits 0.
- [ ] No files outside the in-scope list are modified.
- [ ] `plans/README.md` status row for 004 updated.

## STOP Conditions

Stop and report back (do not improvise) if:

- Plan 002 has not landed and route edits would conflict with unsafe path handling. Complete Plan 002 first.
- You discover existing persisted patches intentionally exceed the proposed limits and there is a documented requirement to support them.
- Validation requires deep knowledge of every module's `data` shape. This plan intentionally validates the patch container, not every module parameter.
- A step's verification fails twice after reasonable local fixes.

## Maintenance Notes

- Future patch version changes should add a migration/normalization layer next to `app/shared/patch-file.ts` rather than loosening route validation.
- Reviewers should check that validation does not mutate node/edge objects in ways that break Vue Flow.
- The bounds are deliberately conservative first-pass constants; adjust them with tests if real user patches exceed them.
