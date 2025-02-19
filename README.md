<div align="center">
  <img src="docs/docs/headermulti.png">
</div>

<h1 align="center">
    <b>Multi</b>
</h1>

## About

Multi is an open-source AI agent platform that offers:

- The capability to create agents for various use cases, such as copilots, assistants, and autonomous workflows.
- Seamless integration with top LLM providers.
- Built-in Retrieval-Augmented Generation (RAG) for handling your data.
- Simple connectivity with custom or private web services and APIs.
- Support for OAuth 2.0 authentication.

## Installation
Launch Multi:
```bash
docker run -d -p 8080:8080 -e ghcr.io/multi-platform/multi:latest
```
Then visit http://localhost:8080.

## Getting Started

```python
# translator.py

import asyncio
import os

from multi.agents import WalletAgent, ChatAgent, SolanaClient

developer = AgentSpec(
    "developer",
    new(
        ChatAgent,
        system="You are developer that specializes in Solana blockchain integration.",
        client=ModelClient(model="multi/v6.1", api_key=os.getenv("MULTI_API_KEY")),
    ),
)


async def main():
    async with LocalRuntime() as runtime:
        await runtime.register(developer)

        result = await developer.run(
            WalletAction(role="user", content="Burn").encode(),
            stream=True,
        )    


if __name__ == "__main__":
    asyncio.run(main())
```

## Contributions

Contributions are welcome! Follow the steps below to get started:

1. Fork the Repository
Click the "Fork" button on the top right of this repository to create your own copy.

2. Clone Your Fork
Clone your forked repository to your local machine

3. Create a Branch
Create a new branch for your changes

4. Make Your Changes
Implement your changes, following the project’s standards

5. Commit Your Changes
Stage and commit your changes

6. Push Your Changes
Push your branch to your forked repository
