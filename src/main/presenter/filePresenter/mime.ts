import { CsvFileAdapter } from './CsvFileAdapter'
import { ExcelFileAdapter } from './ExcelFileAdapter'
import { FileAdapterConstructor } from './FileAdapterConstructor'
import { ImageFileAdapter } from './ImageFileAdapter'
import { PdfFileAdapter } from './PdfFileAdapter'
import { TextFileAdapter } from './TextFileAdapter'
import { DocFileAdapter } from './DocFileAdapter'
import { PptFileAdapter } from './PptFileAdapter'

export const getMimeTypeAdapterMap = (): Map<string, FileAdapterConstructor> => {
  const map = new Map<string, FileAdapterConstructor>()
  map.set('application/json', TextFileAdapter)
  map.set('application/javascript', TextFileAdapter)
  map.set('text/plain', TextFileAdapter)
  map.set('text/csv', CsvFileAdapter)
  map.set('application/vnd.ms-excel', ExcelFileAdapter)
  map.set('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ExcelFileAdapter)
  map.set('application/vnd.oasis.opendocument.spreadsheet', ExcelFileAdapter)
  map.set('application/vnd.ms-excel.sheet.binary.macroEnabled.12', ExcelFileAdapter)
  map.set('application/vnd.apple.numbers', ExcelFileAdapter)
  map.set('text/markdown', TextFileAdapter)
  map.set('application/x-yaml', TextFileAdapter)
  map.set('application/xml', TextFileAdapter)
  map.set('application/typescript', TextFileAdapter)
  map.set('application/x-sh', TextFileAdapter)
  map.set('text/*', TextFileAdapter)
  map.set('application/pdf', PdfFileAdapter)
  map.set('image/jpeg', ImageFileAdapter)
  map.set('image/jpg', ImageFileAdapter)
  map.set('image/png', ImageFileAdapter)
  map.set('image/gif', ImageFileAdapter)
  map.set('image/webp', ImageFileAdapter)
  map.set('image/bmp', ImageFileAdapter)
  map.set('image/*', ImageFileAdapter)

  // Word document formats
  map.set('application/msword', DocFileAdapter)
  map.set('application/vnd.openxmlformats-officedocument.wordprocessingml.document', DocFileAdapter)

  // PowerPoint formats
  map.set('application/vnd.ms-powerpoint', PptFileAdapter)
  map.set(
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    PptFileAdapter
  )

  // Web formats
  map.set('text/html', TextFileAdapter)
  map.set('text/css', TextFileAdapter)
  map.set('application/xhtml+xml', TextFileAdapter)

  return map
}
