export type DebouncedFunction<T extends (...args: any[]) => any> = ((
  ...args: Parameters<T>
) => void) & {
  cancel: () => void
  flush: () => void
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
): DebouncedFunction<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null
  let lastThis: unknown = null

  const invoke = () => {
    if (lastArgs) {
      fn.apply(lastThis, lastArgs)
    }
    lastArgs = null
    lastThis = null
    timer = null
  }

  const debounced = function (this: unknown, ...args: Parameters<T>) {
    lastArgs = args
    lastThis = this
    if (timer !== null) {
      clearTimeout(timer)
    }
    timer = setTimeout(invoke, wait)
  } as DebouncedFunction<T>

  debounced.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
    lastArgs = null
    lastThis = null
  }

  debounced.flush = () => {
    if (timer !== null) {
      clearTimeout(timer)
      invoke()
    }
  }

  return debounced
}
