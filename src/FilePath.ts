import EventEmitter from './EventEmitter'

export type FilePathParams = {
  state?: 'remove-started' | 'remove-done' | 'remove-error' | 'download-started' | 'download-done' | 'download-error' | 'none';
}

class FilePath extends EventEmitter<Required<FilePathParams>['state']> {
  private static files: { [path: string]: FilePath } = {}
  
  private path: string
  private state: Required<FilePathParams>['state']
  
  constructor(path: string, params: FilePathParams = {}) {
    super()
    this.path = path
    this.state = params.state || 'none'
  }
  
  static isRemoving(path: string) {
    return FilePath.getFile(path).state == 'remove-started'
  }

  static isDownloading(path: string) {
    return FilePath.getFile(path).state == 'download-started'
  }
  
  static getState(path: string) {
    const file = FilePath.getFile(path)
    return file.state
  }
  
  static emitTo(path: string, state: Required<FilePathParams>['state'], ...args: any[]) {
    const file = FilePath.getFile(path)
    file.state = state
    file.emit(state, ...args)
  }
  
  static cleanFile(path: string) {
    const file = FilePath.files[path]
    if (file) {
      file.removeAllListeners()
      delete FilePath.files[path]
    }
  }
  
  static addListener(path: string, state: Required<FilePathParams>['state'], listener: (...args: any[]) => void) {
    const file = FilePath.getFile(path)
    file.on(state, listener)
  }
  
  static removeListener(path: string, state: Required<FilePathParams>['state'], listener: (...args: any[]) => void) {
    const file = FilePath.getFile(path)
    file.off(state, listener)
  }
  
  static getFile(path: string) {
    const file = FilePath.files[path] || new FilePath(path)
    FilePath.files[path] = file
    return file
  }
}

export default FilePath