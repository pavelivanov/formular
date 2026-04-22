# Changelog

## 4.0.0-beta.3 — unreleased

### Added

- **`formular/testing`** subpath export with a `createTestForm<T>(options)`
  helper. Returns `{ form, Provider }` — a `Form` instance you can read
  and mutate directly from test code, plus a minimal React wrapper that
  puts that form on context for rendered components. Renderer-agnostic
  (works with `@testing-library/react`, Enzyme, bare `react-dom`, etc.).
- **`FormContextProvider` now accepts an optional `form` prop.** When
  provided, the Provider puts the caller-controlled instance on context
  and skips its internal lifecycle (no `setOptions`/`setInitialValues`
  re-seed/destroy-on-unmount). Additive — existing usage is unchanged.
  Primarily for tests and advanced users who want to own the form's
  lifetime.

### Bundle

| Bundle | Limit (brotli) | Actual |
|---|---|---|
| ESM entry | 6.5 kB | 5.99 kB (+30 B for the provider split) |
| CJS entry | 7 kB | 6.25 kB |
| Tree-shaken core | 5 kB | 4.35 kB |
| Devtools subpath | 5 kB | 3.12 kB |
| Testing subpath | 5 kB | **4.21 kB (new)** |

## 4.0.0-beta.2 — unreleased

### Added

- **`formular/devtools`** subpath export with a floating
  `<FormularDevtools />` inspection panel. Three tabs: state (values,
  errors, flags), fields (registered paths + per-field flags), events
  (rolling log of every form event). Self-contained inline styles, no
  portals, no global CSS, opt-in via explicit render. Props for
  position, default open/tab, and an `enabled` kill-switch.
- Shipping as a subpath export of the same package (not a separate
  npm name) — single version, and tree-shakes out of the main bundle
  when not imported. The devtools bundle weighs **3.1 KB brotli**;
  main bundle is unchanged.
- Integrated into `examples/vite-react` so you can poke at it via
  `npm run dev`.

### Changed

- `tsdown.config.ts` switched from a single multi-entry build to two
  independent build passes (`dist/index.js` + `dist/devtools/index.js`).
  The multi-entry approach produced a shared chunk that every entry
  had to load, inflating the main bundle for consumers that don't use
  devtools. Two passes produce self-contained bundles — devtools pays
  a small code-duplication cost, main bundle stays lean.

### Bundle

| Bundle | Limit (brotli) | Actual |
|---|---|---|
| ESM entry | 6.5 kB | 5.96 kB (unchanged) |
| CJS entry | 7 kB   | 6.22 kB (unchanged) |
| Tree-shaken core | 5 kB | 4.32 kB (unchanged) |
| Devtools subpath | 5 kB | **3.12 kB (new)** |

## 4.0.0-beta.1

First published release of the v4 line. The pre-release line under the
`next` dist-tag; `latest` remains on v3 until external adopters
confirm stability. Rollup of everything built across six in-tree alphas.

### Summary

- Ground-up rewrite. The public API from v3 is **not** preserved — see
  [MIGRATION.md](./MIGRATION.md) for the v3 → v4 mapping.
- Class-based `Form<T>` + `FieldManager<T>` pair. `FormContextProvider`
  puts a single form on React context; hooks subscribe to it via
  `useSyncExternalStore`. Components re-render only on the slice they
  read.
- Peer dep: `react >=18`. Bundle: **5.96 KB brotli** (ESM, everything),
  **4.32 KB** (tree-shaken core). Under CI size budgets.

### What's in this release

#### Core

- `Form<T>` / `FieldManager<T>` replace v3's `Form` / `Field` /
  `FormGroup` trio. Nesting is expressed via field names; `FormGroup`
  is not ported.
- `FormContextProvider<T>` + `useFormContext<T>` for an ambient form.
- `useSyncExternalStore`-based hooks — `useForm`, `useFormState`,
  `useFieldRegister`, `useField`, `useFormValidation` — each
  subscribes to a specific slice so siblings don't thrash.
- Async validation sequenced by a monotonic counter (replaces v3's
  `CancelablePromise`). Stale runs discard themselves.
- `handleSubmit(onSuccess?)` returns a React-safe submit handler.
  Distinct `submit` and `submit error` events with a
  `phase: 'submit' | 'onSuccess'` tag on errors.
- `setValues` / `setInitialValues` buffer writes for fields that
  haven't registered yet, so async-hydrated data doesn't race field
  mounts.

#### Typed API (the headline)

- **`createForm<T>()` factory** closes the form shape over a namespace
  of hooks — `useFieldRegister`, `useFieldArray`, `useField`, plus the
  Provider — so literal path arguments narrow at the call site:

  ```ts
  const contact = createForm<ContactForm>()
  const street = contact.useFieldRegister('address.street')
  //    ^? FieldManager<string>
  ```

  TypeScript's partial-explicit-generic inference doesn't narrow
  `const` type parameters in hook signatures; the factory sidesteps
  that by keeping only one generic in play at call-sites.

