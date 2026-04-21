# Changelog

## 4.0.0-alpha.6 — unreleased

### Added

- **Per-row field reindexing in `useFieldArray`.** When a component has
  registered sub-fields under `items.<N>.<rest>` and the user calls
  `remove/insert/swap/move/prepend`, the sub-fields' state (value, error,
  touched, subscriptions) is preserved and the paths are atomically
  renamed. `replace` and `clear` destroy all sub-fields at the array
  path; new rows register fresh. Closes the last RHF-parity gap in the
  field-array story.
- `Form.on('field renamed', (oldPath, newPath) => …)` event for observers
  (devtools, logging). Fires once per sub-field moved during an array
  reindex.
- `Form._reindexArrayFields(basePath, mapping)` — internal primitive
  powering the above. Atomic three-phase swap: collect → purge old
  entries → write new entries. Handles swap-style collisions correctly.

### Fixed

- **`setByPath` mutated caller-owned arrays and objects.** When
  `Form.getValues()` built the aggregated state, writing
  `out.rows[2] = {}` for a newly-renamed sub-field would **expand the
  live `rows` field's internal array to 3 items**, poisoning subsequent
  `setValue` calls (the next `[item, ...prev]` would see the corrupted
  array). `setByPath` now shallow-copies each container it descends
  into, so writes to `out` never leak back into the source fields.
  Covered by the `useFieldArray reindexing` tests and a new
  `paths.spec.ts` case.
- **`unregisterField` identity check.** Previously, a component's
  `useEffect` cleanup with a stale `name` closure would call
  `unregisterField(oldName)` and destroy whatever field happened to be
  at that path — including a *different* FieldManager moved there by
  concurrent array reindex. `unregisterField` now accepts an optional
  `expectedField` argument; if the field at that path isn't the one the
  caller holds, the destroy is skipped. `useFieldRegister` passes its
  own field reference on cleanup.
- `Form.registerField` existing-count default changed from `?? 1` to
  `?? 0` so re-registration immediately after a rename (count cleared)
  bumps correctly from 0 → 1, not 1 → 2.

### Changed

- `FieldManager.name` is no longer `readonly` at the type level. Use
  `FieldManager._rename(newName)` (internal, called by `Form` during
  reindex) rather than direct assignment from consumer code.

## 4.0.0-alpha.5 — unreleased

### Added

- **`createForm<T>()` factory** is the new primary way to get fully typed
  hooks bound to a form shape. Call it once at module scope; the returned
  object carries `FormContextProvider`, `useForm`, `useFormContext`,
  `useFormState`, `useFormValidation`, `useFieldRegister`, `useFieldArray`,
  and `useField`, each narrowed against `T`. `useFieldRegister('address.zip')`
  now infers `FieldManager<string>` with no extra type arguments.

  Background: TypeScript doesn't narrow `const` type parameters when a
  caller supplies only *some* explicit generics — so the previous
  `useFieldRegister<ContactForm>('name')` shape always widened the
  returned field's value type to the full union of every path value.
  Closing the form shape over a factory eliminates the partial-explicit
  case entirely.

- **`examples/vite-react`** — runnable contact form exercising nested
  paths, `useFieldArray`, Zod schemas (including an async `.refine(…)`),
  and the submit lifecycle. Links from the root README.

### Changed (breaking — alpha)

- Dropped the typed `<FieldValues, P>` overload from the direct
  `useFieldRegister` and `useFieldArray` hooks. The remaining overloads
  take a plain string path plus a single `<T>` or `<Item>` generic for
  the field value type. Ad-hoc / untyped use cases are unchanged; typed
  forms should migrate to `createForm<T>()`.

### Bundle

- ESM entry: 5.55 KB brotli (+180 B for `createForm`). Tree-shaken core:
  3.96 KB. All size budgets intact.

## 4.0.0-alpha.4 — unreleased

### Added

- **`useFieldArray(path)`** hook for managing array-valued fields. Returns
  `{ fields, append, prepend, insert, remove, swap, move, replace, clear }`.
  Each `fields[i]` has a stable `id` (survives inserts/swaps/moves) for
  React keying, plus `index` and `value`. Typed via `ArrayPath<T>` — the
  hook is only callable at paths whose value is an array.
- `ArrayPath<T>` exported from the entry.

### Scope note

This hook manages the array value as a single `FieldManager<Item[]>`. It
does NOT auto-register/reindex sub-fields at `items.<N>.*` paths when
items are inserted or removed. If you need per-row field state beyond
schema validation, register those paths yourself — or layer a schema
(Zod `z.array(...)`) at the form or field level. The RHF-style
auto-reindex is a future feature.

### Bundle

- ESM entry: 5.37 KB brotli (+440 B for the hook and its 8 operations).
  Tree-shaken core: 3.95 KB (+20 B, negligible — the hook ships only when
  imported). All size budgets intact.

## 4.0.0-alpha.3 — unreleased

### Added

- **Typed nested paths.** `useFieldRegister<T>('address.street')` now accepts
  any dotted path into `T`; the returned `FieldManager` is typed as
  `PathValue<T, 'address.street'>`. Same for `form.registerField`,
  `form.getField`, `form.unregisterField`.
- `Path<T>`, `PathValue<T, P>`, and `DeepPartial<T>` exported from the entry.
- `setValues` / `setInitialValues` accept `DeepPartial<FieldValues>` and walk
  the shape down to each registered field. Registering a whole-object field
  (e.g. `'address'`) short-circuits recursion for that subtree.
- `getValues()` reconstructs the nested object from the flat storage; keys
  that weren't registered don't appear in the result.
- `getErrors()` and the `submit()` error payload use dotted-path keys
  (`{ 'address.street': '...' }`).

### Changed

