# 🎲 rollhub-dice-mcp

[![npm version](https://img.shields.io/npm/v/rollhub-dice-mcp.svg)](https://www.npmjs.com/package/rollhub-dice-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Server-blue.svg)](https://modelcontextprotocol.io/)

**MCP server casino for AI agents — provably fair dice & coinflip gambling via Claude Desktop, Cursor, and any MCP-compatible client.**

> 🎰 **[Agent Casino](https://agent.rollhub.com)** — The first provably fair crypto casino built for AI agents

## What is this?

`rollhub-dice-mcp` is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that connects AI assistants to [Agent Casino](https://agent.rollhub.com), the provably fair crypto betting API for AI agents. Let Claude, GPT, or any MCP client place dice bets, verify fairness cryptographically (SHA3-384 + AES-256-CTR), and manage crypto deposits/withdrawals across 70+ blockchain networks. Zero-trust gambling with 99% RTP.

## Features

- **MCP server casino** — drop-in provably fair dice & coinflip for Claude Desktop & Cursor
- **Auto-verification** of every bet — SHA3-384 + AES-256-CTR commit-reveal proof
- **70+ cryptocurrency chains** for deposits and withdrawals (SOL, ETH, BTC, USDT, USDC...)
- **99% RTP**, 1% house edge, transparent math
- **30% affiliate earnings** on referred agents — agent affiliate program
- Register new agents, place bets, verify proofs, check balance & history

## Quick Start

```bash
npx rollhub-dice-mcp
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "rollhub-dice": {
      "command": "npx",
      "args": ["-y", "rollhub-dice-mcp"],
      "env": {
        "ROLLHUB_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Config file location:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Then restart Claude Desktop. Ask: *"Roll a dice over 50 for 100 units"* — it just works!

## Cursor / Windsurf / Other MCP Clients

Any MCP-compatible client can use this server. The command is:

```bash
npx -y rollhub-dice-mcp
```

Set `ROLLHUB_API_KEY` environment variable with your API key from [agent.rollhub.com](https://agent.rollhub.com).

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `register` | Create a new agent account |
| `bet` | Place a dice bet (over/under target) |
| `coinflip` | Flip a coin (heads/tails) |
| `verify` | Verify bet fairness cryptographically |
| `balance` | Check agent balance |
| `history` | Get bet history |
| `deposit` | Get deposit address for 70+ chains |
| `withdraw` | Withdraw winnings |

## 💰 Affiliate Program — Earn Crypto with AI

Earn **30% of house edge** on every bet by agents you refer. Instant credit. AI agents can earn money by referring other autonomous gambling agents.

Also check out [rollhub-affiliate-mcp](https://www.npmjs.com/package/rollhub-affiliate-mcp) — a dedicated MCP server for affiliate marketing automation.

## Full Ecosystem

| Package | Registry | Description |
|---------|----------|-------------|
| [rollhub-dice](https://pypi.org/project/rollhub-dice/) | PyPI | Core Python SDK for AI agent gambling API |
| [rollhub-dice](https://www.npmjs.com/package/rollhub-dice) | npm | Core JS/TS SDK for AI agent gambling API |
| [rollhub-dice-mcp](https://www.npmjs.com/package/rollhub-dice-mcp) | npm | MCP server casino for Claude Desktop & Cursor |
| [rollhub-affiliate-mcp](https://www.npmjs.com/package/rollhub-affiliate-mcp) | npm | Affiliate marketing MCP server |
| [langchain-rollhub](https://pypi.org/project/langchain-rollhub/) | PyPI | LangChain gambling tool |
| [crewai-rollhub](https://pypi.org/project/crewai-rollhub/) | PyPI | CrewAI gambling tool |
| [rollhub-openai-tools](https://www.npmjs.com/package/rollhub-openai-tools) | npm | OpenAI function calling gambling |
| [rollhub-ai-tools](https://www.npmjs.com/package/rollhub-ai-tools) | npm | Vercel AI SDK tools |
| [eliza-rollhub](https://www.npmjs.com/package/eliza-rollhub) | npm | ElizaOS plugin |
| [autogpt-rollhub](https://pypi.org/project/autogpt-rollhub/) | PyPI | AutoGPT plugin |

## Keywords

MCP server casino, AI agent gambling, provably fair dice, Claude Desktop gambling, crypto betting API, coinflip MCP, zero-trust verification, autonomous agent betting, Solana gambling API, AI casino

## Links

- 🌐 **Website:** [agent.rollhub.com](https://agent.rollhub.com)
- 📖 **API docs:** [agent.rollhub.com](https://agent.rollhub.com) (scroll to API Reference)
- 🎲 **Core SDK:** [rollhub-dice](https://www.npmjs.com/package/rollhub-dice)
- 💰 **Affiliate MCP:** [rollhub-affiliate-mcp](https://www.npmjs.com/package/rollhub-affiliate-mcp)
