import connector from './lib/connector';
import noop from 'licia/noop';
import methods from './domains/methods';

type OnMessage = (message: string) => void;

class Chobitsu {
  private onMessage: OnMessage;
  constructor() {
    this.onMessage = noop;
    connector.on('message', message => this.onMessage(message));
  }
  setOnMessage(onMessage: OnMessage) {
    this.onMessage = onMessage;
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

    this.onMessage(JSON.stringify(resultMsg));
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
