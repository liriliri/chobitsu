import Emitter from 'licia/Emitter';
import isStr from 'licia/isStr';
import last from 'licia/last';
import Url from 'licia/Url';
import isEmpty from 'licia/isEmpty';
import trim from 'licia/trim';
import now from 'licia/now';
import each from 'licia/each';
import startWith from 'licia/startWith';
import toNum from 'licia/toNum';
import { createId, fullUrl, getMimeTypeByUrl } from './util';
import { isSupported } from './resourceTiming';
import connector from './connector';

export class ElementRequest extends Emitter {
  private el: HTMLImageElement | HTMLScriptElement;
  private tagName: string;
  private url: string;
  private id: string;
  private type: string;
  private mimeType: string;
  constructor(element: HTMLImageElement | HTMLScriptElement, url: string) {
    super();

    this.el = element;
    this.tagName = element.tagName.toLowerCase();
    this.url = fullUrl(url);
    // 如果支持performance resourcetiming，则放弃这种方案：dom、new Image
    if (!isSupported) {
      this.type = this.getType(this.tagName);
      this.mimeType = getMimeTypeByUrl(this.url);
      this.id = createId();
      this.willBeSent();
      this.bindEvent();
    }
  }
  willBeSent() {
    // 说明是图片或者script请求，则发送url
    connector.trigger('Network.requestWillBeSent', {
      requestId: this.id,
      type: this.type,
      request: {
        url: this.url,
        method: 'get',
        headers: {},
        initialPriority: 'Low',
        // TODO: how to get the correct value here
        referrerPolicy: 'no-referrer-when-downgrade',
      },
      timestamp: Date.now() / 1000,
    });
  }
  bindEvent() {
    let timeid: ReturnType<typeof setTimeout>;
    const clear = () => {
      if (timeid) {
        clearTimeout(timeid);
      }
      this.el.removeEventListener('load', onload);
      this.el.removeEventListener('error', onerror);
    };
    const onload = () => {
      clear();
      this.onLoad.bind(this)();
    };
    const onerror = (err: any) => {
      clear();
      this.onError.bind(this)(err);
    };
    // add Event listener
    timeid = setTimeout(onload, 1000);
    this.el.addEventListener('load', onload);
    this.el.addEventListener('error', onerror);
  }
  getType(type: string): string {
    const map: any = {
      script: 'Script',
      img: 'Image',
    };
    return map[type] ? map[type] : 'Other';
  }
  onLoad() {
    const requestId = this.id;
    const contentLength = 10;
    const timestamp = Date.now() / 1000;
    const encodedDataLength = contentLength;

    connector.trigger('Network.responseReceived', {
      requestId,
      timestamp,
      type: this.type,
      response: {
        url: this.url,
        headers: {
          'content-length': encodedDataLength + '',
          'content-type': this.mimeType,
          'x-powered-by': 'Devtools-Resource-Timing',
        },
        status: 200,
        statusText: 'ok',
        mimeType: this.mimeType,
        encodedDataLength,
      },
    });
    connector.trigger('Network.loadingFinished', {
      requestId,
      timestamp,
      encodedDataLength,
    });
  }
  onError(err: any) {
    connector.trigger('Network.loadingFailed', {
      requestId: this.id,
      timestamp: Date.now() / 1000,
      type: this.type,
      errorText: err.message,
      canceled: false,
    });
  }
}

export class XhrRequest extends Emitter {
  private xhr: XMLHttpRequest;
  private method: string;
  private url: string;
  private id: string;
  private reqHeaders: any;
  constructor(xhr: XMLHttpRequest, method: string, url: string) {
    super();

    this.xhr = xhr;
    this.reqHeaders = {};
    this.method = method;
    this.url = fullUrl(url);
    this.id = createId();
  }
  handleSend(data: any) {
    if (!isStr(data)) data = '';

    data = {
      name: getFileName(this.url),
      url: this.url,
      data,
      time: now(),
      reqHeaders: this.reqHeaders,
      method: this.method,
    };
    if (!isEmpty(this.reqHeaders)) {
      data.reqHeaders = this.reqHeaders;
    }
    this.emit('send', this.id, data);
  }
  handleReqHeadersSet(key: string, val: string) {
    if (key && val) {
      this.reqHeaders[key] = val;
    }
  }
  handleHeadersReceived() {
    const { xhr } = this;

    const type = getType(xhr.getResponseHeader('Content-Type') || '');
    this.emit('headersReceived', this.id, {
      type: type.type,
      subType: type.subType,
      size: getSize(xhr, true, this.url),
      time: now(),
      resHeaders: getHeaders(xhr),
    });
  }
  handleDone() {
    const xhr = this.xhr;
    const resType = xhr.responseType;
    let resTxt = '';
    const update = () => {
      this.emit('done', this.id, {
        mimeType: xhr.getResponseHeader('Content-Type'),
        status: xhr.status,
        statusText: xhr.statusText,
        size: getSize(xhr, false, this.url),
        time: now(),
        resTxt,
      });
    };

    const type = getType(xhr.getResponseHeader('Content-Type') || '');
    if (
      resType === 'blob' &&
      (type.type === 'text' ||
        type.subType === 'javascript' ||
        type.subType === 'json')
    ) {
      readBlobAsText(xhr.response, (err: Error, result: string) => {
        if (result) resTxt = result;
        update();
      });
    } else {
      if (resType === '' || resType === 'text') resTxt = xhr.responseText;
      if (resType === 'json') resTxt = JSON.stringify(xhr.response);

      update();
    }
  }
}

