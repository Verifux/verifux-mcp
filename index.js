#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────
//  Verifux snapshot MCP server (hosted, zero-dependency).
//
//  A thin Model Context Protocol server that lets any MCP client (Claude
//  Desktop, Cursor, etc.) run a free Verifux snapshot on a URL - UX,
//  conversion and AI-agent-readiness - by calling the hosted API. No local
//  browser, no Playwright, no API key: it proxies to api.verifux.app, where
//  the snapshot is email-optional, so install is just `npx`.
//
//  This repo is the client shim only. The audit engine behind api.verifux.app
//  is not open source.
//
//  Transport: newline-delimited JSON-RPC 2.0 over stdin/stdout, matching the
//  MCP stdio convention our other server already uses. Node 20+ (global fetch).
// ─────────────────────────────────────────────────────────────────────
'use strict';

const API_BASE = (process.env.VERIFUX_API_URL || 'https://api.verifux.app').replace(/\/+$/, '');
// Read the version from package.json so the handshake can never drift from the
// published package again: it reported 1.0.0 while npm was on 1.0.2, and that
// mismatch is visible in every directory listing.
const SERVER_INFO = { name: 'verifux-snapshot', version: require('./package.json').version };
const PROTOCOL_VERSION = '2024-11-05';

const TOOLS = [
  {
    name: 'run_snapshot',
    description:
      'Run a free Verifux snapshot on a URL: a fast, deterministic read of UX, conversion and AI-agent readiness. Returns a band (Strong/Mixed/Weak/Poor), a pass rate over a named set of automated checks, the top findings, and whether the page declares an AI-agent surface. No score out of 100 (that is the full paid audit). No sign-up or API key required.',
    inputSchema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'The page URL to audit (any publicly reachable URL).' } },
      required: ['url'],
    },
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const result = (id, res) => ({ jsonrpc: '2.0', id, result: res });
const errorResponse = (id, code, message) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
const serialise = (obj) => JSON.stringify(obj) + '\n';

async function runSnapshot(url) {
  if (typeof url !== 'string' || !url.trim()) throw new Error('A "url" argument is required.');
  const start = await fetch(`${API_BASE}/api/snapshot`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: url.trim() }),
  });
  const startJson = await start.json().catch(() => ({}));
  if (!start.ok || !startJson.jobId) {
    throw new Error(`Could not start snapshot (HTTP ${start.status}): ${startJson.message || 'no jobId returned'}`);
  }
  const jobId = startJson.jobId;
  const deadline = Date.now() + 150000;
  while (Date.now() < deadline) {
    await sleep(2500);
    let j = {};
    try { j = await (await fetch(`${API_BASE}/api/snapshot/${jobId}/status`)).json(); } catch { continue; }
    if (j.status === 'error') throw new Error(`Snapshot could not complete: ${j.message || j.code || 'unknown error'}`);
    if (j.status === 'done') return renderSnapshot(j.snapshot);
  }
  throw new Error('Snapshot timed out.');
}

// Prefer the API's clean boolean; fall back to reading the agent_surface array
// of rows (an earlier version read .declared on the array and always printed
// "none detected"). Declared when a tool/mcp.json/agents.md/WebMCP row is > 0.
function agentSurfaceDeclared(snap) {
  if (typeof snap.agent_surface_declared === 'boolean') return snap.agent_surface_declared;
  const as = snap.agent_surface;
  if (Array.isArray(as)) {
    return as.some((r) => r && ['agent_tools', 'agent_mcp_json', 'agent_agents_md', 'agent_webmcp'].includes(r.id) && (r.value || 0) > 0);
  }
  return !!(as && (as.has_surface || as.declared || as.found));
}

function renderSnapshot(snap) {
  const mc = (snap && snap.machine_check) || {};
  const band = mc.band || 'unknown';
  const lines = [];
  lines.push(`Verifux snapshot for ${snap.hostname || snap.url || 'the page'}`);
  lines.push(`Band: ${band} - ${mc.checks_passed ?? 0} of ${mc.checks_run ?? 0} automated checks passed`);
  lines.push(`Findings: ${snap.critical_count ?? 0} critical, ${snap.major_count ?? 0} major, ${snap.minor_count ?? 0} minor`);
  const findings = Array.isArray(snap.findings) ? snap.findings.slice(0, 5) : [];
  if (findings.length) {
    lines.push('');
    lines.push('Top findings:');
    for (const f of findings) {
      const sev = (f.severity || '').toString().toUpperCase() || '-';
      lines.push(`  [${sev}] ${(f.headline || f.detail || '').toString()}`);
    }
  }
  const as = snap.agent_surface;
  if (as) {
    lines.push('');
    lines.push(`AI agent surface: ${agentSurfaceDeclared(snap) ? 'declared' : 'none detected'}`);
  }
  lines.push('');
  lines.push('This is the free snapshot. Run the full 54-checkpoint audit (UX, behaviour and AI-readiness) at https://verifux.app');
  return lines.join('\n');
}

async function dispatch(msg) {
  if (!msg || typeof msg !== 'object') return errorResponse(null, -32600, 'Invalid Request');
  const { id, method, params } = msg;
  if (method === 'initialize') return result(id, { protocolVersion: PROTOCOL_VERSION, capabilities: { tools: {} }, serverInfo: SERVER_INFO });
  if (method === 'notifications/initialized' || method === 'notifications/cancelled') return null;
  if (method === 'ping') return result(id, {});
  if (method === 'tools/list') return result(id, { tools: TOOLS });
  if (method === 'tools/call') {
    const name = params && params.name;
    const args = (params && params.arguments) || {};
    if (name !== 'run_snapshot') return errorResponse(id, -32602, `Unknown tool: ${name}`);
    try {
      const text = await runSnapshot(args.url);
      return result(id, { content: [{ type: 'text', text }], isError: false });
    } catch (e) {
      return result(id, { content: [{ type: 'text', text: `run_snapshot failed: ${(e && e.message) || e}` }], isError: true });
    }
  }
  if (id === undefined || id === null) return null; // notification
  return errorResponse(id, -32601, `Method not found: ${method}`);
}

function main() {
  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      let msg;
      try { msg = JSON.parse(line); } catch { process.stdout.write(serialise(errorResponse(null, -32700, 'Parse error'))); continue; }
      dispatch(msg).then((res) => { if (res) process.stdout.write(serialise(res)); })
        .catch((e) => process.stdout.write(serialise(errorResponse(msg && msg.id, -32603, `Internal error: ${(e && e.message) || e}`))));
    }
  });
  process.stderr.write(`[verifux-snapshot] ${SERVER_INFO.name} ${SERVER_INFO.version} ready on stdio (API: ${API_BASE})\n`);
}

// Exported for tests; runs as a server only when invoked directly.
module.exports = { dispatch, runSnapshot, renderSnapshot, TOOLS, SERVER_INFO, serialise };
if (require.main === module) main();
