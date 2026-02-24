#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import crypto, { createHash, createCipheriv } from "node:crypto";

const BASE_URL = process.env.ROLLHUB_BASE_URL || "https://agent.rollhub.com/api/v1";
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

// --- Provably fair verification ---

function computeRoll(serverSeedHex: string, clientSeedHex: string, nonce: number): number {
  const serverBytes = Buffer.from(serverSeedHex, 'hex');
  const clientBytes = Buffer.from(clientSeedHex, 'hex');
  const nonceBytes = Buffer.alloc(8);
  nonceBytes.writeBigUInt64LE(BigInt(nonce));

  const h = createHash('sha3-384');
  h.update(serverBytes);
  h.update(clientBytes);
  h.update(nonceBytes);
  const digest = h.digest();

  const key = digest.subarray(0, 32);
  const iv = digest.subarray(32, 48);

  const cipher = createCipheriv('aes-256-ctr', key, iv);
  const ct = cipher.update(Buffer.alloc(16));

  let xor = 0;
  for (let i = 0; i < 16; i += 4) {
    xor ^= ct.readUInt32LE(i);
  }

  return 0.5 + xor / 4294967295;
}

function hashServerSeed(serverSeedHex: string): string {
  return createHash('sha3-384').update(Buffer.from(serverSeedHex, 'hex')).digest('hex');
}

function verifyBetProof(data: {
  server_seed: string;
  server_seed_hash: string;
  client_seed: string;
  nonce: number;
  roll: number;
}) {
  const computedHash = hashServerSeed(data.server_seed);
  const hashOk = computedHash === data.server_seed_hash;
  const rollRecalc = parseFloat(computeRoll(data.server_seed, data.client_seed, data.nonce).toFixed(6));
  const rollReported = parseFloat(data.roll.toFixed(6));
  const rollOk = rollRecalc === rollReported;
  return {
    verified: hashOk && rollOk,
    hash_verified: hashOk,
    roll_verified: rollOk,
    roll_reported: rollReported,
    roll_recalculated: rollRecalc,
  };
}

const server = new McpServer({
  name: "rollhub-dice",
  version: "0.4.0",
});

// --- Tools ---

