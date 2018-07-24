class Event {

  /**
   *
   * @param {String} name
   */
  constructor(name) {
    this.name = name
    this.handlers = []
  }

  /**
   * Add handler to current Event
   *
   * @param {function} handler
   */
  addHandler(handler) {
    return this.handlers.push(handler)
  }

  /**
   * Call all handlers in all priorities of current Event
   *
   * @param {...array} eventArgs
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
   * Get event by name
   *
   * @param {String} name
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
   * Dispatch event
   *
   * @param {String} name
   * @param {...array} eventArgs
   */
  dispatchEvent(name, ...eventArgs) {
    const event = this.getEvent(name)

    if (event) {
      event.call(...eventArgs)
    }
  }

  /**
   * Add handler
   *
   * @param {String} name
   * @param {Function} handler
   * @returns {{ event: *, handler: * }}
   */
  subscribe(name, handler) {
    const event = this.getEvent(name)

    event.addHandler(handler)

    return { event, handler }
  }
}


export default new EventAggregator()
