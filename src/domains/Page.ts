import { $, fetch } from 'licia-es'
import { fullUrl } from '../lib/request'
import { MAIN_FRAME_ID } from '../lib/constants'

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
        securityOrigin: location.origin,
        url: location.href,
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
        const result = await fetch(url)
        content = await result.text()
      } catch (e) {
        content = document.documentElement.outerHTML
      }
    }
    return {
      content,
    }
  }
}
