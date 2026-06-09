// ============ MCP JSON-RPC Protocol Handler ============
import { createInterface } from "node:readline";
import { API_KEY } from "./config.js";
import { TOOLS, TOOL_HANDLERS } from "./tools.js";

// ===== JSON-RPC Response Builder =====
function makeResponse(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function makeError(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

// ===== Request Router =====
async function handleRequest(request) {
  const { id, method, params } = request;

  try {
    switch (method) {
      case "initialize":
        return makeResponse(id, {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: {
            name: "Curseforge MCP",
            version: "1.0.0",
          },
        });

      case "notifications/initialized":
        // No response needed
        return null;

      case "tools/list":
        return makeResponse(id, { tools: TOOLS });

      case "tools/call": {
        const { name, arguments: args } = params;
        const handler = TOOL_HANDLERS[name];
        if (!handler) {
          return makeError(id, -32601, `Unknown tool: ${name}`);
        }
        const result = await handler(args ?? {});
        return makeResponse(id, {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        });
      }

      case "ping":
        return makeResponse(id, {});

      default:
        return makeError(id, -32601, `Unknown method: ${method}`);
    }
  } catch (e) {
    return makeError(id, -32603, `Tool execution error: ${e.message}`);
  }
}

// ===== Start Server =====
export function startServer() {
  if (!API_KEY) {
    console.error(
      "[curseforge-mcp] Error: CURSEFORGE_API_KEY environment variable is not set."
    );
    console.error(
      '[curseforge-mcp] Set it via: set CURSEFORGE_API_KEY=your-api-key'
    );
    process.exit(1);
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on("line", async (line) => {
    try {
      const request = JSON.parse(line);
      const response = await handleRequest(request);
      if (response) {
        process.stdout.write(JSON.stringify(response) + "\n");
      }
    } catch (e) {
      const errorResponse = {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32700,
          message: `Parse error: ${e.message}`,
        },
      };
      process.stdout.write(JSON.stringify(errorResponse) + "\n");
    }
  });

  console.error("[curseforge-mcp] Server started, waiting for connections...");
}
