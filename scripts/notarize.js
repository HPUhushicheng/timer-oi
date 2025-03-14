import { notarize } from '@electron/notarize'

export default async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context
  const releaseFlag = process.env.build_for_release
  console.info('releaseFlag', releaseFlag)
  if (!releaseFlag) {
    console.info('Skipping notarization as build_for_release is not set')
    return
  }
  if (electronPlatformName !== 'darwin') {
    return
  }
  console.info('start notarize mac app', appOutDir)
  return await notarize({
    appPath: `${appOutDir}/DeepChat.app`,
    keychainProfile: 'DeepChat' // replace with your keychain
  })
}