export class FetchRequest extends Emitter {
  private url: string;
  private id: string;
  private method: string;
  private options: any;
  private reqHeaders: any;
  constructor(url: any, options: any = {}) {
    super();

    if (url instanceof window.Request) url = url.url;

    this.url = fullUrl(url);
    this.id = createId();
    this.options = options;
    this.reqHeaders = options.headers || {};
    this.method = options.method || 'GET';
  }
  send(fetchResult: any) {
    const options = this.options;

    const data = isStr(options.body) ? options.body : '';

    this.emit('send', this.id, {
      name: getFileName(this.url),
      url: this.url,
      data,
      reqHeaders: this.reqHeaders,
      time: now(),
      method: this.method,
    });

    fetchResult.then((res: any) => {
      res = res.clone();

      const type = getType(res.headers.get('Content-Type'));
      res.text().then((resTxt: string) => {
        const data: any = {
          type: type.type,
          subType: type.subType,
          time: now(),
          size: getFetchSize(res, resTxt),
          resTxt,
          resHeaders: getFetchHeaders(res),
          status: res.status,
          statusText: res.statusText,
        };
        if (!isEmpty(this.reqHeaders)) {
          data.reqHeaders = this.reqHeaders;
        }
        this.emit('done', this.id, data);
      });

      return res;
    });
  }
}

function getFetchSize(res: any, resTxt: string) {
  let size = 0;

  const contentLen = res.headers.get('Content-length');

  if (contentLen) {
    size = toNum(contentLen);
  } else {
    size = lenToUtf8Bytes(resTxt);
  }

  return size;
}

function getFetchHeaders(res: any) {
  const ret: any = {};

  res.headers.forEach((val: string, key: string) => (ret[key] = val));

  return ret;
}

function getHeaders(xhr: XMLHttpRequest) {
  const raw = xhr.getAllResponseHeaders();
  const lines = raw.split('\n');

  const ret: any = {};

  each(lines, line => {
    line = trim(line);

    if (line === '') return;

    const [key, val] = line.split(':', 2);

    ret[key] = trim(val);
  });

  return ret;
}

function getSize(xhr: XMLHttpRequest, headersOnly: boolean, url: string) {
  let size = 0;

  function getStrSize() {
    if (!headersOnly) {
      const resType = xhr.responseType;
      let resTxt = '';

      if (resType === '' || resType === 'text') resTxt = xhr.responseText;
      if (resTxt) size = lenToUtf8Bytes(resTxt);
    }
  }

  if (isCrossOrig(url)) {
    getStrSize();
  } else {
    try {
      size = toNum(xhr.getResponseHeader('Content-Length'));
    } catch (e) {
      getStrSize();
    }
  }

  if (size === 0) getStrSize();

  return size;
}

function getFileName(url: string) {
  let ret = last(url.split('/'));

  if (ret.indexOf('?') > -1) ret = trim(ret.split('?')[0]);

  if (ret === '') {
    const urlObj = new Url(url);
    ret = urlObj.hostname;
  }

  return ret;
}

function getType(contentType: string) {
  if (!contentType)
    return {
      type: 'unknown',
      subType: 'unknown',
    };

  const type = contentType.split(';')[0].split('/');

  return {
    type: type[0],
    subType: last(type),
  };
}

function readBlobAsText(blob: Blob, callback: any) {
  const reader = new FileReader();
  reader.onload = () => {
    callback(null, reader.result);
  };
  reader.onerror = err => {
    callback(err);
  };
  reader.readAsText(blob);
}

const origin = window.location.origin;

function isCrossOrig(url: string) {
  return !startWith(url, origin);
}

function lenToUtf8Bytes(str: string) {
  const m = encodeURIComponent(str).match(/%[89ABab]/g);

  return str.length + (m ? m.length : 0);
}
