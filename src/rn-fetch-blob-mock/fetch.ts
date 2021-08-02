import Deffer from "../Deffer"
import FileSystem from "tree-file-system"
import { XMLHttpRequest } from 'xhr2-cookies'

export const createFetch = (fs: FileSystem) => {
  const module = {
    config: function (options: RNFetchBlobConfig) {
      return { fetch: module.fetch.bind(options) }
    },
    fetch: function (method: string, url: string, headers?: Record<string, string>, body?: any): StatefulPromise<FetchBlobResponse> {
      // @ts-ignore
      const options: RNFetchBlobConfig = this || {}
      const { promise, resolve, reject } = new Deffer<FetchBlobResponse>()
      const taskId = Math.floor(Math.random() * 1e9).toString()
      const xhr = new XMLHttpRequest()
      xhr.open(method, url, true)
      if (headers) {
        Object.keys(headers).forEach(key => xhr.setRequestHeader(key, headers[key]))
      }
      // @ts-ignore
      const respInfo: RNFetchBlobResponseInfo = {
        respType: 'text',
        taskId,
      }
      xhr.addEventListener('readystatechange', () => {
        respInfo.status = xhr.status
        respInfo.state = xhr.readyState
        if (xhr.readyState == xhr.HEADERS_RECEIVED) {
          const responseHeaders = xhr.getAllResponseHeaders().split(/\r?\n/g).filter(s => {
            return s.trim()
          }).reduce((headers, rawHeader) => {
            const chunks = rawHeader.split(/\:/).map(s => s.trim())
            const [key] = chunks
            const value = chunks.slice(1).join('')
            if (key && value) {
              headers[key.toLowerCase()] = value
            }
            return headers
          }, {} as Record<string, string>)
          respInfo.headers = responseHeaders
          respInfo.rnfbEncode = 'utf8'
        }
        if (xhr.readyState == xhr.DONE) {
          if (options && options.path) {
            try {
              const file = fs.createFile(options.path)
              const cLength = respInfo.headers['content-length']
              file.size = cLength ? +cLength : 0
            } catch (e) {
              reject(e)
            }
          }
          resolve(new FetchBlobResponse(taskId, respInfo, xhr.response))
        }
      })
      xhr.addEventListener('abort', () => {
        reject(new Error('abort'))
      })
      // @ts-ignore
      promise.cancel = (cb?: (reason: any) => void) => {
        xhr.abort()
        cb && cb('abort')
        return promise
      }
      // @ts-ignore
      promise.progress = (callback: (loaded: number, total: number) => void) => {
        xhr.addEventListener('progress', function (e) {
          callback(e.loaded, e.total)
        })
        return promise
      }
      xhr.send(body)
      return promise as StatefulPromise<FetchBlobResponse>
    }
  }
  return module
}

export class FetchBlobResponse {
  data: any
  taskId: string
  type: 'path' | 'base64' | 'ascii' | 'utf8'
  respInfo: RNFetchBlobResponseInfo

  info = () => {
    return this.respInfo
  }

  constructor(taskId: string, info: RNFetchBlobResponseInfo, data: any) {
    this.data = data
    this.taskId = taskId
    this.type = info.rnfbEncode
    this.respInfo = info
  }

}

export type RNFetchBlobConfig = {
  fileCache?: boolean,
  path?: string,
  appendExt?: string,
  session?: string,
  addAndroidDownloads?: any,
  indicator?: boolean,
  followRedirect?: boolean,
  trusty?: boolean,
  wifiOnly?: boolean
};

export interface StatefulPromise<T> extends Promise<T> {
  /**
   * Cancel the request when invoke this method.
   */
  cancel(cb?: (reason: any) => void): StatefulPromise<FetchBlobResponse>;

  /**
   * Add an event listener which triggers when data receiving from server.
   */
  progress(callback: (received: number, total: number) => void): StatefulPromise<FetchBlobResponse>;

  /**
   * Add an event listener with custom configuration
   */
  progress(config: { count?: number, interval?: number }, callback: (received: number, total: number) => void): StatefulPromise<FetchBlobResponse>;

  /**
   * Add an event listener with custom configuration.
   */
  uploadProgress(callback: (sent: number, total: number) => void): StatefulPromise<FetchBlobResponse>;

  /**
   * Add an event listener with custom configuration
   */
  uploadProgress(config: { count?: number, interval?: number }, callback: (sent: number, total: number) => void): StatefulPromise<FetchBlobResponse>;

  /**
   * An IOS only API, when IOS app turns into background network tasks will be terminated after ~180 seconds,
   * in order to handle these expired tasks, you can register an event handler, which will be called after the
   * app become active.
   */
  expire(callback: () => void): StatefulPromise<void>;
}

export type RNFetchBlobResponseInfo = {
  taskId: string,
  state: number,
  headers: Record<string, string>,
  status: number,
  respType: 'text' | 'blob' | '' | 'json',
  rnfbEncode: 'path' | 'base64' | 'ascii' | 'utf8'
}
