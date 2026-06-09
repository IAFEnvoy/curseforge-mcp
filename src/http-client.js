// ============ HTTP Request Client ============
import https from "node:https";
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
