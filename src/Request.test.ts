import { FSItem, populateFS, fileSystem } from './rn-fetch-blob-mock/fs'
import Request from './Request'
import { sleep } from './util'

const items: FSItem[] = [{
  type: 'directory',
  name: 'base',
  childs: [{
    type: 'directory',
    name: 'dir',
  }]
}]

const initFS = () => {
  fileSystem.createDirectory('/request')
  populateFS(fileSystem, items, '/request')
}

const clearFS = () => {
  const directory = fileSystem.getDirectory('/request')
  directory && directory.remove()
}

describe('Request', () => {
  beforeEach(() => {
    initFS()
  })
  afterEach(() => {
    clearFS()
  })
  test('download', async () => {
    const onLoad = jest.fn()
    const request = new Request({
      url: 'https://example.com',
      path: '/request/base/dir/file-01.html',
    })
    request.addListener('load', onLoad)
    await request.download()
    expect(onLoad).toHaveBeenCalled()
    const file = request.getFile()
    expect(file).toBeTruthy()
    expect(file?.ext).toEqual('html')
  })
  test('stop', async () => {
    const request = new Request({
      url: 'https://example.com',
      path: '/request/base/dir/example.html',
    })

    const onCancel = jest.fn()
    const onLoadEnd = jest.fn()
    const onError = jest.fn()

    request.addListener('cancel', onCancel)
    request.addListener('loadend', onLoadEnd)
    request.addListener('error', onError)

    await Promise.race([
      request.download(),
      sleep(10).then(() => request.stop()),
    ])

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onLoadEnd).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledTimes(1)
  })
})