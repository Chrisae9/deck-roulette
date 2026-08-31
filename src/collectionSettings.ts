export const INSTALLED_SOURCE_ID = "builtin:installed"
export const MY_GAMES_SOURCE_ID = "builtin:my-games"

export type PluginSettings = {
	excludedCollectionIds: string[]
	pinnedSourceIds: string[]
}

export const createDefaultSettings = (): PluginSettings => ({
	excludedCollectionIds: [],
	pinnedSourceIds: [INSTALLED_SOURCE_ID, MY_GAMES_SOURCE_ID],
})

export const setIdEnabled = (
	ids: string[],
	id: string,
	enabled: boolean
) =>
	enabled
		? Array.from(new Set([...ids, id]))
		: ids.filter((existingId) => existingId !== id)

export const setSourcePinned = (
	settings: PluginSettings,
	sourceId: string,
	pinned: boolean
): PluginSettings => ({
	...settings,
	pinnedSourceIds: setIdEnabled(settings.pinnedSourceIds, sourceId, pinned),
})

export const setCollectionExcluded = (
	settings: PluginSettings,
	collectionId: string,
	excluded: boolean
): PluginSettings => ({
	...settings,
	excludedCollectionIds: setIdEnabled(
		settings.excludedCollectionIds,
		collectionId,
		excluded
	),
})
