import {
	ButtonItem,
	Navigation,
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

export const QuickAccess = ({ store }: QuickAccessProps) => {
	const { collectionStore }: { collectionStore?: CollectionStore } = window as any
	const { settings, loaded, saving, error } = useSettingsStore(store)
	const [browsingOtherLists, setBrowsingOtherLists] = useState(false)
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
	const openRandomGame = (appIds: number[]) => {
		navigateToRandomGame(appIds)
	}

	if (browsingOtherLists) {
		return (
			<div>
				<PanelSection title="Other Game Lists">
					<PanelSectionRow>
						<ButtonItem
							layout="below"
							onClick={() => setBrowsingOtherLists(false)}
						>
							← Back to Shortcuts
						</ButtonItem>
					</PanelSectionRow>
					{otherSources.map((source) => (
						<PanelSectionRow key={source.id}>
							<ButtonItem
								layout="below"
								disabled={source.appIds.length === 0}
								onClick={() => openRandomGame(source.appIds)}
							>
								{source.label} ({source.appIds.length})
							</ButtonItem>
						</PanelSectionRow>
					))}
				</PanelSection>
			</div>
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
							onClick={() => openRandomGame(source.appIds)}
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
							onClick={() => setBrowsingOtherLists(true)}
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
