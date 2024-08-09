import each from 'licia/each'
import rmCookie from 'licia/rmCookie'
import safeStorage from 'licia/safeStorage'
import { getCookies } from './Network'
import Protocol from 'devtools-protocol'
import Storage = Protocol.Storage

const localStore = safeStorage('local')
const sessionStore = safeStorage('session')

export function getUsageAndQuota(): Storage.GetUsageAndQuotaResponse {
  return {
    quota: 0,
    usage: 0,
    overrideActive: false,
    usageBreakdown: [],
  }
}

export function clearDataForOrigin(params: Storage.ClearDataForOriginRequest) {
  const storageTypes = params.storageTypes.split(',')

  each(storageTypes, type => {
    if (type === 'cookies') {
      const cookies = getCookies().cookies
      each(cookies, ({ name }) => rmCookie(name))
    } else if (type === 'local_storage') {
      localStore.clear()
      sessionStore.clear()
    }
  })
}

export function getTrustTokens(): Storage.GetTrustTokensResponse {
  return {
    tokens: [],
  }
}
