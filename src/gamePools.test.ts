import { describe, expect, test } from "vitest"

import { INSTALLED_SOURCE_ID } from "./collectionSettings"
import {
	availableRouletteSources,
	collectionSourceId,
	partitionSourcesByPinned,
	resolvePinnedSources,
	selectableCollections,
} from "./gamePools"

const collection = (
	id: string,
	displayName: string,
	appIds: number[]
) =>
	({
		id,
		displayName,
		visibleApps: appIds.map((appid) => ({ appid })),
	}) as SteamCollection

const collectionStore = (collections: SteamCollection[]) =>
	({
		userCollections: collections,
		localGamesCollection: collection("local-install", "Installed", [1, 2, 2]),
		deckDesktopApps: collection("desktop-apps", "Desktop", [3]),
		myGamesCollection: collection("my-games", "My Games", [1, 2, 3, 4]),
	}) as CollectionStore

describe("roulette game pools", () => {
	test("resolves a renamed collection pin by stable ID", () => {
		const sourceId = collectionSourceId("favorites-id")
		const beforeRename = availableRouletteSources(
			collectionStore([collection("favorites-id", "Favorites", [10])]),
			[]
		)
		const afterRename = availableRouletteSources(
			collectionStore([collection("favorites-id", "Weekend Games", [10])]),
			[]
		)

		expect(resolvePinnedSources(beforeRename, [sourceId])[0].label).toBe(
			"Favorites"
		)
		expect(resolvePinnedSources(afterRename, [sourceId])[0].label).toBe(
			"Weekend Games"
		)
	})

	test("ignores a pin after its collection is deleted", () => {
		const sources = availableRouletteSources(collectionStore([]), [])

		expect(
			resolvePinnedSources(sources, [
				INSTALLED_SOURCE_ID,
				collectionSourceId("deleted-id"),
			]).map(({ id }) => id)
		).toEqual([INSTALLED_SOURCE_ID])
	})

	test("keeps exclusions working after a collection is renamed", () => {
		const sources = availableRouletteSources(
			collectionStore([collection("stable-id", "A New Name", [2])]),
			["stable-id"]
		)

		expect(sources[0].appIds).toEqual([1, 3])
		expect(sources[2].label).toBe("A New Name")
	})

	test("ignores a stale exclusion after its collection is deleted", () => {
		const sources = availableRouletteSources(
			collectionStore([]),
			["deleted-id"]
		)

		expect(sources[0].appIds).toEqual([1, 2, 3])
		expect(sources[1].appIds).toEqual([1, 2, 3, 4])
	})

	test("normalizes Steam's My games label", () => {
		const store = collectionStore([])
		store.myGamesCollection!.displayName = "My games"

		expect(availableRouletteSources(store, [])[1].label).toBe("My Games")
	})

	test("exclusions affect broad pools but not direct collection roulette", () => {
		const sources = availableRouletteSources(
			collectionStore([collection("emulation", "Emulation", [2, 3])]),
			["emulation"]
		)

		expect(sources[0].appIds).toEqual([1])
		expect(sources[1].appIds).toEqual([1, 4])
		expect(sources[2].appIds).toEqual([2, 3])
	})

	test("preserves saved pin order and removes duplicate or missing IDs", () => {
		const sources = availableRouletteSources(
			collectionStore([
				collection("alpha", "Alpha", [10]),
				collection("beta", "Beta", [20]),
			]),
			[]
		)
		const alpha = collectionSourceId("alpha")
		const beta = collectionSourceId("beta")

		expect(
			resolvePinnedSources(sources, [beta, "collection:deleted", alpha, beta]).map(
				(source) => source.id
			)
		).toEqual([beta, alpha])
	})

	test("places every source in exactly one shortcut group", () => {
		const sources = availableRouletteSources(
			collectionStore([
				collection("alpha", "Alpha", [10]),
				collection("beta", "Beta", [20]),
			]),
			[]
		)
		const beta = collectionSourceId("beta")
		const groups = partitionSourcesByPinned(sources, [
			beta,
			"collection:deleted",
		])
		const groupedIds = [
			...groups.pinnedSources,
			...groups.availableSources,
		].map(({ id }) => id)

		expect(groups.pinnedSources.map(({ id }) => id)).toEqual([beta])
		expect(new Set(groupedIds).size).toBe(sources.length)
		expect(groupedIds).toHaveLength(sources.length)
	})

	test("hides Steam pseudo-collections from configurable pools", () => {
		const store = collectionStore([
			collection("local-install", "Installed", [1]),
			collection("uncategorized", "Uncategorized", [2]),
			collection("real", "Real Collection", [3]),
		])

		expect(selectableCollections(store).map(({ id }) => id)).toEqual(["real"])
	})

	test("sorts configurable collections by their current names", () => {
		const store = collectionStore([
			collection("zeta", "Zeta", [1]),
			collection("alpha", "Alpha", [2]),
		])

		expect(
			selectableCollections(store).map(({ displayName }) => displayName)
		).toEqual(["Alpha", "Zeta"])
	})
})
