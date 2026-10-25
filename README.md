# Pi Model Aliases

A Pi package that creates selectable model aliases with fixed thinking levels,
configured through a personal JSON file. Works with any physical chat model in
Pi's catalog, including models from custom providers.

No aliases are enabled by default. The extension never changes your model scope
or writes to your settings. Pi itself records package installation in settings.

## Requirements

- Pi with the `registerVirtualModel` API (tested with Pi 1.3.0).
- Authentication configured in Pi for the models you want to use.

## Install from GitHub

```sh
pi install git:github.com/moreauadrien/pi-model-alias
```

Then restart Pi or run `/reload` to load the extension.

No manual clone, `npm install`, or installation script is needed.
You can also pin a Git tag or commit, for example:

```sh
pi install git:github.com/moreauadrien/pi-model-alias@v0.1.0
```

The tag must exist in the repository.

## Configure your aliases

Create this file in your Pi agent directory:

```text
~/.pi/agent/model-aliases.json
```

If you set `PI_CODING_AGENT_DIR`, put the file in that directory instead.
The file is separate from the installed package so updates do not overwrite it.
A missing file or an empty object (`{}`) enables no aliases.

Example configuration:

```json
{
  "sol-high": "openai/gpt-6-sol:high",
  "sol-low": "openai/gpt-6-sol:low"
}
```

Each key is the alias ID (letters, digits, hyphens, or underscores). Each value
is `provider/model:thinking`, using exact physical provider and model IDs from
Pi's catalog. Thinking can be `off`, `minimal`, `low`, `medium`, `high`, `xhigh`,
or `max`. Alias display names match their IDs. The two aliases above target the
same model at different thinking levels. See
[`examples/model-aliases.json`](examples/model-aliases.json) for an OpenAI Codex
configuration; that example is not loaded automatically.

**Updating from the old format?** Replace the `aliases` array with a flat JSON
object: each old `id` becomes a key and `provider/model:thinking` its value.
Custom `name` fields are no longer supported.

Aliases are registered under the `model-aliases` provider. Each alias always
routes to its configured physical model and thinking level, including tool
follow-ups, retries, and summaries. Pi adapts thinking levels to the target
model's capabilities; a provider may map `minimal` to `low`, for example.

Aliases are listed even if the target provider is not yet authenticated.
Pi reports a missing model or credentials when you try to use an alias.

Run `/reload` after editing the JSON to reload the aliases. Restart Pi when you
need to rebuild a configured model scope after adding or removing aliases.

## Scoped models

This package does not add, remove, or enable scoped models automatically.
Use `/scoped-models` to select the aliases you want in the model picker and
`Ctrl+P` cycle. With no scope configured, Pi makes all models available as usual.

If you explicitly want every alias included, you can add `model-aliases/*` to
`enabledModels` in your own Pi settings. This is optional, not an installation
side effect. An explicit `--models` option or project-level `enabledModels`
setting overrides the global scope.

## Update

```sh
pi update git:github.com/moreauadrien/pi-model-alias
```

Restart Pi or run `/reload`. Your personal JSON configuration is unchanged.
Pinned tags and commits stay pinned when updating.

## Uninstall

```sh
pi remove git:github.com/moreauadrien/pi-model-alias
```

Restart Pi or run `/reload`. Optionally delete your personal
`model-aliases.json` file and remove any alias entries you manually added to
scoped models.

## Development

From a local checkout:

```sh
node --test test.mjs
pi install /absolute/path/to/pi-model-aliases
```

Pi loads only `index.js`, as declared by the `pi.extensions` package manifest.
The example configuration is not an extension and is never auto-loaded.

## Migrating from the old manual installer

If you installed an earlier version using `node install.mjs`:

1. Move your customized `~/.pi/agent/extensions/model-aliases/aliases.json` to
   `~/.pi/agent/model-aliases.json` and convert its `aliases` array to the flat
   `{"id": "provider/model:thinking"}` format above.
2. Delete the old `~/.pi/agent/extensions/model-aliases/` directory to avoid
   loading both versions.
3. Remove `model-aliases/*` from `enabledModels` if the old installer added it
   and you do not want automatic inclusion. If it also added `*`, keep that
   pattern only if you want all models included.
4. Install this package with `pi install git:github.com/moreauadrien/pi-model-alias`.
5. Restart Pi.