server.tool(
  "rollhub_register",
  "Register a new agent wallet on Agent Casino (AI agent gambling API) and receive an API key for provably fair dice betting with cryptocurrency.",
  {
    wallet_address: z.string().describe("Wallet address to register"),
    ref: z.string().optional().describe("Referral code of the referring agent"),
  },
  async ({ wallet_address, ref }) => {
    const body: Record<string, string> = { wallet_address };
    if (ref) body.ref = ref;
    const data = await api("/register", {
      method: "POST",
      body,
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "rollhub_affiliate_stats",
  "Get Agent Casino affiliate earnings — earn 30% of house edge on referred agents. Agent affiliate program with instant credit. Returns referral code, link, earnings.",
  { api_key: z.string().optional().describe("API key (uses ROLLHUB_API_KEY env if omitted)") },
  async ({ api_key }) => {
    const data = await api("/affiliate/stats", { apiKey: resolveKey(api_key) });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "rollhub_balance",
  "Check current Agent Casino crypto betting account balance for the AI agent gambling API.",
  { api_key: z.string().optional().describe("API key (uses ROLLHUB_API_KEY env if omitted)") },
  async ({ api_key }) => {
    const data = await api("/balance", { apiKey: resolveKey(api_key) });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "rollhub_bet",
  "Place a provably fair dice bet with real cryptocurrency on Agent Casino. Every outcome is cryptographically verified using SHA3-384 + AES-256-CTR commit-reveal. 99% RTP, 1% house edge. 70+ blockchain networks.",
  {
    api_key: z.string().optional().describe("API key (uses ROLLHUB_API_KEY env if omitted)"),
    target: z.number().min(0).max(100).describe("Target number (0-100)"),
    direction: z.enum(["over", "under"]).describe("Bet direction: over or under the target"),
    amount: z.number().positive().describe("Bet amount in USD"),
  },
  async ({ api_key, target, direction, amount }) => {
    const client_secret = crypto.randomBytes(16).toString("hex");
    const data = (await api("/dice", {
      method: "POST",
      apiKey: resolveKey(api_key),
      body: { target, direction, amount, client_secret },
    })) as Record<string, unknown>;

    // Auto-verify if proof contains server_seed
    const proof = data.proof as Record<string, unknown> | undefined;
    if (proof?.server_seed) {
      const verification = verifyBetProof({
        server_seed: proof.server_seed as string,
        server_seed_hash: proof.server_seed_hash as string,
        client_seed: (proof.client_seed as string) || client_secret,
        nonce: proof.nonce as number,
        roll: data.roll as number,
      });
      (data as Record<string, unknown>).verification = verification;
    }

    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "rollhub_history",
  "Get recent bet history from Agent Casino AI agent gambling API.",
  { api_key: z.string().optional().describe("API key (uses ROLLHUB_API_KEY env if omitted)") },
  async ({ api_key }) => {
    const data = await api("/bets", { apiKey: resolveKey(api_key) });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "rollhub_verify",
  "Verify a bet was provably fair using zero-trust cryptographic proof — SHA3-384 + AES-256-CTR client-side recomputation. Independent verification.",
  {
    bet_id: z.number().describe("Bet ID to verify"),
    api_key: z.string().optional().describe("API key (uses ROLLHUB_API_KEY env if omitted)"),
  },
  async ({ bet_id, api_key }) => {
    const data = (await api(`/verify/${bet_id}`, { apiKey: resolveKey(api_key) })) as Record<string, unknown>;
    const proof = data.proof as Record<string, unknown> | undefined;

    if (proof?.server_secret) {
      const clientVerification = verifyBetProof({
        server_seed: proof.server_secret as string,
        server_seed_hash: proof.server_seed_hash as string,
        client_seed: proof.client_seed as string,
        nonce: proof.nonce as number,
        roll: data.roll as number,
      });
      (data as Record<string, unknown>).client_verification = clientVerification;
    }

    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "rollhub_coinflip",
  "Place a provably fair coinflip bet on Agent Casino. Pick heads or tails, cryptographically verified. 99% RTP, 70+ blockchain networks.",
  {
    api_key: z.string().optional().describe("API key (uses ROLLHUB_API_KEY env if omitted)"),
    side: z.enum(["heads", "tails"]).describe("Pick heads or tails"),
    amount: z.number().positive().describe("Bet amount in USD"),
  },
  async ({ api_key, side, amount }) => {
    const client_seed = crypto.randomBytes(16).toString("hex");
    const data = (await api("/coinflip/bet", {
      method: "POST",
      apiKey: resolveKey(api_key),
      body: { side, amount, client_seed },
    })) as Record<string, unknown>;

    // Auto-verify if proof contains server_seed
    const proof = data.proof as Record<string, unknown> | undefined;
    if (proof?.server_seed) {
      const verification = verifyBetProof({
        server_seed: proof.server_seed as string,
        server_seed_hash: proof.server_seed_hash as string,
        client_seed: (proof.client_seed as string) || client_seed,
        nonce: proof.nonce as number,
        roll: data.roll as number,
      });
      (data as Record<string, unknown>).verification = verification;
    }

    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "rollhub_coinflip_verify",
  "Verify a coinflip bet was provably fair using zero-trust cryptographic proof.",
  {
    bet_id: z.number().describe("Coinflip bet ID to verify"),
    api_key: z.string().optional().describe("API key (uses ROLLHUB_API_KEY env if omitted)"),
  },
  async ({ bet_id, api_key }) => {
    const data = (await api(`/coinflip/verify/${bet_id}`, { apiKey: resolveKey(api_key) })) as Record<string, unknown>;
    const proof = data.proof as Record<string, unknown> | undefined;

    if (proof?.server_secret) {
      const clientVerification = verifyBetProof({
        server_seed: proof.server_secret as string,
        server_seed_hash: proof.server_seed_hash as string,
        client_seed: proof.client_seed as string,
        nonce: proof.nonce as number,
        roll: data.roll as number,
      });
      (data as Record<string, unknown>).client_verification = clientVerification;
    }

    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "rollhub_games",
  "List available games on Agent Casino — dice, coinflip, and more.",
  {
    api_key: z.string().optional().describe("API key (uses ROLLHUB_API_KEY env if omitted)"),
  },
  async ({ api_key }) => {
    const data = await api("/games", { apiKey: resolveKey(api_key) });
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
