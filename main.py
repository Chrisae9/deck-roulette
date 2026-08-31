import decky


class Plugin:
    async def _main(self):
        decky.logger.info("DeckRoulette loaded")

    async def _unload(self):
        decky.logger.info("DeckRoulette unloaded")
