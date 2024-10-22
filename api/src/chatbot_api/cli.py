import os
from argparse import ArgumentParser
from dotenv import load_dotenv, find_dotenv

def env(variable: str, *, default = None, required: bool = True) -> dict:
  if (value := os.getenv(variable, default)) is not None:
    return dict(default=value)
  return dict(required=required)

description = 'Run the Chatbot API server. Parameters can also be set with environment variables, or in a .env file.'

def main():
  load_dotenv(find_dotenv(usecwd=True))

  parser = ArgumentParser(description=description)
  parser.add_argument('--assistant', **env('ASSISTANT_ID', required=False), help='OpenAI Assistant ID. Will be created if not provided. Env var: `ASSISTANT_ID`')
  parser.add_argument('--api-key', **env('OPENAI_API_KEY', required=False), help='OpenAI API key. Env var: `OPENAI_API_KEY`')
  parser.add_argument('--model', **env('OPENAI_MODEL', default='gpt-4o'), help='OpenAI model to use. Env var: `OPENAI_MODEL`')
  parser.add_argument('--sql', **env('SQL_CONN_STR', default='sqlite+aiosqlite:///.data/db.sqlite'), help='SQL connection string. Env var: `SQL_CONN_STR`')

  parser.add_argument('--host', default='0.0.0.0')
  parser.add_argument('-p', '--port', type=int, default=8000)
  parser.add_argument('--cors', nargs='*', default=['*'], help='CORS origins to allow. Defaults to: "*"')

  args = parser.parse_args()

  import asyncio

  if args.api_key is None:
    print(f'[INFO] No OPENAI_API_KEY provided. Running in mock mode.')
    from chatbot_api import MockAssistant
    assistant = MockAssistant()
  else:
    from chatbot_api import OpenAIAssistant, create_assistant
    from openai import AsyncOpenAI
    openai = AsyncOpenAI(api_key=args.api_key)
    if (assistant_id := args.assistant) is None:
      if os.path.exists('.data/assistant_id.txt'):
        with open('assistant_id.txt') as f:
          assistant_id = f.read().strip()
      else:
        assistant_id = asyncio.run(create_assistant(openai, model=args.model))
        with open('.data/assistant_id.txt', 'w') as f:
          f.write(assistant_id)
        print(f'[INFO] Created assistant with ID: {assistant_id}')
    assistant = OpenAIAssistant(openai, assistant_id)

  from sqlalchemy.ext.asyncio import create_async_engine
  from fastapi.middleware.cors import CORSMiddleware
  import uvicorn
  from chatbot_api import api, DB

  db = DB(create_async_engine(args.sql))
  asyncio.run(db.init())

  app = api(assistant, db)
  app.add_middleware(
    CORSMiddleware,
    allow_origins=args.cors,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
  )

  uvicorn.run(app, host=args.host, port=args.port)