import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const LEVELS = new Set(["off", "minimal", "low", "medium", "high", "xhigh", "max"]);
export const PROVIDER = "model-aliases";

export function parseAliases(text) {
  const config = JSON.parse(text);
  if (!config || !Array.isArray(config.aliases)) {
    throw new Error("model-aliases.json: expected an aliases array");
  }
  const ids = new Set();
  for (const alias of config.aliases) {
    if (!alias || typeof alias.id !== "string" || !/^[a-zA-Z0-9_-]+$/.test(alias.id)) {
      throw new Error("model-aliases.json: each id must contain only letters, digits, _ or -");
    }
    if (ids.has(alias.id.toLowerCase())) throw new Error(`Duplicate alias: ${alias.id}`);
    ids.add(alias.id.toLowerCase());
    for (const key of ["provider", "model"]) {
      if (typeof alias[key] !== "string" || !alias[key].trim()) {
        throw new Error(`${alias.id}: missing ${key}`);
      }
    }
    if (alias.provider === PROVIDER) throw new Error(`${alias.id}: target must be a physical model`);
    if (!LEVELS.has(alias.thinking)) throw new Error(`${alias.id}: invalid thinking level`);
    if (alias.name !== undefined && (typeof alias.name !== "string" || !alias.name.trim())) {
      throw new Error(`${alias.id}: name must be a nonempty string`);
    }
  }
  return config.aliases;
}

export function registerAliases(pi, aliases) {
  for (const alias of aliases) {
    pi.registerVirtualModel({
      provider: PROVIDER,
      id: alias.id,
      name: alias.name ?? alias.id,
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
