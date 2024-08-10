import trim from 'licia/trim'
import each from 'licia/each'
import decodeUriComponent from 'licia/decodeUriComponent'
import rmCookie from 'licia/rmCookie'
import once from 'licia/once'
import isNative from 'licia/isNative'
import contain from 'licia/contain'
import now from 'licia/now'
import isStr from 'licia/isStr'
import isBlob from 'licia/isBlob'
import isUndef from 'licia/isUndef'
import convertBin from 'licia/convertBin'
import { XhrRequest, FetchRequest } from '../lib/request'
import connector from '../lib/connector'
import { createId } from '../lib/util'
import Protocol from 'devtools-protocol'
import Network = Protocol.Network

export function deleteCookies(params: Network.DeleteCookiesRequest) {
  rmCookie(params.name)
}

export function getCookies(): Network.GetCookiesResponse {
  const cookies: any[] = []

  const cookie = document.cookie
  if (trim(cookie) !== '') {
    each(cookie.split(';'), function (value: any) {
      value = value.split('=')
      const name = trim(value.shift())
      value = decodeUriComponent(value.join('='))
      cookies.push({
        name,
        value,
      })
    })
  }

  return { cookies }
}

const resTxtMap = new Map()

export const enable = once(function () {
  enableXhr()
  enableFetch()
  enableWebSocket()
})

function enableXhr() {
  const winXhrProto = window.XMLHttpRequest.prototype

  const origSend: any = winXhrProto.send
  const origOpen: any = winXhrProto.open
  const origSetRequestHeader: any = winXhrProto.setRequestHeader

  winXhrProto.open = function (method: string, url: string) {
    if (!isValidUrl(url)) {
      return origOpen.apply(this, arguments)
    }

    const xhr = this

    const req = ((xhr as any).chobitsuRequest = new XhrRequest(
      xhr,
      method,
      url
    ))

    req.on('send', (id: string, data: any) => {
      const request: any = {
        method: data.method,
        url: data.url,
        headers: data.reqHeaders,
      }
      if (data.data) {
        request.postData = data.data
      }

      connector.trigger('Network.requestWillBeSent', {
        requestId: id,
        type: 'XHR',
        request,
        timestamp: data.time / 1000,
      })
    })
    req.on('headersReceived', (id: string, data: any) => {
      connector.trigger('Network.responseReceivedExtraInfo', {
        requestId: id,
        blockedCookies: [],
        headers: data.resHeaders,
      })
    })
    req.on('done', (id: string, data: any) => {
      connector.trigger('Network.responseReceived', {
        requestId: id,
        type: 'XHR',
        response: {
          status: data.status,
        },
        timestamp: data.time / 1000,
      })
      resTxtMap.set(id, data.resTxt)
      connector.trigger('Network.loadingFinished', {
        requestId: id,
        encodedDataLength: data.size,
        timestamp: data.time / 1000,
      })
    })

    xhr.addEventListener('readystatechange', function () {
      switch (xhr.readyState) {
        case 2:
          return req.handleHeadersReceived()
        case 4:
          return req.handleDone()
      }
    })

    origOpen.apply(this, arguments)
  }

  winXhrProto.send = function (data) {
    const req = (this as any).chobitsuRequest
    if (req) req.handleSend(data)

    origSend.apply(this, arguments)
  }

  winXhrProto.setRequestHeader = function (key, val) {
    const req = (this as any).chobitsuRequest
    if (req) {
      req.handleReqHeadersSet(key, val)
    }

    origSetRequestHeader.apply(this, arguments)
  }
}

