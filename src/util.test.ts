import { debounce, pad, random, sha1, sleep, throttle } from './util'

describe('util', () => {
  test('sleep', async () => {
    const fn = jest.fn()
    await sleep(500).then(fn)
    expect(fn).toHaveBeenCalled()
  })
  test('throttle', async () => {
    const fn = jest.fn()
    const throttledFn = throttle(fn, 300)

    throttledFn(1, 2, 3)
    await sleep(110)

    throttledFn(3, 2, 1)
    await sleep(110)

    throttledFn(4, 4)
    await sleep(110)

    throttledFn(5, 5)
    await sleep(110)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(4, 4)

    await sleep(300)

    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenCalledWith(5, 5)
  })
  test('debounce', async () => {
    const fn = jest.fn()
    const debouncedFn = debounce(fn, 300)

    debouncedFn(1, 2)
    debouncedFn(1, 3)
    await sleep(100)

    debouncedFn(1, 4)
    await sleep(100)

    debouncedFn(1, 5)
    await sleep(100)

    debouncedFn(1, 6)
    await sleep(100)

    debouncedFn(1, 7)
    await sleep(100)

    expect(fn).not.toHaveBeenCalled()
    await sleep(300)

    expect(fn).toHaveBeenCalled()
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(1, 7)
  })
  test('sha1', () => {
    const input = '12356'
    const res = sha1(input)
    expect(res).toEqual(sha1(input))
    expect(typeof res).toEqual('string')
    expect(sha1('аbс')).not.toEqual(sha1('abc'))
  })
  test('random', () => {
    const run = (min: number, max: number, size = 5) => {
      for (let i = 0; i < size; ++i) {
        const val = random(min, max)
        expect(val).toBeLessThanOrEqual(max)
        expect(val).toBeGreaterThanOrEqual(min)
      }
    }
    run(5, 10)
    run(-3, -1)
    run(-1000, 1000, 100)
    run(4, 5)
  })

  test('pad', () => {
    const run = (val: string | number, expected: string, size?: number) => {
      expect(pad(val, size)).toEqual(expected)
    }

    run('1', '01', 2)
    run(1, '001', 3)
    run(111, '111', 2)
    run(2, '002')
  })
})