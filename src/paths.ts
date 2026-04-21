/**
 * Typed path utilities over a form's value shape.
 *
 * `Path<T>` produces the union of every navigable string path into `T`,
 * using dotted notation for nested keys. Arrays are treated as leaves —
 * `tags: string[]` gives you `'tags'` but not `'tags.0'`. Field-array
 * support will be layered on top later.
 *
 * `PathValue<T, P>` reads the value type at `P`. `DeepPartial<T>` allows
 * partial shapes for `setValues` / `setInitialValues`.
 */

type IsPlainObject<T> = T extends object
  ? T extends Array<any>
    ? false
    : T extends ReadonlyArray<any>
      ? false
      : T extends Date
        ? false
        : T extends (...args: any[]) => any
          ? false
          : true
  : false

type PathImpl<T, K extends keyof T> = K extends string | number
  ? IsPlainObject<T[K]> extends true
    ? `${K}` | `${K}.${PathImpl<T[K], keyof T[K]>}`
    : `${K}`
  : never

export type Path<T> = [ T ] extends [ never ]
  ? never
  : IsPlainObject<T> extends true
    ? PathImpl<T, keyof T>
    : never

export type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never

export type DeepPartial<T> = T extends Array<infer U>
  ? Array<U>
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T

/**
 * Subset of `Path<T>` whose value is an array (or readonly array). Used to
 * constrain `useFieldArray` to paths that actually point at a collection.
 */
export type ArrayPath<T> = {
  [P in Path<T>]: PathValue<T, P> extends ReadonlyArray<any> ? P : never
}[Path<T>]

/**
 * Walks `obj` by a dotted path, creating intermediate containers as needed,
 * and sets the leaf value. Mutates `obj`.
 *
 * When descending into an existing array or object, replaces it with a
 * shallow copy first. This matters because the caller (Form.getValues)
 * feeds whole-array field values into `obj` as-is; without the copy-on-
 * descend step, subsequent calls would mutate those live values (e.g.
 * assigning `out.rows[2] = {}` to a 2-item field array would expand the
 * field's internal state to 3 items).
 *
 * Numeric-looking path segments get materialised as arrays so
 * `setByPath({}, 'rows.0.name', 'x')` produces `{ rows: [{ name: 'x' }] }`
 * rather than `{ rows: { '0': { name: 'x' } } }`.
 */
export function setByPath(obj: Record<string, any>, path: string, value: unknown): void {
  const parts = path.split('.')
  let cursor: Record<string, any> = obj

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i] as string
    const next = cursor[part]
    if (next === null || typeof next !== 'object') {
      const nextPart = parts[i + 1] as string
      cursor[part] = /^\d+$/.test(nextPart) ? [] : {}
    }
    else {
      cursor[part] = Array.isArray(next) ? [ ...next ] : { ...next }
    }
    cursor = cursor[part]
  }

  cursor[parts[parts.length - 1] as string] = value
}

/**
 * Test whether a value is a plain object (and therefore eligible for
 * recursive flattening). Arrays, Dates, class instances and functions
 * count as leaves.
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  if (Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === null || proto === Object.prototype
}
