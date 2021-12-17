import { getNode, getNodeId } from '../lib/stringifyNode'
import { pushNodesToFrontend } from './DOM'
import { $, h, isMobile, evalCss, defaults } from 'licia-es'
import connector from '../lib/connector'
import LunaDomHighlighter from 'luna-dom-highlighter'
import * as stringifyObj from '../lib/stringifyObj'

let domHighlighter: LunaDomHighlighter
let isCssLoaded = false
let $container: $.$
let isEnable = false

export function enable() {
  if (isEnable) {
    return
  }

  if (!isCssLoaded) {
    evalCss(require('luna-dom-highlighter/luna-dom-highlighter.css'))
    isCssLoaded = true
  }
  const container = h('div', {
    class: '__chobitsu-hide__',
  })
  $container = $(container)
  document.documentElement.appendChild(container)
  domHighlighter = new LunaDomHighlighter(container)

  window.addEventListener('resize', resizeHandler)

  isEnable = true
}

export function disable() {
  domHighlighter.destroy()
  $container.remove()
  window.removeEventListener('resize', resizeHandler)

  isEnable = false
}

export function highlightNode(params: any) {
  const { nodeId, highlightConfig, objectId } = params

  let node: any
  if (nodeId) {
    node = getNode(nodeId)
  }
  if (objectId) {
    node = stringifyObj.getObj(objectId)
  }

  if (node.nodeType !== 1 && node.nodeType !== 3) return

  defaults(highlightConfig, {
    contentColor: 'transparent',
    paddingColor: 'transparent',
    borderColor: 'transparent',
    marginColor: 'transparent',
  })
  domHighlighter.highlight(node, highlightConfig)
}

export function hideHighlight() {
  domHighlighter.hide()
}

let showViewportSizeOnResize = false
export function setShowViewportSizeOnResize(params: any) {
  showViewportSizeOnResize = params.show
}

let highlightConfig: any = {}
let inspectMode: string = 'none'
export function setInspectMode(params: any) {
  highlightConfig = params.highlightConfig
  inspectMode = params.mode
}

function getElementFromPoint(e: any) {
  if (isMobile()) {
    const touch = e.touches[0] || e.changedTouches[0]
    return document.elementFromPoint(touch.pageX, touch.pageY)
  }

  return document.elementFromPoint(e.clientX, e.clientY)
}

function moveListener(e: any) {
  if (inspectMode === 'none') return

  const node = getElementFromPoint(e)
  if (!node) return
  let nodeId = getNodeId(node)

  if (!nodeId) {
    nodeId = pushNodesToFrontend(node)
  }

  highlightNode({
    nodeId,
    highlightConfig,
  })

  connector.trigger('Overlay.nodeHighlightRequested', {
    nodeId,
  })
}

function outListener() {
  if (inspectMode === 'none') return

  hideHighlight()
}

function clickListener(e: any) {
  if (inspectMode === 'none') return

  e.preventDefault()
  e.stopImmediatePropagation()

  const node = getElementFromPoint(e)
  connector.trigger('Overlay.inspectNodeRequested', {
    backendNodeId: getNodeId(node),
  })

  hideHighlight()
}

function addEvent(type: string, listener: any) {
  document.documentElement.addEventListener(type, listener, true)
}
if (isMobile()) {
  addEvent('touchstart', moveListener)
  addEvent('touchmove', moveListener)
  addEvent('touchend', clickListener)
} else {
  addEvent('mousemove', moveListener)
  addEvent('mouseout', outListener)
  addEvent('click', clickListener)
}

const viewportSize = h('div', {
  class: '__chobitsu-hide__',
  style: {
    position: 'fixed',
    right: 0,
    top: 0,
    background: '#fff',
    fontSize: 13,
    opacity: 0.5,
    padding: '4px 6px',
  },
})

function resizeHandler() {
  if (!showViewportSizeOnResize) return

  $viewportSize.text(`${window.innerWidth}px × ${window.innerHeight}px`)
  if (viewportSizeTimer) {
    clearTimeout(viewportSizeTimer)
  } else {
    document.documentElement.appendChild(viewportSize)
  }
  viewportSizeTimer = setTimeout(() => {
    $viewportSize.remove()
    viewportSizeTimer = null
  }, 1000)
}
const $viewportSize: any = $(viewportSize)
let viewportSizeTimer: any
