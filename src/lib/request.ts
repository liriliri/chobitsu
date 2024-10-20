import Emitter from 'licia/Emitter'
import isStr from 'licia/isStr'
import last from 'licia/last'
import Url from 'licia/Url'
import isEmpty from 'licia/isEmpty'
import trim from 'licia/trim'
import now from 'licia/now'
import each from 'licia/each'
import startWith from 'licia/startWith'
import toNum from 'licia/toNum'
import { createId } from './util'

export class XhrRequest extends Emitter {
  private xhr: XMLHttpRequest
  private method: string
  private url: string
  private id: string
  private reqHeaders: any
  constructor(xhr: XMLHttpRequest, method: string, url: string) {
    super()

    this.xhr = xhr
    this.reqHeaders = {}
    this.method = method
    this.url = fullUrl(url)
    this.id = createId()

    xhr.addEventListener('readystatechange', () => {
      if (xhr.readyState === 2) {
        this.handleHeadersReceived()
      } else if (xhr.readyState === 4) {
        if (xhr.status === 0) {
          this.handleError()
        } else {
          this.handleDone()
        }
      }
    })
  }
  // #1
  toJSON() {
    return {
      method: this.method,
      url: this.url,
      id: this.id,
    }
  }
  handleSend(data: any) {
    if (!isStr(data)) data = ''

    data = {
      name: getFileName(this.url),
      url: this.url,
      data,
      time: now(),
      reqHeaders: this.reqHeaders,
      method: this.method,
    }
    if (!isEmpty(this.reqHeaders)) {
      data.reqHeaders = this.reqHeaders
    }
    this.emit('send', this.id, data)
  }
  handleReqHeadersSet(key: string, val: string) {
    if (key && val) {
      this.reqHeaders[key] = val
    }
  }
  private handleHeadersReceived() {
    const { xhr } = this

    const type = getType(xhr.getResponseHeader('Content-Type') || '')
    this.emit('headersReceived', this.id, {
      type: type.type,
      subType: type.subType,
      size: getSize(xhr, true, this.url),
      time: now(),
      resHeaders: getHeaders(xhr),
    })
  }
  private handleDone() {
    const xhr = this.xhr
    const resType = xhr.responseType
    let resTxt = ''

    const update = () => {
      this.emit('done', this.id, {
        status: xhr.status,
        size: getSize(xhr, false, this.url),
        time: now(),
        resTxt,
      })
    }

    const type = getType(xhr.getResponseHeader('Content-Type') || '')
    if (
      resType === 'blob' &&
      (type.type === 'text' ||
        type.subType === 'javascript' ||
        type.subType === 'json')
    ) {
      readBlobAsText(xhr.response, (err: Error, result: string) => {
        if (result) resTxt = result
        update()
      })
    } else {
      if (resType === '' || resType === 'text') resTxt = xhr.responseText
      if (resType === 'json') resTxt = JSON.stringify(xhr.response)

      update()
    }
  }
  private handleError() {
    this.emit('error', this.id, {
      errorText: 'Network error',
      time: now(),
    })
  }
}

export class FetchRequest extends Emitter {
  private url: string
  private id: string
  private method: string
  private options: any
  private reqHeaders: any
  constructor(input: any, options: any = {}) {
    super()

    const isRequest = input instanceof window.Request
    const url = isRequest ? input.url : input

    this.url = fullUrl(url)
    this.id = createId()
    this.options = options
    this.reqHeaders = options.headers || (isRequest ? input.headers : {})
    this.method = options.method || (isRequest ? input.method : 'GET')
  }
  send(fetchResult: any) {
    const options = this.options

    const data = isStr(options.body) ? options.body : ''

    this.emit('send', this.id, {
      name: getFileName(this.url),
      url: this.url,
      data,
      reqHeaders: this.reqHeaders,
      time: now(),
      method: this.method,
    })

    fetchResult
      .then((res: any) => {
        res = res.clone()

        const type = getType(res.headers.get('Content-Type'))
        res.text().then((resTxt: string) => {
          const data: any = {
            type: type.type,
            subType: type.subType,
            time: now(),
            size: getFetchSize(res, resTxt),
            resTxt,
            resHeaders: getFetchHeaders(res),
            status: res.status,
          }
          if (!isEmpty(this.reqHeaders)) {
            data.reqHeaders = this.reqHeaders
          }
          this.emit('done', this.id, data)
        })

        return res
      })
      .catch((err: any) => {
        this.emit('error', this.id, {
          errorText: err.message,
          time: now(),
        })
      })
  }
}

function getFetchSize(res: any, resTxt: string) {
  let size = 0

  const contentLen = res.headers.get('Content-length')

  if (contentLen) {
    size = toNum(contentLen)
  } else {
    size = lenToUtf8Bytes(resTxt)
  }

  return size
}

function getFetchHeaders(res: any) {
  const ret: any = {}

  res.headers.forEach((val: string, key: string) => (ret[key] = val))

  return ret
}

function getHeaders(xhr: XMLHttpRequest) {
  const raw = xhr.getAllResponseHeaders()
  const lines = raw.split('\n')

  const ret: any = {}

  each(lines, line => {
    line = trim(line)

    if (line === '') return

    const [key, val] = line.split(':', 2)

    ret[key] = trim(val)
  })

  return ret
}

function getSize(xhr: XMLHttpRequest, headersOnly: boolean, url: string) {
  let size = 0

  function getStrSize() {
    if (!headersOnly) {
      const resType = xhr.responseType
      let resTxt = ''

      if (resType === '' || resType === 'text') resTxt = xhr.responseText
      if (resTxt) size = lenToUtf8Bytes(resTxt)
    }
  }

  if (isCrossOrig(url)) {
    getStrSize()
  } else {
    try {
      size = toNum(xhr.getResponseHeader('Content-Length'))
    } catch (e) {
      getStrSize()
    }
  }

  if (size === 0) getStrSize()

  return size
}

const link = document.createElement('a')

export function fullUrl(href: string) {
  link.href = href

  return (
    link.protocol + '//' + link.host + link.pathname + link.search + link.hash
  )
}

function getFileName(url: string) {
  let ret = last(url.split('/'))

  if (ret.indexOf('?') > -1) ret = trim(ret.split('?')[0])

  if (ret === '') {
    const urlObj = new Url(url)
    ret = urlObj.hostname
  }

  return ret
}

function getType(contentType: string) {
  if (!contentType)
    return {
      type: 'unknown',
      subType: 'unknown',
    }

  const type = contentType.split(';')[0].split('/')

  return {
    type: type[0],
    subType: last(type),
  }
}

function readBlobAsText(blob: Blob, callback: any) {
  const reader = new FileReader()
  reader.onload = () => {
    callback(null, reader.result)
  }
  reader.onerror = err => {
    callback(err)
  }
  reader.readAsText(blob)
}

const origin = window.location.origin

function isCrossOrig(url: string) {
  return !startWith(url, origin)
}

function lenToUtf8Bytes(str: string) {
  const m = encodeURIComponent(str).match(/%[89ABab]/g)

  return str.length + (m ? m.length : 0)
}
