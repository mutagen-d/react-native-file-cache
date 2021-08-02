import Deffer from './Deffer'
import EventEmitter from './EventEmitter'

class FileLock extends EventEmitter {
  private static fileLocks: { [path: string]: FileLock } = {}

  private components: { [componentId: string]: boolean }
  private path: string

  constructor(path: string) {
    super()
    this.path = path
    this.components = {}
  }

  private remove() {
    const ids = Object.keys(this.components)
    for (const componentId of ids) {
      delete this.components[componentId]
    }
    if (ids.length) {
      this.emit('unlock', this.path)
    }
    this.removeAllListeners()
  }

  static lock(path: string, componentId: string) {
    const file = FileLock.fileLocks[path] || new FileLock(path)
    file.components[componentId] = true
    FileLock.fileLocks[path] = file
  }

  static unlock(path: string, componentId: string) {
    const file = FileLock.fileLocks[path]
    if (!file) {
      return
    }
    delete file.components[componentId]
    if (Object.keys(file.components).length == 0) {
      file.emit('unlock', path)
      delete FileLock.fileLocks[path]
      file.removeAllListeners()
    }
  }

  static onUnlock(path: string, listener: (path: string) => void) {
    const file = FileLock.fileLocks[path]
    if (file) {
      file.once('unlock', listener)
    } else {
      listener(path)
    }
  }
  static waitUnlock(path: string) {
    const deffer = new Deffer<string>()
    FileLock.onUnlock(path, deffer.resolve)
    return deffer.promise
  }

  static getFile(path: string) {
    return FileLock.fileLocks[path]
  }
  static isLocked(path: string) {
    return Boolean(FileLock.fileLocks[path])
  }
  static findPaths(componentId: string) {
    return Object.keys(FileLock.fileLocks).filter(path => {
      return FileLock.fileLocks[path]?.components[componentId]
    })
  }

  static unlockAll() {
    Object.keys(FileLock.fileLocks).forEach(path => {
      const file = FileLock.getFile(path)
      file.remove()
      delete FileLock.fileLocks[path]
    })
  }
}

export default FileLock