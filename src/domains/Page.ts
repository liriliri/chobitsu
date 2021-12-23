import $ from 'licia/$';
import fetch from 'licia/fetch';
import { fullUrl } from '../lib/util';

export function reload(opts: any) {
  location.reload(!!opts.ignoreCache);
  return {};
}
export function navigate(opts: any) {
  if (!opts || typeof opts.url !== 'string') {
    return;
  }

  location.assign(opts.url);
  return {};
}
export function navigateToHistoryEntry(opts: any) {
  history.go(opts.entryId);
  return {};
}

export async function getAppManifest() {
  const $links = $('link');
  const ret: any = {
    errors: [],
  };

  let url = '';
  $links.each(function (this: Element) {
    const $this = $(this);

    if ($this.attr('rel') === 'manifest') {
      url = fullUrl($this.attr('href'));
    }
  });
  ret.url = url;

  if (url) {
    const res = await fetch(url);
    ret.data = await res.text();
  }

  return ret;
}

export function getResourceTree() {
  return {
    frameTree: {
      frame: {
        id: '',
        mimeType: 'text/html',
        securityOrigin: location.origin,
        url: location.href,
      },
      resources: [],
    },
  };
}
export function getResourceContent() {
    return {
        content: document.getElementsByTagName('html')[0].outerHTML,
        base64Encoded: false
    };
}
