import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'

import type { FieldState, FormState } from '../types'
import type { Form } from '../Form'
import { eventNames } from '../Form'
import { useFormContext } from '../FormContext'

/**
 * Maximum number of recent events kept in the rolling buffer. Plenty for
 * debugging; keeps the panel from bloating if a form fires thousands.
 */
const MAX_EVENTS = 50

type EventKind =
  | 'state change'
  | 'change'
  | 'field registered'
  | 'field unregistered'
  | 'field renamed'
  | 'submit'
  | 'submit error'

type LoggedEvent = {
  id: number
  at: number
  kind: EventKind
  detail: string
}

export type FormularDevtoolsPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left'

export interface FormularDevtoolsProps {
  /**
   * The form to inspect. When omitted, the component reads the ambient
   * `FormContextProvider`. Supply this when you want to inspect a form
   * that lives in a different subtree.
   */
  form?: Form<any>
  /** Which corner of the viewport the toggle sits in. */
  position?: FormularDevtoolsPosition
  /** Initial panel visibility. Defaults to false (collapsed). */
  defaultOpen?: boolean
  /** Starting tab. Defaults to 'state'. */
  defaultTab?: DevtoolsTab
  /** When true (default), the panel renders nothing. Wrap manually with
   * `process.env.NODE_ENV !== 'production'` if you want an auto-kill-
   * switch without a rebuild; left here as an explicit override. */
  enabled?: boolean
}

type DevtoolsTab = 'state' | 'fields' | 'events'

/**
 * Floating inspection panel for a formular `Form`. Shows live form state,
 * registered fields + their state, and a rolling log of emitted events.
 *
 * Renders nothing when `enabled={false}` or when there is no form in
 * context. Use inline — the component is fully self-contained (no shared
 * CSS, no portals, no global side effects).
 *
 * ```tsx
 * <FormContextProvider<Contact>>
 *   <ContactFormBody />
 *   {process.env.NODE_ENV !== 'production' && <FormularDevtools />}
 * </FormContextProvider>
 * ```
 */
export function FormularDevtools({
  form: formProp,
  position = 'bottom-right',
  defaultOpen = false,
  defaultTab = 'state',
  enabled = true,
}: FormularDevtoolsProps): ReactNode {
  const ambient = useContextOrNull()
  const form = formProp ?? ambient

  const [ open, setOpen ] = useState(defaultOpen)
  const [ tab, setTab ] = useState<DevtoolsTab>(defaultTab)
  const [ events, setEvents ] = useState<LoggedEvent[]>([])

  const state = useFormStateSnapshot(form)

  useEffect(() => {
    if (!enabled || !form) return

    let nextId = 0
    const push = (kind: EventKind, detail: string) => {
      const entry: LoggedEvent = {
        id: ++nextId,
        at: Date.now(),
        kind,
        detail,
      }
      setEvents((prev) => {
        const next = prev.length >= MAX_EVENTS ? prev.slice(-MAX_EVENTS + 1) : prev
        return [ ...next, entry ]
      })
    }

    const unsubs = [
      form.on(eventNames.stateChange, (_s: FormState) => push('state change', '')),
      form.on(eventNames.change, (values: unknown) => push('change', truncate(values))),
      form.on(eventNames.fieldRegistered, (name: string) =>
        push('field registered', String(name)),
      ),
      form.on(eventNames.fieldUnregistered, (name: string) =>
        push('field unregistered', String(name)),
      ),
      form.on(eventNames.fieldRenamed, (oldPath: string, newPath: string) =>
        push('field renamed', `${oldPath} → ${newPath}`),
      ),
      form.on(eventNames.submit, (payload: unknown) => push('submit', truncate(payload))),
      form.on(
        eventNames.submitError,
        (error: unknown) =>
          push('submit error', error instanceof Error ? error.message : String(error)),
      ),
    ]

    return () => {
      unsubs.forEach((u) => u())
    }
  }, [ form, enabled ])

  if (!enabled || !form) return null

  const fieldList = useMemo(() => collectFields(form), [ form, state ])

  return (
    <div style={shellStyle(position)} data-testid="formular-devtools">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={toggleStyle(open)}
        aria-expanded={open}
        aria-label={open ? 'Close formular devtools' : 'Open formular devtools'}
      >
        {open ? '×' : 'formular'}
      </button>

      {open && (
        <div style={panelStyle} role="region" aria-label="formular devtools">
          <header style={headerStyle}>
            <strong style={{ fontSize: 12, letterSpacing: 0.4 }}>
              {form.formId ? `form · ${form.formId}` : 'form'}
            </strong>
            <span style={stateBadgeStyle(state)}>
              {state.isSubmitting
                ? 'submitting'
                : state.isValidating
                  ? 'validating'
                  : state.isValid
                    ? 'valid'
                    : 'invalid'}
            </span>
          </header>

          <nav style={tabsStyle}>
            {([ 'state', 'fields', 'events' ] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                style={tabButtonStyle(tab === t)}
                aria-current={tab === t ? 'true' : undefined}
              >
                {t}
                {t === 'fields' && fieldList.length > 0 && (
                  <span style={countBadgeStyle}>{fieldList.length}</span>
                )}
                {t === 'events' && events.length > 0 && (
                  <span style={countBadgeStyle}>{events.length}</span>
                )}
              </button>
            ))}
          </nav>

          <div style={bodyStyle}>
            {tab === 'state' && <StatePanel state={state} />}
            {tab === 'fields' && <FieldsPanel fields={fieldList} />}
            {tab === 'events' && <EventsPanel events={events} />}
          </div>
        </div>
      )}
    </div>
  )
}

