import { createRNFetchBlob } from "../src/rn-fetch-blob-mock";
import { populateFS, defaultItems, fileSystem } from "../src/rn-fetch-blob-mock/fs";

const RNFetchBlob = createRNFetchBlob(fileSystem)

fileSystem.removeAll()
populateFS(fileSystem, defaultItems)

export default RNFetchBlob