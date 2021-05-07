import connector from '../../lib/connector';

import { createId, requestLru } from '../../lib/util';

export default function init(): void {
  const OriginImage = Image;
  const newImage = (width?: number, height?: number): HTMLImageElement =>
    new ((Function.bind.apply(OriginImage as any, [
      null,
      width,
      height,
    ]) as any) as typeof Image)() as HTMLImageElement;

  // @ts-ignore: The error says that Window has not image here
  window.Image = function (...args): HTMLImageElement & { _src?: string } {
    const image: HTMLImageElement & { _src?: string } = newImage(...args);
    image._src = image.src;
    let requestId: string;

    Object.defineProperty(image, 'src', {
      get() {
        return this._src;
      },
      set(url) {
        this._src = url;
        image.setAttribute('src', url);
        if (requestLru.get(url) || !url || !OriginImage) {
          return;
        }
        requestId = createId();
        requestLru.set(url, requestId);
        // Definition: https://chromedevtools.github.io/devtools-protocol/tot/Network#event-requestWillBeSent
        connector.trigger('Network.requestWillBeSent', {
          requestId,
          documentURL: location.href,
          hasUserGesture: false,
          type: 'Image',
          request: {
            url,
            method: 'get',
            headers: {},
            initialPriority: 'Low',
            // TODO: how to get the correct value here
            referrerPolicy: 'no-referrer-when-downgrade',
          },
          timestamp: Date.now() / 1e3,
          wallTime: Date.now() / 1e3,
          // TODO: We can do better here
          // Definition: https://chromedevtools.github.io/devtools-protocol/tot/Network#type-Initiator
          initiator: { type: 'script' },
        });
      },
      configurable: true,
    });

    image.addEventListener('load', () => {
      if (requestLru.get(image.src) !== requestId || !OriginImage) {
        return;
      }
      const contentLength = 0;
      const timestamp = Date.now() / 1000;
      const encodedDataLength = contentLength;
      const dataLength = contentLength;
      // Definition: https://chromedevtools.github.io/devtools-protocol/tot/Network#event-responseReceived
      connector.trigger('Network.responseReceived', {
        requestId,
        timestamp,
        // Definition: https://chromedevtools.github.io/devtools-protocol/tot/Network#type-ResourceType
        type: 'Image',
        // Definition: https://chromedevtools.github.io/devtools-protocol/tot/Network#type-Response
        response: {
          url: image.src,
          status: 200,
          statusText: 'ok',
          mimeType: '',
          headers: {},
          requestHeaders: {},
          connectionReused: false,
          connectionId: 0,
          fromDiskCache: false,
          fromServiceWorker: false,
          encodedDataLength,
          securityState: 'neutral',
        },
      });
      connector.trigger('Network.dataReceived', {
        requestId,
        timestamp,
        dataLength,
        encodedDataLength,
      });
      connector.trigger('Network.loadingFinished', {
        requestId,
        timestamp,
        encodedDataLength,
      });
    });

    image.addEventListener('error', error => {
      connector.trigger('Network.loadingFailed', {
        requestId,
        timestamp: Date.now() / 1000,
        type: 'Image',
        errorText: error.message,
        canceled: false,
      });
    });
    return image;
  };
}