- Internal field storage moved from a per-key indexed object to
  `Map<string, FieldManager<any>>` keyed by dotted path. The public
  `FormFields` export is now `Record<string, FieldManager<any>>` — the
  previous per-key typing no longer made sense once nesting was introduced.
  Use `getField(path)` for the typed variant.
- Constructor `initialValues` typed as `DeepPartial<FieldValues>` (was
  `Partial`); can be set at any depth.

### Fixed

- `_resolveConstructorInitial` walks the dotted path through
  `options.initialValues`, so nested constructor seeds apply correctly to
  nested fields (previously only top-level keys were read).

### Bundle

- ESM entry: 4.93 KB brotli (+270 B from alpha.2). Tree-shaken core: 3.93 KB.
  All size budgets still green.

## 4.0.0-alpha.2 — unreleased

### Added

- **Standard Schema v1 adapter.** `FieldOptions.schema` accepts any schema
  library that implements [Standard Schema](https://standardschema.dev)
  (Zod 3.24+, Valibot 0.40+, ArkType, …) with zero glue code. The schema
  runs before `validators` in the pipeline; the first issue message becomes
  the field error. No runtime dependency on the spec — the interface is
  inlined and re-exported as `StandardSchemaV1` for consumers.

  ```ts
  import { z } from 'zod'
  const email = useFieldRegister<ContactForm>('email', {
    schema: z.string().email(),
  })
  ```

- **Bundle-size budget.** `size-limit` wired into `npm run size` and CI.
  Targets: ESM entry < 6 KB brotli, CJS < 6.5 KB, tree-shaken core < 4.5 KB.
  Regressions fail CI.

### Changed

- Validation pipeline in `FieldManager`: `required` → `schema` → `validators`.
  Each stage short-circuits on the first error. Previously there was no
  schema stage.

## 4.0.0-alpha.1 — unreleased

Complete rewrite. The public API from v3 is **not** preserved. v3.x remains
published on npm and will continue to receive critical fixes; no new features.

### New

- **Form/FieldManager** class pair replaces v3's Form/Field/FormGroup. A Form
  now owns its fields directly; nesting is expressed via field names, not a
  separate FormGroup abstraction.
- **FormContextProvider** + **useFormContext** — single, explicit ambient form
  per subtree.
- `useSyncExternalStore`-based hooks: `useForm`, `useFormState`,
  `useFieldRegister`, `useField`, `useFormValidation`. Components re-render
  only on the slice they read.
- Async validation with sequence tagging — newer runs invalidate stale ones
  without a custom CancelablePromise.
- `setValues` / `setInitialValues` **buffer writes** for fields that haven't
  registered yet; hydration order no longer matters.
- `handleSubmit(onSuccess?)` returns a React-safe submit handler. Distinct
  `submit` and `submit error` events, with an `onSuccess`-vs-`submit` phase
  tag on errors.
- Bundled validators: `minLength`, `maxLength`, `pattern`, `email`, `url`,
  `phoneNumber`, `numeric`, `min`, `max`, `creditCard`, `dateFormat`,
  `minAge`, `confirmField`, `asyncValidator`, `compose`.
- Headless `FieldLabel` and `FieldError` components.

### Removed

- `FormGroup`. Compose by giving each logical sub-form its own
  `FormContextProvider`, or model nesting via field names.
- `Field.props.ref` / `Field.props.onChange`. Wire inputs yourself:
  `<input value={field.state.value} onChange={e => field.setValue(e.target.value)} />`.
- `FieldState` render-prop component.
- Custom `CancelablePromise` and `asyncSome` utilities.
- `@testing-library/react-hooks` devDep (replaced by `@testing-library/react`).

### Changed

- **Peer dep** bumped to `react >=18` (uses `useSyncExternalStore`).
- **Build tool**: Rollup → tsdown. ESM + CJS output, proper `exports` map.
- **Test runner**: Jest → Vitest. Tests colocated under `src/**/*.spec.ts`.
- **Module layout**: `dist/` replaces the `lib/` + `dist/` split.
- `sideEffects: false` declared for tree-shaking.

### Migration (v3 → v4)

| v3 | v4 |
|---|---|
| `new Form({ fields: { name: [validator] }, initialValues })` | `new Form({ initialValues })` + `form.registerField('name', { validators: [validator] })` |
| `form.fields.name.set(value)` | `form.setValues({ name: value })` or `field.setValue(value)` |
| `useForm({ fields: {...} })` | `<FormContextProvider<T>>` + `useFieldRegister<T>('name')` |
| `useField(field)` (takes instance) | `useFieldRegister<T>('name', options)` |
| `FormGroup` | Not ported. Compose via multiple providers. |

## 3.1.7 — unreleased (master)

Stabilization of v3. Safe to upgrade from any 3.x.

- Fix: FormGroup subscription leak — debounced-factory handlers replaced with
  per-form handler map so unsubscribe matches. attachForms/detachForms now
  manage subscription lifecycle.
- Fix: Field.setRef rebinds cleanly — removes listeners from the previous
  node before attaching new ones; no-op on same node.
- Fix: Form.submit / FormGroup.submit wrap in try/finally and toggle
  `state.isSubmitting` (previously unused). Field.set short-circuits while
  submitting, eliminating the captured-values vs returned-errors divergence.
- Fix: Field.validate no longer hangs forever when a validator throws.
- Fix: Events.call re-throws handler errors via `setTimeout(fn, 0)` so they
  reach global error handlers, while the dispatch loop still reaches every
  listener.
- Chore: Toolchain refresh — TypeScript 3.8 → 5.4, Jest 24 → 29 + ts-jest,
  Rollup 2 → 4, Babel removed. Adds ESLint + Prettier + GitHub Actions CI
  matrix (Node 18/20/22).
