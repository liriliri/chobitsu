const connector = require('./lib/connector').default
const methods = require('./domains/methods').default
const noop = require('licia-es/noop').default
const uuid = require('licia-es/uuid').default
const each = require('licia-es/each').default
const Emitter = require('licia-es/Emitter').default

type OnMessage = (message: string) => void
type DomainMethod = (...args: any[]) => any

class Chobitsu {
  private onMessage: OnMessage
  private resolves: Map<string, (value?: any) => void> = new Map()
  private domains: Map<string, { [index: string]: DomainMethod }> = new Map()
  constructor() {
    this.onMessage = noop
    connector.on('message', (message: any) => {
      const parsedMessage = JSON.parse(message)

      const resolve = this.resolves.get(parsedMessage.id)
      if (resolve) {
        resolve(parsedMessage.result)
      }

      if (!parsedMessage.id) {
        const [name, method] = parsedMessage.method.split('.')
        const domain = this.domains.get(name)
        if (domain) {
          domain.emit(method, parsedMessage.params)
        }
      }

      this.onMessage(message)
    })

    this.initDomains()
  }
  domain(name: string) {
    return this.domains.get(name)
  }
  setOnMessage(onMessage: OnMessage) {
    this.onMessage = onMessage
  }
  sendMessage(method: string, params: any = {}) {
    const id = uuid()

    this.sendRawMessage(
      JSON.stringify({
        id,
        method,
        params,
      })
    )

    return new Promise(resolve => {
      this.resolves.set(id, resolve)
    })
  }
  async sendRawMessage(message: string) {
    const parsedMessage = JSON.parse(message)

    const { method, params, id } = parsedMessage

    const resultMsg: any = {
      id,
    }

    try {
      resultMsg.result = await this.callMethod(method, params)
    } catch (e) {
      resultMsg.error = {
        message: e.message,
      }
    }

    connector.emit('message', JSON.stringify(resultMsg))
  }
  private initDomains() {
    const domains = this.domains

    each(methods, (fn: any, key: string) => {
      const [name, method] = key.split('.')
      let domain = domains.get(name)
      if (!domain) {
        domain = {}
        Emitter.mixin(domain)
      }
      domain[method] = fn
      domains.set(name, domain)
    })
  }
  private async callMethod(method: string, params: any) {
    if (methods[method]) {
      return methods[method](params) || {}
    } else {
      throw Error(`${method} unimplemented`)
    }
  }
}

module.exports = new Chobitsu()
