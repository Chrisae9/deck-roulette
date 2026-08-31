import { describe, expect, test } from "vitest"

import {
	createDefaultSettings,
	INSTALLED_SOURCE_ID,
	MY_GAMES_SOURCE_ID,
	setCollectionExcluded,
	setSourcePinned,
} from "./collectionSettings"

describe("collection settings", () => {
	test("pins Installed and My Games by default", () => {
		expect(createDefaultSettings()).toEqual({
			excludedCollectionIds: [],
			pinnedSourceIds: [INSTALLED_SOURCE_ID, MY_GAMES_SOURCE_ID],
		})
	})

	test("allows default sources to be unpinned", () => {
		const settings = setSourcePinned(
			createDefaultSettings(),
			INSTALLED_SOURCE_ID,
			false
		)

		expect(settings.pinnedSourceIds).toEqual([MY_GAMES_SOURCE_ID])
	})

	test("appends new pins once and preserves their order", () => {
		const sourceId = "collection:emulation"
		const once = setSourcePinned(createDefaultSettings(), sourceId, true)
		const twice = setSourcePinned(once, sourceId, true)

		expect(twice.pinnedSourceIds).toEqual([
			INSTALLED_SOURCE_ID,
			MY_GAMES_SOURCE_ID,
			sourceId,
		])
	})

	test("tracks exclusions separately from direct collection pins", () => {
		const pinned = setSourcePinned(
			createDefaultSettings(),
			"collection:emulation",
			true
		)
		const excluded = setCollectionExcluded(pinned, "emulation", true)

		expect(excluded.pinnedSourceIds).toContain("collection:emulation")
		expect(excluded.excludedCollectionIds).toEqual(["emulation"])
	})
})
