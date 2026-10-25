import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { loadAliases, parseAliases, registerAliases } from "./index.js";

const config = readFileSync(new URL("./examples/model-aliases.json", import.meta.url), "utf8");

test("example aliases route to their configured physical model and fixed thinking", () => {
  const models = [];
  const aliases = parseAliases(config);
  registerAliases({ registerVirtualModel: (model) => models.push(model) }, aliases);
  assert.equal(models.length, 5);
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

test("missing config means no aliases; loading never creates or changes files", () => {
  const dir = mkdtempSync(join(tmpdir(), "pi-alias-config-"));
  try {
    const path = join(dir, "model-aliases.json");
    assert.deepEqual(loadAliases(path), []);
    assert.deepEqual(readdirSync(dir), []);
    writeFileSync(path, config);
    assert.deepEqual(loadAliases(path), parseAliases(config));
    assert.equal(readFileSync(path, "utf8"), config);
    writeFileSync(path, "{bad");
    assert.throws(() => loadAliases(path));
    assert.equal(readFileSync(path, "utf8"), "{bad");
    assert.throws(() => loadAliases(dir));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("supports arbitrary models, display names and an empty configuration", () => {
  const aliases = parseAliases(JSON.stringify({ aliases: [{
    id: "my-model-fast", name: "My model: fast", provider: "my-provider",
    model: "some-model-id", thinking: "low",
  }] }));
  const models = [];
  registerAliases({ registerVirtualModel: (model) => models.push(model) }, aliases);
  assert.equal(models[0].name, "My model: fast");
  assert.deepEqual(parseAliases('{"aliases":[]}'), []);
});

test("Pi package manifest exposes only the extension", () => {
  const manifest = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
  assert.deepEqual(manifest.pi, { extensions: ["./index.js"] });
  assert.equal(manifest.scripts.postinstall, undefined);
});
