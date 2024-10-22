import { Box, Text, VStack } from '@chakra-ui/react'
import Markdown from 'react-markdown'
import { Message } from '../controller/chat'

export function UserMessage({ text }: { text: string }) {
  return (
    <Box alignSelf='flex-end' bg='blue.600' color='white' p='0.5rem' borderRadius='md' maxW='80%' mt='0.5rem'>
      <Text>{text}</Text>
    </Box>
  )
}

export function BotMessage({ text }: { text: string }) {
  return (
    <Box alignSelf='flex-start' bg='gray.700' color='gray.200' p='0.5rem' pl='2rem' borderRadius='md' maxW='80%' mt='0.5rem'>
      <Markdown>{text || '...'}</Markdown>
    </Box>
  )
}

export function Messages({ messages }: { messages: Message[] }) {
  return (
    <VStack align='stretch' spacing='1rem' w='100%'>
      {messages.map((msg, i) =>
        msg.role === 'user' ? <UserMessage key={i} text={msg.text} /> : <BotMessage key={i} text={msg.text} />
      )}
    </VStack>
  )
}