// @ts-ignore
import SHA1 from 'crypto-js/sha1'

export const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

export const random = (min: number, max: number) => {
  return Math.floor(Math.min(min, max) + Math.abs(max - min) * Math.random());
}

export const pad = (val: string | number, size = 3) => {
  const res = `${val}`
  return res.length > size ? res : `0000${val}`.slice(-size)
}

const sha1CachedResults: { [K: string]: string } = {}
export const sha1 = (source: string): string => {
  if (!sha1CachedResults[source]) {
    sha1CachedResults[source] = `${SHA1(source)}`
  }
  return sha1CachedResults[source]
}

type Callback<T extends any[] = any[], R = any> = (...args: T) => R

export const debounce = <T extends Callback>(fn: T, ms: number): Callback<Parameters<T>, void> => {
  const timeout: Record<string, any> = {}
  const callback = (...args: Parameters<T>) => {
    clearTimeout(timeout.id)
    timeout.id = setTimeout(() => fn(...args), ms)
  }
  return callback
}

export const throttle = <T extends Callback>(fn: T, ms: number) => {
  const timeout: Record<string, any> = {}
  const callback = (...args: Parameters<T>) => {
    timeout.args = args
    if (timeout.id) {
      return
    }
    timeout.id = setTimeout(() => {
      fn(...timeout.args as Parameters<T>)
      timeout.id = null
      timeout.args = null
    }, ms)
  }
  return callback
}
