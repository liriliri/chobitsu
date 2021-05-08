import { ElementRequest } from '../../lib/request';

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

    Object.defineProperty(image, 'src', {
      get() {
        return this._src;
      },
      set(url) {
        this._src = url;
        image.setAttribute('src', url);
        new ElementRequest(image, url);
      },
      configurable: true,
    });

    return image;
  };
}
