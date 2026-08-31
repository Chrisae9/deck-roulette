import json
from pathlib import Path
from typing import Any

import decky


DEFAULT_SETTINGS = {"excludedCollectionIds": []}


class Plugin:
    settings_path = Path(decky.DECKY_SETTINGS_DIR) / "settings.json"

    def _validated_settings(self, settings: Any) -> dict[str, list[str]]:
        if not isinstance(settings, dict):
            return DEFAULT_SETTINGS.copy()

        excluded_ids = settings.get("excludedCollectionIds", [])
        if not isinstance(excluded_ids, list):
            excluded_ids = []

        return {
            "excludedCollectionIds": list(
                dict.fromkeys(
                    collection_id
                    for collection_id in excluded_ids
                    if isinstance(collection_id, str)
                )
            )
        }

    async def get_settings(self) -> dict[str, list[str]]:
        try:
            with self.settings_path.open(encoding="utf-8") as settings_file:
                return self._validated_settings(json.load(settings_file))
        except FileNotFoundError:
            return DEFAULT_SETTINGS.copy()
        except (OSError, json.JSONDecodeError):
            decky.logger.exception("Could not read DeckRoulette settings")
            return DEFAULT_SETTINGS.copy()

    async def save_settings(self, settings: Any) -> dict[str, list[str]]:
        validated_settings = self._validated_settings(settings)
        self.settings_path.parent.mkdir(parents=True, exist_ok=True)
        temporary_path = self.settings_path.with_suffix(".tmp")

        try:
            with temporary_path.open("w", encoding="utf-8") as settings_file:
                json.dump(validated_settings, settings_file, indent=2)
                settings_file.write("\n")
            temporary_path.replace(self.settings_path)
        except OSError:
            decky.logger.exception("Could not save DeckRoulette settings")
            raise

        return validated_settings

    async def _main(self):
        decky.logger.info("DeckRoulette loaded")

    async def _unload(self):
        decky.logger.info("DeckRoulette unloaded")
