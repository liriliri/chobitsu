import { uniqId, random } from 'licia-es'

const prefix = random(1000, 9999) + '.'

export function createId() {
  return uniqId(prefix)
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
