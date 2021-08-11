import Deffer from "./Deffer"
import { FileRequestOptions as DownloadOptions } from "./FileRequest"
import { File } from "./FileResponse"
import Logger from "./Logger"
import Request from "./Request"

export class DownloadError extends Error {}

class Downloader {
  private static requests: { [url: string]: Request } = {}

  static getActiveRequest(url: string) {
    return Downloader.requests[url]
  }
  static setActiveRequest(url: string, request: Request) {
    Downloader.requests[url] = request
  }
  static removeActiveRequest(url: string) {
    return delete Downloader.requests[url]
  }
  static isRequestStarted(url: string) {
    return Boolean(Downloader.requests[url])
  }

  public static async download(options: DownloadOptions) {
    try {
      const file = await Downloader.downloadFile(options)
      return file
    } catch (reason) {
      Downloader.logError(new DownloadError(`${reason}`))
      throw reason
    } finally {
      Downloader.removeActiveRequest(options.url)
    }
  }

  private static async downloadFile(options: DownloadOptions) {
    const { url, path, method, headers } = options
    const started = Downloader.isRequestStarted(url)
    const request = started ? Downloader.getActiveRequest(url) : new Request({ url, path, method, headers })
    Downloader.setActiveRequest(url, request)
    this.addDownloadListeners(options)
    if (started) {
      await Downloader.waitRequestToComplete(url)
    } else {
      await request.download()
    }
    const file = request.getFile() as File
    return file
  }

  private static addDownloadListeners(options: DownloadOptions) {
    const { url } = options
    const request = Downloader.getActiveRequest(url)
    if (options?.onProgress) {
      request.on('progress', options.onProgress)
    }
    if (options?.onLoad) {
      request.on('load', options.onLoad)
    }
    if (options?.onError) {
      request.on('error', options.onError)
    }
    if (options?.onCancel) {
      request.on('cancel', options.onCancel)
    }
    if (options?.onLoadEnd) {
      request.on('loadend', options.onLoadEnd)
    }
  }

  private static waitRequestToComplete(url: string) {
    const deffer = new Deffer<File>()
    const request = Downloader.getActiveRequest(url)
    request.once('load', (file) => deffer.resolve(file))
    request.once('error', (error) => deffer.reject(error))
    return deffer.promise
  }

  static async stopDownload(url: string) {
    try {
      const request = Downloader.getActiveRequest(url)
      if (request) {
        await request.stop()
        return true
      }
    } catch (error) {
      this.logError(new DownloadError(`${error}`))
    }
    return false
  }

  private static logError(error: Error) {
    Logger.debug('Downloader [error]', error)
  }
}

export default Downloader