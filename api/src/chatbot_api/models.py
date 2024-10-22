from typing_extensions import Literal
from pydantic import BaseModel

class UserMessage(BaseModel):
  message: str
  chatId: str

class BotMessage(BaseModel):
  chunk: str
  chatId: str
  tag: Literal['message', 'idea']
  done: bool | None = None

class DoneMessage(BaseModel):
  chatId: str
  tag: Literal['done'] = 'done'