from fastapi import FastAPI, WebSocket, Response
from chatbot_api import Assistant, DB, UserMessage, DoneMessage, parse_response

def api(assistant: Assistant, db: DB):

  app = FastAPI()

  @app.websocket('/chat')
  async def chat(ws: WebSocket):
    await ws.accept()
    while True:
      data = await ws.receive_text()
      msg = UserMessage.model_validate_json(data)
      chatId = msg.chatId

      async with db:
        if (threadId := await db.get_thread(chatId)) is None:
          threadId = await assistant.new_thread()
          await db.new_thread(chatId=msg.chatId, threadId=threadId)

      async for out in parse_response(assistant.chat(msg.message, threadId=threadId)):
        out.chatId = chatId
        await ws.send_text(out.model_dump_json(exclude_none=True))

      await ws.send_text(DoneMessage(chatId=chatId).model_dump_json())
      

  return app