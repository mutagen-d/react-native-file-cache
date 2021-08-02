import { populateFS, defaultTimes, defaultItems, FILES, URLS, setTimes, fileSystem } from './rn-fetch-blob-mock/fs'

import BaseDir from './BaseDir'
import RNFileCache from './RNFileCache'
import FileLock from './FileLock'
import FileStorage from './FileStorage'
import { sleep } from './util'

const clearFS = () => {
  const directory = fileSystem.getDirectory('/base')
  directory && directory.remove()
}

const initFS = () => {
  populateFS(fileSystem, defaultItems, '/')
}

describe('RNFileCache', () => {
  beforeEach(() => {

    initFS()

    setTimes('lstat', defaultTimes.lstat)
    setTimes('unlink', defaultTimes.unlink)

    BaseDir.setBaseDIR('/base/dir/')
    FileStorage.baseDir = BaseDir.getBaseDIR()

    FileStorage.cleanRecords()
    FileStorage.resetState()
    FileLock.unlockAll()
  })
  afterEach(() => {
    clearFS()
  })
  test('isReady', async () => {
    expect(RNFileCache.isReady()).toBe(false)
    const onReady = jest.fn()
    RNFileCache.onReady(onReady)
    RNFileCache.onReady(onReady)
    await RNFileCache.load()
    expect(onReady).toHaveBeenCalledTimes(1)
    expect(RNFileCache.isReady()).toBe(true)
  })
  test('setClearRatio', () => {
    const setCleanRatio = (value: number, expected?: number) => {
      RNFileCache.setClearingRatio(value)
      if (typeof expected == 'undefined') {
        expect(RNFileCache.getClearingRatio()).toBe(value)
      } else {
        expect(RNFileCache.getClearingRatio()).toBe(expected)
      }
    }

    setCleanRatio(0.3)
    setCleanRatio(1)
    setCleanRatio(0)

    setCleanRatio(1.3, 1)
    setCleanRatio(-1, 0)
  })
  test('setPrefix', () => {
    const setPrefix = (prefix: string) => {
      RNFileCache.setPrefix(prefix)
      expect(RNFileCache.getPrefix()).toBe(prefix)
    }

    setPrefix('prefix://')
    setPrefix('suffix://')
    setPrefix('file://')
  })
  test('maxSize', () => {
    const setMaxSize = (maxSize: number) => {
      RNFileCache.maxSize = maxSize
      expect(RNFileCache.maxSize).toEqual(maxSize)
    }

    setMaxSize(1)
    setMaxSize(500 * 1e6)
  })
  test('totalSize', async () => {
    expect(RNFileCache.totalSize).toEqual(0)
    await RNFileCache.load()
    expect(RNFileCache.totalSize).toBeGreaterThan(0)
  })
  test('lock/unlock', async () => {
    await RNFileCache.load()

    const lockUnlock = (componentId: string, paths: string[]) => {

      paths.forEach(path => {
        RNFileCache.lock(componentId, path)
        expect(FileLock.isLocked(path)).toBe(true)
      })
      paths.forEach((path, index) => {
        if (index == paths.length - 1) {
          expect(FileLock.isLocked(path)).toBe(true)
        } else {
          expect(FileLock.isLocked(path)).not.toBe(true)
        }
      })
      RNFileCache.unlock(componentId)
      paths.forEach(path => {
        expect(FileLock.isLocked(path)).not.toBe(true)
      })
    }

    const paths = URLS.slice(0, 5).map(url => RNFileCache.getPath(url))
    paths.push(...URLS.slice(5, 10).map(url => RNFileCache.getPath(url, 'some-dir')))
    paths.forEach(path => {
      expect(fileSystem.getFile(path)).toBeTruthy()
    })
    lockUnlock('1234', paths)
    lockUnlock('1111', paths)
  })

  test('exists vs getPath on existing files', async () => {
    await RNFileCache.load()

    const exists = (url: string, expected: boolean) => {
      expect(RNFileCache.exists(url)).toBe(expected)
    }
    const getPath = (url: string, expectedPath: string, dir?: string) => {
      expect(RNFileCache.getPath(url, dir)).toEqual(expectedPath)
    }

    URLS.slice(0, 10).forEach(url => {
      exists(url, true)
      getPath(url, RNFileCache.getPath(url))
      getPath(url, RNFileCache.getPath(url), 'some-dir')
    })
  })
  test('remove existing url', async () => {
    const remove = async (url: string) => {
      const path = RNFileCache.getPath(url)
      expect(RNFileCache.exists(url)).toBe(true)
      const promise = RNFileCache.remove(url)
      await sleep(0)
      expect(RNFileCache.isRemoving(path)).toBe(true)
      const listener = jest.fn()
      RNFileCache.onRemoved(path, listener)
      await promise
      expect(RNFileCache.exists(url)).not.toBe(true)
      expect(fileSystem.getFile(path)).toBeFalsy()
      expect(listener).toHaveBeenCalledWith()
      expect(listener).toHaveBeenCalledTimes(1)
    }

    await RNFileCache.load()

    await Promise.all(URLS.slice(0, 10).map(remove))
  })
  test('remove not existing url', async () => {
    const remove = async (url: string) => {
      const path = RNFileCache.getPath(url)
      expect(fileSystem.getFile(path)).toBeFalsy()

      await RNFileCache.remove(url)
      expect(fileSystem.getFile(path)).toBeFalsy()
    }

    await RNFileCache.load()

    await remove('http://some.page.com/file-00.png')
    await remove('http://some.page.com/file-01.png')
    await remove('http://some.page.com/file-03.png')
  })
  test('removeFile', async () => {
    const removeFile = async (path: string) => {
      const promise = RNFileCache.removeFile(path)
      await sleep(0)
      expect(RNFileCache.isRemoving(path)).toBe(true)
      const res = await promise
      expect(res).toBe(true)
      expect(fileSystem.getFile(path)).toBeFalsy()
    }

    await RNFileCache.load()

    await Promise.all(URLS.slice(-10).map(url => removeFile(RNFileCache.getPath(url))))
  })
  test('removeFile - locked files', async () => {
    const removeFile = async (path: string) => {
      expect(fileSystem.getFile(path)).toBeTruthy()

      setTimes('unlink', { min: 100, max: 200 })
      const componentId = '1234'
      RNFileCache.lock(componentId, path)
      const promise = RNFileCache.removeFile(path, 100)
      await sleep(0)
      const [res] = await Promise.all([
        promise,
        sleep(10).then(() => RNFileCache.unlock(componentId))
      ])

      expect(res).toBe(true)
      expect(fileSystem.getFile(path)).toBeFalsy()
    }

    await RNFileCache.load()
    await Promise.all(URLS.slice(0, 20).map(url => removeFile(RNFileCache.getPath(url))))
  })
  test('removeFile - not existed file', async () => {
    const removeFile = async (path: string) => {
      expect(fileSystem.getFile(path)).toBeFalsy()

      const res = await RNFileCache.removeFile(path, 100)
      expect(res).not.toBe(true)
    }
    const paths = [
      '/base/dir/file-001.png',
      '/base/dir/file-002.png',
      '/base/dir/../file-002.png',
    ]

    await RNFileCache.load()
    await Promise.all(paths.map(removeFile))
  })
  test('removeAll', async () => {
    await RNFileCache.load()

    URLS.forEach(url => {
      const path = RNFileCache.getPath(url)
      expect(fileSystem.getFile(path)).toBeTruthy()
    })
    setTimes('unlink', { min: 10, max: 20 })
    const [res, res2] = await Promise.all([
      RNFileCache.removeAll(),
      RNFileCache.removeAll(),
    ])
    expect(res).toBe(true)
    expect(res2).not.toBe(true)
    URLS.forEach((url, index) => {
      const path = RNFileCache.getPath(url)
      expect(fileSystem.getFile(path)).toBeFalsy()
    })
  }, 15 * 1000)
  test('pruneCache', async () => {
    await RNFileCache.load()

    setTimes('unlink', { min: 100, max: 200 })
    await RNFileCache.pruneCache()

    const remainingSize = URLS.reduce((size, url) => {
      const path = RNFileCache.getPath(url)
      const file = fileSystem.getFile(path)
      return size + (file ? file.size : 0)
    }, 0)
    const maxRemainingSize = (1 - RNFileCache.getClearingRatio()) * FileStorage.maxSize

    expect(remainingSize).toBeLessThanOrEqual(maxRemainingSize)

    const res = await RNFileCache.pruneCache()
    expect(res).not.toBe(true)
  })
  test('getTotalSize', async () => {
    await RNFileCache.load()

    const totalSize = FileStorage.getTotalSize()
    const filesSize = FILES.reduce((size, file) => {
      return size + (file.size || 0)
    }, 0)
    expect(totalSize).toEqual(filesSize)
  })
  test('getSource', () => {
    const getSource = (path: any, expected: any) => {
      expect(RNFileCache.getSource(path)).toEqual(expected)
    }

    getSource('', undefined)
    getSource(null, undefined)
    getSource('/base/dir/file.png', { uri: `${RNFileCache.getPrefix()}/base/dir/file.png` })
  })
  test('isInternetURL', () => {
    const isInternetURL = (url: any, expected: boolean) => {
      expect(RNFileCache.isInternetURL(url)).toBe(expected)
    }

    isInternetURL('', false)
    isInternetURL('file://some.thing/index.html', false)
    isInternetURL('http://example.com', true)
    isInternetURL('ftp://example.com', false)
    isInternetURL(null, false)
    isInternetURL(undefined, false)
    isInternetURL(111, false)
  })
  test('isEqual', () => {
    const isEqual = (source1: any, source2: any, expected: boolean) => {
      expect(RNFileCache.isEqual(source1, source2)).toBe(expected)
    }

    isEqual({ uri: 'https://example.com/file.png', method: 'get' }, { uri: 'https://example.com/file.png' }, true)
    isEqual(null, null, true)
    isEqual(undefined, null, false)
    isEqual('', '', true)
  })
  test('download', async () => {
    await RNFileCache.load()

    const download = async (url: string) => {
      const path = RNFileCache.getPath(url)
      expect(fileSystem.getFile(path)).toBeFalsy()
      const onError = jest.fn()
      await RNFileCache.download({ url, onError })
      expect(onError).not.toHaveBeenCalled()
      expect(fileSystem.getFile(path)).toBeTruthy()
    }

    const urls = [
      'https://example.com/index.html',
      'https://example.com/page.html',
    ]
    await Promise.all(urls.map(download))
  })
  test('download - not ready error', async () => {
    expect.assertions(1)
    try {
      await RNFileCache.download({ url: 'https://example.com' })
    } catch (e) {
      expect(e instanceof Error).toBe(true)
    }
  })
  test('cancelDownload', async () => {
    await RNFileCache.load()

    const cancelDownload = async (url: string) => {
      const path = RNFileCache.getPath(url)
      expect(fileSystem.getFile(path)).toBeFalsy()
      await Promise.all([
        RNFileCache.download({ url }),
        sleep(10).then(() => RNFileCache.cancelDownload(url)),
      ])
      expect(fileSystem.getFile(path)).toBeFalsy()
    }

    await cancelDownload('https://example.com')
    await cancelDownload('https://example.com/index.html')
  })
})