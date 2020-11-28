# chobitsu

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![License][license-image]][npm-url]

[npm-image]: https://img.shields.io/npm/v/chobitsu?style=flat-square 
[npm-url]: https://npmjs.org/package/chobitsu
[travis-image]: https://img.shields.io/travis/liriliri/chobitsu?style=flat-square
[travis-url]: https://travis-ci.org/liriliri/chobitsu
[codecov-image]: https://img.shields.io/codecov/c/github/liriliri/chobitsu?style=flat-square
[codecov-url]: https://codecov.io/github/liriliri/chobitsu?branch=master
[license-image]: https://img.shields.io/npm/l/chobitsu?style=flat-square

Chrome devtools protocol JavaScript implementation.

## Install

You can get it on npm.

```bash
npm install chobitsu --save
```

## Usage

```javascript
const chobitsu = require('chobitsu');

chobitsu.setOnMessage(message => {
  console.log(message);
});

chobitsu.sendRawMessage(JSON.stringify({
  id: 1,  
  method: 'DOMStorage.clear',
  params: {
    storageId: {
      isLocalStorage: true,
      securityOrigin: 'http://example.com'
    }
  }
}));

!(async () => {
  console.log(await chobitsu.sendMessage('Storage.clearDataForOrigin', {
    storageTypes: 'local_storage'
  }));
})();

const domStorage = chobitsu.domain('DOMStorage');
domStorage.enable();
domStorage.on('domStorageItemUpdated', params => console.log(params));
```

## API

### sendRawMessage(message: string)

Send message to chobitsu.

### setOnMessage(onMessage: (message: string) => void)

Set message handler.

### sendMessage(method: string, params: any): Promise<any>

Send message without setting id and get result.

### domain(name: string)

Get domain object.

## Related Projects

* [chii](https://github.com/liriliri/chii): Remote debugging tool.
