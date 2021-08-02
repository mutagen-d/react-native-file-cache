import { createFetch } from './fetch'
import { XMLHttpRequest } from 'xhr2-cookies'
import FileSystem from 'tree-file-system'
import { clearFS, FSItem, populateFS } from './fs'
import { sleep } from '../util'

const items: FSItem[] = [{
  type: 'directory',
  name: 'base',
  childs: [{
    type: 'directory',
    name: 'dir',
  }],
}]

const fs = new FileSystem()
populateFS(fs, items)

const { config, fetch } = createFetch(fs)

describe('fetch', () => {
  beforeEach(() => {
    clearFS(fs)
    populateFS(fs, items)
  })
  test('fetch', async () => {
    const onProgress = jest.fn()
    const req = fetch('get', 'https://example.com').progress(onProgress)
    const res = await req
    expect(onProgress).toHaveBeenCalled()
  })
  test('fetch file', async () => {
    const fetch = async (path: string) => {
      expect(fs.getFile(path)).toBeFalsy()
      const req = config({ path }).fetch('get', 'https://example.com', { 'X-User-Agent': 'rn-file-cache' })
      const onProgress = jest.fn()
      req.progress(onProgress)
      const res = await req
      expect(onProgress).toHaveBeenCalled()
      const file = fs.getFile(path)
      expect(file).toBeTruthy()
      const info = res.info()
      expect(info.status).toEqual(200)
      expect(info.state).toEqual(XMLHttpRequest.DONE)
      const cLength = res.info().headers['content-length']
      if (cLength) {
        expect(file?.size).toBeTruthy()
        expect(+cLength).toEqual(file?.size)
      }
    }

    const paths = [
      '/base/dir/example.html',
      '/base/dir/file-01.html',
      '/base/file-02.html',
    ]

    await Promise.all(paths.map(fetch))
  })
  test('fetch file - invalid path error', async () => {
    const fetch = async (path: string) => {
      expect(fs.getFile(path)).toBeFalsy()
      const req = config({ path }).fetch('get', 'https://example.com', { 'X-User-Agent': 'rn-file-cache' })
      try {
        const res = await req
      } catch (e) {
        expect(e instanceof Error).toBe(true)
      }
    }

    const paths = [
      '/base/dir/sub-dir/file-1.html',
      '/base/dir/sub-dir/file-2.html',
      '/base/sub-dir/file-2.html',
    ]
    expect.assertions(paths.length * 2)
    await Promise.all(paths.map(fetch))
  })
  test('cacel request', async () => {
    const cancel = async () => {
      const onCancel = jest.fn()
      const req = fetch('get', 'https://example.com')
      await sleep(0)
      try {
        await Promise.all([
          req,
          req.cancel(onCancel),
        ])
      } catch (e) {
        expect(e instanceof Error).toBe(true)
        expect(onCancel).toHaveBeenCalled()
      }
    }

    expect.assertions(2)
    await cancel()
  })
})