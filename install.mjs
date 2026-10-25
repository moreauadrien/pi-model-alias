import { copyFileSync, constants, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseAliases } from "./index.js";

export function withAliasScope(settings) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    throw new Error("settings.json must contain an object");
  }
  const scope = settings.enabledModels;
  if (scope !== undefined && (!Array.isArray(scope) || scope.some((x) => typeof x !== "string"))) {
    throw new Error("settings.json: enabledModels must be an array of strings");
  }
  // An absent/empty scope means all models. Keep that behavior instead of restricting it to aliases.
  const patterns = scope?.length ? scope : ["*"];
  return { ...settings, enabledModels: [...new Set([...patterns, "model-aliases/*"])] };
}

export function install(agentDir, { scopedModels = false } = {}) {
  const source = dirname(fileURLToPath(import.meta.url));
  const destination = join(agentDir, "extensions", "model-aliases");
  const settingsPath = join(agentDir, "settings.json");
  const original = scopedModels && existsSync(settingsPath) ? readFileSync(settingsPath, "utf8") : undefined;
  const settings = scopedModels ? withAliasScope(original === undefined ? {} : JSON.parse(original)) : undefined;
  parseAliases(readFileSync(join(source, "aliases.json"), "utf8"));
  if (existsSync(join(destination, "aliases.json"))) {
    parseAliases(readFileSync(join(destination, "aliases.json"), "utf8"));
  }

  mkdirSync(destination, { recursive: true });
  if (resolve(source) !== resolve(destination)) {
    for (const name of ["index.js", "package.json", "README.md"]) {
      copyFileSync(join(source, name), join(destination, name));
    }
    // Reinstalling updates the extension, never the user's alias configuration.
    if (!existsSync(join(destination, "aliases.json"))) {
      copyFileSync(join(source, "aliases.json"), join(destination, "aliases.json"), constants.COPYFILE_EXCL);
    }
  }

  if (scopedModels && (original === undefined || JSON.stringify(settings) !== JSON.stringify(JSON.parse(original)))) {
    if (original !== undefined) {
      const backup = `${settingsPath}.${Date.now()}.bak`;
      copyFileSync(settingsPath, backup, constants.COPYFILE_EXCL);
      console.log(`Settings backup: ${backup}`);
    }
    const temporary = `${settingsPath}.${process.pid}.tmp`;
    writeFileSync(temporary, `${JSON.stringify(settings, null, 2)}\n`, {
      flag: "wx",
      mode: original === undefined ? 0o600 : statSync(settingsPath).mode & 0o777,
    });
    renameSync(temporary, settingsPath);
  }
  console.log(`Extension: ${destination}`);
  console.log(`Configuration: ${join(destination, "aliases.json")}`);
  console.log(scopedModels ? "Alias scope enabled. Restart Pi." : "Scoped models unchanged. Restart Pi to load aliases.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--scoped-models")) {
    throw new Error("Usage: node install.mjs [--scoped-models]");
  }
  install(resolve(process.env.PI_CODING_AGENT_DIR || join(homedir(), ".pi", "agent")), {
    scopedModels: args.includes("--scoped-models"),
  });
}
