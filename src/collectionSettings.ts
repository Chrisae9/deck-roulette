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

export const moveItem = <T>(items: T[], fromIndex: number, toIndex: number) => {
	if (
		fromIndex < 0 ||
		toIndex < 0 ||
		fromIndex >= items.length ||
		toIndex >= items.length ||
		fromIndex === toIndex
	) {
		return [...items]
	}

	const reorderedItems = [...items]
	const [item] = reorderedItems.splice(fromIndex, 1)
	reorderedItems.splice(toIndex, 0, item)
	return reorderedItems
}

export const setPinnedSourceOrder = (
	settings: PluginSettings,
	pinnedSourceIds: string[]
): PluginSettings => ({
	...settings,
	pinnedSourceIds: Array.from(new Set(pinnedSourceIds)),
})

export const reconcilePinnedSourceOrder = (
	currentPinnedSourceIds: string[],
	orderedSourceIds: string[]
) => {
	const currentIds = new Set(currentPinnedSourceIds)
	const orderedCurrentIds = Array.from(new Set(orderedSourceIds)).filter((id) =>
		currentIds.has(id)
	)
	const orderedIds = new Set(orderedCurrentIds)

	return [
		...orderedCurrentIds,
		...currentPinnedSourceIds.filter((id) => !orderedIds.has(id)),
	]
}

export const focusAfterItemRemoval = (itemIds: string[], removedId: string) => {
	const removedIndex = itemIds.indexOf(removedId)
	if (removedIndex < 0) return itemIds[0] ?? removedId

	return itemIds[removedIndex + 1] ?? itemIds[removedIndex - 1] ?? removedId
}

export const focusAfterReorderSave = (
	orderedIds: string[],
	focusedId?: string
) =>
	focusedId && orderedIds.includes(focusedId)
		? focusedId
		: orderedIds[0]
