import { Platform } from 'react-native'
import RNFetchBlob from 'rn-fetch-blob'

class BaseDir {
  // @ts-ignore
  private static baseDIR: string = Platform.OS == 'ios' ? RNFetchBlob.fs.dirs.DocumentDir : RNFetchBlob.fs.dirs.PictureDir
  
  static setBaseDIR(baseDIR: string) {
    BaseDir.baseDIR = baseDIR
  }
  static getBaseDIR() {
    return BaseDir.baseDIR
  }
}

export default BaseDir