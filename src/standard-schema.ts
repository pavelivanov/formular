/**
 * Standard Schema v1 interface, inlined from the spec at
 * https://standardschema.dev/v1/spec to avoid a runtime dependency on
 * @standard-schema/spec. Any schema library that implements the spec —
 * Zod 3.24+, Valibot 0.40+, ArkType, Yup (via adapter) — will satisfy
 * this shape without additional glue code.
 */

export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': StandardSchemaV1Props<Input, Output>
}

export interface StandardSchemaV1Props<Input = unknown, Output = Input> {
  readonly version: 1
  readonly vendor: string
  readonly validate: (
    value: unknown,
  ) => StandardSchemaV1Result<Output> | Promise<StandardSchemaV1Result<Output>>
  readonly types?: StandardSchemaV1Types<Input, Output>
}

export type StandardSchemaV1Result<Output> =
  | StandardSchemaV1SuccessResult<Output>
  | StandardSchemaV1FailureResult

export interface StandardSchemaV1SuccessResult<Output> {
  readonly value: Output
  readonly issues?: undefined
}

export interface StandardSchemaV1FailureResult {
  readonly issues: ReadonlyArray<StandardSchemaV1Issue>
}

export interface StandardSchemaV1Issue {
  readonly message: string
  readonly path?: ReadonlyArray<PropertyKey | StandardSchemaV1PathSegment>
}

export interface StandardSchemaV1PathSegment {
  readonly key: PropertyKey
}

export interface StandardSchemaV1Types<Input = unknown, Output = Input> {
  readonly input: Input
  readonly output: Output
}

/**
 * Run a Standard Schema against a value and return either `null` (valid) or
 * the first issue's message (invalid). Awaits the promise if the schema
 * returns one — sync schemas cost zero microtasks.
 */
export async function runStandardSchema<Output>(
  schema: StandardSchemaV1<unknown, Output>,
  value: unknown,
): Promise<string | null> {
  const maybePromise = schema['~standard'].validate(value)
  const result = maybePromise instanceof Promise ? await maybePromise : maybePromise

  if (result.issues === undefined) {
    return null
  }

  return result.issues[0]?.message ?? 'Invalid value'
}
