# DeckRoulette

Decky Loader plugin for opening a random game from your library or Steam
collections.

![DeckRoulette shortcuts in the Decky Quick Access menu](screenshots/002_quick_access.png)

## Features

- Choose from Locally Installed Games, My Games, or any Steam collection.
- Pin, unpin, and reorder game lists in Quick Access.
- Browse unpinned collections and return to the last selected list.
- Exclude collections from Locally Installed Games and My Games while keeping
  them available as individual roulette lists.

## Development

```sh
npx -y pnpm@9.4.0 install --frozen-lockfile
npx -y pnpm@9.4.0 test
npx -y pnpm@9.4.0 build
```
