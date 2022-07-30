import { each, strHash, toStr } from 'licia-es'
import { getAbsoluteUrl, getContent } from './util'

const scripts = new Map()
scripts.set('1', {
  scriptId: '1',
  startColumn: 0,
  startLine: 0,
  endColumn: 100000,
  endLine: 100000,
  scriptLanguage: 'JavaScript',
  url: '',
})
const sources = new Map()
sources.set('1', '')

export function getScript(scriptId: string) {
  return scripts.get(scriptId)
}

export async function getScriptSource(scriptId: string) {
  if (sources.get(scriptId)) {
    return sources.get(scriptId)
  }
  const script = getScript(scriptId)
  try {
    const source = await getContent(script.url)
    sources.set(scriptId, source)
  } catch (e) {
    sources.set(scriptId, '')
  }

  return sources.get(scriptId)
}

export function getScripts() {
  const elements = document.querySelectorAll('script')
  const ret: any[] = []

  each(elements, element => {
    const src = element.getAttribute('src')
    if (src) {
      const url = getAbsoluteUrl(src)
      const scriptId = getScriptId(url)
      if (!scripts.get(scriptId)) {
        scripts.set(scriptId, {
          scriptId,
          startColumn: 0,
          startLine: 0,
          endColumn: 100000,
          endLine: 100000,
          scriptLanguage: 'JavaScript',
          url,
        })
      }
      ret.push(scripts.get(scriptId))
    }
  })

  return ret
}

function getScriptId(url: string) {
  return toStr(strHash(url))
}
