import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const LEVELS = new Set(["off", "minimal", "low", "medium", "high", "xhigh", "max"]);
export const PROVIDER = "model-aliases";

export function parseAliases(text) {
  const config = JSON.parse(text);
  if (!config || Array.isArray(config) || typeof config !== "object") {
    throw new Error("model-aliases.json: expected an object of alias IDs to provider/model:level strings");
  }
  const ids = new Set();
  return Object.entries(config).map(([id, target]) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      throw new Error(`Invalid alias ID: ${id}`);
    }
    if (ids.has(id.toLowerCase())) throw new Error(`Duplicate alias: ${id}`);
    ids.add(id.toLowerCase());
    if (typeof target !== "string") throw new Error(`${id}: expected provider/model:level`);
    const match = /^([^/]+)\/(.+):([^:]+)$/.exec(target);
    if (!match) throw new Error(`${id}: expected provider/model:level`);
    const [, provider, model, thinking] = match;
    if (provider === PROVIDER) throw new Error(`${id}: target must be a physical model`);
    if (!LEVELS.has(thinking)) throw new Error(`${id}: invalid thinking level`);
    return { id, provider, model, thinking };
  });
}

export function registerAliases(pi, aliases) {
  for (const alias of aliases) {
    pi.registerVirtualModel({
      provider: PROVIDER,
      id: alias.id,
      name: alias.id,
      thinkingLevels: [alias.thinking],
      route(_request, ctx) {
        const model = ctx.modelRegistry.find(alias.provider, alias.model);
        if (!model) throw new Error(`${alias.id}: model ${alias.provider}/${alias.model} not found`);
        return { model, thinkingLevel: alias.thinking };
      },
    });
  }
}

export function loadAliases(path) {
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  return parseAliases(text);
}

export default function (pi) {
  const directory = process.env.PI_CODING_AGENT_DIR || join(homedir(), ".pi", "agent");
  const agentDir = directory === "~" ? homedir()
    : directory.startsWith("~/") ? join(homedir(), directory.slice(2)) : directory;
  registerAliases(pi, loadAliases(join(agentDir, "model-aliases.json")));
}
