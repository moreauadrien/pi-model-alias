import { readFileSync } from "node:fs";

const LEVELS = new Set(["off", "minimal", "low", "medium", "high", "xhigh", "max"]);
export const PROVIDER = "model-aliases";

export function parseAliases(text) {
  const config = JSON.parse(text);
  if (!config || !Array.isArray(config.aliases)) {
    throw new Error("aliases.json: expected an aliases array");
  }
  const ids = new Set();
  for (const alias of config.aliases) {
    if (!alias || typeof alias.id !== "string" || !/^[a-zA-Z0-9_-]+$/.test(alias.id)) {
      throw new Error("aliases.json: each id must contain only letters, digits, _ or -");
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

export default function (pi) {
  const aliases = parseAliases(readFileSync(new URL("./aliases.json", import.meta.url), "utf8"));
  registerAliases(pi, aliases);
}
