import {
	ButtonItem,
	PanelSection,
	PanelSectionRow,
	ReorderableEntry,
	ReorderableList,
	SidebarNavigation,
	ToggleField,
} from "@decky/ui"
import { useState } from "react"
import { FaArrowsAltV, FaFilter, FaThumbtack } from "react-icons/fa"

import {
	createDefaultSettings,
	INSTALLED_SOURCE_ID,
	MY_GAMES_SOURCE_ID,
	setCollectionExcluded,
	setPinnedSourceOrder,
	setSourcePinned,
} from "../collectionSettings"
import {
	availableRouletteSources,
	partitionSourcesByPinned,
	selectableCollections,
} from "../gamePools"
import { SETTINGS_ROUTE } from "../routes"
import { SettingsStore, useSettingsStore } from "../settingsStore"

type SettingsPageProps = {
	store: SettingsStore
}

const ErrorRow = ({ error }: { error?: string }) =>
	error ? (
		<PanelSectionRow>
			<div>{error}</div>
		</PanelSectionRow>
	) : null

const ShortcutSettings = ({ store }: SettingsPageProps) => {
	const { collectionStore }: { collectionStore?: CollectionStore } = window as any
	const { settings, loaded, saving, error } = useSettingsStore(store)
	const [reordering, setReordering] = useState(false)
	const availableSources = availableRouletteSources(
		collectionStore,
		settings.excludedCollectionIds
	)
	const { pinnedSources, availableSources: availableShortcuts } =
		partitionSourcesByPinned(
			availableSources,
			settings.pinnedSourceIds
		)
	const reorderEntries: ReorderableEntry<string>[] = pinnedSources.map(
		(source, position) => ({
			label: (
				<span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
					<FaArrowsAltV />
					{source.label}
				</span>
			),
			data: source.id,
			position,
		})
	)

	const beginReordering = () => {
		setReordering(true)
	}

	const saveOrder = (entries: ReorderableEntry<string>[]) => {
		void store.update((currentSettings) =>
			setPinnedSourceOrder(
				currentSettings,
				entries.flatMap((entry) => (entry.data ? [entry.data] : []))
			)
		)
	}

	if (reordering) {
		return (
			<div>
				<PanelSection title="Reorder Pinned Shortcuts">
					<PanelSectionRow>
						<div>
							Select a shortcut, then choose Reorder in the footer. Move it
							with ↑ or ↓ and choose Save Order when finished.
						</div>
					</PanelSectionRow>
					<PanelSectionRow>
						<ReorderableList
							disableReordering={!loaded || saving}
							entries={reorderEntries}
							onSave={saveOrder}
						/>
					</PanelSectionRow>
					<PanelSectionRow>
						<ButtonItem onClick={() => setReordering(false)}>Done</ButtonItem>
					</PanelSectionRow>
				</PanelSection>
			</div>
		)
	}

	return (
		<div>
			<PanelSection title="Pinned Shortcuts">
				<ErrorRow error={error} />
				<PanelSectionRow>
					<div>These shortcuts appear in Decky Quick Access.</div>
				</PanelSectionRow>
				{pinnedSources.length > 0 ? (
					pinnedSources.map((source) => (
						<PanelSectionRow key={source.id}>
							<ToggleField
								label={source.label}
								checked
								disabled={!loaded || saving}
								onChange={(pinned) =>
									void store.update((currentSettings) =>
										setSourcePinned(currentSettings, source.id, pinned)
									)
								}
							/>
						</PanelSectionRow>
					))
				) : (
					<PanelSectionRow>
						<div>No shortcuts are pinned.</div>
					</PanelSectionRow>
				)}
				<PanelSectionRow>
					<ButtonItem
						disabled={!loaded || saving || pinnedSources.length < 2}
						description={
							pinnedSources.length < 2
								? "Pin at least two shortcuts to change their order."
								: "Use Decky's native reorder controls."
						}
						onClick={beginReordering}
					>
						Change Order…
					</ButtonItem>
				</PanelSectionRow>
			</PanelSection>
			<PanelSection title="Available Shortcuts">
				{availableShortcuts.length > 0 ? (
					availableShortcuts.map((source) => (
						<PanelSectionRow key={source.id}>
							<ToggleField
								label={source.label}
								checked={false}
								disabled={!loaded || saving}
								onChange={(pinned) =>
									void store.update((currentSettings) =>
										setSourcePinned(currentSettings, source.id, pinned)
									)
								}
							/>
						</PanelSectionRow>
					))
				) : (
					<PanelSectionRow>
						<div>Every shortcut is pinned.</div>
					</PanelSectionRow>
				)}
				<PanelSectionRow>
					<ButtonItem
						disabled={!loaded || saving}
						onClick={() =>
							void store.update((currentSettings) => ({
								...currentSettings,
								pinnedSourceIds:
									createDefaultSettings().pinnedSourceIds,
							}))
						}
					>
						Restore Default Shortcuts
					</ButtonItem>
				</PanelSectionRow>
			</PanelSection>
		</div>
	)
}

const ExclusionSettings = ({ store }: SettingsPageProps) => {
	const { collectionStore }: { collectionStore?: CollectionStore } = window as any
	const { settings, loaded, saving, error } = useSettingsStore(store)
	const collections = selectableCollections(collectionStore)
	const availableSources = availableRouletteSources(
		collectionStore,
		settings.excludedCollectionIds
	)
	const installedCount =
		availableSources.find((source) => source.id === INSTALLED_SOURCE_ID)
			?.appIds.length ?? 0
	const myGamesCount =
		availableSources.find((source) => source.id === MY_GAMES_SOURCE_ID)
			?.appIds.length ?? 0

	return (
		<div>
			<PanelSection title="Collection Exclusions">
				<ErrorRow error={error} />
				<PanelSectionRow>
					<div>
						Remove collections from Installed and My Games only. Direct
						collection shortcuts still work.
						<div style={{ opacity: 0.7, marginTop: "8px" }}>
							Eligible: Installed {installedCount} · My Games {myGamesCount}
						</div>
					</div>
				</PanelSectionRow>
				{collections.map((collection) => (
					<PanelSectionRow key={collection.id}>
						<ToggleField
							label={collection.displayName}
							checked={settings.excludedCollectionIds.includes(
								collection.id
							)}
							disabled={!loaded || saving}
							onChange={(excluded) =>
								void store.update((currentSettings) =>
									setCollectionExcluded(
										currentSettings,
										collection.id,
										excluded
									)
								)
							}
						/>
					</PanelSectionRow>
				))}
				<PanelSectionRow>
					<ButtonItem
						disabled={
							!loaded ||
							saving ||
							settings.excludedCollectionIds.length === 0
						}
						onClick={() =>
							void store.update((currentSettings) => ({
								...currentSettings,
								excludedCollectionIds: [],
							}))
						}
					>
						Clear Exclusions
					</ButtonItem>
				</PanelSectionRow>
			</PanelSection>
		</div>
	)
}

export const CollectionSettings = ({ store }: SettingsPageProps) => (
	<SidebarNavigation
		pages={[
			{
				title: "Shortcuts",
				content: <ShortcutSettings store={store} />,
				route: `${SETTINGS_ROUTE}/shortcuts`,
				icon: <FaThumbtack />,
			},
			{
				title: "Exclusions",
				content: <ExclusionSettings store={store} />,
				route: `${SETTINGS_ROUTE}/exclusions`,
				icon: <FaFilter />,
			},
		]}
	/>
)
