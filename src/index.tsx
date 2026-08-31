import {
	ButtonItem,
	PanelSection,
	PanelSectionRow,
	staticClasses,
	ToggleField,
} from "@decky/ui"
import { callable, definePlugin } from "@decky/api"
import { useEffect, useState } from "react"
import { GiPerspectiveDiceSixFacesRandom } from "react-icons/gi"

import {
	appIdsWithoutExcludedCollections,
	uniqueAppIds,
} from "./gamePools"
import { HIDDEN_COLLECTION_IDS, navigateToRandomGame } from "./utils"

type PluginSettings = {
	excludedCollectionIds: string[]
}

const DEFAULT_SETTINGS: PluginSettings = {
	excludedCollectionIds: [],
}

const getSettings = callable<[], PluginSettings>("get_settings")
const saveSettings = callable<
	[settings: PluginSettings],
	PluginSettings
>("save_settings")

const DeckRoulette = () => {
	const { collectionStore }: { collectionStore?: CollectionStore } = window as any
	const [settings, setSettings] = useState(DEFAULT_SETTINGS)
	const [settingsLoaded, setSettingsLoaded] = useState(false)
	const [settingsError, setSettingsError] = useState<string>()
	const [savingSettings, setSavingSettings] = useState(false)

	useEffect(() => {
		let mounted = true

		getSettings()
			.then((loadedSettings) => {
				if (!mounted) return
				setSettings(loadedSettings)
				setSettingsLoaded(true)
			})
			.catch(() => {
				if (!mounted) return
				setSettingsError("Could not load collection exclusions.")
				setSettingsLoaded(true)
			})

		return () => {
			mounted = false
		}
	}, [])

	const collections = collectionStore?.userCollections ?? []

	const localGames = collectionStore?.localGamesCollection

	const allInstalled = uniqueAppIds([
		...(localGames?.visibleApps ?? []).map((app) => app.appid),
		...(collectionStore?.deckDesktopApps?.visibleApps ?? []).map(
			(app) => app.appid
		),
	])

	const myGamesCollection = collectionStore?.myGamesCollection
	const excludedCollectionIds = settings.excludedCollectionIds
	const selectableCollections = collections.filter(
		(collection) => !HIDDEN_COLLECTION_IDS.includes(collection.id)
	)

	const eligibleInstalled = appIdsWithoutExcludedCollections(
		allInstalled,
		collections,
		excludedCollectionIds
	)

	const eligibleMyGames = appIdsWithoutExcludedCollections(
		(myGamesCollection?.visibleApps ?? []).map((app) => app.appid),
		collections,
		excludedCollectionIds
	)

	const toggleCollectionExclusion = async (
		collectionId: string,
		excluded: boolean
	) => {
		const previousSettings = settings
		const nextSettings: PluginSettings = {
			excludedCollectionIds: excluded
				? Array.from(
						new Set([
							...settings.excludedCollectionIds,
							collectionId,
						])
					)
				: settings.excludedCollectionIds.filter(
						(id) => id !== collectionId
					),
		}

		setSettings(nextSettings)
		setSettingsError(undefined)
		setSavingSettings(true)

		try {
			setSettings(await saveSettings(nextSettings))
		} catch {
			setSettings(previousSettings)
			setSettingsError("Could not save collection exclusions.")
		} finally {
			setSavingSettings(false)
		}
	}

	return (
		<div>
			<PanelSection title="Random Game">
				{localGames ? (
					<PanelSectionRow>
						<ButtonItem
							layout="below"
							disabled={!settingsLoaded || eligibleInstalled.length === 0}
							description={
								settingsLoaded && eligibleInstalled.length === 0
									? "No games remain after collection exclusions."
									: undefined
							}
							onClick={() => navigateToRandomGame(eligibleInstalled)}
						>
							{localGames.displayName} ({eligibleInstalled.length})
						</ButtonItem>
					</PanelSectionRow>
				) : null}
				{myGamesCollection ? (
					<PanelSectionRow>
						<ButtonItem
							layout="below"
							disabled={!settingsLoaded || eligibleMyGames.length === 0}
							description={
								settingsLoaded && eligibleMyGames.length === 0
									? "No games remain after collection exclusions."
									: undefined
							}
							onClick={() => navigateToRandomGame(eligibleMyGames)}
						>
							{myGamesCollection.displayName} ({eligibleMyGames.length})
						</ButtonItem>
					</PanelSectionRow>
				) : null}
			</PanelSection>
			<PanelSection title="Steam Collections">
				{selectableCollections.map((collection) => (
					<PanelSectionRow key={collection.id}>
						<ButtonItem
							layout="below"
							onClick={() =>
								navigateToRandomGame(
									collection.visibleApps.map((app) => app.appid)
								)
							}
						>
							{collection.displayName} ({collection.visibleApps.length})
						</ButtonItem>
					</PanelSectionRow>
				))}
			</PanelSection>
			<PanelSection title="Collection Exclusions">
				{settingsError ? (
					<PanelSectionRow>
						<div>{settingsError}</div>
					</PanelSectionRow>
				) : null}
				{selectableCollections.length === 0 ? (
					<PanelSectionRow>
						<div>No Steam collections found.</div>
					</PanelSectionRow>
				) : (
					selectableCollections.map((collection) => (
						<PanelSectionRow key={collection.id}>
							<ToggleField
								label={`${collection.displayName} (${collection.visibleApps.length})`}
								description="Exclude from Installed and My Games roulette"
								checked={excludedCollectionIds.includes(collection.id)}
								disabled={!settingsLoaded || savingSettings}
								onChange={(excluded) =>
									void toggleCollectionExclusion(collection.id, excluded)
								}
							/>
						</PanelSectionRow>
					))
				)}
			</PanelSection>
		</div>
	)
}

export default definePlugin(() => {
	return {
		name: "DeckRoulette",
		titleView: <div className={staticClasses.Title}>DeckRoulette</div>,
		content: <DeckRoulette />,
		icon: <GiPerspectiveDiceSixFacesRandom />,
		onDismount() {},
	}
})
