import { useState } from 'react'
import { z } from 'zod'

import { FieldError, FieldLabel, createForm, useFieldRegister } from 'formular'
import { FormularDevtools } from 'formular/devtools'

// Form shape — drives the typing of every form.useFieldRegister /
// form.useFieldArray call below. Paths are checked against this.
type ContactForm = {
  name: string
  email: string
  address: {
    street: string
    city: string
    zip: string
  }
  tags: string[]
  bio: string
}

// Single factory call at module scope gives us a bundle of hooks + the
// Provider, all typed against ContactForm. Inside components we just call
// `contact.useFieldRegister('address.street')` and inference does the rest.
const contact = createForm<ContactForm>()

// Field-level Zod schemas — Standard Schema v1 means formular takes these
// directly, no adapter package needed.
const schemas = {
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .email('Invalid email')
    .refine(
      async (value) => {
        await new Promise((r) => setTimeout(r, 400))
        return value !== 'taken@example.com'
      },
      { message: 'This email is already registered' },
    ),
  street: z.string().min(1, 'Required'),
  city: z.string().min(1, 'Required'),
  zip: z.string().regex(/^\d{5}$/, 'Must be a 5-digit ZIP'),
  tag: z.string().min(1, 'Tag cannot be empty'),
  bio: z.string().max(280, 'Keep it under 280 characters'),
}

type ResultSnapshot = {
  values?: ContactForm
  errors?: Record<string, string> | null
  isValid?: boolean
}

export function App() {
  const [ lastResult, setLastResult ] = useState<ResultSnapshot | null>(null)

  return (
    <main>
      <h1>formular — contact form</h1>
      <p className="lede">
        Nested paths via <code>address.zip</code>, field array via{' '}
        <code>useFieldArray('tags')</code>, validation by Zod schemas
        attached per field. Try submitting with an empty name, or
        using <code>taken@example.com</code> for the email to see async
        validation.
      </p>

      <contact.FormContextProvider
        initialValues={{
          name: '',
          email: '',
          address: { street: '', city: '', zip: '' },
          tags: [],
          bio: '',
        }}
        onSubmit={(values) => {
          setLastResult({ values, errors: null, isValid: true })
        }}
      >
        {/* Render devtools first so it subscribes in time to catch
            the initial field-registration events. */}
        <FormularDevtools />
        <ContactFormBody
          onSubmitError={(errors, values, isValid) =>
            setLastResult({ values, errors, isValid })
          }
        />
      </contact.FormContextProvider>

      {lastResult && (
        <pre className="output">
          {lastResult.isValid ? (
            <>
              <span className="ok">valid submit</span>
              {'\n\n'}
              {JSON.stringify(lastResult.values, null, 2)}
            </>
          ) : (
            <>
              submit blocked by validation
              {'\n\n'}
              {JSON.stringify(lastResult.errors, null, 2)}
            </>
          )}
        </pre>
      )}
    </main>
  )
}

function ContactFormBody({
  onSubmitError,
}: {
  onSubmitError: (
    errors: Record<string, string> | null,
    values: ContactForm,
    isValid: boolean,
  ) => void
}) {
  const form = contact.useForm()
  const { isSubmitting, isValidating, isValid } = contact.useFormState()

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        const result = await form.submit()
        if (!result.isValid) {
          onSubmitError(result.errors, result.values, result.isValid)
        }
      }}
    >
      <NameField />
      <EmailField />

      <fieldset>
        <legend>Address</legend>
        <StreetField />
        <CityField />
        <ZipField />
      </fieldset>

      <TagsField />
      <BioField />

      <div className="submit-bar">
        <button type="submit" disabled={isSubmitting || isValidating || !isValid}>
          {isSubmitting ? 'Submitting…' : isValidating ? 'Validating…' : 'Submit'}
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => form.reset()}
          disabled={isSubmitting}
        >
          Reset
        </button>
      </div>
    </form>
  )
}

