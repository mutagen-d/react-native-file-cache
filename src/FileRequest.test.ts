import { FSItem, populateFS, fileSystem } from './rn-fetch-blob-mock/fs'
import FileRequest from './FileRequest'
import { sleep } from './util'

const items: FSItem[] = [{
  type: 'directory',
  name: 'base',
  childs: [{
    type: 'directory',
    name: 'dir',
  }]
}]

const clearFS = () => {
  const directory = fileSystem.getDirectory('/file_request')
  directory && directory.remove()
}

const initFS = () => {
  fileSystem.createDirectory('/file_request')
  populateFS(fileSystem, items, '/file_request')
}

describe('FileRequest', () => {
  beforeEach(async () => {
    initFS()
  })
  afterEach(async () => {
    clearFS()
  })
  test('request and save file to path', async () => {
    const path = '/file_request/base/dir/file-01.html'
    expect(fileSystem.getFile(path)).toBeFalsy()
    const onProgress = jest.fn()
    const onLoad = jest.fn()
    const fileRequest = new FileRequest({
      url: 'https://example.com',
      path,
      onProgress,
      onLoad,
    })
    await fileRequest.request()
    expect(onProgress).toHaveBeenCalled()
    expect(onLoad).toHaveBeenCalled()
    const file = fileSystem.getFile(path)
    expect(file).toBeTruthy()
  })
  test('request', async () => {
    const onLoadEnd = jest.fn()
    // @ts-ignore
    const fileRequest = new FileRequest({
      url: 'https://example.com',
      onLoadEnd,
    })
    await fileRequest.request()
    expect(onLoadEnd).toHaveBeenCalled()
  })
  test('cancel', async () => {
    const path = '/file_request/base/dir/file-02.html'
    const url = 'https://example.com'
    const onProgress = jest.fn()
    const onLoad = jest.fn()
    const onLoadEnd = jest.fn()
    const onError = jest.fn()
    const onCancel = jest.fn()
    const req = new FileRequest({
      url,
      path,
      onProgress,
      onLoad,
      onCancel,
      onLoadEnd,
      onError,
    })
    const promise = req.request()
    await Promise.race([
      promise,
      sleep(10).then(() => req.cancel())
    ])
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onLoad).not.toHaveBeenCalled()
    expect(onLoadEnd).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledTimes(1)
  })
})