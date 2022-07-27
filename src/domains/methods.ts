import { noop } from 'licia-es'
import * as Runtime from './Runtime'
import * as Page from './Page'
import * as DOM from './DOM'
import * as CSS from './CSS'
import * as DOMStorage from './DOMStorage'
import * as Network from './Network'
import * as Overlay from './Overlay'
import * as DOMDebugger from './DOMDebugger'
import * as Debugger from './Debugger'
import * as Storage from './Storage'

const methods: any = {
  'Debugger.enable': Debugger.enable,
  'Debugger.getScriptSource': Debugger.getScriptSource,
  'Debugger.setAsyncCallStackDepth': noop,
  'Debugger.setBlackboxPatterns': noop,
  'Debugger.setPauseOnExceptions': noop,

  'DOM.collectClassNamesFromSubtree': DOM.collectClassNamesFromSubtree,
  'DOM.copyTo': DOM.copyTo,
  'DOM.discardSearchResults': DOM.discardSearchResults,
  'DOM.enable': DOM.enable,
  'DOM.getDocument': DOM.getDocument,
  'DOM.getOuterHTML': DOM.getOuterHTML,
  'DOM.getSearchResults': DOM.getSearchResults,
  'DOM.markUndoableState': noop,
  'DOM.moveTo': DOM.moveTo,
  'DOM.performSearch': DOM.performSearch,
  'DOM.pushNodesByBackendIdsToFrontend': DOM.pushNodesByBackendIdsToFrontend,
  'DOM.removeNode': DOM.removeNode,
  'DOM.requestChildNodes': DOM.requestChildNodes,
  'DOM.requestNode': DOM.requestNode,
  'DOM.resolveNode': DOM.resolveNode,
  'DOM.setAttributesAsText': DOM.setAttributesAsText,
  'DOM.setAttributeValue': DOM.setAttributeValue,
  'DOM.setInspectedNode': DOM.setInspectedNode,
  'DOM.setNodeValue': DOM.setNodeValue,
  'DOM.setOuterHTML': DOM.setOuterHTML,
  'DOM.undo': noop,
  'DOM.getNodeId': DOM.getDOMNodeId,

  'DOMDebugger.getEventListeners': DOMDebugger.getEventListeners,
  'DOMDebugger.setBreakOnCSPViolation': noop,

  'Emulation.setEmulatedMedia': noop,
  'Emulation.setAutoDarkModeOverride': noop,
  'Emulation.setEmulatedVisionDeficiency': noop,
  'Emulation.setFocusEmulationEnabled': noop,

  'Log.clear': noop,
  'Log.enable': noop,
  'Log.startViolationsReport': noop,

  'Network.deleteCookies': Network.deleteCookies,
  'Network.enable': Network.enable,
  'Network.getCookies': Network.getCookies,
  'Network.getResponseBody': Network.getResponseBody,
  'Network.setAttachDebugStack': noop,
  'Network.clearAcceptedEncodingsOverride': noop,

  'Page.getResourceContent': Page.getResourceContent,
  'Page.getResourceTree': Page.getResourceTree,

  'Runtime.callFunctionOn': Runtime.callFunctionOn,
  'Runtime.compileScript': noop,
  'Runtime.discardConsoleEntries': noop,
  'Runtime.enable': Runtime.enable,
  'Runtime.evaluate': Runtime.evaluate,
  'Runtime.getHeapUsage': noop,
  'Runtime.getIsolateId': noop,
  'Runtime.getProperties': Runtime.getProperties,
  'Runtime.releaseObject': noop,
  'Runtime.releaseObjectGroup': noop,
  'Runtime.runIfWaitingForDebugger': noop,
  'Runtime.globalLexicalScopeNames': Runtime.globalLexicalScopeNames,

  'ApplicationCache.enable': noop,
  'ApplicationCache.getFramesWithManifests': noop,

  'Page.getManifestIcons': noop,
  'Page.bringToFront': noop,
  'Page.enable': noop,
  'Page.getAppManifest': Page.getAppManifest,
  'Page.getInstallabilityErrors': noop,
  'Page.setAdBlockingEnabled': noop,
  'Page.getAppId': noop,

  'Profiler.enable': noop,

  'Audits.enable': noop,

  'BackgroundService.startObserving': noop,

  'CacheStorage.requestCacheNames': noop,

  'CSS.enable': CSS.enable,
  'CSS.getComputedStyleForNode': CSS.getComputedStyleForNode,
  'CSS.getInlineStylesForNode': CSS.getInlineStylesForNode,
  'CSS.getMatchedStylesForNode': CSS.getMatchedStylesForNode,
  'CSS.getPlatformFontsForNode': noop,
  'CSS.getStyleSheetText': CSS.getStyleSheetText,
  'CSS.getBackgroundColors': CSS.getBackgroundColors,
  'CSS.setStyleTexts': CSS.setStyleTexts,
  'CSS.trackComputedStyleUpdates': noop,
  'CSS.takeComputedStyleUpdates': noop,

  'Database.enable': noop,

  'DOMStorage.clear': DOMStorage.clear,
  'DOMStorage.enable': DOMStorage.enable,
  'DOMStorage.getDOMStorageItems': DOMStorage.getDOMStorageItems,
  'DOMStorage.removeDOMStorageItem': DOMStorage.removeDOMStorageItem,
  'DOMStorage.setDOMStorageItem': DOMStorage.setDOMStorageItem,

  'HeapProfiler.enable': noop,

  'IndexedDB.enable': noop,

  'Inspector.enable': noop,
  'IndexedDB.requestDatabaseNames': noop,

  'Overlay.enable': Overlay.enable,
  'Overlay.disable': Overlay.disable,
  'Overlay.hideHighlight': Overlay.hideHighlight,
  'Overlay.highlightFrame': noop,
  'Overlay.highlightNode': Overlay.highlightNode,
  'Overlay.setInspectMode': Overlay.setInspectMode,
  'Overlay.setShowViewportSizeOnResize': Overlay.setShowViewportSizeOnResize,
  'Overlay.setShowGridOverlays': noop,
  'Overlay.setShowFlexOverlays': noop,
  'Overlay.setShowScrollSnapOverlays': noop,
  'Overlay.setShowContainerQueryOverlays': noop,
  'Overlay.setShowIsolatedElements': noop,

  'ServiceWorker.enable': noop,

  'Storage.getUsageAndQuota': Storage.getUsageAndQuota,

  'Storage.trackCacheStorageForOrigin': noop,
  'Storage.trackIndexedDBForOrigin': noop,
  'Storage.clearDataForOrigin': Storage.clearDataForOrigin,
  'Storage.getTrustTokens': Storage.getTrustTokens,

  'Target.setAutoAttach': noop,
  'Target.setDiscoverTargets': noop,
  'Target.setRemoteLocations': noop,
}

export default methods