function enableFetch() {
  let isFetchSupported = false
  if (window.fetch) {
    isFetchSupported = isNative(window.fetch)
  }
  // #2 Probably not a fetch polyfill
  if (!isFetchSupported && navigator.serviceWorker) {
    isFetchSupported = true
  }
  if (!isFetchSupported) return

  const origFetch = window.fetch

  window.fetch = function (...args) {
    const req = new FetchRequest(...args)
    req.on('send', (id, data) => {
      const request: any = {
        method: data.method,
        url: data.url,
        headers: data.reqHeaders,
      }

      if (data.data) {
        request.postData = data.data
      }

      connector.trigger('Network.requestWillBeSent', {
        requestId: id,
        type: 'Fetch',
        request,
        timestamp: data.time / 1000,
      })
    })
    req.on('done', (id, data) => {
      connector.trigger('Network.responseReceived', {
        requestId: id,
        type: 'Fetch',
        response: {
          status: data.status,
          headers: data.resHeaders,
        },
        timestamp: data.time / 1000,
      })
      resTxtMap.set(id, data.resTxt)
      connector.trigger('Network.loadingFinished', {
        requestId: id,
        encodedDataLength: data.size,
        timestamp: data.time / 1000,
      })
    })

    const fetchResult = origFetch(...args)
    req.send(fetchResult)

    return fetchResult
  }
}

function enableWebSocket() {
  const origWebSocket = window.WebSocket
  function WebSocket(url: string, protocols?: string | string[]) {
    const ws = new origWebSocket(url, protocols)
    const requestId = createId()

    connector.trigger('Network.webSocketCreated', {
      requestId,
      url,
    })

    ws.addEventListener('open', function () {
      connector.trigger('Network.webSocketWillSendHandshakeRequest', {
        requestId,
        timestamp: now() / 1000,
        request: {
          headers: {},
        },
      })
      connector.trigger('Network.webSocketHandshakeResponseReceived', {
        requestId,
        timeStamp: now() / 1000,
        response: {
          status: 101,
          statusText: 'Switching Protocols',
        },
      })
    })

    ws.addEventListener('message', async function (e) {
      let payloadData = e.data
      if (isUndef(payloadData)) {
        return
      }

      let opcode = 1
      if (!isStr(payloadData)) {
        opcode = 2
        if (isBlob(payloadData)) {
          payloadData = await convertBin.blobToArrBuffer(payloadData)
        }
        payloadData = convertBin(payloadData, 'base64')
      }

      connector.trigger('Network.webSocketFrameReceived', {
        requestId,
        timestamp: now() / 1000,
        response: {
          opcode,
          payloadData,
        },
      })
    })

    const origSend = ws.send
    ws.send = function (data: any) {
      if (!isUndef(data)) {
        frameSent(data)
      }

      return origSend.call(this, data)
    }

    async function frameSent(data: any) {
      let opcode = 1
      let payloadData = data
      if (!isStr(data)) {
        opcode = 2
        if (isBlob(payloadData)) {
          payloadData = await convertBin.blobToArrBuffer(payloadData)
        }
        payloadData = convertBin(data, 'base64')
      }

      connector.trigger('Network.webSocketFrameSent', {
        requestId,
        timestamp: now() / 1000,
        response: {
          opcode,
          payloadData,
        },
      })
    }

    ws.addEventListener('close', function () {
      connector.trigger('Network.webSocketClosed', {
        requestId,
        timestamp: now() / 1000,
      })
    })

    ws.addEventListener('error', function () {
      connector.trigger('Network.webSocketFrameError', {
        requestId,
        timestamp: now() / 1000,
        errorMessage: 'WebSocket error',
      })
    })

    return ws
  }
  WebSocket.prototype = origWebSocket.prototype
  WebSocket.CLOSED = origWebSocket.CLOSED
  WebSocket.CLOSING = origWebSocket.CLOSING
  WebSocket.CONNECTING = origWebSocket.CONNECTING
  WebSocket.OPEN = origWebSocket.OPEN
  window.WebSocket = WebSocket as any
}

export function getResponseBody(
  params: Network.GetResponseBodyRequest
): Network.GetResponseBodyResponse {
  return {
    base64Encoded: false,
    body: resTxtMap.get(params.requestId),
  }
}

function isValidUrl(url: string) {
  return !contain(url, '__chobitsu-hide__=true')
}
