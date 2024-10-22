import { Box, Button, Heading, UnorderedList, ListItem, Text, VStack } from '@chakra-ui/react'
import { chat } from '@controller'

export function Sidebar(props: Parameters<typeof VStack>[0]) {
  const { ideas, reset } = chat.use()

  return (
    <VStack w='20%' h='100%' bg='gray.800' p='1rem' {...props}>
      <Heading fontSize='2xl' color='white' fontWeight='bold'>Brainstormer</Heading>
      <Heading fontSize='lg' color='white'>Ideas List</Heading>
      <Box w='100%' flex={1} overflow='auto'>
        {ideas.length === 0 && (
          <Text color='gray.300' fontSize='md'>No ideas yet</Text>
        )}
        <VStack align='flex-start'>
          <UnorderedList>
            {ideas.map((idea, index) => (
              <ListItem key={index} color='gray.300' fontSize='md'>
                {idea}
              </ListItem>
            ))}
          </UnorderedList>
        </VStack>
      </Box>

      <Button onClick={reset} variant='ghost' colorScheme='red' w='100%'>Reset</Button>
    </VStack>
  )
}

export default Sidebar