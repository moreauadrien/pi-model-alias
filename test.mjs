import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import extension, { parseAliases, registerAliases } from "./index.js";
import { install, withAliasScope } from "./install.mjs";

const config = readFileSync(new URL("./aliases.json", import.meta.url), "utf8");

test("five aliases always route to their configured physical model and thinking", () => {
  const models = [];
  extension({ registerVirtualModel: (model) => models.push(model) });
  assert.equal(models.length, 5);
  const aliases = parseAliases(config);
  for (const [i, model] of models.entries()) {
    const alias = aliases[i];
    assert.equal(model.provider, "model-aliases");
    assert.equal(model.id, alias.id);
    assert.deepEqual(model.thinkingLevels, [alias.thinking]);
    const physical = { provider: alias.provider, id: alias.model };
    const ctx = { modelRegistry: { find: (provider, id) => {
      assert.equal(provider, alias.provider);
      assert.equal(id, alias.model);
      return physical;
    } } };
    for (const reason of ["user", "continuation", "retry", "direct"]) {
      assert.deepEqual(model.route({ reason, thinkingLevel: "off" }, ctx), {
        model: physical, thinkingLevel: alias.thinking,
      });
    }
    assert.throws(() => model.route({}, { modelRegistry: { find: () => undefined } }), /not found/);
  }
});

test("rejects bad JSON, duplicate IDs, invalid fields and recursive targets", () => {
  const alias = parseAliases(config)[0];
  for (const bad of ["{", "null", "{}", '{"aliases":[null]}']) {
    assert.throws(() => parseAliases(bad));
  }
  for (const change of [
    { id: "sol:high" }, { thinking: "maximum" }, { provider: "model-aliases" },
    { model: "" }, { name: 42 },
  ]) {
    assert.throws(() => parseAliases(JSON.stringify({ aliases: [{ ...alias, ...change }] })));
  }
  assert.throws(() => parseAliases(JSON.stringify({ aliases: [alias, alias] })), /Duplicate/);
});

test("scope preserves existing choices; wildcard includes future alias IDs", () => {
  const settings = { theme: "dark", enabledModels: ["anthropic/*:high"] };
  const scoped = withAliasScope(settings);
  assert.deepEqual(scoped.enabledModels, ["anthropic/*:high", "model-aliases/*"]);
  assert.equal(scoped.theme, "dark");
  assert.deepEqual(settings.enabledModels, ["anthropic/*:high"]);
  assert.deepEqual(withAliasScope(scoped), scoped);
  assert.deepEqual(withAliasScope({}).enabledModels, ["*", "model-aliases/*"]);
  assert.deepEqual(withAliasScope({ enabledModels: [] }).enabledModels, ["*", "model-aliases/*"]);
  assert.throws(() => withAliasScope({ enabledModels: "*" }));
  const models = [];
  registerAliases({ registerVirtualModel: (model) => models.push(model) }, [
    { id: "future-alias", provider: "openai-codex", model: "gpt-6-sol", thinking: "high" },
  ]);
  assert.equal(`${models[0].provider}/${models[0].id}`.startsWith("model-aliases/"), true);
});

test("installer preserves settings and user aliases on reinstall; fails safely on malformed settings", () => {
  const dir = mkdtempSync(join(tmpdir(), "pi-model-aliases-"));
  try {
    const settingsPath = join(dir, "settings.json");
    writeFileSync(settingsPath, JSON.stringify({ theme: "dark", enabledModels: ["openai-codex/gpt-6-sol"] }));
    install(dir);
    assert.deepEqual(JSON.parse(readFileSync(settingsPath, "utf8")), {
      theme: "dark", enabledModels: ["openai-codex/gpt-6-sol", "model-aliases/*"],
    });
    const aliasPath = join(dir, "extensions/model-aliases/aliases.json");
    const custom = JSON.stringify({ aliases: [parseAliases(config)[0]] });
    writeFileSync(aliasPath, custom);
    install(dir);
    assert.equal(readFileSync(aliasPath, "utf8"), custom);
    writeFileSync(settingsPath, "{bad");
    assert.throws(() => install(dir));
    assert.equal(readFileSync(settingsPath, "utf8"), "{bad");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
