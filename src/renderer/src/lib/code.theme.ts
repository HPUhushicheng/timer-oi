import { createTheme } from '@uiw/codemirror-themes'
import { tags as t } from '@lezer/highlight'

export const anysphereTheme = createTheme({
  theme: 'dark',
  settings: {
    background: '#181818',
    foreground: '#D6D6DD',
    caret: '#D6D6DD',
    selection: '#163761',
    selectionMatch: '#163761',
    lineHighlight: '#292929',
    gutterBackground: '#181818',
    gutterForeground: '#535353'
  },
  styles: [
    { tag: [t.comment, t.lineComment, t.blockComment], color: '#6D6D6D', fontStyle: 'italic' },
    { tag: t.docComment, color: '#6D6D6D', fontStyle: 'italic', fontWeight: 'bold' },
    { tag: t.variableName, color: '#D1D1D1' },
    { tag: [t.propertyName, t.labelName], color: '#AA9BF5' },
    { tag: [t.string, t.character, t.docString], color: '#E394DC' },
    { tag: [t.number, t.integer, t.float], color: '#EBC88D' },
    { tag: [t.bool, t.null, t.atom], color: '#82D2CE' },
    { tag: [t.keyword, t.modifier, t.operatorKeyword], color: '#82D2CE' },
    { tag: [t.controlKeyword, t.controlOperator], color: '#83D6C5' },
    { tag: t.definitionKeyword, color: '#83D6C5', fontWeight: 'bold' },
    { tag: t.moduleKeyword, color: '#83D6C5', fontStyle: 'italic' },
    { tag: t.self, color: '#83D6C5', fontStyle: 'italic' },
    {
      tag: [
        t.operator,
        t.arithmeticOperator,
        t.logicOperator,
        t.bitwiseOperator,
        t.compareOperator,
        t.updateOperator
      ],
      color: '#D6D6DD'
    },
    { tag: t.definitionOperator, color: '#83D6C5' },
    { tag: [t.className, t.definition(t.typeName), t.typeName], color: '#87C3FF' },
    { tag: t.namespace, color: '#87C3FF' },
    { tag: t.typeOperator, color: '#EFB080' },
    { tag: t.tagName, color: '#87C3FF', fontWeight: 'bold' },
    { tag: t.angleBracket, color: '#898989' },
    { tag: t.attributeName, color: '#AAA0FA' },
    { tag: t.attributeValue, color: '#E394DC' },
    { tag: t.function(t.variableName), color: '#EFB080' },
    { tag: t.macroName, color: '#A8CC7C' },
    { tag: [t.bracket, t.paren, t.brace], color: '#E394DC' },
    { tag: t.punctuation, color: '#D6D6DD' },
    { tag: t.invalid, color: '#ff0000', fontStyle: 'italic' },
    { tag: [t.meta, t.documentMeta, t.annotation], color: '#6D6D6D' },
    { tag: t.url, color: '#83D6C5', textDecoration: 'underline' },
    { tag: t.color, color: '#EBC88D' }
  ]
})
