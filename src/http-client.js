// ============ HTTP Request Client ============
import https from "node:https";
import { createWriteStream } from "node:fs";
import { basename, join } from "node:path";
import { API_BASE, API_KEY } from "./config.js";

/**
 * Make a CurseForge API request
 * @param {"GET"|"POST"} method
 * @param {string} path - URL path, e.g. "/v1/mods/search?gameId=432"
 * @param {object|null} body - POST body, pass null for GET
 * @returns {Promise<object>} Full JSON response from API
 */
export function apiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE,
      path: path,
      method: method,
      headers: {
        "x-api-key": API_KEY,
        Accept: "application/json",
      },
    };

    if (body) {
      options.headers["Content-Type"] = "application/json";
    }

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(
              new Error(
                `CurseForge API error (${res.statusCode}): ${JSON.stringify(json)}`
              )
            );
          } else {
            resolve(json);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data.substring(0, 500)}`));
        }
      });
    });

    req.on("error", (e) => reject(new Error(`Network request failed: ${e.message}`)));

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Unwrap the `data` field from a CurseForge API response
 * @param {Promise<object>} response - apiRequest return value
 * @returns {Promise<object>} Unwrapped data
 */
export async function getData(response) {
  const json = await response;
  return json.data ?? json;
}

/**
 * Download a file from a URL to a local directory.
 * Supports redirects and uses API key authentication (required by ForgeCDN).
 * @param {string} url - The download URL
 * @param {string} dir - Local directory to save the file
 * @returns {Promise<object>} { filePath, fileName, fileSize }
 */
export function downloadFile(url, dir) {
  return new Promise((resolve, reject) => {
    const requestUrl = new URL(url);
    const isForgeCdn = requestUrl.hostname.endsWith("forgecdn.net");

    const options = {
      hostname: requestUrl.hostname,
      path: requestUrl.pathname + requestUrl.search,
      method: "GET",
      headers: {
        Accept: "*/*",
      },
    };

    // ForgeCDN now requires API key
    if (isForgeCdn) {
      options.headers["x-api-key"] = API_KEY;
    }

    const req = https.request(options, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(res.headers.location, dir).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode >= 400) {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => reject(new Error(`Download failed (${res.statusCode}): ${body.substring(0, 200)}`)));
        return;
      }

      // Determine filename from Content-Disposition or URL
      let filename = basename(requestUrl.pathname);
      const disposition = res.headers["content-disposition"];
      if (disposition) {
        const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/);
        if (match) filename = decodeURIComponent(match[1]);
      }

      const filePath = join(dir, filename);
      const totalSize = parseInt(res.headers["content-length"], 10) || 0;
      let downloaded = 0;

      const fileStream = createWriteStream(filePath);
      res.on("data", (chunk) => {
        downloaded += chunk.length;
        fileStream.write(chunk);
      });

      res.on("end", () => {
        fileStream.end();
        resolve({ filePath, fileName: filename, fileSize: downloaded });
      });

      res.on("error", (e) => {
        fileStream.close();
        reject(new Error(`Download stream error: ${e.message}`));
      });

      fileStream.on("error", (e) => {
        reject(new Error(`File write error: ${e.message}`));
      });
    });

    req.on("error", (e) => reject(new Error(`Download request failed: ${e.message}`)));
    req.end();
  });
}
