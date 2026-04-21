# formular — vite-react example

End-to-end contact form showing:

- **Nested paths** — `address.street`, `address.zip` registered from
  separate components under a single `FormContextProvider`.
- **Field arrays** — `useFieldArray('tags')` with append / remove and
  stable row keys.
- **Standard Schema** — per-field validation via Zod schemas; no adapter
  package.
- **Async validation** — email uniqueness check runs as a Zod
  `.refine(async …)` refinement with a 300ms `validationDelay`.
- **Submit lifecycle** — `useFormState().isSubmitting` disables the
  submit button, `form.submit()` resolves with `{ values, errors,
  isValid }`.
- **`createForm<T>()` factory** — typed hooks bound to `ContactForm`;
  paths infer cleanly from string literals.

## Running

```bash
npm install    # resolves `formular` via `file:../..`
npm run dev
# open http://localhost:5173
```

If you change the library source (`../../src`), rebuild it before
restarting the dev server:

```bash
(cd ../.. && npm run build) && npm run dev
```

## Things to try

- Submit with an empty name → required / minLength errors.
- Type `taken@example.com` into the email field → async validator runs
  (brief "checking availability…" label), then rejects.
- Add several tags, then remove the middle one → the rendered row
  components for the remaining tags keep their identity (no remount).
- Click Reset → every field returns to its `initialValues`.
