import Downloader from './Downloader'
import { sleep } from './util'
import { FSItem, populateFS, fileSystem } from './rn-fetch-blob-mock/fs'

const items: FSItem[] = [{
  type: 'directory',
  name: 'base',
  childs: [{
    type: 'directory',
    name: 'dir',
  }]
}]

const clearFS = () => {
  const directory = fileSystem.getDirectory('/downloader')
  directory && directory.remove()
}

const initFS = () => {
  fileSystem.createDirectory('/downloader')
  populateFS(fileSystem, items, '/downloader')
}

describe('Downloader', () => {
  beforeEach(() => {
    initFS()
  })
  afterEach(() => {
    clearFS()
  })
  test('download - concurent downloads of one file', async () => {
    const path = '/downloader/base/dir/file-01.html'
    const path2 = '/downloader/base/dir/file-02.html'

    const url = 'https://example.com'
    const download = async (params: { url: string; path: string }) => {
      const onLoad = jest.fn((res) => {
        expect(res.url).toEqual(url)
        expect(res.path).toEqual(path)
      })
      const onProgress = jest.fn()
      const req = Downloader.download({
        url: params.url,
        path: params.path,
        onProgress,
        onLoad,
      })
      await sleep(0)
      const request = Downloader.getActiveRequest(params.url)
      const res = await req
      expect(onLoad).toHaveBeenCalledTimes(1)
      expect(request.countAllListeners()).toEqual(0)
      return res
    }

    expect(fileSystem.getFile(path)).toBeFalsy()

    const files = await Promise.all([
      download({ path, url }),
      download({ path, url }),
      download({ path, url }),
      download({ url, path: path2 })
    ])
    files.forEach(file => {
      files.forEach(f => {
        expect(f === file).toBe(true)
      })
      expect(file?.path).toEqual(path)
    })

    expect(fileSystem.getFile(path)).toBeTruthy()
    expect(fileSystem.getFile(path2)).toBeFalsy()
  })
  test('stopDownload', async () => {
    const url = 'https://example.com'
    const path = '/downloader/base/dir/file-001.html'
    const onError = jest.fn()
    const onCancel = jest.fn()
    const onLoad = jest.fn()
    const onLoadEnd = jest.fn()
    const req = Downloader.download({ url, path, onError, onCancel, onLoad, onLoadEnd })
    await sleep(0)
    const request = Downloader.getActiveRequest(url)
    const stopped = await Promise.race([
      req,
      Downloader.stopDownload(url)
    ])
    expect(request.countAllListeners()).toEqual(0)
    expect(stopped).toBe(true)
    expect(fileSystem.getFile(path)).toBeFalsy()
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onLoad).not.toHaveBeenCalled()
    expect(onLoadEnd).toHaveBeenCalledTimes(1)
  })
  test('stopDownload - with error', async () => {
    const url = 'https://example.com'
    const path = '/downloader/base/dir/file-001.html'
    const onError = jest.fn()
    const onCancel = jest.fn()
    const onLoad = jest.fn()
    const onLoadEnd = jest.fn()
    const req = Downloader.download({ url, path, onError, onCancel, onLoad, onLoadEnd })
    await sleep(0)
    const request = Downloader.getActiveRequest(url)
    expect(request.countAllListeners()).toBeGreaterThan(0)
    request.stop = jest.fn(async () => {
      try {
        throw new Error('')
      } finally {
        request.removeAllListeners()
      }
    })
    const stopped = await Promise.race([
      req,
      Downloader.stopDownload(url)
    ])
    expect(request.stop).toBeCalled()
    expect(request.countAllListeners()).toEqual(0)
    expect(stopped).not.toBe(true)
    expect(fileSystem.getFile(path)).toBeFalsy()
    expect(onError).not.toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
    expect(onLoad).not.toHaveBeenCalled()
    expect(onLoadEnd).not.toHaveBeenCalled()
  })
})