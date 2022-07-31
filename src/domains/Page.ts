import { $, contain, fetch, now, Readiness } from 'licia-es'
import { fullUrl } from '../lib/request'
import { MAIN_FRAME_ID } from '../lib/constants'
import { getContent, getOrigin, getUrl } from '../lib/util'
import domToImage from 'dom-to-image'
import connector from '../lib/connector'
import { isValidNode } from '../lib/nodeManager'

export function enable() {
  stopScreencast()
}

export function reload() {
  location.reload()
}

export function navigate(params: any) {
  location.href = params.url
}

export function getNavigationHistory() {
  return {
    currentIndex: 0,
    entries: [
      {
        id: 0,
        url: getUrl(),
        userTypedURL: getUrl(),
        title: document.title,
        transitionType: 'link',
      },
    ],
  }
}

export async function getAppManifest() {
  const $links = $('link')
  const ret: any = {
    errors: [],
  }

  let url = ''
  $links.each(function (this: Element) {
    const $this = $(this)

    if ($this.attr('rel') === 'manifest') {
      url = fullUrl($this.attr('href'))
    }
  })
  ret.url = url

  if (url) {
    const res = await fetch(url)
    ret.data = await res.text()
  }

  return ret
}

export function getResourceTree() {
  return {
    frameTree: {
      frame: {
        id: MAIN_FRAME_ID,
        mimeType: 'text/html',
        securityOrigin: getOrigin(),
        url: getUrl(),
      },
      resources: [],
    },
  }
}

let content = ''

export async function getResourceContent(params: any) {
  const { frameId, url } = params

  if (frameId === MAIN_FRAME_ID) {
    if (!content) {
      try {
        content = await getContent(url)
      } catch (e) {
        content = document.documentElement.outerHTML
      }
    }
    return {
      content,
    }
  }
}

let screenshotTimer: any
let ack: Readiness
const screencastInterval = 2000
let isCapturingScreenshot = false

export function screencastFrameAck() {
  if (ack) {
    ack.signal('ack')
  }
}

export function startScreencast() {
  if (isCapturingScreenshot) {
    return
  }
  stopScreencast()
  captureScreenshot()
}

export function stopScreencast() {
  if (screenshotTimer) {
    clearTimeout(screenshotTimer)
    screenshotTimer = null
    if (ack) {
      ack.signal('ack')
    }
  }
}

async function captureScreenshot() {
  if (document.hidden) {
    screenshotTimer = setTimeout(captureScreenshot, screencastInterval)
    return
  }

  isCapturingScreenshot = true

  const $body = $(document.body)
  const deviceWidth = window.innerWidth
  let deviceHeight = window.innerHeight
  let offsetTop = -window.scrollY
  const overflowY = $body.css('overflow-y')
  if (contain(['auto', 'scroll'], overflowY)) {
    deviceHeight = $body.offset().height
    offsetTop = -document.body.scrollTop
  }
  let width = $body.offset().width
  if (width < deviceWidth) {
    width = deviceWidth
  }

  const data = (
    await domToImage.toJpeg(document.body, {
      filter(node) {
        return isValidNode(node)
      },
      width,
      quality: 0.6,
      bgcolor: '#fff',
    })
  ).replace(/^data:image\/jpeg;base64,/, '')

  if (ack) {
    await ack.ready('ack')
  }
  ack = new Readiness()
  connector.trigger('Page.screencastFrame', {
    data,
    sessionId: 1,
    metadata: {
      deviceWidth,
      deviceHeight,
      pageScaleFactor: 1,
      offsetTop,
      scrollOffsetX: 0,
      scrollOffsetY: 0,
      timestamp: now(),
    },
  })

  screenshotTimer = setTimeout(captureScreenshot, screencastInterval)

  isCapturingScreenshot = false
}
