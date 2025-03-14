import { MessageFile } from '@shared/chat'

export const getFileContext = (files: MessageFile[]) => {
  return files.length > 0
    ? `

  <files>
    ${files
      .map(
        (file) => `<file>
      <name>${file.name}</name>
      <content>${file.content}</content>
    </file>`
      )
      .join('\n')}
  </files>
  `
    : ''
}