// -------------------------------------------------------------------
// Hooks

function useContextOrNull(): Form<any> | null {
  try {
    return useFormContext<Record<string, any>>()
  }
  catch {
    // Rendered outside a provider — fine, show nothing.
    return null
  }
}

function useFormStateSnapshot(form: Form<any> | null): FormState {
  const subscribe = (onChange: () => void) => {
    if (!form) return () => {}
    return form.on(eventNames.stateChange, onChange)
  }
  const getSnapshot = () => form?.state ?? EMPTY_STATE
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

const EMPTY_STATE: FormState = {
  isValid: true,
  isChanged: false,
  isValidating: false,
  isSubmitting: false,
  isSubmitted: false,
  values: {},
  errors: {},
}

// -------------------------------------------------------------------
// Sub-panels

function StatePanel({ state }: { state: FormState }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <FlagsRow state={state} />
      <Labeled label="values">
        <JsonPreview value={state.values} />
      </Labeled>
      <Labeled label="errors">
        {Object.keys(state.errors).length === 0 ? (
          <div style={mutedStyle}>none</div>
        ) : (
          <JsonPreview value={state.errors} />
        )}
      </Labeled>
    </div>
  )
}

type FieldRow = {
  name: string
  state: Readonly<FieldState<unknown>>
}

function FieldsPanel({ fields }: { fields: FieldRow[] }) {
  if (fields.length === 0) {
    return <div style={mutedStyle}>No fields registered.</div>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {fields.map((field) => (
        <div key={field.name} style={fieldRowStyle}>
          <div style={fieldRowHeaderStyle}>
            <span style={{ fontWeight: 600 }}>{field.name}</span>
            <FieldFlags state={field.state} />
          </div>
          <div style={{ marginTop: 4 }}>
            <JsonPreview value={field.state.value} />
          </div>
          {field.state.error && (
            <div style={errorInlineStyle}>{field.state.error}</div>
          )}
        </div>
      ))}
    </div>
  )
}

function EventsPanel({ events }: { events: LoggedEvent[] }) {
  if (events.length === 0) {
    return <div style={mutedStyle}>No events yet.</div>
  }
  // Newest first.
  const ordered = [ ...events ].reverse()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {ordered.map((event) => (
        <div key={event.id} style={eventRowStyle}>
          <span style={eventTimeStyle}>{formatTime(event.at)}</span>
          <span style={eventKindStyle(event.kind)}>{event.kind}</span>
          {event.detail && <span style={eventDetailStyle}>{event.detail}</span>}
        </div>
      ))}
    </div>
  )
}

function FlagsRow({ state }: { state: FormState }) {
  const flags: Array<[ keyof FormState, boolean ]> = [
    [ 'isValid', state.isValid ],
    [ 'isChanged', state.isChanged ],
    [ 'isValidating', state.isValidating ],
    [ 'isSubmitting', state.isSubmitting ],
    [ 'isSubmitted', state.isSubmitted ],
  ]
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {flags.map(([ key, on ]) => (
        <span key={String(key)} style={flagPillStyle(on)}>
          {String(key)}
        </span>
      ))}
    </div>
  )
}

function FieldFlags({ state }: { state: Readonly<FieldState<unknown>> }) {
  const flags: Array<[ string, boolean ]> = [
    [ 'touched', state.isTouched ],
    [ 'changed', state.isChanged ],
    [ 'validating', state.isValidating ],
    [ 'valid', state.isValid ],
  ]
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {flags.filter(([ , on ]) => on).map(([ key ]) => (
        <span key={key} style={flagPillStyle(true, 10)}>
          {key}
        </span>
      ))}
    </div>
  )
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      {children}
    </div>
  )
}

function JsonPreview({ value }: { value: unknown }) {
  const text = useMemo(() => safeStringify(value), [ value ])
  return <pre style={jsonStyle}>{text}</pre>
}

// -------------------------------------------------------------------
// Helpers

