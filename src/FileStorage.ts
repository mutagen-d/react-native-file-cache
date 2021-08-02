import EventEmitter from './EventEmitter'
import FileRecord from './FileRecord'
import Path from '@mutagen-d/path'
import FileSystem from './FileSystem'
import { sha1 } from './util'
import BaseDir from './BaseDir'
import Logger from './Logger'

const _1MiB = 1024 * 1024

class FileStorage {
  static get baseDir() { return BaseDir.getBaseDIR() }
  static set baseDir(baseDir) {}
  static maxSize: number = 512 * _1MiB
  private static defaultDir = 'rn-file-cache' as const
  
  private static readyState: 'ready' | 'loading' | 'none' = 'none'
  
  private static events = new EventEmitter()
  
  private static records: { [name: string]: FileRecord } = {}
  private static fileNames: string[] = []
  
  static sources: { [path: string]: boolean } = {}

  static resetState() {
    FileStorage.readyState = 'none'
  }

  static async load(...subDirs: string[]) {
    FileStorage.log('load..', FileStorage.baseDir)
    FileStorage.readyState = 'loading'
    FileStorage.emit('loading')
    
    FileStorage.log('loadRecords..')
    const records = await FileStorage.loadRecords(...subDirs)
    const fileNames = records.map(record => record.getBaseName())
    
    FileStorage.cleanRecords()
    
    FileStorage.fileNames.push(...fileNames)
    records.forEach(record => {
      FileStorage.records[record.getBaseName()] = record
      FileStorage.sources[record.getFilePath()] = true
    })
    
    FileStorage.readyState = 'ready'
    FileStorage.emit('ready')
  }
  private static async loadRecords(...subDirs: string[]) {
    const dirs = FileStorage.getDirPaths(...subDirs)
    await FileSystem.requestPermissions()
    await Promise.all(dirs.map(FileSystem.createDirIfNotExists))
    const files = await FileSystem.loadFiles(...dirs)
    const records = files.map(file => {
      return FileRecord.create(file.path, { size: file.size, lastModified: file.lastModified })
    })
    return records
  }
  private static getDirPaths(...subDirs: string[]) {
    const dirs = [...subDirs, FileStorage.defaultDir].filter((dir, idx, arr) => {
      return arr.indexOf(dir) == idx
    }).map(dir => {
      return Path.resolve(Path.join(FileStorage.baseDir, dir))
    }).filter(dirPath => {
      return Path.isSubPath(dirPath, FileStorage.baseDir)
    })
    return dirs
  }
  static cleanRecords() {
    FileStorage.fileNames.length = 0
    Object.keys(FileStorage.records).forEach(name => {
      delete FileStorage.records[name]
    })
    Object.keys(FileStorage.sources).forEach(path => {
      delete FileStorage.sources[path]
    })
  }

  private static emit(...args: Parameters<typeof FileStorage.events.emit>) {
    FileStorage.events.emit(...args)
  }

  static on(...args: Parameters<typeof FileStorage.events.on>) {
    FileStorage.events.on(...args)
  }
  static off(...args: Parameters<typeof FileStorage.events.off>) {
    FileStorage.events.off(...args)
  }

  static isReady() {
    return FileStorage.readyState == 'ready'
  }
  
  static exists(url: string) {
    const name = sha1(url)
    const record = FileStorage.records[name]
    return Boolean(record)
  }
  static getPath(url: string, dir: string = FileStorage.defaultDir) {
    const name = sha1(url)
    const record = FileStorage.records[name]
    if (record) {
      return record.getFilePath()
    }
    const ext = Path.getExtension(url.split(/\#\?/g)[0].split('/').pop() as string)
    const fileName = ext ? `${name}.${ext}` : `${name}`
    const path = Path.join(FileStorage.baseDir, dir, fileName)
    return path
  }
  static getExistingPaths() {
    const paths = FileStorage.fileNames.map(name => {
      const record = FileStorage.records[name]
      return record.getFilePath()
    })
    return paths
  }
  
  static async removeFile(path: string) {
    try {
      const fileName = Path.getFileName(path)
      const dirPath = Path.getSourceDirectory(path, fileName)
      const isSubPath = Path.isSubPath(dirPath, FileStorage.baseDir)
      if (!isSubPath) {
        throw new Error('invalid path')
      }
      FileStorage.sources[path] = false
      await FileSystem.removeFile(path)
      FileStorage.removeRecord(path)
    } catch (error) {
      FileStorage.logError(error)
      throw error
    }
  }
  private static removeRecord(path: string) {
    const record = FileRecord.create(path)
    const baseName = record.getBaseName()
    delete FileStorage.records[baseName]
    const index = FileStorage.fileNames.indexOf(baseName)
    index > -1 && FileStorage.fileNames.splice(index, 1)
  }
  
  static saveFile(file: { url: string; path: string; ext: string; size: number; mime: string }) {
    return FileStorage.saveRecord(file)
  }
  private static saveRecord(file: any) {
    const record = FileRecord.create(file.path, { size: file.size, lastModified: Date.now() })
    const baseName = record.getBaseName()
    const exists = Boolean(FileStorage.records[baseName])
    if (exists) {
      return false
    }
    FileStorage.records[baseName] = record
    FileStorage.fileNames.push(baseName)
    FileStorage.sources[record.getFilePath()] = true
    return true
  }
  
  static getTotalSize() {
    return Object.keys(FileStorage.records).reduce((size, name) => {
      return size + FileStorage.records[name].getSize()
    }, 0)
  }
  
  static getRemovablePaths(ratio = 0.15) {
    const totalSize = FileStorage.getTotalSize()
    const maxRemainingSize = (1 - ratio) * FileStorage.maxSize
    let size = totalSize
    const names = FileStorage.fileNames.filter((name) => {
      if (size > maxRemainingSize) {
        size -= FileStorage.records[name].getSize()
        return true
      }
      return false
    })
    const paths = names.map(name => FileStorage.records[name].getFilePath())
    return paths
  }

  static countFiles() {
    return FileStorage.fileNames.length
  }
  
  private static logError(error: any) {
    Logger.debug('FileStorage [error]', error)
  }

  private static log(...args: any[]) {
    Logger.debug('FileStorage [log]', ...args)
  }
}

export default FileStorage
















