import FileSystem from 'tree-file-system'
import { createRNFetchBlob } from './index'

describe('RNFetchBlob', () => {
  test('createRNFetchBlob', () => {
    const fs = new FileSystem()
    const RNFetchBlob = createRNFetchBlob(fs)
    expect(RNFetchBlob).toHaveProperty('fs')
    expect(RNFetchBlob).toHaveProperty('config')
    expect(RNFetchBlob).toHaveProperty('fetch')
  })
})