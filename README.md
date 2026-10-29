# Verifux snapshot MCP server

[![npm](https://img.shields.io/npm/v/@verifux/mcp?color=FF0033&label=%40verifux%2Fmcp)](https://www.npmjs.com/package/@verifux/mcp)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

**Can an AI agent actually use your website?** This MCP server gives Claude, Cursor and
any other MCP client one tool, `run_snapshot`, that audits any URL for UX, conversion and
**AI-agent readiness** in a few seconds, and tells you whether the page even declares a
surface an agent can act on.

Zero dependencies, no local browser, no API key, no sign-up. It calls the hosted
[Verifux](https://verifux.app) API, so installing is just `npx`.

## Install

Add it to your MCP client config:

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

Then ask your agent: "run a Verifux snapshot on https://example.com".

## What you get

`run_snapshot({ url })` returns a plain-text report:

```
Verifux snapshot for your-store.com
Band: Mixed - 13 of 17 automated checks passed
0 critical, 2 major, 1 minor

  [MAJOR] Largest Contentful Paint at 3.1s, past the 2.5s threshold
  [MINOR] Cumulative Layout Shift of 0.15, content moves under the reader

AI agent surface: none detected
```

That last line is the one most tools miss. As shopping and research agents become real
traffic, a site that declares nothing an agent can call is invisible to them, and never
sees why. Verifux is built to measure exactly that, alongside the human-facing UX.

## Why it exists

Lighthouse and accessibility scanners tell you about code and compliance. Verifux asks a
different question: can a person, and now an AI agent, actually get the job done on this
page? The snapshot is the fast, free read. It is deterministic, so the same page scores the
same way twice, and it carries no score out of 100 on purpose, because that number belongs
to the full audit.

## The full audit

This tool is the **free snapshot**. The full 54-checkpoint audit, across human experience
(MX), behavioural design (BX) and AI-agent readiness (AIX), with a written report and a PDF,
lives at **[verifux.app](https://verifux.app)**. No account, no subscription.

## Notes

- Point at a different backend with `VERIFUX_API_URL` (defaults to `https://api.verifux.app`).
- The snapshot is email-optional through this client, so there is nothing to sign up for.
- The hosted engine is closed source. This repository is the MCP client shim only: a small,
  zero-dependency wrapper that calls the public API.

## Links

- Run any site in your browser: [verifux.app](https://verifux.app)
- CLI version: [`@verifux/cli`](https://www.npmjs.com/package/@verifux/cli) (`npx @verifux/cli your-site.com`)
- Machine-readable surface: [llms.txt](https://verifux.app/llms.txt), [mcp.json](https://verifux.app/.well-known/mcp.json)

MIT licensed. Built by [Designerama](https://verifux.app).
