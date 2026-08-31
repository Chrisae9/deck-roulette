# DeckRoulette

A Decky Loader plugin that opens a randomly selected game from:

- Installed games, including non-Steam games
- Your owned games
- Any individual Steam collection

Installed and My Games are pinned in Quick Access by default. Any game list can
be pinned, unpinned, and reordered, while the complete list remains available
from the Browse Other Lists subpage.

Collections can also be excluded from the broad Installed and My Games lists
while remaining available for their own collection roulette. This is useful
for collections such as EmuDeck's Emulation collection.

## Development

```sh
npx -y pnpm@9.4.0 install --frozen-lockfile
npx -y pnpm@9.4.0 test
npx -y pnpm@9.4.0 build
```
