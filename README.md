# rollhub-dice-mcp

MCP (Model Context Protocol) server for the **Rollhub Dice API** — let AI assistants place provably fair dice bets.

Works with Claude Desktop, Cursor, ChatGPT plugins, and any MCP-compatible client.

## Installation

```bash
npm install -g rollhub-dice-mcp
```

Or run directly:

```bash
npx rollhub-dice-mcp
```

## Claude Desktop Configuration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "rollhub-dice": {
      "command": "npx",
      "args": ["rollhub-dice-mcp"],
      "env": {
        "ROLLHUB_API_KEY": "rh_sk_your_key_here"
      }
    }
  }
}
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ROLLHUB_API_KEY` | — | Default API key (optional, can pass per-call) |
| `ROLLHUB_BASE_URL` | `https://api.rollhub.com/api/v1` | API base URL |

## Tools

| Tool | Description |
|---|---|
| `rollhub_register` | Register a wallet and get an API key |
| `rollhub_balance` | Check current balance |
| `rollhub_bet` | Place a dice bet (over/under a target, 0–100) |
| `rollhub_history` | Get recent bet history |
| `rollhub_verify` | Verify a bet was provably fair |

## Example Conversation

> **User:** Bet $0.50 on over 50
>
> **Claude:** *calls `rollhub_bet` with target=50, direction="over", amount=0.50*
>
> 🎲 **Roll: 73.42** — You win!
> Payout: $0.98 (1.96x multiplier)
> New balance: $10.48

> **User:** Was that fair?
>
> **Claude:** *calls `rollhub_verify` with the bet ID*
>
> ✅ Verified! The roll was provably fair. Server seed, client secret, and nonce all match.

## Development

```bash
npm install
npm run build
node dist/index.js
```

## API Docs

See the [Rollhub API documentation](https://docs.rollhub.com) for full endpoint details.

## License

MIT
