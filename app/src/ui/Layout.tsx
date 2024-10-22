import { HStack } from '@chakra-ui/react'
import Chat from './Chat'
import Sidebar from './Sidebar'

export function Layout() {
  return (
    <HStack h='100vh' w='100vw' align='center' justify='end'>
      <Chat w='70%' />
      <Sidebar w='20%' />
    </HStack>
  )
}

export default Layout