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
