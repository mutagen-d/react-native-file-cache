import { populateFS, defaultItems, _1MiB, FILES, FILES_COUNT, fileSystem } from './rn-fetch-blob-mock/fs';
import Path from "@mutagen-d/path";

import BaseDir from "./BaseDir";
import FileStorage from "./FileStorage";

const clearFS = () => {
  const directory = fileSystem.getDirectory('/storage')
  directory && directory.remove()
}

const initFS = () => {
  fileSystem.createDirectory('/storage')
  populateFS(fileSystem, defaultItems, '/storage')
}

describe('FileStorage', () => {
  beforeEach(() => {
    BaseDir.setBaseDIR('/storage/base/dir/')
    FileStorage.baseDir = BaseDir.getBaseDIR()

    initFS()

    FileStorage.cleanRecords()
  })
  afterEach(() => {
    clearFS()
  })
  test('load default dir', async () => {

    expect(FileStorage.isReady()).not.toBe(true)
    await FileStorage.load()

    expect(FileStorage.isReady()).toBe(true)

    expect(FileStorage.countFiles()).toEqual(FILES_COUNT)
    const totalSize = FileStorage.getTotalSize()
    expect(totalSize).toBeLessThanOrEqual(15 * _1MiB * FILES_COUNT)
    expect(totalSize).toBeGreaterThanOrEqual(7.5 * _1MiB * FILES_COUNT)
    FILES.forEach(file => {
      expect(FileStorage.exists(`/storage/base/dir/rn-file-cache/${file.name}`))
    })

    const paths = FileStorage.getExistingPaths()
    expect(paths.length).toEqual(FILES_COUNT)

    paths.forEach(path => {
      const fileName = Path.getFileName(path)
      const ext = Path.getExtension(fileName)
      expect(ext).toEqual('png')
    })
  })
  test('load not sub dir', async () => {
    await FileStorage.load('../temporary_dir')
    expect(FileStorage.countFiles()).toEqual(FILES_COUNT)
  })
  test('on/off listeners', async () => {
    const loadingListener = jest.fn()
    FileStorage.on('loading', loadingListener)
    const readyListener = jest.fn()
    FileStorage.on('ready', readyListener)

    await FileStorage.load()

    expect(loadingListener).toHaveBeenCalledTimes(1)
    expect(readyListener).toHaveBeenCalledTimes(1)

    FileStorage.off('loading', loadingListener)
    FileStorage.off('ready', readyListener)

    // @ts-ignore
    expect(FileStorage.events.countAllListeners()).toEqual(0)
  })
  test('getPath from url', async () => {
    const getPath = (url: string, exists = false) => {
      const ext = Path.getExtension(url.split(/\?\#/g)[0].split('/').pop() as string)
      const path = FileStorage.getPath(url)
      const fileName = Path.getFileName(path)
      expect(ext).toEqual(Path.getExtension(fileName))
      expect(Path.isSubPath(path, '/storage/base/dir')).toBe(true)
      expect(FileStorage.exists(url)).toBe(exists)
    }
    await FileStorage.load()

    getPath('https://example.com/file-image-01.jpeg', false)
    getPath('https://example.com/path/to/image-01.png', true)
    getPath('https://example.com/path/to/file', false)
  })
  test('saveFile', async () => {
    const saveFile = (url: string, isSaved: boolean) => {
      if (isSaved) {
        expect(FileStorage.exists(url)).not.toBe(true)
      } else {
        expect(FileStorage.exists(url)).toBe(true)
      }

      const path = FileStorage.getPath(url)
      const fileName = Path.getFileName(path)
      const ext = Path.getExtension(fileName)
      const file = { url, path, ext, size: 101, mime: `image/${ext}` }
      const retval = FileStorage.saveFile(file)

      expect(FileStorage.exists(url)).toBe(true)
      if (isSaved) {
        expect(fileSystem.getFile(path)).toBeFalsy()
      } else {
        expect(fileSystem.getFile(path)).toBeTruthy()
      }
      expect(retval).toEqual(isSaved)
    }

    await FileStorage.load()

    saveFile('https://example.com/path/to/file-image-01.jpeg', true)
    saveFile('https://example.com/some/path/file-image-02.jpeg', true)
    saveFile('https://example.com/some/path/file-image-03.jpeg', true)

    saveFile('https://example.com/path/to/image-01.png', false)
  })
  test('getExistingPaths', async () => {
    await FileStorage.load()
    const paths = FileStorage.getExistingPaths()
    paths.forEach(path => {
      expect(Path.isSubPath(path, '/storage/base/dir')).toBe(true)
      expect(fileSystem.getFile(path)).toBeTruthy()
    })
  })

  test('removeFile', async () => {
    await FileStorage.load()

    const paths = FileStorage.getExistingPaths()
    const removeFile = async (path: string) => {
      expect(fileSystem.getFile(path)).toBeTruthy()
      await FileStorage.removeFile(path)
      expect(fileSystem.getFile(path)).toBeFalsy()
    }
    await Promise.all(paths.slice(0, 5).map(removeFile))
  })
  test('removeFile - error', async () => {
    await FileStorage.load()

    const removeFile = async (path: string) => {
      try {
        await FileStorage.removeFile(path)
      } catch (e) {
        expect(e instanceof Error).toBe(true)
      }
    }

    const paths = [
      '/storage/base/dir/rn-image-cache/../image-01.png',
      '/storage/base/dir/rn-image-cache/not-existing-image-01.png',
    ]
    expect.assertions(paths.length)

    await Promise.all(paths.map(removeFile))
  })
  test('getRemovablePaths', async () => {
    const getRemovablePaths = (ratio: number = 0.15) => {
      const paths = FileStorage.getRemovablePaths(ratio)
      const remainingPaths = FileStorage.getExistingPaths().filter(path => !paths.includes(path))
      const files = remainingPaths.map(path => fileSystem.getFile(path))
      const remainingSize = files.reduce((size, file) => {
        return size + (file?.size || 0)
      }, 0)
      const maxRemainingSize = (1 - ratio) * FileStorage.maxSize
      expect(remainingSize).toBeLessThanOrEqual(maxRemainingSize)
    }

    await FileStorage.load()

    getRemovablePaths(0.5)
    getRemovablePaths()
  })
  test('getExistingPaths', async () => {
    await FileStorage.load()
    const paths = FileStorage.getExistingPaths()
    paths.forEach(path => {
      expect(fileSystem.getFile(path)).toBeTruthy()
    })
  })
  test('resetState', async () => {
    await FileStorage.load()
    expect(FileStorage.isReady()).toBe(true)
    FileStorage.resetState()
    expect(FileStorage.isReady()).not.toBe(true)
  })
})