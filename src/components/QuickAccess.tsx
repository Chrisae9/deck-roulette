import {
	ButtonItem,
	Menu,
	MenuItem,
	Navigation,
	PanelSection,
	PanelSectionRow,
	showContextMenu,
} from "@decky/ui"

import {
	availableRouletteSources,
	resolvePinnedSources,
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
	const collections = selectableCollections(collectionStore)
	const availableSources = availableRouletteSources(
		collectionStore,
		settings.excludedCollectionIds
	)
	const pinnedSources = resolvePinnedSources(
		availableSources,
		settings.pinnedSourceIds
	)
	const knownCollectionIds = new Set(
		collections.map((collection) => collection.id)
	)
	const excludedCount = settings.excludedCollectionIds.filter((id) =>
		knownCollectionIds.has(id)
	).length

	const openGamePoolMenu = (event: MouseEvent) => {
		showContextMenu(
			<Menu label="Choose a Game List">
				{availableSources.map((source) => (
					<MenuItem
						key={source.id}
						disabled={source.appIds.length === 0}
						onClick={() => navigateToRandomGame(source.appIds)}
						onOKActionDescription={`Random game from ${source.label}`}
					>
						{source.label} ({source.appIds.length})
					</MenuItem>
				))}
			</Menu>,
			event.currentTarget ?? undefined
		)
	}

	const openSettings = () => {
		Navigation.Navigate(`${SETTINGS_ROUTE}/shortcuts`)
		Navigation.CloseSideMenus()
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
							onClick={() => navigateToRandomGame(source.appIds)}
						>
							{source.label} ({source.appIds.length})
						</ButtonItem>
					</PanelSectionRow>
				))}
				<PanelSectionRow>
					<ButtonItem
						layout="below"
						disabled={!loaded}
						onClick={openGamePoolMenu}
					>
						Choose Another List…
					</ButtonItem>
				</PanelSectionRow>
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
