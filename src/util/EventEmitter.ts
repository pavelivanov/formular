type Listener = (...args: any[]) => void

type EventMap = Record<string, Listener>

class EventEmitter<Events extends EventMap = EventMap> {

  private _listeners: Map<keyof Events, Set<Listener>> = new Map()

  private _getSet(name: keyof Events): Set<Listener> {
    let set = this._listeners.get(name)
    if (!set) {
      set = new Set()
      this._listeners.set(name, set)
    }
    return set
  }

  addListener<K extends keyof Events>(name: K, listener: Events[K]): void {
    this._getSet(name).add(listener as Listener)
  }

  removeListener<K extends keyof Events>(name: K, listener: Events[K]): void {
    this._listeners.get(name)?.delete(listener as Listener)
  }

  once<K extends keyof Events>(name: K, listener: Events[K]): void {
    const wrapper: Listener = (...args) => {
      this.removeListener(name, wrapper as Events[K])
      ;(listener as Listener)(...args)
    }
    this.addListener(name, wrapper as Events[K])
  }

  emit<K extends keyof Events>(name: K, ...args: Parameters<Events[K]>): void {
    const set = this._listeners.get(name)
    if (!set || set.size === 0) return

    // Iterate over a snapshot so a listener unsubscribing mid-dispatch doesn't
    // skip siblings. Collected errors are rethrown via setTimeout so global
    // handlers see them while the remaining listeners still fire.
    const errors: unknown[] = []
    Array.from(set).forEach((listener) => {
      try {
        listener(...args)
      }
      catch (err) {
        errors.push(err)
      }
    })
    errors.forEach((err) => {
      setTimeout(() => { throw err }, 0)
    })
  }

  removeAllListeners(name?: keyof Events): void {
    if (name === undefined) {
      this._listeners.clear()
    }
    else {
      this._listeners.delete(name)
    }
  }

  listenerCount(name: keyof Events): number {
    return this._listeners.get(name)?.size ?? 0
  }
}

export default EventEmitter
