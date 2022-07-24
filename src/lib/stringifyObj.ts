import {
  toStr,
  isNull,
  isArr,
  isFn,
  isEl,
  isErr,
  isMap,
  isSet,
  isRegExp,
  type as getType,
  keys as getKeys,
  toSrc,
  allKeys,
  isNative,
  getProto,
  isSymbol,
  has,
} from 'licia-es'

const objects = new Map()
const objectIds = new Map()
const selfs = new Map()
let id = 1

function getOrCreateObjId(obj: any, self: any) {
  let objId = objectIds.get(obj)
  if (objId) return objId

  objId = JSON.stringify({
    injectedScriptId: 0,
    id: id++,
  })
  objectIds.set(obj, objId)
  objects.set(objId, obj)
  selfs.set(objId, self)

  return objId
}

export function clear() {
  objects.clear()
  objectIds.clear()
  selfs.clear()
}

export function wrap(
  value: any,
  { generatePreview = false, self = value } = {}
): any {
  const ret = basic(value)
  const { type, subtype } = ret

  if (type === 'undefined') {
    return ret
  }

  if (type === 'string' || type === 'boolean' || subtype === 'null') {
    ret.value = value
    return ret
  }

  ret.description = getDescription(value, self)
  if (type === 'number') {
    ret.value = value
    return ret
  }

  if (type === 'symbol') {
    ret.objectId = getOrCreateObjId(value, self)
    return ret
  }

  if (type === 'function') {
    ret.className = 'Function'
  } else if (subtype === 'array') {
    ret.className = 'Array'
  } else if (subtype === 'map') {
    ret.className = 'Map'
  } else if (subtype === 'set') {
    ret.className = 'Set'
  } else if (subtype === 'regexp') {
    ret.className = 'RegExp'
  } else if (subtype === 'error') {
    ret.className = value.name
  } else {
    ret.className = getType(value, false)
  }

  if (generatePreview) {
    ret.preview = getPreview(value, self)
  }

  ret.objectId = getOrCreateObjId(value, self)

  return ret
}

export function getObj(objectId: number) {
  return objects.get(objectId)
}

export function releaseObj(objectId: number) {
  const object = getObj(objectId)
  objectIds.delete(object)
  selfs.delete(objectId)
  objects.delete(objectId)
}

export function getProperties(params: any) {
  const { accessorPropertiesOnly, objectId, ownProperties, generatePreview } =
    params
  const properties = []

  const options = {
    prototype: !ownProperties,
    unenumerable: true,
    symbol: !accessorPropertiesOnly,
  }

  const obj = objects.get(objectId)
  const self = selfs.get(objectId)
  const keys = allKeys(obj, options)
  const proto = getProto(obj)
  for (let i = 0, len = keys.length; i < len; i++) {
    const name = keys[i]
    let propVal
    try {
      propVal = self[name]
    } catch (e) {
      /* tslint:disable-next-line */
    }

    const property: any = {
      name: toStr(name),
      isOwn: has(self, name),
    }

    let descriptor = Object.getOwnPropertyDescriptor(obj, name)
    if (!descriptor && proto) {
      descriptor = Object.getOwnPropertyDescriptor(proto, name)
    }
    if (descriptor) {
      if (accessorPropertiesOnly) {
        if (!descriptor.get && !descriptor.set) {
          continue
        }
      }
      property.configurable = descriptor.configurable
      property.enumerable = descriptor.enumerable
      property.writable = descriptor.writable
      if (descriptor.get) {
        property.get = wrap(descriptor.get)
      }
      if (descriptor.set) {
        property.set = wrap(descriptor.set)
      }
    }

    if (proto && has(proto, name) && property.enumerable) {
      property.isOwn = true
    }

    let accessValue = true
    if (!property.isOwn && property.get) accessValue = false
    if (accessValue) {
      if (isSymbol(name)) {
        property.symbol = wrap(name)
        property.value = { type: 'undefined' }
      } else {
        property.value = wrap(propVal, {
          generatePreview,
        })
      }
    }

    if (accessorPropertiesOnly) {
      if (isFn(propVal) && isNative(propVal)) continue
    }

    properties.push(property)
  }
  if (proto) {
    properties.push({
      name: '__proto__',
      configurable: true,
      enumerable: false,
      isOwn: has(obj, '__proto__'),
      value: wrap(proto, {
        self,
      }),
      writable: false,
    })
  }

  return {
    result: properties,
  }
}

const MAX_PREVIEW_LEN = 5

function getPreview(obj: any, self: any = obj) {
  const ret = basic(obj)
  ret.description = getDescription(obj, self)
  let overflow = false
  const properties = []

  const keys = getKeys(obj)
  let len = keys.length
  if (len > MAX_PREVIEW_LEN) {
    len = MAX_PREVIEW_LEN
    overflow = true
  }

  for (let i = 0; i < len; i++) {
    const name = keys[i]

    properties.push(getPropertyPreview(name, self[name]))
  }
  ret.properties = properties

  if (isMap(obj)) {
    const entries = []
    let i = 0
    const keys = obj.keys()
    let key = keys.next().value
    while (key) {
      if (i > MAX_PREVIEW_LEN) {
        overflow = true
        break
      }
      entries.push({
        key: getPreview(key),
        value: getPreview(obj.get(key)),
      })
      i++
      key = keys.next().value
    }

    ret.entries = entries
  }

  ret.overflow = overflow
  return ret
}

function getPropertyPreview(name: string, propVal: any) {
  const property: any = basic(propVal)
  property.name = name
  const { subtype, type } = property

  let value
  if (type === 'object') {
    if (subtype === 'null') {
      value = 'null'
    } else if (subtype === 'array') {
      value = `Array(${propVal.length})`
    } else if (subtype === 'map') {
      value = `Map(${propVal.size})`
    } else if (subtype === 'set') {
      value = `Set(${propVal.size})`
    } else {
      value = getType(propVal, false)
    }
  } else {
    value = toStr(propVal)
  }

  property.value = value

  return property
}

function getDescription(obj: any, self: any = obj) {
  let description = ''
  const { type, subtype } = basic(obj)

  if (type === 'string') {
    description = obj
  } else if (type === 'number') {
    description = toStr(obj)
  } else if (type === 'symbol') {
    description = toStr(obj)
  } else if (type === 'function') {
    description = toSrc(obj)
  } else if (subtype === 'array') {
    description = `Array(${obj.length})`
  } else if (subtype === 'map') {
    description = `Map(${self.size})`
  } else if (subtype === 'set') {
    description = `Set(${self.size})`
  } else if (subtype === 'regexp') {
    description = toStr(obj)
  } else if (subtype === 'error') {
    description = obj.stack
  } else {
    description = getType(obj, false)
  }

  return description
}

function basic(value: any) {
  const type = typeof value
  const ret: any = { type }

  if (isNull(value)) {
    ret.subtype = 'null'
  } else if (isArr(value)) {
    ret.subtype = 'array'
  } else if (isRegExp(value)) {
    ret.subtype = 'regexp'
  } else if (isErr(value)) {
    ret.subtype = 'error'
  } else if (isMap(value)) {
    ret.subtype = 'map'
  } else if (isSet(value)) {
    ret.subtype = 'set'
  } else {
    try {
      // Accessing nodeType may throw exception
      if (isEl(value)) {
        ret.subtype = 'node'
      }
    } catch (e) {
      /* tslint:disable-next-line */
    }
  }

  return ret
}
