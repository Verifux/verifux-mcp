<div align="center">

# Verifux · MCP server

### Let your coding agent check whether an AI agent can use a site

One tool, `run_snapshot`. Point it at any URL and it reports what an agent actually finds
when it arrives: a band, a pass rate, the top findings, and whether the page declares an
agent surface at all.

**Zero dependencies. No sign-up. No API key.**

[![npm](https://img.shields.io/npm/v/@verifux/mcp?color=FF0033&label=npm&logo=npm&logoColor=white)](https://www.npmjs.com/package/@verifux/mcp)
[![downloads](https://img.shields.io/npm/dm/@verifux/mcp?color=FF0033&label=downloads)](https://www.npmjs.com/package/@verifux/mcp)
[![registry](https://img.shields.io/badge/MCP_registry-listed-7C3AED)](https://registry.modelcontextprotocol.io/?q=verifux)
[![node](https://img.shields.io/node/v/@verifux/mcp?color=111827&label=node)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/@verifux/mcp?color=111827)](./LICENSE)
[![dependencies](https://img.shields.io/badge/dependencies-0-111827)](./package.json)
[![Snapshot MCP server](https://mcprush.com/badge/verifux-snapshot-mcp/card.svg)](https://mcprush.com/to/verifux-snapshot-mcp?ref=badge)

</div>

---

## Add it

**Claude Code**

```bash
claude mcp add verifux -- npx -y @verifux/mcp
```

**Any MCP client** (Claude Desktop, Cursor, and others)

```json
{
  "mcpServers": {
    "verifux": {
      "command": "npx",
      "args": ["-y", "@verifux/mcp"]
    }
  }
}
```

Then just ask: *"run a Verifux snapshot on example.com"*.

---

## What comes back

A real run, pasted verbatim:

```text
Verifux snapshot for example.com
Band: Mixed - 13 of 16 automated checks passed
Findings: 0 critical, 2 major, 1 minor

Top findings:
  [MAJOR] No Organization or FAQPage structured data for AI answer engines
  [MAJOR] No H1 heading on the page
  [MINOR] No meta description for search engines or AI summaries to quote

AI agent surface: none detected
```

That last line is the one almost nobody checks. **`none detected`** means nothing an agent looks
for was found: no declared tools, no `/.well-known/mcp.json`, no `/agents.md`.

> We got exactly that on our own site. The file existed. We were serving it at the wrong path, and
> nothing anywhere warned us. One path, and the whole surface was invisible.

Agent readiness is the only part of a site that can break without anyone noticing. No error, no
alert, nothing in a dashboard. Just traffic that never arrives.

---

## The tool

| | |
| --- | --- |
| **Name** | `run_snapshot` |
| **Takes** | `url`, any publicly reachable URL. Nothing else |
| **Returns** | Band (Strong / Mixed / Weak / Poor), pass rate over named automated checks, top findings, and whether an agent surface is declared |
| **Env** | `VERIFUX_API_URL` to point at a different backend. Defaults to `https://api.verifux.app` |

It deliberately has **no score out of 100**. That belongs to the full 54-checkpoint audit, and two
different numbers out of 100 would contradict each other.

---

## Prefer a terminal?

The same check as a CLI, with a CI mode that fails the build when the band drops:

```bash
npx @verifux/cli your-site.com --ci --min-band mixed
```

→ **[Verifux/verifux-cli](https://github.com/Verifux/verifux-cli)**

---

<div align="center">

**This is the free snapshot:** a fast, deterministic read. The full audit lives at
**[verifux.app](https://verifux.app)**.

This repo is the client shim. The audit engine behind `api.verifux.app` is not open source.

<sub>MIT · built by <a href="https://verifux.app">Verifux</a></sub>

</div>
