import connector from '../lib/connector';
import * as scripts from '../lib/scripts';
import {createId} from '../lib/util';

declare global {
    interface Window { __devtools_pro_tools_config__: any; }
}
export function enable() {
  connector.trigger('Debugger.scriptParsed', scripts.get());
}
export function setBreakpointByUrl(requsetparams: any) {
    return {
        locations:[
            {
                scriptId: createId(),
                lineNumber: requsetparams.lineNumber,
                columnNumber: requsetparams.columnNumber,
                origin: location.origin
            }
        ],
        breakpointId: createId()
    };
}

export function removeBreakpoint(requsetparams: any) {
    return {
        locations:[
            {
                scriptId: createId(),
                lineNumber: requsetparams.lineNumber,
                columnNumber: requsetparams.columnNumber,
                origin: location.origin
            }
        ],
        breakpointId: createId()
    };
}
export function setSkipAllPauses(params:any) {
    return {
        skip: true
    };
}
export function pause(params:any) {
    return true;
}
export function stepOver(params:any) {
    return true;
}
export function resume(params:any) {
    return true;
}
export function stepOut(params:any) {
    return true;
}
export function stepInto(params:any) {
    return true;
}

export function getPossibleBreakpoints(params:any) {
    return {
        locations: [{
            columnNumber: 0,
            lineNumber: 1,
            url: 'filename',
            scriptId: 'requestId'
        }]
    }
}
export function evaluateOnCallFrame(params:any) {
    let evalResult = eval.call(window, `(${params.expression})`);
    let tmpResult = window.__devtools_pro_tools_config__.serialize(evalResult, '__json_evaluate__');
    let className = evalResult;
    if (typeof evalResult === 'object') {
        className = window.__devtools_pro_tools_config__.getClassName(evalResult, 'Object');
    }
    return {
        method: 'Debugger.evaluateOnCallFrame',
        id: params.id,
        result: {
            result: {
                objectId: JSON.stringify({
                    injectedScriptId: 1,
                    id: params.id
                }),
                type: 'object',
                value: tmpResult,
                unserializableValue: tmpResult,
                description: className,
                preview: tmpResult,
                customPreview: '',
                configurable: true,
                enumerable: true,
                ownProtites: evalResult && Object.getOwnPropertyNames(evalResult) || [],
                className
            }
        }
    }
}
