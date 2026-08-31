import json
from pathlib import Path
from typing import Any

import decky


DEFAULT_SETTINGS = {
    "excludedCollectionIds": [],
    "pinnedSourceIds": ["builtin:installed", "builtin:my-games"],
}
SETTINGS_DIR = getattr(decky, "DECKY_SETTINGS_DIR", None)
if SETTINGS_DIR is None:
    SETTINGS_DIR = decky.DECKY_PLUGIN_SETTINGS_DIR


class Plugin:
    settings_path = Path(SETTINGS_DIR) / "settings.json"

    def _default_settings(self) -> dict[str, list[str]]:
        return {
            key: list(value)
            for key, value in DEFAULT_SETTINGS.items()
        }

    def _validated_settings(self, settings: Any) -> dict[str, list[str]]:
        if not isinstance(settings, dict):
            return self._default_settings()

        validated_settings: dict[str, list[str]] = {}
        for key, default_ids in DEFAULT_SETTINGS.items():
            ids = settings.get(key, default_ids)
            if not isinstance(ids, list):
                ids = default_ids

            validated_settings[key] = list(
                dict.fromkeys(
                    item_id
                    for item_id in ids
                    if isinstance(item_id, str)
                )
            )

        return validated_settings

    async def get_settings(self) -> dict[str, list[str]]:
        try:
            with self.settings_path.open(encoding="utf-8") as settings_file:
                return self._validated_settings(json.load(settings_file))
        except FileNotFoundError:
            return self._default_settings()
        except (OSError, json.JSONDecodeError):
            decky.logger.exception("Could not read DeckRoulette settings")
            return self._default_settings()

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
