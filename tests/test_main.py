import asyncio
import importlib.util
import json
import logging
import sys
import tempfile
import types
import unittest
from pathlib import Path
from uuid import uuid4


class PluginSettingsTests(unittest.TestCase):
    def load_plugin(self, settings_dir: str, legacy: bool = False):
        fake_decky = types.SimpleNamespace(logger=logging.getLogger("deck-roulette-test"))
        constant = "DECKY_PLUGIN_SETTINGS_DIR" if legacy else "DECKY_SETTINGS_DIR"
        setattr(fake_decky, constant, settings_dir)
        sys.modules["decky"] = fake_decky

        module_name = f"deck_roulette_main_{uuid4().hex}"
        spec = importlib.util.spec_from_file_location(module_name, "main.py")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module.Plugin()

    def test_defaults_include_broad_game_pools(self):
        with tempfile.TemporaryDirectory() as settings_dir:
            plugin = self.load_plugin(settings_dir)

            self.assertEqual(
                asyncio.run(plugin.get_settings()),
                {
                    "excludedCollectionIds": [],
                    "pinnedSourceIds": ["builtin:installed", "builtin:my-games"],
                },
            )

    def test_old_settings_gain_default_pins(self):
        with tempfile.TemporaryDirectory() as settings_dir:
            Path(settings_dir, "settings.json").write_text(
                json.dumps({"excludedCollectionIds": ["emulation"]}),
                encoding="utf-8",
            )
            plugin = self.load_plugin(settings_dir)

            self.assertEqual(
                asyncio.run(plugin.get_settings()),
                {
                    "excludedCollectionIds": ["emulation"],
                    "pinnedSourceIds": ["builtin:installed", "builtin:my-games"],
                },
            )

    def test_save_deduplicates_ids_and_discards_non_strings(self):
        with tempfile.TemporaryDirectory() as settings_dir:
            plugin = self.load_plugin(settings_dir)
            saved = asyncio.run(
                plugin.save_settings(
                    {
                        "excludedCollectionIds": ["emulation", "emulation", 123],
                        "pinnedSourceIds": [
                            "builtin:installed",
                            "collection:alpha",
                            "collection:alpha",
                            None,
                        ],
                    }
                )
            )

            self.assertEqual(
                saved,
                {
                    "excludedCollectionIds": ["emulation"],
                    "pinnedSourceIds": ["builtin:installed", "collection:alpha"],
                },
            )
            self.assertEqual(asyncio.run(plugin.get_settings()), saved)
            self.assertFalse(Path(settings_dir, "settings.tmp").exists())

    def test_legacy_decky_settings_directory_is_supported(self):
        with tempfile.TemporaryDirectory() as settings_dir:
            plugin = self.load_plugin(settings_dir, legacy=True)

            self.assertEqual(
                asyncio.run(plugin.get_settings())["pinnedSourceIds"],
                ["builtin:installed", "builtin:my-games"],
            )


if __name__ == "__main__":
    unittest.main()
