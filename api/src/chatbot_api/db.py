from dataclasses import dataclass, field
from sqlmodel import SQLModel, Field
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

class Thread(SQLModel, table=True):
  chatId: str = Field(primary_key=True)
  """Frontend ID"""
  threadId: str
  """Assistant's API thread ID"""

@dataclass
class DB:
  engine: AsyncEngine
  threads_cache: dict[str, str] = field(default_factory=dict)
  _session: AsyncSession | None = None

  @property
  def session(self) -> AsyncSession:
    if self._session is None:
      raise RuntimeError('The client must be used as an async context manager: `async with db: ...`')
    return self._session

  async def init(self):
    async with self.engine.begin() as conn:
      await conn.run_sync(SQLModel.metadata.create_all)

  async def __aenter__(self):
    self._session = AsyncSession(self.engine)
    return self
  
  async def __aexit__(self, *_):
    await self.session.close()

  async def new_thread(self, *, threadId: str, chatId: str):
    """Create a new `threadId <-> chatId` mapping"""
    thread = Thread(threadId=threadId, chatId=chatId)
    self.session.add(thread)
    await self.session.commit()
    self.threads_cache[chatId] = threadId

  async def get_thread(self, chatId: str) -> str | None:
    if chatId in self.threads_cache:
      return self.threads_cache[chatId]
    thread = await self.session.get(Thread, chatId)
    if thread:
      self.threads_cache[chatId] = thread.threadId
      return thread.threadId
