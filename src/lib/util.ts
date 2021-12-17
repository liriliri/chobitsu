import { uniqId, random } from 'licia-es'

const prefix = random(1000, 9999) + '.'

export function createId() {
  return uniqId(prefix)
}
