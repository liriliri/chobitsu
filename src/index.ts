import connector from './lib/connector';
import noop from 'licia/noop';
import uuid from 'licia/uuid';
import methods from './domains/methods';

type OnMessage = (message: string) => void;

class Chobitsu {
  private onMessage: OnMessage;
  private resolves: Map<string, (value?: any) => void> = new Map();
  constructor() {
    this.onMessage = noop;
    connector.on('message', message => {
      const parsedMessage = JSON.parse(message);

      const resolve = this.resolves.get(parsedMessage.id);
      if (resolve) {
        resolve(parsedMessage.result);
      }

      this.onMessage(message);
    });
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
  private async callMethod(method: string, params: any) {
    if (methods[method]) {
      return methods[method](params) || {};
    } else {
      throw Error(`${method} unimplemented`);
    }
  }
}

module.exports = new Chobitsu();
