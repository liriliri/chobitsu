import uniqId from 'licia/uniqId';
import random from 'licia/random';

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

const link = document.createElement('a');
export function fullUrl(href: string) {
  link.href = href;

  return (
    link.protocol + '//' + link.host + link.pathname + link.search + link.hash
  );
}
