import RNFetchBlob, { FetchBlobResponse, StatefulPromise } from 'rn-fetch-blob';
import FileSystem from './FileSystem';
import Logger from './Logger';
import Path from '@mutagen-d/path'
import FileResponse from './FileResponse';

export type DownloadOptions = RequestOptions<DownloadMethod> & {
  path: string
}
export type RequestOptions<T extends RequestMethod = RequestMethod> = {
  url: string
  method?: T
  headers?: Record<string, string>
  body?: any
}
export type DownloadMethod = RequestMethod<Exclude<Method, 'HEAD'>>
export type RequestMethod<T extends Method = Method> = Uppercase<T> | Lowercase<T>
export type Method = 'GET' | 'POST' | 'PUT' | 'HEAD'

export type RequestListeners = {
  onProgress?: (loaded: number, total: number) => void
  onLoad?: (response: { url: string; path?: string; responseHeaders: Record<string, string> }) => void
  onError?: (reason?: any) => void
  onLoadEnd?: () => void
  onCancel?: () => void
}

export type FileRequestOptions = RequestListeners & DownloadOptions

class FileRequest {
  private options: FileRequestOptions
  private req?: StatefulPromise<FetchBlobResponse>
  private res?: FetchBlobResponse
  
  constructor(options: FileRequestOptions) {
    this.options = options
  }
  
  async request() {
    try {
      await this.fetchFile()
      return this.onLoad()
    } catch (e) {
      this.unlinkFile()
      this.onError(e)
      this.logError(e)
    } finally {
      this.onLoadEnd()
    }
  }

  private async fetchFile() {
    const { url, path, method = 'GET', headers, body } = this.options

    const { fetch } = path ? RNFetchBlob.config({ path }) : RNFetchBlob
    const req = this.req = fetch(method, url, headers, body)
    if (this.options.onProgress) {
      req.progress(this.options.onProgress)
    }
    this.res = await req
  }
  private async onLoad() {
    const res = this.res as FetchBlobResponse
    const { onLoad, url } = this.options
    const path = await this.getFixedPath()
    const response = { url, path, responseHeaders: res.info().headers as Record<string, string> }
    try {
      onLoad && onLoad(response)
    } catch (e) {}
    return response
  }
  private async getFixedPath() {
    const { path } = this.options
    if (!path) {
      return path
    }
    const filename = path.split('/').pop() as string
    if (Path.getExtension(filename)) {
      return path
    }
    const fres = new FileResponse({
      url: this.options.url,
      responseHeaders: this.res?.info().headers
    })
    const file = fres.getFile()
    const fixedPath = `${path}.${file.ext}`
    await RNFetchBlob.fs.mv(path, fixedPath)
    return fixedPath
  }
  private unlinkFile() {
    const { path } = this.options
    if (path) {
      FileSystem.removeFile(path).catch(() => {})
    }
  }
  private onError(error?: any) {
    const { onError } = this.options
    if (onError) {
      onError(error)
    }
  }
  private logError(error?: any) {
    Logger.debug('FileRequest [error]', error)
  }
  private onLoadEnd() {
    const { onLoadEnd } = this.options
    if (onLoadEnd) {
      onLoadEnd()
    }
  }
  
  async cancel() {
    try {
      await this.cancelRequest()
    } catch (e) {
      this.logError(new Error('cancel error: ' + e.message))
    } finally {
      this.unlinkFile()
    }
  }
  private async cancelRequest() {
    const { onCancel } = this.options
    if (this.req) {
      await this.req.cancel(onCancel)
    }
  }
  
}

export default FileRequest
