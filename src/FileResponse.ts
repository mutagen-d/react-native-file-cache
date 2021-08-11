export type File = {
  mime: string;
  ext: string;
  size: number;
  path?: string;
  url: string;
}

export type FileResponseParams = {
  url: string
  responseHeaders: Record<string, string>
  path?: string
}

class FileResponse {
  private headers: Record<string, string>
  private url: string
  private path?: string
  private file: File
  
  constructor(params: FileResponseParams) {
    this.url = params.url
    this.path = params.path
    this.headers = params.responseHeaders
    this.file = this.getFileFromHeaders()
  }
  
  private static headersToLowerCase(headers: Record<string, string>) {
    return Object.keys(headers).reduce((acc, key) => {
      acc[key.toLowerCase().trim()] = headers[key]
      return acc
    }, {} as Record<string, string>)
  }
  private static getExtensionFromMime(mime: string) {
    if (!mime) {
      return mime
    }
    const [type] = mime.split(';').map(s => s.trim())
    return type ? type.split('/').pop() : type
  }
  private static getExtensionFromUrl(url: string) {
    const pathname = url.replace(/^(https?)?\:\/\/([^/#?]+)/, '').split(/[?#]/g)[0].split('/').pop()
    const names = pathname ? pathname.split('.') : []
    return names.length > 1 ? names.pop() as string : ''
  }
  
  getFile() {
    return this.file
  }
  
  private getFileFromHeaders() {
    const headers = FileResponse.headersToLowerCase(this.headers)
    const mime = headers['content-type']
    const ext = FileResponse.getExtensionFromMime(mime) || FileResponse.getExtensionFromUrl(this.url)
    const clength = headers['content-length']
    const size = clength ? +clength : undefined
    return {
      mime: mime,
      ext: ext as string,
      size: size as number,
      path: this.path,
      url: this.url,
    } as File
  }
}

export default FileResponse