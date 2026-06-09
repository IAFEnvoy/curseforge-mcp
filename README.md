# curseforge-mcp

[![npm version](https://img.shields.io/npm/v/curseforge-mcp)](https://www.npmjs.com/package/curseforge-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**MCP (Model Context Protocol) server for CurseForge** — search mods, browse files, get download URLs, and more. Powered by the official `@modelcontextprotocol/sdk`.

Let your AI assistant interact with the CurseForge API directly: find Minecraft mods, check versions, inspect files, and retrieve download links — all through natural language.

---

## Features

- 🔍 **Search mods** by keyword, game version, mod loader (Forge / Fabric / Quilt), category, and more
- 📦 **Get mod details** — summary, authors, download count, categories, logo
- 📂 **Browse mod files** — list all files of a mod, filtered by game version & loader
- 📄 **Inspect file details** — file name, size, release date, dependencies, download URL
- ⬇️ **Get download URLs** — CDN links that work without an API key
- 🏷️ **Browse categories** — discover all category/subcategory IDs
- 🎮 **List Minecraft versions** — all versions available on CurseForge
- ⭐ **Featured mods** — curated/popular mod list
- 📝 **Mod descriptions** — full HTML description text

---

## Installation

```bash
npm install -g curseforge-mcp
```

## Prerequisites

You need a **CurseForge API Key**. Get it from the CurseForge for Studios console:

> https://console.curseforge.com/#/api-keys

Once approved, set it as an environment variable:

```bash
# Windows (PowerShell)
$env:CURSEFORGE_API_KEY = "your-api-key"

# Windows (CMD)
set CURSEFORGE_API_KEY=your-api-key

# Linux / macOS
export CURSEFORGE_API_KEY=your-api-key
```

---

## Quick Start

Run directly:

```bash
node index.js
```

The server communicates via **JSON-RPC 2.0 over stdio** — it's designed to be used by MCP hosts (Claude Desktop, VS Code, Cursor, etc.).

---

## Tools Reference

| Tool | Description |
|------|-------------|
| `search_mods` | Search CurseForge mods by keyword, game version, loader type, sort field, etc. |
| `get_mod` | Get detailed info for a single mod by its ID |
| `get_mods` | Batch fetch up to 50 mods at once |
| `get_mod_files` | List all files of a mod, with optional version/loader filters & pagination |
| `get_mod_file` | Get details of a single file (name, size, download URL, dependencies) |
| `get_mod_file_download_url` | Get the direct CDN download URL (no API key needed to download) |
| `get_categories` | List all categories for a game (e.g. Minecraft mods, resource packs, maps) |
| `get_minecraft_versions` | List all Minecraft versions available on CurseForge |
| `get_featured_mods` | Get the featured/curated mods list |
| `get_mod_description` | Get the full HTML description of a mod |

### Parameter Reference

**ModLoaderType**

| Value | Loader | Notes |
|-------|--------|-------|
| `0` | Any | No filter |
| `1` | Forge | Classic loader with a massive mod ecosystem |
| `2` | Cauldron | Discontinued server-side loader (Forge-compatible) |
| `3` | LiteLoader | Early lightweight loader, no longer maintained |
| `4` | Fabric | Lightweight, modular loader known for fast updates |
| `5` | Quilt | A Fabric fork with more modern APIs |
| `6` | NeoForge | Forge's successor, active in MC 1.21+ ecosystem |

**SortField** (for `search_mods`)

| Value | Field |
|-------|-------|
| `1` | Popularity |
| `2` | Last Updated |
| `3` | Name |
| `4` | Author |
| `5` | Total Downloads |

---

## VS Code Integration

Add this to your `.vscode/mcp.json` (installed globally via npm):

```json
{
  "servers": {
    "curseforge": {
      "type": "stdio",
      "command": "npx",
      "args": ["curseforge-mcp"],
      "env": {
        "CURSEFORGE_API_KEY": "${env:CURSEFORGE_API_KEY}"
      }
    }
  }
}
```

Or for local development:

```json
{
  "servers": {
    "curseforge": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/index.js"],
      "env": {
        "CURSEFORGE_API_KEY": "${env:CURSEFORGE_API_KEY}"
      }
    }
  }
}
```

---

## Claude Desktop Integration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "curseforge": {
      "command": "node",
      "args": ["/absolute/path/to/curseforge-mcp/index.js"],
      "env": {
        "CURSEFORGE_API_KEY": "your-api-key"
      }
    }
  }
}
```

---

## Project Structure

```
curseforge-mcp/
├── index.js              # Entry point
├── package.json
├── src/
│   ├── config.js         # API base URL, API key, Minecraft game ID
│   ├── http-client.js    # HTTPS request wrapper (pure Node.js, no deps)
│   ├── tools.js          # Tool schemas & handler implementations
│   └── mcp-server.js     # MCP server via @modelcontextprotocol/sdk
```

**Dependencies:** `@modelcontextprotocol/sdk` — the only external dependency. The HTTP client (`src/http-client.js`) uses only Node.js built-in modules.

---

## License

MIT © [IAFEnvoy](https://github.com/IAFEnvoy)
