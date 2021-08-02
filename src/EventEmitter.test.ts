import EventEmitter from "./EventEmitter";

describe('EventEmitter', () => {
  test('emit', () => {
    const emitter = new EventEmitter()

    const listener = jest.fn()
    emitter.on('event', listener)
    emitter.emit('event', 1, '2')
    expect(listener).toBeCalledTimes(1)
    expect(listener).toBeCalledWith(1, '2')

    emitter.removeAllListeners()
  })
  test('addListener', () => {
    const emitter = new EventEmitter()

    const listener = jest.fn()
    emitter.addListener('event-name', listener)
    emitter.addListener('event-name', listener)
    emitter.addListener('event-name', listener)
    emitter.on('event-name', listener)
    emitter.emit('event-name')
    expect(listener).toBeCalledTimes(1)

    emitter.removeAllListeners()
  })
  test('once', () => {
    const emitter = new EventEmitter()

    const listener = jest.fn()
    emitter.on('event', listener)
    emitter.on('event', listener)
    emitter.on('event', listener)
    emitter.once('event', listener)
    emitter.once('event', listener)
    emitter.emit('event')

    expect(listener).toBeCalledTimes(2)

    emitter.removeAllListeners()
  })
  test('countListeners', () => {
    const emitter = new EventEmitter()

    const listener = jest.fn()
    emitter.on('event', listener)
    emitter.once('event', listener)
    emitter.once('event-name', listener)
    expect(emitter.countListeners('event')).toBe(2)
    expect(emitter.countListeners('event-name')).toBe(1)
    expect(emitter.countAllListeners()).toBe(3)

    emitter.emit('event')
    expect(emitter.countListeners('event')).toBe(1)
    expect(emitter.countAllListeners()).toBe(2)

    emitter.removeAllListeners()
  })

  test('removeListener', () => {
    const emitter = new EventEmitter()

    const listener = jest.fn()
    emitter.on('event', listener)
    emitter.once('event', listener)
    const listener2 = jest.fn()
    emitter.once('event-name', listener2)

    emitter.removeListener('event', listener2)
    emitter.removeListener('event', listener)

    expect(emitter.countAllListeners()).toBe(1)

    emitter.removeAllListeners()
  })
  test('removeListener by event name', () => {
    const emitter = new EventEmitter()

    const listener = jest.fn()
    emitter.on('event', listener)
    emitter.once('event', listener)

    emitter.removeListener('event')

    expect(emitter.countAllListeners()).toBe(0)

    emitter.removeAllListeners()
  })
  test('removeAllListeners', () => {
    const emitter = new EventEmitter()

    const listener = jest.fn()
    emitter.on('event', listener)
    const listener2 = jest.fn()
    emitter.on('event-name', listener2)
    const listener3 = jest.fn()
    emitter.once('event-1', listener3)

    emitter.removeAllListeners()

    expect(emitter.countListeners('event')).toBe(0)
    expect(emitter.countListeners('event-name')).toBe(0)
    expect(emitter.countListeners('event-1')).toBe(0)
    expect(emitter.countAllListeners()).toBe(0)
  })
})