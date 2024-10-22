# Willow Full Stack Assigment October 2024

## Overview

- Frontend: React SPA
- Backend: Python FastAPI + sqlalchemy
- Frontend <-> Backend: (raw) web sockets
- LLM: OpenAI assistants API

## Running Locally

### Frontend

Assuming you have `node` and `yarn`/`npm` installed:

```bash
cd app
yarn # or `npm i`
yarn dev # or `npm run dev`
```

This will start a development server at `http://localhost:5173`.

### Backend

Assuming you have python >= 3.10 installed:

1. Create a `.env` file with `OPENAI_API_KEY='...'` or export the environment variable.
2. Optional, but plz do create a virtual environment:
    ```bash
    python -m venv .venv # or python3.10 -m venv .venv, etc.
    source .venv/bin/activate
    ```

3. Install and run:
    ```bash
    pip install ./api
    chatbot-api
    ```

This will start a uvicorn server at `http://localhost:8000`.

## Technical Details

### Chat Functionality

#### Assistants API

The app uses OpenAI's [Assistants API](https://platform.openai.com/docs/assistants/overview), which takes care of:

- **Conversation Tracking**: the API tracks the context of the conversation, so there's no need for the frontend or backend to store entire conversations or resend them with each request.
- **Token Clipping**: the conversation context is clipped automatically by the API to stay within token limits, preventing overflow while retaining the most recent and relevant messages.
- **Consistent Prompts**: the same initial prompt is provided for each conversation to ensure consistent behavior from the chatbot.

#### Thread IDs

To simplify the frontend, it generates random conversation IDs. We keep in a DB the mapping from these to the OpenAI's thread IDs. Threads are created on demand upon the first message of a conversation.

### LLM Response Format

The model is instructed to respond in a structured, single-level YAML format. This format is both lightweight and easy to stream in real time. See the prompt [here](api/src/chatbot_api/instructions.txt).

```yaml
idea: '...'
message: '...'
```
- Multiple Ideas: the model can suggest multiple ideas in a single response.
- Single Message: the model outputs only one message per response, and any ideas appear before the message.

Example:

```yaml
idea: "WebSockets"
idea: "HTTP + SSE"
message: "Okay, I've saved them!"
```

### Real-time Frontend <-> Backend Communication

Frontend and backend communicate via websockets, using this simple protocol (in typescript):

```typescript
type UserMessage = {
  message: string // the user's message
  chatId: string  // the conversation id, generated by the frontend
}

type BotMessage = {
  tag: 'message' | 'idea'
  chunk: string // a chunk of the bot's response
  chatId: string  // the conversation id as passed by the frontend
  done?: boolean  // whether the current key-value entry (message or idea) is complete
}
```

**Communication Flow**

- Frontend: sends a message via websocket to the backend.
- Backend: forwards the user's message to the OpenAI Assistants API and streams the response back in chunks via the websocket.

An example of a full conversation:

```typescript
// App -> Server
{ message: 'Hi! Please cat names', chatId: '123' }

// Server -> App
{ tag: 'message', chunk: 'Hi! Here are some cat', chatId: '123' }
{ tag: 'message', chunk: ' names:\n- Whiskers\n- Fluffy\n', chatId: '123', done: True }

// App -> Server
{ message: 'Great! Save them please', chatId: '123' }

// Server -> App
{ tag: 'idea', chunk: 'Whiskers', chatId: '123', done: True }
{ tag: 'idea', chunk: 'Fluf', chatId: '123' }
{ tag: 'idea', chunk: 'fy', chatId: '123', done: True }
{ tag: 'message', chunk: 'Saved them!', chatId: '123', done: True }
```

To reduce payload overhead, chunks have a (configurable) minimum size of 20 characters.