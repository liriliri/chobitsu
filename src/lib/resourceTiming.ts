// 利用轮询 performance.getEntriesByType 抓取请求

import connector from './connector';
import {
  createId,
  hasRequest,
  removeRequestSetCache,
  getMimeTypeByUrl,
} from './util';

let cursor = 0;
let timer: ReturnType<typeof setTimeout> | null;

function getType(e: string) {
  switch (e) {
    case 'xmlhttprequest':
      return 'XHR';
    case 'script':
      return 'Script';
    case 'link':
      return 'Stylesheet';
    case 'css':
    case 'img':
      return 'Image';
    case 'fetch':
      return 'Fetch';
    case 'navigation':
      return 'Document';
    default:
      return 'XHR';
  }
}
function checkResourceTiming(): void {
  if (!self.performance) {
    return;
  }
  const entries = self.performance.getEntriesByType('resource');
  for (let i = cursor; i < entries.length; i++) {
    const entry = entries[i];
    const {
      // The name of resource timing is the URL actually.
      name,
      initiatorType,
      startTime,
      responseEnd,
      encodedBodySize,
    } = entry as PerformanceResourceTiming;

    // 不要多发
    if (hasRequest(name)) {
      continue;
    }

    const type = getType(initiatorType);
    const requestId = createId();
    connector.trigger('Network.requestWillBeSent', {
      requestId,
      documentURL: document.location.href,
      hasUserGesture: false,
      type,
      request: {
        url: name,
        method: 'GET',
        headers: {},
        // mixedContentType: 'none',
        postData: '',
        initialPriority: 'High',
        referrerPolicy: 'no-referrer-when-downgrade',
      },
      timestamp: startTime,
      wallTime: Date.now() / 1e3,
    });

    setTimeout(() => {
      removeRequestSetCache(name);
      const mimeType = getMimeTypeByUrl(name);

      connector.trigger('Network.responseReceived', {
        requestId,
        timestamp: responseEnd,
        type,
        response: {
          status: 200,
          statusText: 'OK',
          mimeType,
          headers: {
            'accept-ranges': 'bytes',
            connection: 'keep-alive',
            'keep-alive': 'timeout=5',
            'content-length': encodedBodySize,
            'content-type': mimeType,
            'x-powered-by': 'Devtools-Resource-Timing',
          },
          encodedDataLength: encodedBodySize,
        },
      });
      connector.trigger('Network.loadingFinished', {
        requestId,
        timestamp: responseEnd,
        encodedDataLength: encodedBodySize,
      });
    }, 30);
  }
  if (self.performance.clearResourceTimings) {
    self.performance.clearResourceTimings();
  } else {
    cursor = entries.length;
  }
}

export function restore(): void {
  timer && clearTimeout(timer);
  timer = null;
}

function poll(): void {
  restore();
  timer = setTimeout(() => {
    checkResourceTiming();
    poll();
  }, 1000);
}

export const isSupported =
  !self.performance || typeof self.performance.getEntriesByType !== 'function'
    ? false
    : true;

export default (): boolean => {
  if (!isSupported) {
    return false;
  }
  poll();
  return true;
};
