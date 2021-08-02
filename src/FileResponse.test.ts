import FileResponse, { FileResponseParams } from './FileResponse'

describe('FileResponse', () => {
  test('ctor', () => {
    const ctor = (params: FileResponseParams, expected: { ext: string; mime?: string; size?: number }) => {
      const res = new FileResponse(params)
      const file = res.getFile()
      expect(file.ext).toEqual(expected.ext)
      expect(file.mime).toEqual(expected.mime)
    }
    ctor({
      url: 'https://example.com/file-01.html',
      responseHeaders: { 'Content-Type': 'image/png' },
    }, { ext: 'png', mime: 'image/png' })
    ctor({
      url: 'https://example.com/file-01.html',
      responseHeaders: { 'Content-Length': '101' },
    }, { ext: 'html', size: 101 })
    ctor({
      url: 'https://example.com/file-01',
      responseHeaders: { 'Content-Length': '101' },
    }, { ext: '', size: 101 })
    ctor({
      url: 'https://example.com',
      responseHeaders: { 'Content-Length': '101' },
    }, { ext: '', size: 101 })
  })
})