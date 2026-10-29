# Verifux snapshot MCP server

Run a free [Verifux](https://verifux.app) snapshot from any MCP client (Claude Desktop,
Cursor, and others). One tool, `run_snapshot`, audits a URL for UX, conversion and
**AI-agent readiness** and returns a band, a check pass-rate, the top findings, and whether
the page declares an agent surface.

Zero dependencies, no local browser, no API key. It calls the hosted Verifux API, where the
snapshot is email-optional — so install is just `npx`.

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

Then ask your agent to "run a Verifux snapshot on https://example.com".

## Tool

`run_snapshot({ url })` → text report:

```
Verifux snapshot for example.com
Band: Mixed - 12 of 16 automated checks passed
Findings: 0 critical, 3 major, 2 minor

Top findings:
  [MAJOR] No H1 heading on the page
  ...

AI agent surface: none detected
```

## Notes

- This is the **free snapshot** — a fast, deterministic read, not the full 54-checkpoint
  audit. It has no score out of 100 on purpose. For the full UX / behavioural / AI-readiness
  audit with a report and PDF, go to [verifux.app](https://verifux.app).
- Point at a different backend with `VERIFUX_API_URL` (defaults to `https://api.verifux.app`).
- Source for the hosted engine is not public. This repo is the MCP client shim only.
