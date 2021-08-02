import { Platform } from 'react-native'
import { ImageURISource } from './Image.types'
import FileLock from './FileLock'
import FileStorage from './FileStorage'
import FilePath from './FilePath'
import FileSource from './FileSource'
import Downloader from './Downloader'
import { File } from './FileResponse'
import { sleep } from './util'
import { FileRequestOptions } from './FileRequest'
import FileSystem from './FileSystem'
import Logger from './Logger'

class RNFileCache {
  private static prefix: string = Platform.OS == 'ios' ? '' : 'file://'
  private static clearingRatio: number = 0.15
  private static cleaning: boolean = false
  
  static setPrefix(prefix: string) {
    RNFileCache.prefix = prefix
  }
  static getPrefix() {
    return RNFileCache.prefix
  }
  static set maxSize(maxSize) {
    FileStorage.maxSize = maxSize
  }
  static get maxSize() {
    return FileStorage.maxSize
  }

  static setClearingRatio(clearingRatio: number) {
    if (0 < clearingRatio && clearingRatio <= 1) {
      RNFileCache.clearingRatio = clearingRatio
    } else if (clearingRatio > 1) {
      RNFileCache.clearingRatio = 1
    } else if (clearingRatio <= 0) {
      RNFileCache.clearingRatio = 0
    }
  }
  static getClearingRatio() {
    return RNFileCache.clearingRatio
  }

  static load(...subDirs: string[]) {
    return FileStorage.load(...subDirs)
  }
  
  static isReady() {
    return FileStorage.isReady()
  }
  static onReady(listener: () => void) {
    FileStorage.on('ready', listener)
  }

  static get totalSize() {
    return FileStorage.getTotalSize()
  }
  
  static lock(componentId: string, path: string) {
    RNFileCache.unlock(componentId)
    FileLock.lock(path, componentId)
  }
  static unlock(componentId: string) {
    const paths = FileLock.findPaths(componentId)
    for (const path of paths) {
      FileLock.unlock(path, componentId)
    }
  }
  
  static isRemoving(path: string) {
    return FilePath.isRemoving(path)
  }
  static onRemoved(path: string, listener: (...args: any[]) => any) {
    FilePath.addListener(path, 'remove-done', listener)
    FilePath.addListener(path, 'remove-error', listener)
  }
  static exists(url: string) {
    return FileStorage.exists(url)
  }
  static getPath(url: string, dir?: string) {
    return FileStorage.getPath(url, dir)
  }
  static getSource(path: string) {
    return path ? { uri: `${RNFileCache.prefix}${path}` } : undefined
  }
  
  static remove(url: string) {
    if (RNFileCache.exists(url)) {
      const path = FileStorage.getPath(url)
      return RNFileCache.removeFile(path)
    }
  }
  static async removeFile(path: string, ms = 10000) {
    try {
      if (FileLock.isLocked(path)) {
        await Promise.race([
          FileLock.waitUnlock(path),
          sleep(ms).then(() => {
            throw new Error('unlock timeout acceeded')
          })
        ])
      }
      await FileStorage.removeFile(path)
      return true
    } catch (e) {
      RNFileCache.logError(e)
      return false
    }
  }
  static pruneCache() {
    const paths = FileStorage.getRemovablePaths(RNFileCache.clearingRatio)
    return RNFileCache.removeFiles(paths)
  }
  static async removeAll() {
    const paths = FileStorage.getExistingPaths()
    return RNFileCache.removeFiles(paths)
  }
  private static async removeFiles(paths: string[]) {
    if (paths.length == 0 || RNFileCache.cleaning) {
      return false
    }
    RNFileCache.cleaning = true

    try {
      await Promise.all(paths.map(path => RNFileCache.removeFile(path)))
    } finally {
      RNFileCache.cleaning = false
    }
    return true
  }
  
  static isInternetURL(url?: any) {
    return FileSource.isInternetURL(url)
  }
  static isEqual(source: ImageURISource, prevSource: ImageURISource) {
    return FileSource.isEqual(source, prevSource)
  }
  
  static async download(options: Omit<FileRequestOptions, 'path'> & { dirName?: string }) {
    if (!FileStorage.isReady()) {
      throw new Error('FileStorage [error]: is not ready')
    }
    await FileSystem.requestPermissions()
    const path = RNFileCache.getPath(options.url, options.dirName)
    const file = await Downloader.download({ ...options, path })
    if (file) {
      FileStorage.saveFile(file as Required<File>)
    }
    return file
  }
  static async cancelDownload(url: string) {
    await Downloader.stopDownload(url)
  }

  private static logError(error?: any) {
    Logger.debug('RNFileCache [error]', error)
  }
}

export default RNFileCache