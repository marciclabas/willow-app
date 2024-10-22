import { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react'
import { v4 as uuid4 } from 'uuid'
import { Chat } from './client'
import { contextize } from 'contextize'

export type Message = {
  role: 'user' | 'bot'
  text: string
}

export type Context = {
  messages: Message[]
  ideas: string[]
  thinking: boolean
  send(message: string): void
  reset(): void
}

export type Props = {
  chat: Chat
  onIdea?(idea: string, count: number): void
  onError?(error: string): void
}

const setLast = <T>(setState: Dispatch<SetStateAction<T[]>>) => (fn: (x: T) => T) =>
  setState(curr => [...curr.slice(0, -1), fn(curr[curr.length-1])])

function useChat({ chat, onIdea, onError }: Props): Context {

  const [ideas, setIdeas] = useState<string[]>([])

  const [messages, setMessages] = useState<Message[]>([])
  const setLastMessage = useCallback(setLast(setMessages), []) // eslint-disable-line react-hooks/exhaustive-deps

  const [thinking, setThinking] = useState(false)
  const [chatId, setChatId] = useState(() => uuid4())

  const send = useCallback(async (message: string) => {
    setThinking(true)
    setMessages(curr => [...curr, { role: 'user', text: message }, { role: 'bot', text: '' }])

    let idea = ''
    let ideas = 0
    for await (const msg of chat(message, chatId)) {
      if (msg.tag === 'idea') {
        idea += msg.chunk
        if (msg.done) {
          const copy = idea // capture the current value
          setIdeas(curr => [...curr, copy])
          onIdea?.(idea, ++ideas)
          idea = ''
        }
      }
      else if (msg.tag === 'message')
        setLastMessage(last => ({ role: 'bot', text: last.text+msg.chunk }))
      else if (msg.tag === 'error') {
        onError?.(msg.error)
        break
      }
    }
    setThinking(false)
  }, [chat, chatId, onIdea, onError, setLastMessage])

  const reset = useCallback(() => {
    setMessages([])
    setIdeas([])
    setThinking(false)
    setChatId(uuid4())
  }, [])

  return useMemo(() => ({ messages, ideas, thinking, send, reset }), [messages, ideas, thinking, send, reset])
}

export const chat = contextize(useChat)