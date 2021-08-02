import Path from '@mutagen-d/path'
import FileSystem from 'tree-file-system'
import { clearFS, createFS, FSItem, populateFS } from './fs'

const items: FSItem[] = [{
  type: 'directory',
  name: 'base',
  childs: [{
    type: 'file',
    name: 'file.txt',
  }, {
    type: 'directory',
    name: 'dir',
    childs: [{
      type: 'file',
      name: 'text.out',
      size: 101,
    }]
  }, {
    type: 'directory',
    name: 'home',
  }]
}]

describe('fs', () => {
  describe('populateFS', () => {
    test('populateFS', () => {
      const fs = new FileSystem()
      expect(fs.getFile('/base/dir/text.out')).toBeFalsy()
      expect(fs.getFile('/base/file.txt')).toBeFalsy()
      expect(fs.getDirectory('/base/dir')).toBeFalsy()

      populateFS(fs, items)

      expect(fs.getFile('/base/dir/text.out')).toBeTruthy()
      expect(fs.getFile('/base/file.txt')).toBeTruthy()
      expect(fs.getDirectory('/base/dir')).toBeTruthy()
    })

    test('populateFS to not existing dir', () => {
      const fs = new FileSystem()

      expect(fs.getDirectory('/base')).toBeFalsy()

      populateFS(fs, items, '/base')

      expect(fs.getDirectory('/base/dir')).toBeFalsy()
      expect(fs.getFile('/base/dir/text.out')).toBeFalsy()
    })
  })

  test('clearFS', () => {
    const fs = new FileSystem()

    populateFS(fs, items)

    expect(fs.getFile('/base/dir/text.out')).toBeTruthy()
    expect(fs.getFile('/base/file.txt')).toBeTruthy()
    expect(fs.getDirectory('/base/dir')).toBeTruthy()

    clearFS(fs)

    expect(fs.getFile('/base/dir/text.out')).toBeFalsy()
    expect(fs.getFile('/base/file.txt')).toBeFalsy()
    expect(fs.getDirectory('/base/dir')).toBeFalsy()
    expect(fs.getDirectory('/base')).toBeFalsy()
  })

  describe('createFS', () => {
    const prepareFS = () => {
      const config = {
        lstat: { min: 100, max: 200 },
        unlink: { min: 150, max: 250 },
      }
      const fs = new FileSystem()
      fs.removeAll()
      const FS = createFS(fs, config)
      populateFS(fs, items)
      return { FS, fs }
    }
    test('createFS', () => {
      const fs = new FileSystem()
      const FS = createFS(fs)
      expect(FS).toHaveProperty('dirs')
      expect(FS).toHaveProperty('lstat')
      expect(FS).toHaveProperty('unlink')
      expect(FS).toHaveProperty('mkdir')
      expect(FS).toHaveProperty('exists')
    })
    test('lstat', async () => {
      const { FS, fs } = prepareFS()

      const lstat = async (dirpath: string, itemsLength: number) => {
        const res = await FS.lstat(dirpath)
        expect(res.length).toBe(itemsLength)
      }

      const paths = [
        '/base',
        '/base/dir',
        '/some/dir',
      ]
      await Promise.all(paths.map(path => {
        return lstat(path, fs.getDirectory(path)?.getItems().length as number ?? 0)
      }))
    })
    test('unlink', async () => {
      const { FS, fs } = prepareFS()

      const unlink = async (path: string) => {
        expect(fs.getItem(path)).toBeTruthy()

        await FS.unlink(path)

        expect(fs.getItem(path)).toBeFalsy()
      }
      const paths = [
        '/base/dir',
        '/base/file.txt',
        '/base/home',
      ]

      await Promise.all(paths.map(unlink))
    })
    test('mkdir', async () => {
      const { FS, fs } = prepareFS()

      const mkdir = async (path: string) => {
        expect(fs.getDirectory(path)).toBeFalsy()

        const res = await FS.mkdir(path)

        expect(fs.getDirectory(path)).toBeTruthy()
        expect(res.path).toEqual(Path.resolve(path))
      }

      const paths = [
        '/base/sub-dir',
        '/base/dir/sub-sub',
        '/base/dir/../sub-sub',
      ]

      await Promise.all(paths.map(mkdir))
    })

    test('exists', async () => {
      const { FS, fs } = prepareFS()

      const exists = async (path: string, expectedValue: boolean) => {
        const res = await FS.exists(path)
        expect(res).toEqual(expectedValue)
        expect(Boolean(fs.getItem(path))).toBe(expectedValue)
      }

      await exists('/base', true)
      await exists('/base/dir', true)
      await exists('/base/dir/text.out', true)
      await exists('/base/file.txt', true)
      await exists('/base/sub/../dir', true)
      await exists('/base/./dir', true)
    })
  })
})