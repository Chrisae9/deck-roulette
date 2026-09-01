import { describe, expect, test } from "vitest"

import {
	createDefaultSettings,
	INSTALLED_SOURCE_ID,
	moveItem,
	MY_GAMES_SOURCE_ID,
	setCollectionExcluded,
	setPinnedSourceOrder,
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

	test("keeps a reasonable order when a focused middle pin is removed", () => {
		const withCollections = setPinnedSourceOrder(createDefaultSettings(), [
			INSTALLED_SOURCE_ID,
			"collection:party",
			"collection:emulation",
			MY_GAMES_SOURCE_ID,
		])
		const unpinned = setSourcePinned(
			withCollections,
			"collection:party",
			false
		)

		expect(unpinned.pinnedSourceIds).toEqual([
			INSTALLED_SOURCE_ID,
			"collection:emulation",
			MY_GAMES_SOURCE_ID,
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

	test("moves shortcuts without mutating the saved order", () => {
		const original = ["installed", "favorites", "my-games"]

		expect(moveItem(original, 2, 0)).toEqual([
			"my-games",
			"installed",
			"favorites",
		])
		expect(original).toEqual(["installed", "favorites", "my-games"])
		expect(moveItem(original, 0, -1)).toEqual(original)
	})

	test("saves a unique explicit shortcut order", () => {
		const settings = setPinnedSourceOrder(createDefaultSettings(), [
			"collection:favorites",
			MY_GAMES_SOURCE_ID,
			"collection:favorites",
		])

		expect(settings.pinnedSourceIds).toEqual([
			"collection:favorites",
			MY_GAMES_SOURCE_ID,
		])
	})
})
