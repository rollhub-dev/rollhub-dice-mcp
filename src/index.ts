#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import crypto from "node:crypto";

const BASE_URL = process.env.ROLLHUB_BASE_URL || "https://api.rollhub.com/api/v1";
const DEFAULT_API_KEY = process.env.ROLLHUB_API_KEY || "";

async function api(
  path: string,
  options: { method?: string; body?: unknown; apiKey?: string } = {}
): Promise<unknown> {
  const { method = "GET", body, apiKey } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["X-API-Key"] = apiKey;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = (data as Record<string, unknown>).error || res.statusText;
    throw new Error(`API error ${res.status}: ${msg}`);
  }
  return data;
}

function resolveKey(provided?: string): string {
  const key = provided || DEFAULT_API_KEY;
  if (!key) throw new Error("No API key provided. Pass api_key or set ROLLHUB_API_KEY env var.");
  return key;
}

const server = new McpServer({
  name: "rollhub-dice",
  version: "0.1.0",
});

// --- Tools ---

server.tool(
  "rollhub_register",
  "Register a new agent wallet and receive an API key for placing bets",
  { wallet_address: z.string().describe("Wallet address to register") },
  async ({ wallet_address }) => {
    const data = await api("/register", {
      method: "POST",
      body: { wallet_address },
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "rollhub_balance",
  "Check the current balance for an API key",
  { api_key: z.string().optional().describe("API key (uses ROLLHUB_API_KEY env if omitted)") },
  async ({ api_key }) => {
    const data = await api("/balance", { apiKey: resolveKey(api_key) });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "rollhub_bet",
  "Place a provably fair dice bet. Roll is 0-100. Pick a target and direction (over/under).",
  {
    api_key: z.string().optional().describe("API key (uses ROLLHUB_API_KEY env if omitted)"),
    target: z.number().min(0).max(100).describe("Target number (0-100)"),
    direction: z.enum(["over", "under"]).describe("Bet direction: over or under the target"),
    amount: z.number().positive().describe("Bet amount in USD"),
  },
  async ({ api_key, target, direction, amount }) => {
    const client_secret = crypto.randomBytes(16).toString("hex");
    const data = await api("/dice", {
      method: "POST",
      apiKey: resolveKey(api_key),
      body: { target, direction, amount, client_secret },
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "rollhub_history",
  "Get recent bet history",
  { api_key: z.string().optional().describe("API key (uses ROLLHUB_API_KEY env if omitted)") },
  async ({ api_key }) => {
    const data = await api("/bets", { apiKey: resolveKey(api_key) });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "rollhub_verify",
  "Verify that a bet was provably fair",
  { bet_id: z.number().describe("Bet ID to verify") },
  async ({ bet_id }) => {
    const data = await api(`/verify/${bet_id}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// --- Start ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
