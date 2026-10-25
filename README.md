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

No `npm install` is needed.

The installer:

- Copies the extension to `~/.pi/agent/extensions/model-aliases/`.
- Leaves `settings.json` and your scoped model selection untouched by default.
- Preserves your installed alias configuration when run again.

Automatic inclusion in scoped models is optional; see below.

Set `PI_CODING_AGENT_DIR` to use a different Pi agent directory.

Restart Pi to load the five default aliases. If you already use a restricted
model scope, select the aliases you want through `/scoped-models` to include them
in `/model` and the `Ctrl+P` cycle. With no scope configured, Pi makes all models
available as usual.

Authentication for the target provider must already be configured, for example
through `/login` for OpenAI Codex.

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

### Optional automatic model scoping

Installation does **not** change scoped models by default. To explicitly opt in,
close Pi and run:

```sh
node install.mjs --scoped-models
```

This adds `model-aliases/*` to `enabledModels` in your agent's `settings.json`,
preserving existing selections and backing up the file before modification.
If no scope was configured, it preserves access to all models through `*`.

The `model-aliases/*` pattern includes all aliases, including any you add later.
Keep this pattern in your settings to retain automatic inclusion.

If you installed an earlier version that added this pattern automatically,
remove `model-aliases/*` from `enabledModels` to undo it. Updating the extension
does not remove existing selections. If that earlier installer also added `*`,
remove it only if you no longer want all models included.

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

Delete `~/.pi/agent/extensions/model-aliases/` and restart Pi. If you opted in to
automatic scoping, also remove `model-aliases/*` from `enabledModels`. Remove any
individually selected aliases from the scope as well. Keep `*` only if you want
all models to remain included.
