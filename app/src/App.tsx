import { useCallback, useRef } from 'react'
import { useToast } from '@chakra-ui/react'
import { chat, subscribe } from '@controller'
import Layout from './ui/Layout'

const chatClient = subscribe('localhost:8000')

export function App() {

  const toast = useToast()
  const toastId = useRef<any>(null)

  const onIdea = useCallback((idea: string, count: number) => {
    if (toastId.current && toast.isActive(toastId.current))
      toast.update(toastId.current, {
        title: `Ideas Saved (x${count})`,
        status: 'success', position: 'top',
        duration: 5000, isClosable: true,
      })
    else
      toastId.current = toast({
        title: 'Idea Saved',
        description: idea,
        status: 'success', position: 'top',
        duration: 5000, isClosable: true,
      })
  }, [toast])

  const onError = useCallback((error: string) => {
    toast({
      title: 'Error',
      description: error,
      status: 'error', position: 'top',
      duration: 5000, isClosable: true,
    })
  }, [toast])

  return (
    <chat.Provider chat={chatClient} onIdea={onIdea} onError={onError}>
      <Layout />
    </chat.Provider>
  )
}

export default App