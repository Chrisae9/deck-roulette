import {
	INSTALLED_SOURCE_ID,
	MY_GAMES_SOURCE_ID,
} from "./collectionSettings"

export const HIDDEN_COLLECTION_IDS = ["local-install", "uncategorized"]

export type RouletteSource = {
	id: string
	kind: "installed" | "my-games" | "collection"
	label: string
	appIds: number[]
	collectionId?: string
}

export const uniqueAppIds = (appIds: number[]) => Array.from(new Set(appIds))

export const appIdsWithoutExcludedCollections = (
	appIds: number[],
	collections: SteamCollection[],
	excludedCollectionIds: string[]
) => {
	const excludedCollectionIdSet = new Set(excludedCollectionIds)
	const excludedAppIds = new Set(
		collections
			.filter((collection) => excludedCollectionIdSet.has(collection.id))
			.flatMap((collection) =>
				collection.visibleApps.map((app) => app.appid)
			)
	)

	return uniqueAppIds(appIds).filter((appId) => !excludedAppIds.has(appId))
}

export const collectionSourceId = (collectionId: string) =>
	`collection:${collectionId}`

export const selectableCollections = (collectionStore?: CollectionStore) =>
	(collectionStore?.userCollections ?? []).filter(
		(collection) => !HIDDEN_COLLECTION_IDS.includes(collection.id)
	).sort((left, right) => left.displayName.localeCompare(right.displayName))

export const availableRouletteSources = (
	collectionStore: CollectionStore | undefined,
	excludedCollectionIds: string[]
): RouletteSource[] => {
	const collections = selectableCollections(collectionStore)
	const allCollections = collectionStore?.userCollections ?? []
	const localGames = collectionStore?.localGamesCollection
	const myGames = collectionStore?.myGamesCollection
	const installedAppIds = uniqueAppIds([
		...(localGames?.visibleApps ?? []).map((app) => app.appid),
		...(collectionStore?.deckDesktopApps?.visibleApps ?? []).map(
			(app) => app.appid
		),
	])

	return [
		{
			id: INSTALLED_SOURCE_ID,
			kind: "installed",
			label: localGames?.displayName ?? "Installed",
			appIds: appIdsWithoutExcludedCollections(
				installedAppIds,
				allCollections,
				excludedCollectionIds
			),
		},
		{
			id: MY_GAMES_SOURCE_ID,
			kind: "my-games",
			label: myGames?.displayName ?? "My Games",
			appIds: appIdsWithoutExcludedCollections(
				(myGames?.visibleApps ?? []).map((app) => app.appid),
				allCollections,
				excludedCollectionIds
			),
		},
		...collections.map((collection) => ({
			id: collectionSourceId(collection.id),
			kind: "collection" as const,
			label: collection.displayName,
			appIds: uniqueAppIds(collection.visibleApps.map((app) => app.appid)),
			collectionId: collection.id,
		})),
	]
}

export const resolvePinnedSources = (
	availableSources: RouletteSource[],
	pinnedSourceIds: string[]
) => {
	const sourceById = new Map(
		availableSources.map((source) => [source.id, source])
	)
	const seenSourceIds = new Set<string>()

	return pinnedSourceIds.flatMap((sourceId) => {
		if (seenSourceIds.has(sourceId)) return []
		seenSourceIds.add(sourceId)
		const source = sourceById.get(sourceId)
		return source ? [source] : []
	})
}

export const partitionSourcesByPinned = (
	availableSources: RouletteSource[],
	pinnedSourceIds: string[]
) => {
	const pinnedSources = resolvePinnedSources(
		availableSources,
		pinnedSourceIds
	)
	const pinnedSourceIdSet = new Set(
		pinnedSources.map((source) => source.id)
	)

	return {
		pinnedSources,
		availableSources: availableSources.filter(
			(source) => !pinnedSourceIdSet.has(source.id)
		),
	}
}
