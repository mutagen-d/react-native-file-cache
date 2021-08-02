import FilePath from './FilePath'

describe('FilePath', () => {
  test('getFile', () => {
    const path = 'some string'
    const file = FilePath.getFile(path)
    expect(file).toBeTruthy()
    expect(file === FilePath.getFile(path)).toBe(true)
    FilePath.cleanFile(path)
  })
  describe('emitTo', () => {
    const path = 'some string'

    afterEach(() => {
      FilePath.cleanFile(path)
    })

    test('state changed', () => {
      FilePath.emitTo(path, 'remove-started')
      expect(FilePath.getState(path) === 'remove-started').toBe(true)
    })
    test('arguments pass', () => {
      const listener = jest.fn()
      FilePath.addListener(path, 'remove-error', listener)
      FilePath.emitTo(path, 'remove-error', '1', 2, '3')
      expect(listener).toBeCalledTimes(1)
      expect(listener).toBeCalledWith('1', 2, '3')
      expect(FilePath.getState(path) == 'remove-error').toBe(true)
      FilePath.removeListener(path, 'remove-error', listener)
      const file = FilePath.getFile(path)
      expect(file.countAllListeners()).toBe(0)
    })
  })
  test('isRemoving', () => {
    FilePath.emitTo('path', 'remove-started')
    expect(FilePath.isRemoving('path')).toBe(true)
    FilePath.cleanFile('path')
  })
  test('isDownloading', () => {
    FilePath.emitTo('path', 'download-started')
    expect(FilePath.isDownloading('path')).toBe(true)
    FilePath.cleanFile('path')
  })
})