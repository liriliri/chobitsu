import connector from '../lib/connector'
import {
  each,
  map,
  now,
  isStr,
  fnParams,
  uncaught,
  startWith,
  stackTrace,
  trim,
} from 'licia-es'
import * as objManager from '../lib/objManager'
import evaluateJs, { setGlobal } from '../lib/evaluate'

const executionContext = {
  id: 1,
  name: 'top',
  origin: location.origin,
}

export async function callFunctionOn(params: any) {
  const { functionDeclaration, objectId } = params
  let args = params.arguments || []

  args = map(args, (arg: any) => {
    const { objectId, value } = arg
    if (objectId) {
      const obj = objManager.getObj(objectId)
      if (obj) return obj
    }

    return value
  })

  let ctx = null
  if (objectId) {
    ctx = objManager.getObj(objectId)
  }

  return {
    result: objManager.wrap(await callFn(functionDeclaration, args, ctx)),
  }
}

export function enable() {
  uncaught.start()
  monitorConsole()
  connector.trigger('Runtime.executionContextCreated', {
    context: executionContext,
  })
}

export function getProperties(params: any) {
  return objManager.getProperties(params)
}

export function evaluate(params: any) {
  const ret: any = {}

  let result: any
  try {
    result = evaluateJs(params.expression)
    setGlobal('$_', result)
    ret.result = objManager.wrap(result, {
      generatePreview: true,
    })
  } catch (e) {
    ret.exceptionDetails = {
      exception: objManager.wrap(e),
      text: 'Uncaught',
    }
    ret.result = objManager.wrap(e, {
      generatePreview: true,
    })
  }

  return ret
}

export function releaseObject(params: any) {
  objManager.releaseObj(params.objectId)
}

export function globalLexicalScopeNames() {
  return {
    names: [],
  }
}

declare const console: any

function monitorConsole() {
  const methods: any = {
    log: 'log',
    warn: 'warning',
    error: 'error',
    info: 'info',
    dir: 'dir',
    table: 'table',
    group: 'startGroup',
    groupCollapsed: 'startGroupCollapsed',
    groupEnd: 'endGroup',
    debug: 'debug',
    clear: 'clear',
  }

  each(methods, (type, name) => {
    const origin = console[name].bind(console)
    console[name] = (...args: any[]) => {
      origin(...args)

      args = map(args, arg =>
        objManager.wrap(arg, {
          generatePreview: true,
        })
      )

      connector.trigger('Runtime.consoleAPICalled', {
        type,
        args,
        stackTrace: {
          callFrames:
            type === 'error' || type === 'warning' ? getCallFrames() : [],
        },
        executionContextId: executionContext.id,
        timestamp: now(),
      })
    }
  })
}

const Function = window.Function
/* tslint:disable-next-line */
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

function parseFn(fnStr: string) {
  const result = fnParams(fnStr)

  if (fnStr[fnStr.length - 1] !== '}') {
    result.push('return ' + fnStr.slice(fnStr.indexOf('=>') + 2))
  } else {
    result.push(fnStr.slice(fnStr.indexOf('{') + 1, fnStr.lastIndexOf('}')))
  }

  return result
}

async function callFn(
  functionDeclaration: string,
  args: any[],
  ctx: any = null
) {
  const fnParams = parseFn(functionDeclaration)
  let fn

  if (startWith(functionDeclaration, 'async')) {
    fn = AsyncFunction.apply(null, fnParams)
    return await fn.apply(ctx, args)
  }

  fn = Function.apply(null, fnParams)
  return fn.apply(ctx, args)
}

uncaught.addListener(err => {
  connector.trigger('Runtime.exceptionThrown', {
    exceptionDetails: {
      exception: objManager.wrap(err),
      stackTrace: { callFrames: getCallFrames(err) },
      text: 'Uncaught',
    },
    timestamp: now,
  })
})

function getCallFrames(error?: Error) {
  let callFrames: any[] = []
  const callSites: any = error ? error.stack : stackTrace()
  if (isStr(callSites)) {
    callFrames = callSites.split('\n')
    if (!error) {
      callFrames.shift()
    }
    callFrames.shift()
    callFrames = map(callFrames, val => ({ functionName: trim(val) }))
  } else {
    callSites.shift()
    callFrames = map(callSites, (callSite: any) => {
      return {
        functionName: callSite.getFunctionName(),
        lineNumber: callSite.getLineNumber(),
        columnNumber: callSite.getColumnNumber(),
        url: callSite.getFileName(),
      }
    })
  }
  return callFrames
}
