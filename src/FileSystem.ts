import { PermissionsAndroid, Platform } from 'react-native'
import RNFetchBlob, { RNFetchBlobStat } from 'rn-fetch-blob'
import PQueue from 'p-queue'
import Path from '@mutagen-d/path'
import FilePath from './FilePath'
import Logger from './Logger'

class FileSystem {
  private static files: RNFetchBlobStat[] = []
  private static queue: PQueue = new PQueue({ concurrency: 1 })

  static async loadFiles(...dirs: string[]) {
    FileSystem.cleanFiles()
    await FileSystem.requestPermissions()
    await Promise.all(dirs.map(dirpath => FileSystem.readDir(dirpath)))
    return FileSystem.files
  }
  
  static async requestPermissions() {
    if (Platform.OS != 'android') {
      return true
    }
    const status = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    ])
    return status[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] == 'granted'
      && status[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] == 'granted'
  }
  
  static cleanFiles() {
    FileSystem.files.length = 0
  }

  static async readDir(dirPath: string) {
    try {
      await FileSystem.readDirAndSaveFiles(dirPath)
    } catch (e) {
      FileSystem.logError(e)
    }
  }
  
  private static async readDirAndSaveFiles(path: string) {
    const items = await RNFetchBlob.fs.lstat(path)
    const files = items.filter(item => item.type == 'file' && !FileSystem.findFile(item.path))
    files.length && FileSystem.files.push(...files)
    FileSystem.files.sort((a, b) => a.lastModified - b.lastModified)
  }
  
  static findFile(path: string) {
    const resolvePath = Path.resolve(path)
    return FileSystem.files.find(file => file.path == resolvePath)
  }
  
  static async removeFile(path: string) {
    try {
      await FileSystem.requestPermissions()
      const resolvedPath = Path.resolve(path)
      FilePath.emitTo(resolvedPath, 'remove-started')
      const res = await FileSystem.queue.add(() => {
        return RNFetchBlob.fs.unlink(resolvedPath)
      })
      FilePath.emitTo(resolvedPath, 'remove-done')
      FilePath.cleanFile(resolvedPath)
      return res
    } catch (e) {
      FilePath.emitTo(Path.resolve(path), 'remove-error', e)
      throw e
    }
  }

  static async createDirIfNotExists(dir: string) {
    const exists = await RNFetchBlob.fs.exists(dir)
    if (exists) {
      return false
    }
    await RNFetchBlob.fs.mkdir(dir)
    return true
  }
  
  static addTask<T extends () => Promise<any>>(task: T) {
    return FileSystem.queue.add(task)
  }

  static getFiles() {
    return FileSystem.files
  }
  
  private static logError(error: any) {
    Logger.debug('FileSystem [error]', error)
  }
}

export default FileSystem