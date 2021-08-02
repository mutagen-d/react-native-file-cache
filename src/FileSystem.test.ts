import { FSItem, populateFS, fileSystem } from "./rn-fetch-blob-mock/fs";
import Path from "@mutagen-d/path";
import FilePath from "./FilePath";
import FileSystem from "./FileSystem";

const items: FSItem[] = [{
  type: 'directory',
  name: 'home',
  childs: [{
    type: 'directory',
    name: 'user1',
    childs: [{
      type: 'file',
      name: '.bashrc',
      size: 101,
    }, {
      type: 'directory',
      name: 'Download',
      childs: [{
        type: 'file',
        name: 'image.png',
        size: 203128,
      }, {
        type: 'file',
        name: 'image-2.png',
        size: 103302,
      }, {
        type: 'file',
        name: 'image-3.png',
        size: 103303,
      }, {
        type: 'file',
        name: 'image-4.png',
        size: 103304,
      }, {
        type: 'directory',
        name: 'temp'
      }],
    }],
  }],
}]


const clearFS = () => {
  const directory = fileSystem.getDirectory('/file_system')
  directory && directory.remove()
}

const initFS = () => {
  fileSystem.createDirectory('/file_system')
  populateFS(fileSystem, items, '/file_system')
}

describe('FileSystem', () => {
  beforeEach(() =>{
    initFS()
    FileSystem.cleanFiles()
  })
  afterEach(() => {
    clearFS()
  })
  test('load files', async () => {
    await FileSystem.loadFiles(
      '/file_system/home/user1/Download',
    )
    expect(Array.isArray(FileSystem.getFiles())).toBe(true)
    const files = FileSystem.getFiles()
    expect(files.length).toBe(4)
    expect(files.map(file => file.filename)).toEqual(['image.png', 'image-2.png', 'image-3.png', 'image-4.png'])
  })
  test('remove existing files', async () => {
    const files = [
      '/file_system/home/user1/Download/sub/../path/../image.png',
      '/file_system/home/user1/Download/image-2.png',
      '/file_system/home/user1/Download/image-3.png',
      '/file_system/home/user1/Download/image-4.png',
    ]
    const promise = Promise.all(files.map(file => FileSystem.removeFile(file)))

    const removeOrder: number[] = []
    let startCount = 0
    let doneCount = 0

    expect.assertions(files.length * 2)
    files.map((file, index) => {
      const resolvedPath = Path.resolve(file)
      FilePath.addListener(resolvedPath, 'remove-started', () => {
        removeOrder[index] = startCount++
      })
      FilePath.addListener(resolvedPath, 'remove-done', () => {
        expect(removeOrder[index]).toBe(doneCount++)
      })
    })
    await promise

    files.forEach(file => {
      const resolvedPath = Path.resolve(file)
      expect(FilePath.getFile(resolvedPath).countAllListeners()).toBe(0)
    })
  })
  test('find existing files', async () => {
    const findFile = (path: string) => {
      expect(FileSystem.findFile(path)).toBeTruthy()
    }

    await FileSystem.loadFiles('/file_system/home/user1/Download')

    findFile('/file_system/home/user1/Download/sub/../path/../to/../image.png')
    findFile('/file_system/home/user1/Download/image-2.png')
    findFile('/file_system/home/user1/Download/image-3.png')
  })
  test('createDirIfNotExists', async () => {
    const createDir = async (path: string, exists: boolean) => {
      expect(Boolean(fileSystem.getItem(path))).toBe(exists)
      const res = await FileSystem.createDirIfNotExists(path)
      if (exists) {
        expect(res).not.toBe(true)
      } else {
        expect(res).toBe(true)
      }
      expect(fileSystem.getItem(path)).toBeTruthy()
    }

    await createDir('/file_system/home/dir/', false)
    await createDir('/file_system/home/dir/path', false)
    await createDir('/file_system/home/dir', true)
  })
})