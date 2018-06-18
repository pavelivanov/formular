class Event {

  /**
   *
   * @param name {string}
   */
  constructor(name) {
    this.name = name
    this.handlers = []
  }

  /**
   * Add handler to current Event
   *
   * @param handler {function}
   */
  addHandler(handler) {
    return this.handlers.push(handler)
  }

  /**
   * Call all handlers in all priorities of current Event
   *
   * @param eventArgs {...array}
   */
  call(...eventArgs) {
    this.handlers.forEach((handler) => handler(...eventArgs))
  }
}

class EventAggregator {

  constructor() {
    this.events = {}
  }

  /**
   * Get Event by name
   *
   * @param name
   * @returns {*}
   */
  getEvent(name) {
    let event = this.events[name]

    if (!event) {
      event = new Event(name)
      this.events[name] = event
    }

    return event
  }

  /**
   *
   * @param name {string}
   * @param eventArgs {...array}
   */
  dispatchEvent(name, ...eventArgs) {
    const event = this.getEvent(name)

    if (event) {
      event.call(...eventArgs)
    }
  }

  /**
   *
   * @param name {string}
   * @param handler {function}
   * @returns {{ event: *, handler: * }}
   */
  subscribe(name, handler) {
    const event = this.getEvent(name)

    event.addHandler(handler)

    return { event, handler }
  }
}


export default new EventAggregator()