function collectFields(form: Form<any> | null): FieldRow[] {
  if (!form) return []
  return Object.entries(form.getAllFields())
    .map(([ name, field ]) => ({ name, state: field.state }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? 'undefined'
  }
  catch {
    return String(value)
  }
}

function truncate(value: unknown, max = 120): string {
  const text = safeStringify(value).replace(/\s+/g, ' ')
  return text.length > max ? `${text.slice(0, max)}…` : text
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const pad = (n: number): string => n.toString().padStart(2, '0')

// -------------------------------------------------------------------
// Styles (inline — no external CSS, no leaks)

const FONT = '12px/1.4 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'

function shellStyle(position: FormularDevtoolsPosition): CSSProperties {
  const pos: CSSProperties = {
    position: 'fixed',
    zIndex: 999_999,
    font: FONT,
  }
  if (position === 'bottom-right') {
    pos.right = 16
    pos.bottom = 16
  }
  else if (position === 'bottom-left') {
    pos.left = 16
    pos.bottom = 16
  }
  else if (position === 'top-right') {
    pos.right = 16
    pos.top = 16
  }
  else {
    pos.left = 16
    pos.top = 16
  }
  return pos
}

function toggleStyle(open: boolean): CSSProperties {
  return {
    font: FONT,
    background: open ? '#ff6b6b' : '#14161d',
    color: open ? '#07101e' : '#e8eaf0',
    border: '1px solid #242834',
    borderRadius: 999,
    padding: '6px 14px',
    cursor: 'pointer',
    boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
    letterSpacing: 0.4,
  }
}

const panelStyle: CSSProperties = {
  position: 'absolute',
  right: 0,
  bottom: 44,
  width: 360,
  maxHeight: 480,
  display: 'flex',
  flexDirection: 'column',
  background: '#14161d',
  color: '#e8eaf0',
  border: '1px solid #242834',
  borderRadius: 8,
  boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
  overflow: 'hidden',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 12px',
  borderBottom: '1px solid #242834',
  background: '#1a1d28',
}

function stateBadgeStyle(state: FormState): CSSProperties {
  const tone = state.isSubmitting || state.isValidating
    ? { bg: 'rgba(110, 168, 254, 0.15)', fg: '#6ea8fe' }
    : state.isValid
      ? { bg: 'rgba(110, 196, 138, 0.15)', fg: '#6ec48a' }
      : { bg: 'rgba(255, 107, 107, 0.15)', fg: '#ff6b6b' }
  return {
    background: tone.bg,
    color: tone.fg,
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 10.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  }
}

const tabsStyle: CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid #242834',
}

function tabButtonStyle(active: boolean): CSSProperties {
  return {
    flex: 1,
    font: FONT,
    color: active ? '#e8eaf0' : '#8a8fa3',
    background: active ? '#1a1d28' : 'transparent',
    border: 0,
    borderBottom: active ? '2px solid #6ea8fe' : '2px solid transparent',
    padding: '8px 10px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 10.5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  }
}

const countBadgeStyle: CSSProperties = {
  background: '#242834',
  color: '#8a8fa3',
  borderRadius: 999,
  padding: '1px 6px',
  fontSize: 10,
}

const bodyStyle: CSSProperties = {
  padding: 12,
  overflow: 'auto',
  flex: 1,
}

const labelStyle: CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: 0.6,
  color: '#8a8fa3',
  marginBottom: 4,
}

const jsonStyle: CSSProperties = {
  margin: 0,
  background: '#0b0c10',
  border: '1px solid #242834',
  borderRadius: 4,
  padding: 8,
  fontSize: 11,
  lineHeight: 1.5,
  overflow: 'auto',
  maxHeight: 180,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
}

const mutedStyle: CSSProperties = { color: '#8a8fa3', fontStyle: 'italic' }

const fieldRowStyle: CSSProperties = {
  background: '#0b0c10',
  border: '1px solid #242834',
  borderRadius: 4,
  padding: 8,
}

const fieldRowHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const errorInlineStyle: CSSProperties = {
  marginTop: 4,
  color: '#ff6b6b',
  fontSize: 11,
}

function flagPillStyle(on: boolean, size = 10.5): CSSProperties {
  return {
    background: on ? 'rgba(110, 168, 254, 0.18)' : '#242834',
    color: on ? '#6ea8fe' : '#8a8fa3',
    borderRadius: 4,
    padding: '1px 6px',
    fontSize: size,
  }
}

const eventRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto auto 1fr',
  gap: 8,
  alignItems: 'baseline',
  background: '#0b0c10',
  border: '1px solid #242834',
  borderRadius: 4,
  padding: '4px 8px',
  fontSize: 11,
}

const eventTimeStyle: CSSProperties = { color: '#8a8fa3' }

function eventKindStyle(kind: EventKind): CSSProperties {
  const tone = kind === 'submit error' || kind === 'field unregistered'
    ? '#ff6b6b'
    : kind === 'submit'
      ? '#6ec48a'
      : kind === 'field registered' || kind === 'field renamed'
        ? '#6ea8fe'
        : '#e8eaf0'
  return {
    color: tone,
    fontWeight: 600,
  }
}

const eventDetailStyle: CSSProperties = {
  color: '#8a8fa3',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
