import FileSource from './FileSource'
import { ImageURISource } from './Image.types'

describe('FileSource', () => {
  test('isInternetURL', () => {
    const isInternetURL = (url: string, value: boolean) => {
      expect(FileSource.isInternetURL(url)).toBe(value)
    }

    isInternetURL('https://example.com', true)
    isInternetURL('http://example.com/to/file.png', true)

    isInternetURL('file://path/to/file', false)
    isInternetURL('ftp://example.com/path/to/file.png', false)
  })
  test('isEqual', () => {
    const isEqual = (source: ImageURISource | null, compareSource: ImageURISource | null, value: boolean) => {
      // @ts-ignore
      expect(FileSource.isEqual(source, compareSource)).toBe(value)
    }

    isEqual({ uri: 'https://example.com/file.png', method: 'get' }, { uri: 'https://example.com/file.png' }, true)
    isEqual(null, null, true)
  })
})