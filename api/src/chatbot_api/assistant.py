from typing_extensions import AsyncIterable, Protocol
from dataclasses import dataclass
from uuid import uuid4
from collections import defaultdict
from functools import cache
from openai import AsyncOpenAI
from openai.types import ChatModel
from openai.types.beta.assistant_stream_event import ThreadMessageDelta
from streamed_yaml import chunked_parse
from chatbot_api import BotMessage

async def parse_response(response: AsyncIterable[str], *, min_chars: int = 20) -> AsyncIterable[BotMessage]:
  """Parse the response from the Assistant API into BotMessages, chunking them to be at least `min_chars` chars"""
  values = defaultdict(str)
  async for update in chunked_parse(response):
    k = update.key
    if k == 'idea' or k == 'message':
      values[k] += update.value
      if len(values[k]) >= min_chars or update.done:
        yield BotMessage(chunk=values[k], done=update.done, tag=k, chatId='')
        values[k] = ''
  
  for k, v in values.items():
    if v:
      yield BotMessage(chunk=v, done=True, tag=k, chatId='')

class Assistant(Protocol):
  async def new_thread(self) -> str:
    ...
  def chat(self, message: str, *, threadId: str) -> AsyncIterable[str]:
    ...

class MockAssistant(Assistant):

  async def new_thread(self) -> str:
    return str(uuid4())
  
  async def chat(self, message: str, *, threadId: str) -> AsyncIterable[str]:
    if 'idea' in message.lower():
      yield f'idea: "Super mocked idea number {len(message)}"\n'
    yield f'message: "# Cool!\n- hello\n- world\n1. First\n2. Second\n"\n'
    # yield f'message: "Starting mock response to message: {message}\n'
    # yield f'This is part 1, referring to {threadId}.\n'
    # yield f'This is part 2, referring to {threadId} again.\n'
    # yield f'Well, that was it, thank you!."\n'

@dataclass
class OpenAIAssistant(Assistant):
  """Async client for the OpenAI Assistant API."""

  openai: AsyncOpenAI
  assistantId: str

  async def new_thread(self) -> str:
    """Create a new chat thread and return its ID."""
    thread = await self.openai.beta.threads.create()
    return thread.id
  
  async def chat(self, message: str, *, threadId: str) -> AsyncIterable[str]:
    await self.openai.beta.threads.messages.create(
      thread_id=threadId, role='user', content=message,
    )
    async with self.openai.beta.threads.runs.stream(
      thread_id=threadId,
      assistant_id=self.assistantId,
    ) as stream:
      async for obj in stream:
        if isinstance(obj, ThreadMessageDelta):
          try:
            yield obj.data.delta.content[0].text.value # type: ignore (some could be None)
          except:
            ...

@cache
def instructions():
  import os
  dir = os.path.dirname(__file__)
  with open(os.path.join(dir, 'instructions.txt')) as f:
    return f.read()
          
async def create_assistant(openai: AsyncOpenAI, *, model: ChatModel = 'gpt-4o') -> str:
  """Create the assistant and return its ID."""
  assistant = await openai.beta.assistants.create(
    name='Brainstormer', instructions=instructions(), model=model
  )
  return assistant.id