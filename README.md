# RNFileCache

[![Build Status](https://api.travis-ci.com/mutagen-d/react-native-file-cache.svg?branch=master)](https://travis-ci.com/mutagen-d/react-native-file-cache)

Caching files to disk in react-native apps

## Installation

This package depends on [`rn-fetch-blob`](https://github.com/joltup/rn-fetch-blob). First [install](https://github.com/joltup/rn-fetch-blob#user-content-installation) it.

```bash
npm i @mutagen-d/react-native-file-cache
// or
yarn add @mutagen-d/react-native-file-cache
```

## Usage

- first `load` files from disk

```javascript
await RNFileCache.load()
```

- then get file path from url or download file

```javascript
if (RNFileCache.exists(url)) {
  const filepath = RNFileCache.getPath(url)
} else {
  const file = await RNFileCache.download({ url })
  const filepath = file.path
}
```

- lock file to prevent from removing

```javascript
RNFileCache.lock("<lock id>", filepath)
```

- unlock file when needed

```javascript
RNFileCache.unlock("<lock id>")
```

- enable logger, see [js-logger](https://github.com/jonnyreeves/js-logger#readme)

```javascript
import { Logger } from "react-native-file-cache"
Logger.setLevel(Logger.DEBUG)
```

## API

| Method                                    | Return type | Description                                                                |
| ----------------------------------------- | ----------- | -------------------------------------------------------------------------- |
| `maxSize`                                 | `number`    | maximum size of cached files, defaults `512 MiB`                           |
| `totalSize`                               | `number`    | current size of cached files                                               |
| [`load()`](#load)                         |             | loads files from cache                                                     |
| [`exists()`](#exists)                     | `boolean`   | return if file exists in cache                                             |
| [`getPath()`](#getpath)                   | `string`    | get file path, regardless of whether file exists or not                    |
| [`download()`](#download)                 | `File`      | download file                                                              |
| [`cancelDownload()`](#canceldownload)     |             | cancel active download, partially downlaoded file will be removed          |
| `pruneCache()`                            |             | removes old files if cache size is reached `maxSize`                       |
| [`setClearingRatio()`](#setclearingratio) |             | set size of cache that will be removed when pruning cache, defaults `0.15` |
| `getClearingRatio()`                      | `number`    |                                                                            |
| [`lock()`](#lock)                         |             | locks file from being deleted                                              |
| [`unlock()`](#unlock)                     |             | unlock locked file                                                         |
| [`remove()`](#remove)                     |             | removes file by url                                                        |
| [`removeFile()`](#removefile)             |             | removes file by path                                                       |
| `isRemoving()`                            | `boolean`   |                                                                            |
| `onRemoved()`                             |             | set listener on file remove                                                |
| `removeAll()`                             |             | removes all files from cache                                               |

### load

```typescript
console.log(RNFileCache.isReady()) // `false`
await RNFileCache.load()
console.log(RNFileCache.isReady()) // `true`
```

### exists

```javascript
const exists = RNFileCache.exists("https://example.com/image.png")
```

### getPath

```javascript
const path = RNFileCache.getPath("https://example.com/image.png")
```

### download

```typescript
try {
  const file = await RNFileCache.download({
    method: "GET",
    url: "https://example.com/image.png",
    headers: {
      Authorization: "Bearer <token>",
    },
    onProgress: (loaded: number, total: number) => {
      console.log("progress", loaded / total)
    },
    onLoad: (file: File) => {
      console.log("file", file)
    },
    onError: (error: any) => {
      console.log("error", error)
    },
    onLoadEnd: () => {},
    onCancel: () => {
      console.log("file downloading canceled")
    },
  })
} catch (e) {
  console.log("error", e)
}
```

### cancelDownload

```javascript
await RNFileCache.cancelDownload("https://example.com/image.png")
```

### setClearingRatio

```javascript
RNFileCache.setClearingRatio(0.4)
RNFileCache.pruneCache()

assert(RNFileCache.totalSize <= RNFileCache.maxSize * 0.6)
```

### lock

```javascript
const lockId1 = "<id1>"
const lockId2 = "<id2>"
RNFileCache.lock(lockId1, file.path)
RNFileCache.lock(lockId2, file.path)
// file is not deleted untill `unlock` it
await RNFileCache.removeFile(file.path)
```

### unlock

```javascript
RNFileCache.unlock("<id1>")
RNFileCache.unlock("<id2>")
```

### remove

```javascript
await RNFileCache.remove("https://example.com/image.png")
```

### removeFile

```javascript
await RNFileCache.removeFile(file.path)
```
