import EventEmitter from './EventEmitter';
import FileResponse, { File } from './FileResponse'
import FileRequest, { RequestListeners } from './FileRequest'
import Logger from './Logger';

export type RequestOptions = {
  url: string
  path: string
  method?: 'GET' | 'POST' | 'PUT' | 'get' | 'post' | 'put'
  headers?: Record<string, string>
}

class Request extends EventEmitter {
  private fileRequest: FileRequest
  private file?: File

  constructor(options: RequestOptions) {
    super()
    this.fileRequest = new FileRequest({
      method: options.method,
      url: options.url,
      path: options.path,
      headers: options.headers,
      onLoad: this.onLoad,
      onError: this.onError,
      onLoadEnd: this.onLoadEnd,
      onProgress: this.onProgress,
      onCancel: this.onCancel,
    })
  }

  download = async () => {
    try {
      await this.fileRequest.request()
    } catch (e) {
      this.onError(e)
    } finally {
      this.removeAllListeners()
    }
  }
  stop = async () => {
    try {
      await this.fileRequest.cancel()
    } catch (e) {
      this.logError(e)
    } finally {
      this.removeAllListeners()
    }
  }
  getFile() {
    return this.file
  }
  
  private onProgress = (loaded: number, total: number) => {
    this.emit('progress', loaded, total)
  }
  private onLoad = (response: Parameters<Required<RequestListeners>['onLoad']>[0]) => {
    const file = new FileResponse(response).getFile()
    this.file = file
    this.emit('load', file)
  }
  private onCancel = () => {
    this.emit('cancel')
  }
  private onError = (reason: any) => {
    this.emit('error', reason)
    this.logError(reason)
  }
  private onLoadEnd = () => {
    this.emit('loadend')
  }

  private logError(error: any) {
    Logger.debug('Request [error]', error)
  }
}

export default Request