function NameField() {
  const field = contact.useFieldRegister('name', {
    schema: schemas.name,
    required: true,
  })

  return (
    <div className="field">
      <FieldLabel field={field}>
        Name<span className="req">*</span>
      </FieldLabel>
      <input
        id={field.name}
        value={field.state.value ?? ''}
        onChange={(e) => field.setValue(e.target.value)}
        aria-invalid={Boolean(field.state.error)}
      />
      <FieldError field={field} className="err" />
    </div>
  )
}

function EmailField() {
  const field = contact.useFieldRegister('email', {
    schema: schemas.email,
    required: true,
    validationDelay: 300,
  })

  return (
    <div className="field">
      <FieldLabel field={field}>
        Email<span className="req">*</span>
      </FieldLabel>
      <input
        id={field.name}
        type="email"
        value={field.state.value ?? ''}
        onChange={(e) => field.setValue(e.target.value)}
        aria-invalid={Boolean(field.state.error)}
      />
      <FieldError field={field} className="err" />
      {field.state.isValidating && (
        <div className="err" style={{ color: 'var(--text-dim)' }}>
          checking availability…
        </div>
      )}
    </div>
  )
}

function StreetField() {
  const field = contact.useFieldRegister('address.street', {
    schema: schemas.street,
    required: true,
  })
  return <TextField label="Street" field={field} />
}

function CityField() {
  const field = contact.useFieldRegister('address.city', {
    schema: schemas.city,
    required: true,
  })
  return <TextField label="City" field={field} />
}

function ZipField() {
  const field = contact.useFieldRegister('address.zip', {
    schema: schemas.zip,
    required: true,
  })
  return <TextField label="ZIP" field={field} />
}

function TextField({
  label,
  field,
}: {
  label: string
  field: ReturnType<typeof contact.useFieldRegister<'address.street'>>
}) {
  return (
    <div className="field">
      <FieldLabel field={field}>
        {label}
        <span className="req">*</span>
      </FieldLabel>
      <input
        id={field.name}
        value={field.state.value ?? ''}
        onChange={(e) => field.setValue(e.target.value)}
        aria-invalid={Boolean(field.state.error)}
      />
      <FieldError field={field} className="err" />
    </div>
  )
}

function TagsField() {
  const { fields, append, remove } = contact.useFieldArray('tags')

  return (
    <fieldset>
      <div className="tags-header">
        <legend>Tags</legend>
        <button type="button" className="ghost" onClick={() => append('')}>
          + add tag
        </button>
      </div>

      {fields.length === 0 && (
        <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: 0 }}>
          No tags yet. Add one — each is validated as a non-empty string.
        </p>
      )}

      {fields.map((item) => (
        <TagRow key={item.id} index={item.index} onRemove={() => remove(item.index)} />
      ))}
    </fieldset>
  )
}

function TagRow({ index, onRemove }: { index: number; onRemove: () => void }) {
  // `tags.<N>` is not part of the typed Path<ContactForm> surface because
  // arrays are leaves in the type-level path model. Use the ad-hoc
  // escape-hatch `useFieldRegister<T>(name)` hook for per-row state.
  const field = useFieldRegister<string>(`tags.${index}`, {
    schema: schemas.tag,
  })

  return (
    <div className="field">
      <div className="row">
        <input
          value={field.state.value ?? ''}
          onChange={(e) => field.setValue(e.target.value)}
          aria-invalid={Boolean(field.state.error)}
          placeholder={`Tag #${index + 1}`}
        />
        <button type="button" className="danger remove" onClick={onRemove}>
          remove
        </button>
      </div>
      <FieldError field={field} className="err" />
    </div>
  )
}

function BioField() {
  const field = contact.useFieldRegister('bio', {
    schema: schemas.bio,
  })

  return (
    <div className="field">
      <FieldLabel field={field}>Bio</FieldLabel>
      <textarea
        id={field.name}
        rows={3}
        value={field.state.value ?? ''}
        onChange={(e) => field.setValue(e.target.value)}
        aria-invalid={Boolean(field.state.error)}
      />
      <FieldError field={field} className="err" />
    </div>
  )
}
