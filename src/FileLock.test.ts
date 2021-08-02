import FileLock from './FileLock'

describe('FileLock', () => {
  beforeEach(() => {
    FileLock.unlockAll()
  })
  test('lock', () => {
    const path = '/path/to/file.txt'
    const componentId = '123'
    FileLock.lock(path, componentId)
    expect(FileLock.getFile(path)).toBeTruthy()
  })
  test('unlock locked paths', () => {
    const unlock = (path: string) => {

      FileLock.lock(path, '123')
      FileLock.lock(path, '111')
      expect(FileLock.isLocked(path)).toBe(true)

      FileLock.unlock(path, '111')
      expect(FileLock.isLocked(path)).toBe(true)
      FileLock.unlock(path, '123')
      expect(FileLock.isLocked(path)).toBe(false)
    }

    unlock('/path/to/file.txt')
    unlock('./path/file')
  })

  test('unlock not locked path', () => {
    const notLockedPath = '/not/locked/path'
    expect(FileLock.isLocked(notLockedPath)).not.toBe(true)
    FileLock.unlock(notLockedPath, '123')
  })
  test('onUnlock locked path', () => {
    const onUnlock = (path: string) => {
      FileLock.lock(path, '123')
      FileLock.lock(path, '222')

      const listener = jest.fn()
      FileLock.onUnlock(path, listener)

      FileLock.unlock(path, '123')
      expect(listener).not.toHaveBeenCalled()

      FileLock.unlock(path, '222')
      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(path)
    }

    onUnlock('/path/to/file')
    onUnlock('./path/to/file.txt')
    onUnlock('./path/to/../file.txt')
  })
  test('onUnlock not locked path', () => {
    const onUnlock = (path: string) => {
      const listener = jest.fn()
      FileLock.onUnlock(path, listener)
      expect(listener).toHaveBeenCalledWith(path)
      expect(listener).toHaveBeenCalledTimes(1)
    }

    onUnlock('/path/to/file')
    onUnlock('./path/to/file.txt')
    onUnlock('./path/to/../file.txt')
  })
  test('waitUnlock', async () => {
    const waitUnlock = async (path: string, lockIt = false) => {
      if (lockIt) {
        FileLock.lock(path, '123')
        FileLock.lock(path, '111')
        const promise = FileLock.waitUnlock(path)
        FileLock.unlock(path, '123')
        FileLock.unlock(path, '111')
        const res = await promise
        expect(res).toEqual(path)
      } else {
        const res = await FileLock.waitUnlock(path)
        expect(res).toEqual(path)
      }
    }

    await waitUnlock('/path/')
    await waitUnlock('/path/to/file', true)
  })
  test('findPaths', () => {
    const findPaths = (componentId: string, foundPaths: string[]) => {
      const paths = FileLock.findPaths(componentId)
      expect(paths.length).toEqual(foundPaths.length)
      foundPaths.forEach(path => {
        expect(paths).toContain(path)
      })
    }

    const lockAndFind = (componentId: string, paths: string[]) => {
      paths.forEach(path => {
        FileLock.lock(path, componentId)
      })
      findPaths(componentId, paths)
      paths.forEach(path => {
        FileLock.unlock(path, componentId)
      })
    }

    lockAndFind('123', ['/path/to/dir/file', '/path/to/file-01'])
    lockAndFind('111', ['/path/image.jpeg', '/absolute/path/file.png', '/file'])
  })
  test('unlockAll', () => {
    const listener = jest.fn()
    const lock = (path: string) => {
      FileLock.lock(path, '111')
      FileLock.lock(path, '222')
      FileLock.onUnlock(path, listener)
    }

    const paths = [
      '/path/first',
      '/path/second',
    ]

    paths.forEach(lock)

    FileLock.unlockAll()
    paths.forEach(path => {
      expect(FileLock.isLocked(path)).not.toBe(true)
      expect(listener).toHaveBeenCalledWith(path)
    })
    expect(listener).toHaveBeenCalledTimes(paths.length)
  })
})