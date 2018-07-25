class Event {

  /**
   *
   * @param {string} name
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
    this.handlers.push(handler.bind({
      unsubscribe: () => {
        this.removeHandler(handler)
      },
    }))
  }

  /**
   * Remove handler from current Event
   *
   * @param {function} handler
   * @returns {Array.<T>|*}
   */
  removeHandler(handler) {
    const handlerIndex = this.handlers.indexOf(handler)

    this.handlers.splice(handlerIndex, 1);
  }

  /**
   * Call all handlers in all priorities of current Event
   *
   * @param {...array} eventArgs
   */
  call(...eventArgs) {
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

class EventAggregator {

  constructor() {
    this.events = {}
  }

  /**
   * Get Event by name
   *
   * @param {string} name
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
   * @param {string} name
   * @param {function} handler
   * @returns {{ event: *, handler: * }}
   */
  subscribe(name, handler) {
    const event = this.getEvent(name)

    event.addHandler(handler)

    return { event, handler }
  }

  /**
   *
   * @param {string} eventName
   * @param {function} handler
   */
  unsubscribe(eventName, handler) {
    const event = this.getEvent(eventName)

    event.removeHandler(handler)
  }

  /**
   *
   * @param {string} name
   * @param {...array} eventArgs
   */
  dispatch(name, ...eventArgs) {
    const event = this.getEvent(name)

    if (event) {
      event.call(...eventArgs)
    }
  }

  /**
   * Subscribe to Event and unsubscribe after call
   *
   * @param {string} eventName
   * @param {function} handler
   * @returns {{ event: *, handlerWrapper: (function(...[*])) }}
   */
  once(eventName, handler) {
    const event = this.getEvent(eventName)

    const handlerWrapper = (...args) => {
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
