import uniqId from 'licia/uniqId';
import random from 'licia/random';
import { LRUCache } from 'lru-fast';

const prefix = random(1000, 9999) + '.';

export function createId() {
  return uniqId(prefix);
}

export const requestLru: LRUCache<string, string> = new LRUCache(200);
