export type Listener = (...args: any[]) => any

class EventEmitter<EventName extends string = string> {
  private listeners: Record<string, Array<Listener>>
  private onceEmitter?: EventEmitter
  constructor(withOnce = true) {
    this.listeners = {}
    if (withOnce) {
      this.onceEmitter = new EventEmitter(false)
    }
  }

  private static emit<E extends EventEmitter, T extends Array<any>>(emitter: E, eventName: string, ...args: T) {
    if (emitter.listeners[eventName] && emitter.listeners[eventName].length !== 0) {
      emitter.listeners[eventName].forEach(listener => listener(...args))
    }
  }
  private static off(emitter: EventEmitter, eventName: string, listener?: Listener) {
    if (typeof listener == 'undefined') {
      emitter.removeAllListenersOfEvent(eventName)
    } else {
      emitter.removeListenerOfEvent(eventName, listener)
    }
  }
  private static removeAllListeners(emitter: EventEmitter) {
    for (const eventName of Object.keys(emitter.listeners)) {
      emitter.listeners[eventName].length = 0
      delete emitter.listeners[eventName]
    }
  }

  private static countListeners(emitter: EventEmitter, eventName: string) {
    return emitter.listeners[eventName] ? emitter.listeners[eventName].length : 0
  }
  private static countAllListeners(emitter: EventEmitter) {
    let count = 0
    for (const eventName of Object.keys(emitter.listeners)) {
      count += emitter.listeners[eventName].length
    }
    return count
  }

  emit<T extends Array<any> = Array<any>>(eventName: EventName, ...args: T) {
    EventEmitter.emit(this, eventName, ...args)
    this.onceEmitter && EventEmitter.emit(this.onceEmitter, eventName, ...args)
    this.onceEmitter?.removeAllListenersOfEvent(eventName)
  }

  on(eventName: EventName, listener: Listener) {
    if (!this.isRegisteredListener(eventName, listener)) {
      this.registerListener(eventName, listener)
    }
  }
  addListener(eventName: EventName, listener: Listener) {
    return this.on(eventName, listener)
  }
  once(eventName: EventName, listener: Listener) {
    return this.onceEmitter?.on(eventName, listener)
  }

  off(eventName: EventName, listener?: Listener) {
    EventEmitter.off(this, eventName, listener)
    this.onceEmitter && EventEmitter.off(this.onceEmitter, eventName, listener)
  }
  removeListener(eventName: EventName, listener?: Listener) {
    return this.off(eventName, listener)
  }

  removeAllListeners() {
    EventEmitter.removeAllListeners(this)
    this.onceEmitter && EventEmitter.removeAllListeners(this.onceEmitter)
  }

  countListeners(eventName: EventName) {
    let count = 0
    count += EventEmitter.countListeners(this, eventName)
    if (this.onceEmitter) {
      count += EventEmitter.countListeners(this.onceEmitter, eventName)
    }
    return count
  }
  countAllListeners() {
    let count = 0
    count += EventEmitter.countAllListeners(this)
    if (this.onceEmitter) {
      count += EventEmitter.countAllListeners(this.onceEmitter)
    }
    return count
  }

  private isRegisteredListener(eventName: EventName, listener: Listener) {
    return this.listeners[eventName] && this.listeners[eventName].includes(listener)
  }
  private registerListener(eventName: EventName, listener: Listener) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = []
    }
    this.listeners[eventName].push(listener)
  }

  private removeAllListenersOfEvent(eventName: string) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].length = 0
      delete this.listeners[eventName]
    }
  }
  private removeListenerOfEvent(eventName: EventName, listener: Listener) {
    if (!this.isRegisteredListener(eventName, listener)) {
      return
    }
    const index = this.listeners[eventName].indexOf(listener)
    this.listeners[eventName].splice(index, 1)
    if (this.listeners[eventName].length == 0) {
      delete this.listeners[eventName]
    }
  }
}

export default EventEmitter