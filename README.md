# Pi Model Aliases

A local extension for Pi 1.3.0 using the `registerVirtualModel` API. Create multiple
aliases for the same model, each with a fixed thinking level, using a JSON file.
No additional dependencies are required.

## Requirements

- Pi 1.3.0 with the `registerVirtualModel` API.
- Node.js and Git available in your terminal.
- Pi authentication configured for the target model provider.

## Installation

Close Pi before installing to avoid concurrent writes to its settings.

### From GitHub or GitLab

Replace `YOUR_USERNAME` and `YOUR_REPOSITORY` with the actual repository owner
and name:

```sh
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git pi-model-aliases
cd pi-model-aliases
node install.mjs
```

For GitLab or another Git host, use that repository's clone URL instead.

### From an existing local checkout

```sh
cd ~/Downloads/pi-model-aliases
node install.mjs
```

No `npm install` is needed. Use this installer rather than `pi install`: the
script also configures model scoping.

The installer:

- Copies the extension to `~/.pi/agent/extensions/model-aliases/`.
- Adds `model-aliases/*` to `enabledModels` in `~/.pi/agent/settings.json`,
  preserving existing model selections and other settings.
- Keeps all models available through `*` if no scope was previously configured.
- Backs up the existing settings file before modifying it.
- Preserves your installed alias configuration when run again.

Set `PI_CODING_AGENT_DIR` to use a different Pi agent directory.

Restart Pi. The five default aliases will appear in `/model`, `/scoped-models`,
and the `Ctrl+P` cycle. Authentication for the target provider must already be
configured, for example through `/login` for OpenAI Codex.

## JSON configuration

Edit the **installed** configuration file, not the copy in the source checkout:

```text
~/.pi/agent/extensions/model-aliases/aliases.json
```

Add entries to its `aliases` array, for example:

```json
{
  "id": "sol-high",
  "name": "sol:high",
  "provider": "openai-codex",
  "model": "gpt-6-sol",
  "thinking": "high"
}
```

- `id`: unique identifier containing only letters, digits, hyphens, or underscores.
- `name`: optional display name. Colons are allowed in display names, but not IDs,
  because Pi uses `:level` in its CLI syntax.
- `provider` and `model`: the provider and exact physical model ID.
- `thinking`: `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, or `max`.

Each alias has a fixed thinking level, including tool follow-ups, retries, and
summaries. Pi adapts thinking levels to the physical model's capabilities. In the
current catalog, `minimal` maps to `low` for these Codex models.

The default configuration targets GPT-6 Luna, Sol, and Astra through
`openai-codex`. Change the model IDs if you use GPT-5.6 Luna/Sol or another provider.
Aliases are listed even if their target provider is not yet authenticated; Pi
reports missing models or credentials when you try to use them.

### Automatic model scoping

The `model-aliases/*` pattern includes all aliases, including any you add later.
Keep this pattern in your settings to retain automatic inclusion.

**Restart Pi after adding or removing aliases** to rebuild the model scope.
`/reload` reloads the extension and JSON configuration, but does not rebuild the
current session's scope in Pi 1.3.0.

An explicit `--models` option or project-level `enabledModels` setting overrides
the global scope. Include `model-aliases/*` there as well if you use either.

## Updating

Close Pi, then run these commands from a clone connected to a remote repository:

```sh
git pull --ff-only
node install.mjs
```

Restart Pi. Updates do not overwrite your installed, customized alias JSON file.

## Tests

Run from the source checkout:

```sh
node --test test.mjs
```

## Uninstalling

Delete `~/.pi/agent/extensions/model-aliases/`, remove `model-aliases/*` from
`enabledModels`, and restart Pi. Keep `*` only if you want all models to remain
included.
