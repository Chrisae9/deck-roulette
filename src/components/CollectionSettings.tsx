import {
	ButtonItem,
	PanelSection,
	PanelSectionRow,
	ReorderableEntry,
	ReorderableList,
	SidebarNavigation,
	ToggleField,
} from "@decky/ui"
import { FaFilter, FaThumbtack } from "react-icons/fa"

import {
	createDefaultSettings,
	INSTALLED_SOURCE_ID,
	MY_GAMES_SOURCE_ID,
	setCollectionExcluded,
	setSourcePinned,
} from "../collectionSettings"
import {
	availableRouletteSources,
	resolvePinnedSources,
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

const QuickAccessSettings = ({ store }: SettingsPageProps) => {
	const { collectionStore }: { collectionStore?: CollectionStore } = window as any
	const { settings, loaded, saving, error } = useSettingsStore(store)
	const availableSources = availableRouletteSources(
		collectionStore,
		settings.excludedCollectionIds
	)
	const pinnedSources = resolvePinnedSources(
		availableSources,
		settings.pinnedSourceIds
	)
	const reorderEntries: ReorderableEntry<string>[] = pinnedSources.map(
		(source, position) => ({
			label: `${source.label} (${source.appIds.length})`,
			data: source.id,
			position,
		})
	)

	const saveOrder = (entries: ReorderableEntry<string>[]) => {
		void store.update((currentSettings) => ({
			...currentSettings,
			pinnedSourceIds: entries.flatMap((entry) =>
				entry.data ? [entry.data] : []
			),
		}))
	}

	return (
		<div>
			<PanelSection title="Pinned Order">
				<ErrorRow error={error} />
				<PanelSectionRow>
					<div>
						Pinned pools appear in this order in Quick Access. Select the
						list to begin reordering.
					</div>
				</PanelSectionRow>
				{reorderEntries.length > 0 ? (
					<PanelSectionRow>
						<ReorderableList
							entries={reorderEntries}
							disableReordering={!loaded || saving}
							onSave={saveOrder}
						/>
					</PanelSectionRow>
				) : (
					<PanelSectionRow>
						<div>No game pools are pinned.</div>
					</PanelSectionRow>
				)}
			</PanelSection>
			<PanelSection title="Pin Game Pools">
				{availableSources.map((source) => (
					<PanelSectionRow key={source.id}>
						<ToggleField
							label={`${source.label} (${source.appIds.length})`}
							checked={settings.pinnedSourceIds.includes(source.id)}
							disabled={!loaded || saving}
							onChange={(pinned) =>
								void store.update((currentSettings) =>
									setSourcePinned(currentSettings, source.id, pinned)
								)
							}
						/>
					</PanelSectionRow>
				))}
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
						Reset to Installed and My Games
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
						Excluded collections are removed only from Installed and My
						Games. Their direct roulette pools still work.
					</div>
				</PanelSectionRow>
				<PanelSectionRow>
					<div>
						Installed: {installedCount} eligible · My Games: {myGamesCount}{" "}
						eligible
					</div>
				</PanelSectionRow>
				{collections.map((collection) => (
					<PanelSectionRow key={collection.id}>
						<ToggleField
							label={`${collection.displayName} (${collection.visibleApps.length})`}
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
				title: "Quick Access",
				content: <QuickAccessSettings store={store} />,
				route: `${SETTINGS_ROUTE}/quick-access`,
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
