// ============ MCP Tool Definitions & Handlers ============
import { z } from "zod";
import { MC_GAME_ID } from "./config.js";
import { apiRequest, getData, downloadFile } from "./http-client.js";

// ===== Tool Schemas & Registry =====
export const TOOLS = [
  {
    name: "search_mods",
    description:
      "Search CurseForge mods by keyword, game version, mod loader type, category, sort field, and pagination.",
    schema: {
      searchFilter: z.string().optional().describe("Search keyword, e.g. 'jei', 'optifine'"),
      gameId: z.coerce.number().int().optional().default(MC_GAME_ID).describe("Game ID. Minecraft defaults to 432"),
      classId: z.coerce.number().int().optional().describe("Class ID (optional)"),
      categoryId: z.coerce.number().int().optional().describe("Category ID (optional)"),
      gameVersion: z.string().optional().describe("Game version filter, e.g. '1.20.1', '1.21.1'"),
      modLoaderType: z.coerce.number().int().min(0).max(6).optional().describe("Mod loader type. 0=Any, 1=Forge, 2=Cauldron, 3=LiteLoader, 4=Fabric, 5=Quilt, 6=NeoForge"),
      sortField: z.coerce.number().int().min(1).max(5).optional().describe("Sort field. 1=Popularity, 2=Last Updated, 3=Name, 4=Author, 5=Total Downloads"),
      sortOrder: z.enum(["asc", "desc"]).optional().default("desc").describe("Sort order"),
      pageSize: z.coerce.number().int().min(1).max(100).optional().describe("Results per page (default 50)"),
      index: z.coerce.number().int().min(0).optional().describe("Pagination offset (0-based)"),
    },
  },

  {
    name: "get_mod",
    description: "Get detailed info for a single mod: description, authors, download count, categories, etc.",
    schema: {
      modId: z.coerce.number().int().describe("Mod ID (usually >= 30000)"),
    },
  },

  {
    name: "get_mods",
    description: "Batch-fetch multiple mods at once. Up to 50 mod IDs per request.",
    schema: {
      modIds: z.array(z.coerce.number().int()).min(1).max(50).describe("List of mod IDs"),
    },
  },

  {
    name: "get_mod_files",
    description:
      "Get a mod's file list. Filter by game version and mod loader type, with pagination.",
    schema: {
      modId: z.coerce.number().int().describe("Mod ID"),
      gameVersion: z.string().optional().describe("Game version filter, e.g. '1.20.1'"),
      modLoaderType: z.coerce.number().int().min(0).max(6).optional().describe("Mod loader type filter. 0=Any, 1=Forge, 2=Cauldron, 3=LiteLoader, 4=Fabric, 5=Quilt, 6=NeoForge"),
      pageSize: z.coerce.number().int().min(1).max(100).optional().describe("Results per page"),
      index: z.coerce.number().int().min(0).optional().describe("Pagination offset (0-based)"),
    },
  },

  {
    name: "get_mod_file",
    description:
      "Get details of a single file: name, download URL, size, dependencies, release date.",
    schema: {
      modId: z.coerce.number().int().describe("Mod ID"),
      fileId: z.coerce.number().int().describe("File ID"),
    },
  },

  {
    name: "get_mod_file_download_url",
    description: "Get the CDN download URL for a mod file. The returned link requires an API key to download via ForgeCDN.",
    schema: {
      modId: z.coerce.number().int().describe("Mod ID"),
      fileId: z.coerce.number().int().describe("File ID"),
    },
  },

  {
    name: "get_categories",
    description: "Get all category lists for a game (e.g. Minecraft mods, resource packs, maps).",
    schema: {
      gameId: z.coerce.number().int().optional().default(MC_GAME_ID).describe("Game ID. Minecraft defaults to 432"),
    },
  },

  {
    name: "get_minecraft_versions",
    description: "Get all Minecraft versions available on CurseForge.",
    schema: {},
  },

  {
    name: "get_featured_mods",
    description: "Get the featured / popular mods list on CurseForge.",
    schema: {
      gameId: z.coerce.number().int().optional().default(MC_GAME_ID).describe("Game ID. Minecraft defaults to 432"),
    },
  },

  {
    name: "get_mod_description",
    description: "Get the full HTML description text of a mod.",
    schema: {
      modId: z.coerce.number().int().describe("Mod ID"),
    },
  },
  {
    name: "download_mod_file",
    description: "Download a mod file from a given URL to a local directory. Requires API key authentication for ForgeCDN links.",
    schema: {
      downloadUrl: z.string().url().describe("The download URL of the mod file (from get_mod_file_download_url or get_mod_file)"),
      downloadDir: z.string().describe("Local directory path to save the downloaded file"),
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

  async download_mod_file(args) {
    const result = await downloadFile(args.downloadUrl, args.downloadDir);
    return {
      success: true,
      filePath: result.filePath,
      fileName: result.fileName,
      fileSize: result.fileSize,
      message: `Downloaded "${result.fileName}" (${(result.fileSize / 1024 / 1024).toFixed(2)} MB) to ${result.filePath}`,
    };
  },
};

