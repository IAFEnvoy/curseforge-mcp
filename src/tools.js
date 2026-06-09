// ============ MCP Tool Definitions & Handlers ============
import { MC_GAME_ID } from "./config.js";
import { apiRequest, getData } from "./http-client.js";

// ===== Tool Schema Definitions =====
export const TOOLS = [
  {
    name: "search_mods",
    description:
      "Search CurseForge mods by keyword, game version, mod loader type, category, sort field, and pagination.",
    inputSchema: {
      type: "object",
      properties: {
        searchFilter: {
          type: "string",
          description: "Search keyword, e.g. 'jei', 'optifine'",
        },
        gameId: {
          type: "integer",
          description: "Game ID. Minecraft defaults to 432",
          default: MC_GAME_ID,
        },
        classId: {
          type: "integer",
          description: "Class ID (optional)",
        },
        categoryId: {
          type: "integer",
          description: "Category ID (optional)",
        },
        gameVersion: {
          type: "string",
          description: "Game version filter, e.g. '1.20.1', '1.21.1'",
        },
        modLoaderType: {
          type: "integer",
          description:
            "Mod loader type. 0=Any, 1=Forge, 2=Cauldron, 3=LiteLoader, 4=Fabric, 5=Quilt, 6=NeoForge",
          enum: [0, 1, 2, 3, 4, 5, 6],
        },
        sortField: {
          type: "integer",
          description:
            "Sort field. 1=Popularity, 2=Last Updated, 3=Name, 4=Author, 5=Total Downloads",
          enum: [1, 2, 3, 4, 5],
        },
        sortOrder: {
          type: "string",
          description: "Sort order",
          enum: ["asc", "desc"],
          default: "desc",
        },
        pageSize: {
          type: "integer",
          description: "Results per page (default 50)",
          minimum: 1,
          maximum: 100,
        },
        index: {
          type: "integer",
          description: "Pagination offset (0-based)",
          minimum: 0,
        },
      },
      required: [],
    },
  },

  {
    name: "get_mod",
    description: "Get detailed info for a single mod: description, authors, download count, categories, etc.",
    inputSchema: {
      type: "object",
      properties: {
        modId: {
          type: "integer",
          description: "Mod ID (usually >= 30000)",
        },
      },
      required: ["modId"],
    },
  },

  {
    name: "get_mods",
    description: "Batch-fetch multiple mods at once. Up to 50 mod IDs per request.",
    inputSchema: {
      type: "object",
      properties: {
        modIds: {
          type: "array",
          description: "List of mod IDs",
          items: { type: "integer" },
          minItems: 1,
          maxItems: 50,
        },
      },
      required: ["modIds"],
    },
  },

  {
    name: "get_mod_files",
    description:
      "Get a mod's file list. Filter by game version and mod loader type, with pagination.",
    inputSchema: {
      type: "object",
      properties: {
        modId: {
          type: "integer",
          description: "Mod ID",
        },
        gameVersion: {
          type: "string",
          description: "Game version filter, e.g. '1.20.1'",
        },
        modLoaderType: {
          type: "integer",
          description:
            "Mod loader type filter. 0=Any, 1=Forge, 2=Cauldron, 3=LiteLoader, 4=Fabric, 5=Quilt, 6=NeoForge",
          enum: [0, 1, 2, 3, 4, 5, 6],
        },
        pageSize: {
          type: "integer",
          description: "Results per page",
          minimum: 1,
          maximum: 100,
        },
        index: {
          type: "integer",
          description: "Pagination offset (0-based)",
          minimum: 0,
        },
      },
      required: ["modId"],
    },
  },

  {
    name: "get_mod_file",
    description:
      "Get details of a single file: name, download URL, size, dependencies, release date.",
    inputSchema: {
      type: "object",
      properties: {
        modId: {
          type: "integer",
          description: "Mod ID",
        },
        fileId: {
          type: "integer",
          description: "File ID",
        },
      },
      required: ["modId", "fileId"],
    },
  },

  {
    name: "get_mod_file_download_url",
    description: "Get the CDN download URL for a mod file. The returned link does not require an API key to download.",
    inputSchema: {
      type: "object",
      properties: {
        modId: {
          type: "integer",
          description: "Mod ID",
        },
        fileId: {
          type: "integer",
          description: "File ID",
        },
      },
      required: ["modId", "fileId"],
    },
  },

  {
    name: "get_categories",
    description: "Get all category lists for a game (e.g. Minecraft mods, resource packs, maps).",
    inputSchema: {
      type: "object",
      properties: {
        gameId: {
          type: "integer",
          description: "Game ID. Minecraft defaults to 432",
          default: MC_GAME_ID,
        },
      },
      required: [],
    },
  },

  {
    name: "get_minecraft_versions",
    description: "Get all Minecraft versions available on CurseForge.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },

  {
    name: "get_featured_mods",
    description: "Get the featured / popular mods list on CurseForge.",
    inputSchema: {
      type: "object",
      properties: {
        gameId: {
          type: "integer",
          description: "Game ID. Minecraft defaults to 432",
          default: MC_GAME_ID,
        },
      },
      required: [],
    },
  },

  {
    name: "get_mod_description",
    description: "Get the full HTML description text of a mod.",
    inputSchema: {
      type: "object",
      properties: {
        modId: {
          type: "integer",
          description: "Mod ID",
        },
      },
      required: ["modId"],
    },
  },
];

// ===== Tool Handlers =====

/** Build query string, only appending non-null / non-undefined fields */
function buildQuery(params, entries) {
  for (const [key, value] of entries) {
    if (value != null) params.append(key, String(value));
  }
  return params;
}

export const TOOL_HANDLERS = {
  async search_mods(args) {
    const params = buildQuery(new URLSearchParams(), [
      ["searchFilter", args.searchFilter],
      ["gameId", args.gameId ?? MC_GAME_ID],
      ["classId", args.classId],
      ["categoryId", args.categoryId],
      ["gameVersion", args.gameVersion],
      ["modLoaderType", args.modLoaderType],
      ["sortField", args.sortField],
      ["sortOrder", args.sortOrder],
      ["pageSize", args.pageSize],
      ["index", args.index],
    ]);
    return getData(apiRequest("GET", `/v1/mods/search?${params}`));
  },

  async get_mod(args) {
    return getData(apiRequest("GET", `/v1/mods/${args.modId}`));
  },

  async get_mods(args) {
    return getData(
      apiRequest("POST", "/v1/mods", { modIds: args.modIds })
    );
  },

  async get_mod_files(args) {
    const params = buildQuery(new URLSearchParams(), [
      ["gameVersion", args.gameVersion],
      ["modLoaderType", args.modLoaderType],
      ["pageSize", args.pageSize],
      ["index", args.index],
    ]);
    const qs = params.toString();
    return getData(
      apiRequest("GET", `/v1/mods/${args.modId}/files${qs ? "?" + qs : ""}`)
    );
  },

  async get_mod_file(args) {
    return getData(
      apiRequest("GET", `/v1/mods/${args.modId}/files/${args.fileId}`)
    );
  },

  async get_mod_file_download_url(args) {
    return getData(
      apiRequest(
        "GET",
        `/v1/mods/${args.modId}/files/${args.fileId}/download-url`
      )
    );
  },

  async get_categories(args) {
    const gameId = args.gameId ?? MC_GAME_ID;
    return getData(apiRequest("GET", `/v1/categories?gameId=${gameId}`));
  },

  async get_minecraft_versions() {
    return getData(apiRequest("GET", "/v1/minecraft/version"));
  },

  async get_featured_mods(args) {
    const gameId = args.gameId ?? MC_GAME_ID;
    return getData(
      apiRequest("POST", "/v1/mods/featured", { gameId })
    );
  },

  async get_mod_description(args) {
    return getData(
      apiRequest("GET", `/v1/mods/${args.modId}/description`)
    );
  },
};
