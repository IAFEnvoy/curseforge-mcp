// ============ MCP Server (powered by @modelcontextprotocol/sdk) ============
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { API_KEY } from "./config.js";
import { TOOLS, TOOL_HANDLERS } from "./tools.js";

// ===== Start Server =====
export async function startServer() {
  if (!API_KEY) {
    console.error(
      "[curseforge-mcp] Error: CURSEFORGE_API_KEY environment variable is not set."
    );
    console.error(
      '[curseforge-mcp] Set it via: set CURSEFORGE_API_KEY=your-api-key'
    );
    process.exit(1);
  }

  const server = new McpServer({
    name: "Curseforge MCP",
    version: "1.0.0",
  });

  // Register all tools — schema is passed as raw Zod shape (not z.object())
  for (const tool of TOOLS) {
    server.tool(
      tool.name,
      tool.description,
      tool.schema,
      async (args) => {
        const handler = TOOL_HANDLERS[tool.name];
        const result = await handler(args ?? {});
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("[curseforge-mcp] Server started, waiting for connections...");
}
