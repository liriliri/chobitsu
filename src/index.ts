import connector from './lib/connector';
import noop from 'licia/noop';
import uuid from 'licia/uuid';
import methods from './domains/methods';
import each from 'licia/each';
import Emitter from 'licia/Emitter';

type OnMessage = (message: string) => void;
type DomainMethod = (...args: any[]) => any;

class Chobitsu {
  private onMessage: OnMessage;
  private resolves: Map<string, (value?: any) => void> = new Map();
  private domains: Map<string, { [index: string]: DomainMethod }> = new Map();
  constructor() {
    this.onMessage = noop;
    connector.on('message', message => {
      const parsedMessage = JSON.parse(message);

      const resolve = this.resolves.get(parsedMessage.id);
      if (resolve) {
        resolve(parsedMessage.result);
      }

      if (!parsedMessage.id) {
        const [name, method] = parsedMessage.method.split('.');
        const domain = this.domains.get(name);
        if (domain) {
          domain.emit(method, parsedMessage.params);
        }
      }

      this.onMessage(message);
    });

    this.initDomains();
  }
  domain(name: string) {
    return this.domains.get(name);
  }
  trigger(method: string, params: any) {
    connector.trigger(method, params);
  }
  setOnMessage(onMessage: OnMessage) {
    this.onMessage = onMessage;
  }
  sendMessage(method: string, params: any = {}) {
    const id = uuid();

    this.sendRawMessage(
      JSON.stringify({
        id,
        method,
        params,
      })
    );

    return new Promise(resolve => {
      this.resolves.set(id, resolve);
    });
  }
  async sendRawMessage(message: string) {
    const parsedMessage = JSON.parse(message);

    const { method, params, id } = parsedMessage;

    const resultMsg: any = {
      id,
    };

    try {
      resultMsg.result = await this.callMethod(method, params);
    } catch (e) {
      resultMsg.error = {
        message: e.message,
      };
    }

    connector.emit('message', JSON.stringify(resultMsg));
  }
  registerMethod(methodName: string, fn: any) {
    if (methods[methodName]) {
      throw Error(`${methodName} is registered!`);
    } else {
      methods[methodName] = fn;
      this._addMethods({
        [methodName]: fn,
      });
    }
  }
  private _addMethods(methodObj: any) {
    const domains = this.domains;

    each(methodObj, (fn: any, key: string) => {
      const [name, method] = key.split('.');
      let domain = domains.get(name);
      if (!domain) {
        domain = {};
        Emitter.mixin(domain);
      }
      domain[method] = fn;
      domains.set(name, domain);
    });
  }
  private initDomains() {
    this._addMethods(methods);
  }
  private async callMethod(method: string, params: any) {
    if (methods[method]) {
      return methods[method](params) || {};
    } else {
      throw Error(`${method} unimplemented`);
    }
  }
}

module.exports = new Chobitsu();
