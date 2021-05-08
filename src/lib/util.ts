import uniqId from 'licia/uniqId';
import random from 'licia/random';
import Url from 'licia/Url';

const prefix = random(1000, 9999) + '.';

export function createId() {
  return uniqId(prefix);
}

export const requestUniqueSet = new Set();
export function hasRequest(url: string): boolean {
  if (requestUniqueSet.has(url)) {
    return true;
  }
  requestUniqueSet.add(url);
  return false;
}
export function removeRequestSetCache(url: string) {
  requestUniqueSet.delete(url);
}

const link = document.createElement('a');
export function fullUrl(href: string) {
  link.href = href;

  return (
    link.protocol + '//' + link.host + link.pathname + link.search + link.hash
  );
}

const MIME_TYPE = {
  'text/css': ['css'],
  'image/jpeg': ['jpeg', 'jpg', 'jpe'],
  'image/gif': ['gif'],
  'image/heic': ['heic'],
  'image/heif': ['heif'],
  'image/apng': ['apng'],
  'image/png': ['png'],
  'application/xml': ['xml', 'xsl', 'xsd', 'rng'],
  'application/javascript': ['js', 'mjs'],
  'application/json': ['json', 'map'],
  'text/plain': ['txt', 'text', 'conf', 'def', 'list', 'log', 'in', 'ini'],
  'text/html': ['html', 'htm', 'shtml'],
};

export function getMimeTypeByUrl(url: string) {
  const parsedUrl = new Url(url);
  const extname = parsedUrl.pathname.split('.').pop();
  let r = '';
  if (!extname) {
    return r;
  }
  for (let type of Object.keys(MIME_TYPE)) {
    //@ts-ignore
    const exts: string[] | undefined = MIME_TYPE[type] || [];
    if (exts && exts.length && exts.includes(extname)) {
      r = type;
      break;
    }
  }

  return r;
}
