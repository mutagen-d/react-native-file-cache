import { createFS, times } from './fs'
import { createFetch, RNFetchBlobConfig, StatefulPromise, FetchBlobResponse } from './fetch'
import FileSystem from 'tree-file-system'

export const createRNFetchBlob = (fs: FileSystem) => {
  const FS = createFS(fs, times)
  const { config, fetch } = createFetch(fs)
  return {
    fs: FS,
    config,
    fetch,
  }
}

export { FetchBlobResponse }
export type { StatefulPromise, RNFetchBlobConfig }