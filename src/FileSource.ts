import { ImageURISource } from './Image.types'

class FileSource {
  private static regex = /^https?\:\/\//
  
  static isInternetURL(url?: any) {
    return typeof url == 'string' && FileSource.regex.test(url)
  }
  
  static isEqual(source: ImageURISource, prevSource: ImageURISource) {
    return FileSource.isEqualRequireSource(source, prevSource)
      || FileSource.isEqualURISource(source, prevSource)
  }
  private static isEqualRequireSource(source: ImageURISource, prevSource: ImageURISource) {
    return source === prevSource
  }
  private static isEqualURISource(source: ImageURISource, prevSource: ImageURISource) {
    const url = source && source.uri
    const prevUrl = prevSource && prevSource.uri
    return url === prevUrl
  }
}

export default FileSource