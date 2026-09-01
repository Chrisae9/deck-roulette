# DeckRoulette

DeckRoulette is a Decky Loader plugin that opens a random game from Locally
Installed Games, My Games, or a Steam collection.

![DeckRoulette shortcuts in the Decky Quick Access menu](screenshots/002_quick_access.png)

## Shortcuts

Locally Installed Games and My Games are pinned by default. Any game list can
be pinned, unpinned, or reordered from **Customize Shortcuts**.

![Pinning and reordering DeckRoulette shortcuts](screenshots/004_reorder_shortcuts.png)

Unpinned collections remain available under **Browse Other Lists**, which
restores the last selected list when reopened.

![Browsing unpinned Steam collections in DeckRoulette](screenshots/003_browse_other_lists.png)

## Exclusions

Collection exclusions apply only to Locally Installed Games and My Games. An
excluded collection can still be used as its own roulette list.

## Development

```sh
npx -y pnpm@9.4.0 install --frozen-lockfile
npx -y pnpm@9.4.0 test
npx -y pnpm@9.4.0 build
```
