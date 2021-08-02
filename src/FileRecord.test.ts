import FileRecord from "./FileRecord";
import BaseDir from './BaseDir'
import Path from "@mutagen-d/path";

describe('FileRecord', () => {
  beforeAll(() => {
    BaseDir.setBaseDIR('/base/dir')
  })
  test('create', () => {
    const createRecord = (path: string) => {
      const record = FileRecord.create(path)
      const filename = Path.getFileName(path)
      expect(record.getBaseName()).toEqual(Path.getBaseName(filename))
      expect(record.getExt()).toEqual(Path.getExtension(filename))
      expect(record.getFileName()).toEqual(filename)
      expect(record.getFilePath()).toEqual(Path.resolve(path))
      const relativePath = Path.getRelativePath(path, BaseDir.getBaseDIR())
      expect(record.getDir()).toEqual(Path.resolve(relativePath.replace(`/${filename}`, '')))
      expect(record.getDir()).toEqual(Path.getSourceDirectory(relativePath, filename))
    }

    createRecord('/base/dir/folder/file.png')
    createRecord('/base/dir/folder/file')
    createRecord('/base/dir/folder/subfolder/file.1.txt')
    createRecord('/base/dir/folder/subfolder/../.file...txt')
  })
  test('create and ctor consistency', () => {
    const compare = (path: string) => {
      const record = FileRecord.create(path)
      const record2 = new FileRecord({
        name: record.getBaseName(),
        ext: record.getExt(),
        dir: record.getDir(),
      })

      expect(record.getFilePath()).toEqual(record2.getFilePath())
      expect(record.getFilePath()).toEqual(Path.resolve(path))
    }

    compare('/base/dir/folder/file.png')
    compare('/base/dir/folder/file.1.png')
    compare('/base/dir/folder/file')
    compare('/base/dir/folder/subfolder/file')
  })
  test('setFilePath', () => {
    const setFilePath = (path: string) => {
      const record = new FileRecord({ name: 'file', ext: 'txt', dir: './some-dir' })
      record.setFilePath(path)
      expect(record.getFilePath()).toEqual(Path.resolve(path))
    }

    setFilePath('/base/dir/cache/text.file.out')
    setFilePath('/base/dir/cache/input.txt')
    setFilePath('/base/dir/cache/../folder/input.txt')
  })
  test('toJSON', () => {
    const record = FileRecord.create('/base/dir/folder/file.txt')
    const json = record.toJSON()
    expect(json).toHaveProperty('name')
    expect(json).toHaveProperty('ext')
    expect(json).toHaveProperty('dir')
    expect(json).toHaveProperty('path')
  })
  test('set/get extension', () => {
    const record = FileRecord.create('/base/dir/subdir/../folder/file')
    expect(record.getExt()).toEqual('')
    record.setExt('txt')
    expect(record.getExt()).toEqual('txt')
    expect(record.getFilePath()).toEqual('/base/dir/folder/file.txt')
  })
  test('set/get directory', () => {
    const setGetDirectory = (path: string, dir: string) => {
      const record = FileRecord.create(path)
      const filename = Path.getFileName(path)
      record.setDir(dir)
      expect(record.getFilePath()).toEqual(Path.join(BaseDir.getBaseDIR(), dir, filename))
      expect(record.getDir()).toEqual(Path.resolve(dir))
    }

    setGetDirectory('/base/dir/folder/../subdir/file.txt', 'some/other/dir')
    setGetDirectory('/base/dir/folder/file.txt', './some/other/dir')
  })
  test('set/get filename', () => {
    const setGetFileName = (path: string, filename: string, expectedPath: string) => {
      const record = FileRecord.create(path)
      record.setFileName(filename)
      expect(record.getFilePath()).toEqual(expectedPath)
      expect(record.getFileName()).toEqual(filename)
    }
    setGetFileName('/base/dir/folder/file.txt', 'input_file.out', '/base/dir/folder/input_file.out')
    setGetFileName('/base/dir/folder/../dir/file.txt', 'input_file.out', '/base/dir/dir/input_file.out')
  })
  test('set/get basename', () => {
    const record = FileRecord.create('/base/dir/folder/file.txt')
    record.setBaseName('output_file_name')
    expect(record.getFileName()).toEqual('output_file_name.txt')
    expect(record.getBaseName()).toEqual('output_file_name')
  })
  test('set/get size/lastModified', () => {
    const record = FileRecord.create('/base/dir/folder/file.txt')
    record.setSize(101)
    expect(record.getSize()).toEqual(101)
    record.setLastModified(100132)
    expect(record.getLastModified()).toEqual(100132)
  })
  test('toString', () => {
    const record = FileRecord.create('/base/dir/folder/file.txt')
    const res = record.toString()
    expect(typeof res == 'string').toBe(true)
    expect(`${record}`).toEqual(res)
  })
  test('create - errors', () => {
    const createRecord = (path: string) => {
      try {
        const record = FileRecord.create(path)
      } catch (e) {
        expect(e instanceof Error).toBe(true)
      }
    }
    expect.assertions(2)
    createRecord('/base/folder/dir/file.txt')
    createRecord('/base/dir/file.txt')
  })
  test('set directory - error', () => {
    const setDirectory = (path: string, dir: string, errorMessage: string) => {
      try {
        const record = FileRecord.create(path)
        record.setDir(dir)
      } catch (e) {
        expect(e instanceof Error).toBe(true)
        expect(e.message.includes(errorMessage)).toBe(true)
      }
    }
    const size = 2
    expect.assertions(size * 2)
    setDirectory('/base/dir/folder/file.txt', '../../', 'invalid dir path')
    setDirectory('/base/dir/folder/file.txt', '../', 'invalid dir path')
  })
  test('get file path - error', () => {
    const run = (dir: string, errorMessage: string) => {
      try {
        const record = new FileRecord({ name: 'file', ext: 'txt', dir })
        record.getFilePath()
      } catch (e) {
        expect(e instanceof Error).toBe(true)
        expect(e.message.includes(errorMessage)).toBe(true)
      }
    }

    const size = 3
    expect.assertions(size * 2)
    run('./', 'invalid file path')
    run('../', 'invalid file path')
    run('../../', 'invalid file path')
  })
})