- **Typed nested paths**: `Path<T>`, `PathValue<T, P>`, `ArrayPath<T>`,
  and `DeepPartial<T>` are exported. `setValues` / `setInitialValues`
  take `DeepPartial<T>` and walk down to each registered field.
  `getValues()` reconstructs the nested shape.

#### Validation

- **Standard Schema v1** accepted directly at the field level
  (Zod 3.24+, Valibot 0.40+, ArkType, …). The `FieldOptions.schema`
  option runs the schema before `validators`; the first issue message
  becomes the field error. No `@hookform/resolvers`-style adapter
  package required — the interface is inlined at
  `src/standard-schema.ts` and re-exported as `StandardSchemaV1`.
- Pipeline order: `required` → `schema` → `validators`. Each stage
  short-circuits on the first error.
- 15 built-in function validators kept for BYO (`minLength`,
  `maxLength`, `pattern`, `email`, `url`, `phoneNumber`, `numeric`,
  `min`, `max`, `creditCard`, `dateFormat`, `minAge`, `confirmField`,
  `asyncValidator`, `compose`). Recommendation in the README: prefer
  `schema` for new projects.

#### Field arrays

- **`useFieldArray(path)`** with the usual list operations: `append`,
  `prepend`, `insert`, `remove`, `swap`, `move`, `replace`, `clear`.
  Returns `{ fields, ...ops }` where `fields[i].id` is stable across
  mutations so React keys survive reorders.
- **Per-row field reindexing**: sub-fields registered at
  `items.<N>.<rest>` are atomically renamed when list operations run.
  A field's state (value, error, touched, subscriptions) carries over
  to its new index rather than being orphaned. `replace` and `clear`
  destroy the sub-fields; new rows register fresh. Observable via the
  `field renamed` event.

#### Components

- Headless `FieldLabel` and `FieldError`. Plain `<label>` and an
  `aria-live="polite"` div. No styling opinions — pass your own
  classNames.

### Tooling

- Build: **tsdown**. ESM + CJS output with a proper `exports` map and
  `sideEffects: false`.
- Test: **Vitest**. 74 tests colocated under `src/**/*.spec.ts`.
- Lint: ESLint 9 flat config.
- CI matrix: Node 18 / 20 / 22 running `typecheck` + `lint` + `build`
  + `test` + `size`.
- Bundle-size budget in CI via `size-limit`:

  | Bundle | Limit (brotli) | Actual |
  |---|---|---|
  | ESM entry | 6.5 kB | 5.96 kB |
  | CJS entry | 7 kB   | 6.22 kB |
  | Tree-shaken core | 5 kB | 4.32 kB |

### Notable fixes discovered during the alpha series

- `setByPath` used to mutate caller-owned arrays and objects when
  reconstructing form state, which silently corrupted field-array
  internals (`out.rows[2] = {}` on a 2-item field would expand the
  live array to 3 items). `setByPath` now shallow-copies each
  container on descend.
- `unregisterField` now takes an optional `expectedField` reference
  and skips destruction if a different FieldManager occupies the
  path — otherwise a stale `useEffect` cleanup could destroy a field
  that a concurrent array reindex moved there.
- `FieldManager.validate` no longer hangs when a validator throws
  (v3 bug that survived into alpha.1; fixed in alpha.2).

### Example app

`examples/vite-react` is a runnable Vite + React 19 contact form
exercising nested paths, `useFieldArray`, and Zod schemas (including
an async `.refine()`). See its [README](./examples/vite-react/README.md).

---

## 3.1.7 — unreleased (on master, not published)

Stabilization of the v3 line. Safe to upgrade from any 3.x. Will be
published as a legacy patch if demand materialises.

- Fix: `FormGroup` subscription leak — debounced-factory handlers
  replaced with a per-form handler map so `unsubscribe` matches.
  `attachForms` / `detachForms` now manage subscription lifecycle.
- Fix: `Field.setRef` rebinds cleanly — removes listeners from the
  previous node before attaching new ones; no-op on the same node.
- Fix: `Form.submit` / `FormGroup.submit` wrap validation in
  try/finally and toggle `state.isSubmitting` (previously an unused
  state flag). `Field.set` short-circuits while submitting,
  eliminating the captured-values vs returned-errors divergence.
- Fix: `Field.validate` no longer hangs forever when a validator
  throws.
- Fix: `Events.call` re-throws handler errors via
  `setTimeout(fn, 0)` so they reach global error handlers, while the
  dispatch loop still reaches every listener.
- Chore: Toolchain refresh — TypeScript 3.8 → 5.4, Jest 24 → 29 +
  ts-jest, Rollup 2 → 4, Babel removed. Adds ESLint + Prettier +
  GitHub Actions CI matrix.

## 3.1.6 and earlier

The v3 line. See `git log v3.1.6` for history prior to the v4 rewrite.
