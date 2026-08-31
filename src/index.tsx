import {
	ButtonItem,
	PanelSection,
	PanelSectionRow,
	staticClasses,
} from "@decky/ui"
import { definePlugin } from "@decky/api"
import { Fragment } from "react"
import { GiPerspectiveDiceSixFacesRandom } from "react-icons/gi"

import { EXCLUDE_COLLECTION_IDS, navigateToRandomGame } from "./utils"

const DeckRoulette = () => {
	const { collectionStore }: { collectionStore?: CollectionStore } = window as any

	const collections = collectionStore?.userCollections ?? []

	const localGames = collectionStore?.localGamesCollection

	const allInstalled = Array.from(
		new Set([
			...(localGames?.visibleApps ?? []).map((app) => app.appid),
			...(collectionStore?.deckDesktopApps?.visibleApps ?? []).map(
				(app) => app.appid
			),
		])
	)

	const myGamesCollection = collectionStore?.myGamesCollection

	return (
		<div>
			<PanelSection title="Random Game">
				{localGames ? (
					<PanelSectionRow>
						<ButtonItem
							layout="below"
							onClick={() =>
								navigateToRandomGame(allInstalled)
							}
						>
							{localGames.displayName} ({allInstalled.length})
						</ButtonItem>
					</PanelSectionRow>
				) : null}
				{myGamesCollection ? (
					<PanelSectionRow>
						<ButtonItem
							layout="below"
							onClick={() =>
								navigateToRandomGame(
									myGamesCollection.visibleApps.map(
										(app) => app.appid
									)
								)
							}
						>
							{myGamesCollection.displayName} (
							{myGamesCollection.visibleApps.length})
						</ButtonItem>
					</PanelSectionRow>
				) : null}
			</PanelSection>
			<PanelSection title="Steam Collections">
				{collections.map((collection) => (
					<Fragment key={collection.id}>
						{EXCLUDE_COLLECTION_IDS.includes(
							collection.id
						) ? null : (
							<PanelSectionRow>
								<ButtonItem
									layout="below"
									onClick={() =>
										navigateToRandomGame(
											collection.visibleApps.map(
												(app) => app.appid
											)
										)
									}
								>
									{collection.displayName} (
									{collection.visibleApps.length})
								</ButtonItem>
							</PanelSectionRow>
						)}
					</Fragment>
				))}
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
