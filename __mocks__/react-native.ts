type PlatformStatic = {
  OS: 'ios' | 'android'
}

export const Platform: PlatformStatic = {
  OS: 'android'
}

type PermissionsAndroidStatic = {
  requestMultiple: (permissions: Permission[]) => Promise<Record<Permission, PermissionStatus>>
  PERMISSIONS: Record<string, Permission>
}

type Permission = 'android.permission.READ_EXTERNAL_STORAGE'
  | 'android.permission.WRITE_EXTERNAL_STORAGE'

type PermissionStatus = 'granted' | 'denied' | 'never_ask_again'

export const PermissionsAndroid: PermissionsAndroidStatic = {
  requestMultiple: async (permissions: Permission[]): Promise<Record<Permission, PermissionStatus>> => {
    return {
      'android.permission.READ_EXTERNAL_STORAGE': 'granted',
      'android.permission.WRITE_EXTERNAL_STORAGE': 'granted',
    }
  },
  PERMISSIONS: {
    READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE' as const,
    WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE' as const,
  },
}
