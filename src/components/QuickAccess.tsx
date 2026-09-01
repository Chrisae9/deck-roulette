import {
	ButtonItem,
	Focusable,
	Navigation,
	NavEntryPositionPreferences,
	PanelSection,
	PanelSectionRow,
} from "@decky/ui"
import { useState } from "react"

import {
	availableRouletteSources,
	partitionSourcesByPinned,
	selectableCollections,
} from "../gamePools"
import { SETTINGS_ROUTE } from "../routes"
import { SettingsStore, useSettingsStore } from "../settingsStore"
import { navigateToRandomGame } from "../utils"

type QuickAccessProps = {
	store: SettingsStore
}

let quickAccessView: "shortcuts" | "other-lists" = "shortcuts"
let lastSelectedOtherSourceId: string | undefined

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

	const openSettings = () => {
		Navigation.Navigate(`${SETTINGS_ROUTE}/shortcuts`)
		Navigation.CloseSideMenus()
	}
	const showOtherLists = () => {
		quickAccessView = "other-lists"
		setBrowsingOtherLists(true)
	}
	const showShortcuts = () => {
		quickAccessView = "shortcuts"
		setBrowsingOtherLists(false)
	}
	const openRandomGame = (sourceId: string, appIds: number[]) => {
		if (browsingOtherLists) lastSelectedOtherSourceId = sourceId
		navigateToRandomGame(appIds)
	}

	if (browsingOtherLists) {
		return (
			<Focusable
				navEntryPreferPosition={NavEntryPositionPreferences.PREFERRED_CHILD}
			>
				<PanelSection title="Other Game Lists">
					<PanelSectionRow>
						<ButtonItem layout="below" onClick={showShortcuts}>
							← Back to Shortcuts
						</ButtonItem>
					</PanelSectionRow>
					{otherSources.map((source) => (
						<PanelSectionRow key={source.id}>
							<ButtonItem
								{...({
									preferredFocus:
										source.id === lastSelectedOtherSourceId,
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
		<div>
			<PanelSection title="Random Game">
				{pinnedSources.map((source) => (
					<PanelSectionRow key={source.id}>
						<ButtonItem
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
						layout="below"
						disabled={saving}
						description={`${pinnedSources.length} pinned · ${excludedCount} excluded`}
						onClick={openSettings}
					>
						Customize Shortcuts
					</ButtonItem>
				</PanelSectionRow>
			</PanelSection>
		</div>
	)
}
