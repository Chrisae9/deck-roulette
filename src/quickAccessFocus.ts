export const BROWSE_FOCUS_ID = "ui:browse-other-lists"
export const SETTINGS_FOCUS_ID = "ui:settings"
export const OTHER_LISTS_BACK_FOCUS_ID = "ui:other-lists-back"

export const focusableSourceIds = (
	sources: Array<{ id: string; appIds: number[] }>
) => sources.filter(({ appIds }) => appIds.length > 0).map(({ id }) => id)

export const resolveMainFocus = (
	pinnedSourceIds: string[],
	hasOtherSources: boolean,
	requestedFocusId?: string
) => {
	if (requestedFocusId && pinnedSourceIds.includes(requestedFocusId)) {
		return requestedFocusId
	}
	if (requestedFocusId === BROWSE_FOCUS_ID && hasOtherSources) {
		return BROWSE_FOCUS_ID
	}
	if (requestedFocusId === SETTINGS_FOCUS_ID) return SETTINGS_FOCUS_ID

	return pinnedSourceIds[0] ??
		(hasOtherSources ? BROWSE_FOCUS_ID : SETTINGS_FOCUS_ID)
}

export const resolveOtherListsFocus = (
	otherSourceIds: string[],
	requestedSourceId?: string
) => {
	if (requestedSourceId && otherSourceIds.includes(requestedSourceId)) {
		return requestedSourceId
	}

	return otherSourceIds[0] ?? OTHER_LISTS_BACK_FOCUS_ID
}
