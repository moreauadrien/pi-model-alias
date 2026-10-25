# Alias de modèles Pi

Extension locale pour Pi 1.3.0 (API `registerVirtualModel`), sans dépendance à installer.

## Prérequis

- Pi 1.3.0 avec l'API `registerVirtualModel`.
- Node.js et Git accessibles dans le terminal.
- Une authentification Pi pour le fournisseur des modèles cibles.

## Installation

Fermer Pi avant l'installation pour éviter les écritures concurrentes dans les réglages.
Depuis le dépôt local :

```sh
cd ~/Downloads/pi-model-aliases
node install.mjs
```

Si le dépôt a été publié sur GitHub/GitLab, le cloner d'abord (remplacer
`<URL_DU_DEPOT>` par son URL réelle) :

```sh
git clone <URL_DU_DEPOT> pi-model-aliases
cd pi-model-aliases
node install.mjs
```

Aucun `npm install` n'est nécessaire. L'installation se fait avec ce script,
qui configure aussi les scoped models, et non avec `pi install`.

L'installateur copie l'extension dans `~/.pi/agent/extensions/model-aliases/` et ajoute
`model-aliases/*` à `enabledModels` dans `~/.pi/agent/settings.json`, sans supprimer
les modèles déjà sélectionnés ni les autres réglages. Si aucun scope n'était défini,
il conserve tous les modèles via `*`. Le fichier settings existant est sauvegardé
avant modification. `PI_CODING_AGENT_DIR` permet d'utiliser un autre répertoire agent.
Une réinstallation conserve le fichier d'alias installé.

Redémarrer Pi. Les cinq alias apparaissent dans `/model`, `/scoped-models` et le
cycle `Ctrl+P`. L'authentification du fournisseur cible doit déjà être configurée
(par exemple `/login` pour OpenAI Codex).

## Configuration JSON

Modifier le fichier **installé** :

`~/.pi/agent/extensions/model-aliases/aliases.json`

Exemple d'entrée à ajouter dans le tableau `aliases` :

```json
{
  "id": "sol-high",
  "name": "sol:high",
  "provider": "openai-codex",
  "model": "gpt-6-sol",
  "thinking": "high"
}
```

- `id` : identifiant unique, lettres/chiffres/tirets/underscores uniquement.
- `name` : nom affiché facultatif. Les deux-points sont réservés au nom affiché,
  car Pi utilise `:niveau` dans la syntaxe CLI.
- `provider` et `model` : fournisseur et ID exact du modèle physique.
- `thinking` : `off`, `minimal`, `low`, `medium`, `high`, `xhigh` ou `max`.

Le niveau est fixé pour chaque alias, y compris les appels d'outils, retries et
résumés. Pi adapte les niveaux aux capacités du modèle : dans le catalogue actuel,
`minimal` correspond notamment à `low` pour ces modèles Codex.

Les valeurs initiales supposent GPT-6 Luna, Sol et Astra sur `openai-codex`.
Si tu utilises GPT-5.6 Luna/Sol ou un autre fournisseur, modifier les IDs correspondants.
Les alias sont listés même si le fournisseur cible n'est pas encore authentifié ;
Pi signalera l'absence de modèle ou d'authentification lors de l'utilisation.

**Redémarrer Pi après un ajout ou une suppression**, pour recalculer le scope.
`/reload` recharge l'extension et le JSON, mais ne reconstruit pas le scope de la
session en cours dans Pi 1.3.0. Ne pas supprimer `model-aliases/*` des réglages si
tu veux conserver l'inclusion automatique des futurs alias. Un `--models` explicite
ou un `enabledModels` de projet remplace le scope global : y inclure aussi
`model-aliases/*` dans ce cas.

## Mise à jour

Fermer Pi puis, depuis le clone lié à un dépôt distant :

```sh
git pull --ff-only
node install.mjs
```

Redémarrer Pi. Le JSON installé et personnalisé n'est pas écrasé par la mise à jour.

## Vérifications

Depuis le dépôt source :

```sh
node --test test.mjs
```

## Désinstallation

Supprimer `~/.pi/agent/extensions/model-aliases/`, retirer `model-aliases/*` de
`enabledModels`, puis redémarrer Pi. Conserver `*` uniquement si tous les modèles
doivent rester inclus.
