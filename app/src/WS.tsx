import { useState } from 'react'
import { Box, Button, Heading, Input, Spinner, Text, useToast, VStack } from '@chakra-ui/react'
import { subscribe } from './controller/client'
import { v4 as uuid4 } from 'uuid'
import Markdown from 'react-markdown'

const chat = subscribe('localhost:8000')

export function WS() {

  const [messages, setMessages] = useState<string[]>([])
  const setLastMessage = (fn) => setMessages(curr => curr.slice(0, -1).concat(fn(curr[curr.length - 1])))
  const [input, setInput] = useState('')
  const [threadId, setThreadId] = useState(() => uuid4())
  const [doing, setDoing] = useState(false)

  const toast = useToast()

  for (const msg of messages) {
    console.log(msg)
  }

  async function reset() {
    setMessages([])
    setDoing(false)
    setThreadId(uuid4())
  }

  async function send() {
    setDoing(true)
    setMessages(curr => [...curr, input, ''])
    setInput('')
    let toastId: any = null
    let idea = ''

    for await (const msg of chat(input, threadId)) {
      if (msg.tag === 'idea') {
        idea += msg.chunk
        if (toastId === null) {
          toastId = toast({
            title: 'Saving Idea',
            status: 'loading',
          })
        }
        else if (msg.done) {
          toast.update(toastId, {
            title: 'Idea Saved',
            description: idea,
            status: 'success',
          })
        }
      }
      else if (msg.tag === 'message') {
        setLastMessage(curr => curr + msg.chunk)
        console.log('Last Message:', messages[messages.length - 1])
      }
      else if (msg.tag === 'error') {
        toast({
          title: 'Error',
          description: msg.error,
          status: 'error',
        })
      }
    }
    setDoing(false)
  }

  return (
    <VStack h='100vh' w='100vw' align='center' justify='center'>
      <Heading>Brainstormy</Heading>
      <Text>{threadId}</Text>
      <Box h='60%' w='60%' overflow='auto' p='2rem'>
        {messages.map((msg, i) => (
          <Box key={i}>
            <Text>{i % 2 === 0 ? 'User' : 'Server'}:</Text>
            <Markdown>{msg}</Markdown>
          </Box>
        ))}
        {doing && <Spinner />}
      </Box>
      <Input w='auto' value={input} onChange={e => setInput(e.target.value)} />
      <Button disabled={doing || !input} onClick={send}>Send</Button>
      <Button onClick={reset}>Reset</Button>
    </VStack>
  )
}

export default WS