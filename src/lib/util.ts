import { uniqId, random, startWith } from 'licia-es'

const prefix = random(1000, 9999) + '.'

export function createId() {
  return uniqId(prefix)
}

export function getAbsoluteUrl(url: string) {
  const a = document.createElement('a')
  a.href = url
  return a.href
}

export class ErrorWithCode extends Error {
  code: number
  constructor(code: number, message: string) {
    super(message)
    this.code = code

    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export function createErr(code: number, message: string) {
  return new ErrorWithCode(code, message)
}

export function getUrl() {
  const href = location.href
  if (startWith(href, 'about:')) {
    return parent.location.href
  }
  return href
}

export function getOrigin() {
  const origin = location.origin
  if (origin === 'null') {
    return parent.location.origin
  }
  return origin
}
