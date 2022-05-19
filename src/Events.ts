class Event {

  name: string
  handlers: Array<Function>

  constructor(name: string) {
    this.name = name
    this.handlers = []
  }

  /**
   * Add handler to current Event
   */
  addHandler(handler: Function) {
    this.handlers.push(handler)
  }

  /**
   * Remove handler from current Event
   */
  removeHandler(handler: Function) {
    this.handlers = this.handlers.filter((h) => h !== handler)
  }

  /**
   * Call all handlers in all priorities of current Event
   */
  call(...eventArgs: Array<any>) {
    this.handlers.forEach((handler) => {
      try {
        handler(...eventArgs)
      }
      catch (err) {
        console.error(err)
      }
    })
  }
}

class EventAggregator<EventName extends string> {

  events: {
    [key in EventName]: Event
  }

  constructor() {
    this.events = {} as Record<EventName, Event>
  }

  /**
   * Get Event by name
   */
  getEvent(name: EventName): Event {
    let event = this.events[name]

    if (!event) {
      event = new Event(name)
      this.events[name] = event
    }

    return event
  }

  subscribe(name: EventName, handler: Function): () => void {
    const event = this.getEvent(name)

    event.addHandler(handler)

    return () => {
      this.unsubscribe(name, handler)
    }
  }

  unsubscribe(name: EventName, handler: Function) {
    const event = this.getEvent(name)

    event.removeHandler(handler)
  }

  dispatch(name: EventName, ...eventArgs: Array<any>) {
    const event = this.getEvent(name)

    if (event) {
      event.call(...eventArgs)
    }
  }

  /**
   * Subscribe to Event and unsubscribe after call
   */
  once(name: EventName, handler: Function): { event: Event, handlerWrapper: Function } {
    const event = this.getEvent(name)

    const handlerWrapper = (...args: any[]) => {
      const result = handler(...args)
      if (result) {
        event.removeHandler(handlerWrapper)
      }
    }

    event.addHandler(handlerWrapper)

    return { event, handlerWrapper }
  }
}


export default EventAggregator
