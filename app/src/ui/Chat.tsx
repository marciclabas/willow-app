import { useEffect, useRef, useState } from 'react'
import { chat } from '@controller'
import { Box, Button, Input, InputGroup, InputRightElement, Spinner, VStack } from '@chakra-ui/react'
import { Messages } from './Messages'
import { MdSend } from 'react-icons/md'

export function Chat(props: Parameters<typeof VStack>[0]) {
  const { messages, thinking, send: sendMsg } = chat.use()
  const [input, setInput] = useState('')
  const end = useRef<HTMLDivElement>(null)

  function send() {
    if (input && !thinking) {
      sendMsg(input)
      setInput('')
    }
  }

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <VStack h='100%' align='end' justify='space-between' p='1rem' {...props}>
      <Box h='100%' w='80%' overflowY='auto' p='1rem' bg='gray.800' borderRadius='md'>
        <Messages messages={messages} />
        {thinking && <Spinner mt='1rem' color='white' ref={end} />}
      </Box>

      <InputGroup w='100%' justifyContent='end'>
        <Input w='80%'
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder='Type your message...'
          color='white'
          bg='gray.700'
          border='none'
          _placeholder={{ color: 'gray.400' }}
        />
        <InputRightElement>
          <Button onClick={send} disabled={thinking || !input} colorScheme='blue' variant='ghost' rightIcon={<MdSend />} />
        </InputRightElement>
      </InputGroup>
    </VStack>
  )
}

export default Chat