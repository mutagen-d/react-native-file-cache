import Path from '@mutagen-d/path'
import BaseDir from './BaseDir'

export type FileRecordParams = {
  name: string
  ext: string
  dir: string
  size?: number
  lastModified?: number
}

class FileRecord {
  private name: string = 'text'
  private ext: string = 'out'
  private dir: string = './rn-image-cache'
  private size: number = 0
  private lastModified: number = 0
  
  constructor(params: FileRecordParams) {
    this.name = params.name
    this.ext = params.ext
    this.dir = params.dir
    this.size = params.size || 0
    this.lastModified = params.lastModified || 0
  }
  
  toJSON() {
    return {
      name: this.name,
      ext: this.ext,
      dir: this.dir,
      size: this.size,
      path: this.getFilePath(),
      lastModified: this.lastModified,
    }
  }
  toString() {
    return JSON.stringify(this.toJSON())
  }
  
  setLastModified(lastModified: number) {
    this.lastModified = lastModified
  }
  setSize(size: number) {
    this.size = size
  }
  setBaseName(name: string) {
    this.name = name
  }
  setExt(ext: string) {
    this.ext = ext
  }
  setFileName(fileName: string) {
    const ext = Path.getExtension(fileName)
    const name = Path.getBaseName(fileName)
    this.name = name
    this.ext = ext
  }
  setFilePath(path: string) {
    const record = FileRecord.create(path)
    this.dir = record.dir
    this.name = record.name
    this.ext = record.ext
  }
  static create(path: string, params?: Omit<FileRecordParams, 'name' | 'ext' | 'dir'>) {
    if (!Path.isSubPath(path, BaseDir.getBaseDIR())) {
      throw new Error('invalid file path, path must be within baseDir "' + BaseDir.getBaseDIR() + '"')
    }
    const relativePath = Path.getRelativePath(path, BaseDir.getBaseDIR())
    const names = Path.getNames(relativePath)
    if (names.length < 2) {
      throw new Error('invalid file path, file must be in subdir of baseDir "' + BaseDir.getBaseDIR() + '"')
    }
    const fileName = Path.getFileName(relativePath)
    const dir = Path.getSourceDirectory(relativePath, fileName)
    const ext = Path.getExtension(fileName)
    const name = Path.getBaseName(fileName)
    return new FileRecord({ ...params, name, dir, ext })
  }
  setDir(dir: string) {
    const path = Path.join(BaseDir.getBaseDIR(), dir)
    if (!Path.isSubPath(path, BaseDir.getBaseDIR())) {
      throw new Error('invalid dir path, must be subdir of baseDIR "' + BaseDir.getBaseDIR() + '"')
    }
    this.dir = Path.resolve(dir)
  }
  
  getBaseName() {
    return this.name
  }
  getExt() {
    return this.ext
  }
  getFileName() {
    return this.ext ? `${this.name}.${this.ext}` : this.name
  }
  getFilePath() {
    const path = Path.join(BaseDir.getBaseDIR(), this.dir)
    if (!Path.isSubPath(path, BaseDir.getBaseDIR())) {
      throw new Error('invalid file path')
    }
    const relativePath = Path.getRelativePath(path, BaseDir.getBaseDIR())
    const names = Path.getNames(relativePath)
    if (names.length == 0) {
      throw new Error('invalid file path')
    }
    return Path.join(path, this.getFileName())
  }
  getDir() {
    return this.dir
  }
  getSize() {
    return this.size
  }
  getLastModified() {
    return this.lastModified
  }
}

export default FileRecord
