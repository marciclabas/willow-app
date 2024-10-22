import os
import asyncio
from dotenv import load_dotenv
from openai import AsyncOpenAI
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from fastapi.middleware.cors import CORSMiddleware
from willow_api import api, DB, OpenAIAssistant, MockAssistant, create_assistant

load_dotenv()
ASSISTANT_ID = os.environ.get('ASSISTANT_ID')
MOCK = os.environ.get('MOCK')
OPENAI_MODEL = os.environ.get('OPENAI_MODEL') or 'gpt-4o'
SQL_CONN_STR = os.environ.get('SQL_CONN_STR') or 'sqlite+aiosqlite:///db.sqlite'


if MOCK:
  assistant = MockAssistant()

else:
  openai = AsyncOpenAI()
  if not ASSISTANT_ID:
    ASSISTANT_ID = asyncio.get_running_loop().run_until_complete(create_assistant(openai, model=OPENAI_MODEL)) # type: ignore
  assistant = OpenAIAssistant(openai, ASSISTANT_ID)

db = DB(create_async_engine(SQL_CONN_STR))
try:
  asyncio.create_task(db.init())
except:
  asyncio.run(db.init())

app = api(assistant, db)
app.add_middleware(
  CORSMiddleware,
  allow_origins=['*'],
  allow_credentials=True,
  allow_methods=['*'],
  allow_headers=['*'],
)

if __name__ == '__main__':
  import uvicorn
  uvicorn.run(app, host='0.0.0.0')