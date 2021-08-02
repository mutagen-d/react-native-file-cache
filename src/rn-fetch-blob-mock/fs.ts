import { pad, random, sha1, sleep } from '../util'
import FileSystem, { Directory, File, Item } from 'tree-file-system'

export type FSTimes = {
  min: number
  max: number
}

export type FSItem = {
  type: 'file' | 'directory'
  name: string
  size?: number
  childs?: FSItem[]
}

export type RNFetchBlobStat = {
  lastModified: number;
  size: number;
  type: "directory" | "file";
  path: string;
  filename: string;
}

export const fileSystem = new FileSystem()

export const defaultTimes: {
  lstat: FSTimes
  unlink: FSTimes
} = {
  lstat: { min: 200, max: 400 },
  unlink: { min: 300, max: 450 },
}

export const times: { lstat: FSTimes; unlink: FSTimes } = {
  lstat: { ...defaultTimes.lstat },
  unlink: { ...defaultTimes.unlink },
}

export const setTimes = (name: keyof typeof times, time: FSTimes) => {
  times[name] = time
}

export const clearFS = (fs: FileSystem) => {
  fs.removeAll()
}

export const populateFS = (fs: FileSystem, items: FSItem[], path = '/') => {
  const directory = fs.getDirectory(path)
  if (!directory) {
    return
  }
  for (const item of items) {
    if (item.type == 'directory') {
      const dir = new Directory(item.name)
      directory.appendItem(dir)
      if (item.childs) {
        populateFS(fs, item.childs, dir.path)
      }
    } else if (item.type == 'file') {
      const file = new File(item.name)
      file.size = item.size || 0
      directory.appendItem(file)
    }
  }
}

export const createFS = (fs: FileSystem, _times?: { lstat: FSTimes; unlink: FSTimes }) => {
  const times = _times || defaultTimes
  return {
    lstat: async (path: string) => {
      const directory = fs.getDirectory(path)
      await sleep(random(times.lstat.min, times.lstat.max))
      if (!directory) {
        return []
      }
      return directory.getItems().map(getItem)
    },
    unlink: async (path: string) => {
      await sleep(random(times.unlink.min, times.unlink.max))
      return fs.removeItem(path)
    },
    mkdir: async (path: string) => {
      await sleep(random(times.lstat.min, times.lstat.max))
      const directory = fs.createDirectory(path)
      return getItem(directory)
    },
    exists: async (path: string) => {
      await sleep(random(times.lstat.min, times.lstat.max))
      const item = fs.getItem(path)
      return Boolean(item)
    },
    dirs: {
      PictureDir: '/base/dir/' as const,
      DocumentDir: '/base/dir/' as const,
      DownloadDir: '/base/dir' as const,
    },
  }
}

const getItem = (item: Item) => {
  if (item instanceof File) {
    return getFile(item)
  }
  return getDirectory(item as Directory)
}

const getFile = (file: File) => {
  return {
    type: 'file' as const,
    path: file.path,
    size: file.size,
    filename: file.name,
    // @ts-ignore
    lastModified: file.lastModified || Date.now(),
  }
}

const getDirectory = (directory: Directory) => {
  return {
    type: 'directory' as const,
    path: directory.path,
    size: 0,
    filename: directory.name,
    lastModified: Date.now(),
  }
}

export const _1MiB = 1024 * 1024
export const FILES: FSItem[] = []

export const URLS: string[] = []
export const FILES_COUNT = 50
for (let i = 0; i < FILES_COUNT; ++i) {
  const name = `image-${pad(i + 1, 2)}.png`
  const url = `https://example.com/path/to/${name}`
  URLS.push(url)
  const baseName = sha1(url)
  const fileName = `${baseName}.png`
  const filesize = random(_1MiB * 7.5, _1MiB * 15)
  FILES.push({ type: 'file', name: fileName, size: filesize })
}

export const defaultItems: FSItem[] = [{
  type: 'directory',
  name: 'base',
  childs: [{
    type: 'directory',
    name: 'dir',
    childs: [{
      type: 'directory',
      name: 'rn-file-cache',
      childs: [
        ...FILES,
        {
          type: 'directory',
          name: 'temp',
          childs: [{
            type: 'file',
            name: 'file-01.txt',
            size: 101,
          }]
        }
      ],
    }],
  }, {
    type: 'directory',
    name: 'temporary_dir',
    childs: [{
      type: 'file',
      name: 'file-02.txt',
      size: 10,
    }]
  }],
}]
