# Changelog

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
