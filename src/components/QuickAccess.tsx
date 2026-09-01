import {
	ButtonItem,
	Focusable,
	Navigation,
	NavEntryPositionPreferences,
	PanelSection,
	PanelSectionRow,
} from "@decky/ui"
import { useEffect, useState } from "react"

import {
	availableRouletteSources,
	partitionSourcesByPinned,
	selectableCollections,
} from "../gamePools"
import { SETTINGS_ROUTE } from "../routes"
import { SettingsStore, useSettingsStore } from "../settingsStore"
import {
	BROWSE_FOCUS_ID,
	OTHER_LISTS_BACK_FOCUS_ID,
	resolveMainFocus,
	resolveOtherListsFocus,
	SETTINGS_FOCUS_ID,
} from "../quickAccessFocus"
import { navigateToRandomGame } from "../utils"

type QuickAccessProps = {
	store: SettingsStore
}

let quickAccessView: "shortcuts" | "other-lists" = "shortcuts"
let lastSelectedOtherSourceId: string | undefined
let lastMainFocusId: string | undefined

export const QuickAccess = ({ store }: QuickAccessProps) => {
	const { collectionStore }: { collectionStore?: CollectionStore } = window as any
	const { settings, loaded, saving, error } = useSettingsStore(store)
	const [browsingOtherLists, setBrowsingOtherLists] = useState(
		quickAccessView === "other-lists"
	)
	const collections = selectableCollections(collectionStore)
	const availableSources = availableRouletteSources(
		collectionStore,
		settings.excludedCollectionIds
	)
	const { pinnedSources, availableSources: otherSources } =
		partitionSourcesByPinned(availableSources, settings.pinnedSourceIds)
	const knownCollectionIds = new Set(
		collections.map((collection) => collection.id)
	)
	const excludedCount = settings.excludedCollectionIds.filter((id) =>
		knownCollectionIds.has(id)
	).length
	const preferredMainFocusId = resolveMainFocus(
		pinnedSources.map(({ id }) => id),
		otherSources.length > 0,
		lastMainFocusId
	)
	const preferredOtherFocusId = resolveOtherListsFocus(
		otherSources.map(({ id }) => id),
		lastSelectedOtherSourceId
	)

	useEffect(() => {
		const frame = requestAnimationFrame(() => {
			document
				.querySelector<HTMLElement>(
					'[data-deck-roulette-preferred="true"]'
				)
				?.focus()
		})

		return () => cancelAnimationFrame(frame)
	}, [browsingOtherLists, preferredMainFocusId, preferredOtherFocusId])

	const openSettings = () => {
		lastMainFocusId = SETTINGS_FOCUS_ID
		Navigation.Navigate(`${SETTINGS_ROUTE}/shortcuts`)
		Navigation.CloseSideMenus()
	}
	const showOtherLists = () => {
		lastMainFocusId = BROWSE_FOCUS_ID
		quickAccessView = "other-lists"
		setBrowsingOtherLists(true)
	}
	const showShortcuts = () => {
		lastMainFocusId = BROWSE_FOCUS_ID
		quickAccessView = "shortcuts"
		setBrowsingOtherLists(false)
	}
	const openRandomGame = (sourceId: string, appIds: number[]) => {
		if (browsingOtherLists) {
			lastSelectedOtherSourceId = sourceId
		} else {
			lastMainFocusId = sourceId
		}
		navigateToRandomGame(appIds)
	}

	if (browsingOtherLists) {
		return (
			<Focusable
				key="other-lists"
				navEntryPreferPosition={NavEntryPositionPreferences.PREFERRED_CHILD}
			>
				<PanelSection title="Other Game Lists">
					<PanelSectionRow>
						<ButtonItem
							{...({
								"data-deck-roulette-preferred":
									preferredOtherFocusId === OTHER_LISTS_BACK_FOCUS_ID
										? "true"
										: undefined,
								preferredFocus:
									preferredOtherFocusId === OTHER_LISTS_BACK_FOCUS_ID,
							} as any)}
							layout="below"
							onClick={showShortcuts}
						>
							← Back to Shortcuts
						</ButtonItem>
					</PanelSectionRow>
					{otherSources.map((source) => (
						<PanelSectionRow key={source.id}>
							<ButtonItem
								{...({
									"data-deck-roulette-preferred":
										source.id === preferredOtherFocusId
											? "true"
											: undefined,
									preferredFocus:
										source.id === preferredOtherFocusId,
								} as any)}
								layout="below"
								disabled={source.appIds.length === 0}
								onClick={() => openRandomGame(source.id, source.appIds)}
							>
								{source.label} ({source.appIds.length})
							</ButtonItem>
						</PanelSectionRow>
					))}
				</PanelSection>
			</Focusable>
		)
	}

	return (
		<Focusable
			key="shortcuts"
			navEntryPreferPosition={NavEntryPositionPreferences.PREFERRED_CHILD}
		>
			<PanelSection title="Random Game">
				{pinnedSources.map((source) => (
					<PanelSectionRow key={source.id}>
						<ButtonItem
							{...({
								"data-deck-roulette-preferred":
									source.id === preferredMainFocusId
										? "true"
										: undefined,
								preferredFocus: source.id === preferredMainFocusId,
							} as any)}
							layout="below"
							disabled={!loaded || source.appIds.length === 0}
							description={
								loaded && source.appIds.length === 0
									? "No eligible games in this list."
									: undefined
							}
							onClick={() => openRandomGame(source.id, source.appIds)}
						>
							{source.label} ({source.appIds.length})
						</ButtonItem>
					</PanelSectionRow>
				))}
				{otherSources.length > 0 ? (
					<PanelSectionRow>
						<ButtonItem
							{...({
								"data-deck-roulette-preferred":
									preferredMainFocusId === BROWSE_FOCUS_ID
										? "true"
										: undefined,
								preferredFocus:
									preferredMainFocusId === BROWSE_FOCUS_ID,
							} as any)}
							layout="below"
							disabled={!loaded}
							description={`${otherSources.length} unpinned lists`}
							onClick={showOtherLists}
						>
							Browse Other Lists…
						</ButtonItem>
					</PanelSectionRow>
				) : null}
			</PanelSection>
			<PanelSection title="Settings">
				{error ? (
					<PanelSectionRow>
						<div>{error}</div>
					</PanelSectionRow>
				) : null}
				<PanelSectionRow>
					<ButtonItem
						{...({
							"data-deck-roulette-preferred":
								preferredMainFocusId === SETTINGS_FOCUS_ID
									? "true"
									: undefined,
							preferredFocus: preferredMainFocusId === SETTINGS_FOCUS_ID,
						} as any)}
						layout="below"
						disabled={saving}
						description={`${pinnedSources.length} pinned · ${excludedCount} excluded`}
						onClick={openSettings}
					>
						Customize Shortcuts
					</ButtonItem>
				</PanelSectionRow>
			</PanelSection>
		</Focusable>
	)
}
