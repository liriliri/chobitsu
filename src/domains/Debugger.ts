import connector from '../lib/connector'
import * as scriptMananger from '../lib/scriptMananger'
import { each } from 'licia-es'

export function enable() {
  const scripts = scriptMananger.collect()

  each(scripts, script => {
    connector.trigger('Debugger.scriptParsed', script)
  })
}

export async function getScriptSource(params: any) {
  return {
    scriptSource: await scriptMananger.getScriptSource(params.scriptId),
  }
}
