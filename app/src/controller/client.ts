import { ManagedAsync, managedAsync } from 'haskellian/asyn_iter'
import { managedPromise } from 'haskellian/promise'

export type UserMessage = {
  message: string
  chatId: string
}

export type BotMessage = {
  tag: 'message' | 'idea'
  chatId: string
  chunk: string
  done?: boolean
}

export type ErrorMessage = {
  tag: 'error'
  error: string
}

export type DoneMessage = {
  tag: 'done'
  chatId: string
}

/** Lazy socket connector: when called, will reconnect if needed */
function socket(url: string, prepare: (ws: WebSocket) => void) {
  let ws = new WebSocket(url)
  prepare(ws)

  return () => {
    const promise = managedPromise<WebSocket>()
    const state = ws.readyState === WebSocket.OPEN ? 'OPEN' : ws.readyState === WebSocket.CONNECTING ? 'CONNECTING' : 'CLOSED'
    console.debug('Getting Socket:', state)
    
    if (ws.readyState === WebSocket.OPEN) {
      promise.resolve(ws)
    }
    else if (ws.readyState === WebSocket.CONNECTING)
      ws.addEventListener('open', () => promise.resolve(ws))
    else {
      ws = new WebSocket(url)
      prepare(ws)
      ws.addEventListener('open', () => promise.resolve(ws))
      ws.addEventListener('error', e => promise.reject(e))
      ws.addEventListener('close', () => promise.reject('Socket closed'))
    }

    return promise
  }
}

export type Chat = (message: string, chatId: string) => AsyncIterable<BotMessage|ErrorMessage>

export function subscribe(host: string): Chat {

  const streams = new Map<string, ManagedAsync<BotMessage|ErrorMessage>>()

  const getSocket = socket(`ws://${host}/chat`, ws => {
    ws.addEventListener('message', e => {
      const msg: BotMessage|DoneMessage = JSON.parse(e.data)
      console.log('Message:', msg);
      if (msg.tag === 'done')
        streams.get(msg.chatId)?.end()
      else
        streams.get(msg.chatId)?.push(msg)
    })

    ws.addEventListener('error', e => {
      console.error('Socket Error:', e)
      for (const stream of streams.values()) {
        stream.push({ tag: 'error', error: 'Socket Error' })
        stream.end()
      }
    })
  })

  async function* chat(message: string, chatId: string): AsyncIterable<BotMessage|ErrorMessage> {
    streams.set(chatId, managedAsync<BotMessage|ErrorMessage>())
    getSocket().then(ws => ws.send(JSON.stringify({ message, chatId }))).catch(() => {})
    yield* streams.get(chatId)!
  }
  return chat
}
