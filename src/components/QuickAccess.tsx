import {
	ButtonItem,
	Focusable,
	Navigation,
	NavEntryPositionPreferences,
	PanelSection,
	PanelSectionRow,
} from "@decky/ui"
import { ReactNode, RefObject, useEffect, useRef, useState } from "react"

import {
	availableRouletteSources,
	partitionSourcesByPinned,
	selectableCollections,
} from "../gamePools"
import { SETTINGS_ROUTE } from "../routes"
import { SettingsStore } from "../settingsStore"
import { useSettingsStore } from "../useSettingsStore"
import {
	BROWSE_FOCUS_ID,
	focusableSourceIds,
	OTHER_LISTS_BACK_FOCUS_ID,
	resolveMainFocus,
	resolveOtherListsFocus,
	SETTINGS_FOCUS_ID,
} from "../quickAccessFocus"
import { navigateToRandomGame } from "../utils"

type QuickAccessProps = {
	store: SettingsStore
}

type FocusTargetProps = {
	children: ReactNode
	focusRef: RefObject<HTMLDivElement | null>
	preferred: boolean
}

const FocusTarget = ({ children, focusRef, preferred }: FocusTargetProps) => (
	<div ref={preferred ? focusRef : undefined} style={{ width: "100%" }}>
		{children}
	</div>
)

let quickAccessView: "shortcuts" | "other-lists" = "shortcuts"
let lastSelectedOtherSourceId: string | undefined
let lastMainFocusId: string | undefined

export const QuickAccess = ({ store }: QuickAccessProps) => {
	const { collectionStore }: { collectionStore?: CollectionStore } = window as any
	const { settings, loaded, saving, error } = useSettingsStore(store)
	const [browsingOtherLists, setBrowsingOtherLists] = useState(
		quickAccessView === "other-lists"
	)
	const panelRoot = useRef<HTMLDivElement>(null)
	const preferredFocusTarget = useRef<HTMLDivElement>(null)
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
		focusableSourceIds(pinnedSources),
		otherSources.length > 0,
		lastMainFocusId
	)
	const preferredOtherFocusId = resolveOtherListsFocus(
		focusableSourceIds(otherSources),
		lastSelectedOtherSourceId
	)

	useEffect(() => {
		if (!loaded) return

		const root = panelRoot.current
		const ownerWindow = root?.ownerDocument.defaultView
		if (!root || !ownerWindow) return

		let timeout: number | undefined
		const focusPreferredButton = () => {
			if (timeout !== undefined) ownerWindow.clearTimeout(timeout)
			timeout = ownerWindow.setTimeout(() => {
				const target = preferredFocusTarget.current
				target?.querySelector<HTMLElement>("button")?.focus()
			}, 50)
		}
		const observer = new ownerWindow.IntersectionObserver((entries) => {
			if (entries.some(({ isIntersecting }) => isIntersecting)) {
				focusPreferredButton()
			}
		})
		observer.observe(root)
		if (root.getClientRects().length > 0) focusPreferredButton()

		return () => {
			observer.disconnect()
			if (timeout !== undefined) ownerWindow.clearTimeout(timeout)
		}
	}, [browsingOtherLists, loaded, preferredMainFocusId, preferredOtherFocusId])

	const openSettings = () => {
		lastMainFocusId = undefined
		Navigation.Navigate(`${SETTINGS_ROUTE}/shortcuts`)
		Navigation.CloseSideMenus()
	}
	const showOtherLists = () => {
		lastMainFocusId = undefined
		quickAccessView = "other-lists"
		setBrowsingOtherLists(true)
	}
	const showShortcuts = () => {
		lastMainFocusId = undefined
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
			<div ref={panelRoot}>
				<Focusable
					key="other-lists"
					navEntryPreferPosition={NavEntryPositionPreferences.FIRST}
				>
					<PanelSection title="Other Game Lists">
					<PanelSectionRow>
						<FocusTarget
							focusRef={preferredFocusTarget}
							preferred={
								preferredOtherFocusId === OTHER_LISTS_BACK_FOCUS_ID
							}
						>
							<ButtonItem
								{...({
									preferredFocus:
										preferredOtherFocusId === OTHER_LISTS_BACK_FOCUS_ID,
								} as any)}
								layout="below"
								onClick={showShortcuts}
							>
								← Back to Shortcuts
							</ButtonItem>
						</FocusTarget>
					</PanelSectionRow>
					{otherSources.map((source) => (
						<PanelSectionRow key={source.id}>
							<FocusTarget
								focusRef={preferredFocusTarget}
								preferred={source.id === preferredOtherFocusId}
							>
								<ButtonItem
									{...({
										preferredFocus:
											source.id === preferredOtherFocusId,
									} as any)}
									layout="below"
									disabled={source.appIds.length === 0}
									onClick={() =>
										openRandomGame(source.id, source.appIds)
									}
								>
									{source.label} ({source.appIds.length})
								</ButtonItem>
							</FocusTarget>
						</PanelSectionRow>
					))}
					</PanelSection>
				</Focusable>
			</div>
		)
	}

	return (
		<div ref={panelRoot}>
			<Focusable
				key="shortcuts"
				navEntryPreferPosition={NavEntryPositionPreferences.FIRST}
			>
				<PanelSection title="Random Game">
				{pinnedSources.map((source) => (
					<PanelSectionRow key={source.id}>
						<FocusTarget
							focusRef={preferredFocusTarget}
							preferred={source.id === preferredMainFocusId}
						>
							<ButtonItem
								{...({
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
						</FocusTarget>
					</PanelSectionRow>
				))}
				{otherSources.length > 0 ? (
					<PanelSectionRow>
						<FocusTarget
							focusRef={preferredFocusTarget}
							preferred={preferredMainFocusId === BROWSE_FOCUS_ID}
						>
							<ButtonItem
								{...({
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
						</FocusTarget>
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
					<FocusTarget
						focusRef={preferredFocusTarget}
						preferred={preferredMainFocusId === SETTINGS_FOCUS_ID}
					>
						<ButtonItem
							{...({
								preferredFocus:
									preferredMainFocusId === SETTINGS_FOCUS_ID,
							} as any)}
							layout="below"
							disabled={saving}
							description={`${pinnedSources.length} pinned · ${excludedCount} excluded`}
							onClick={openSettings}
						>
							Customize Shortcuts
						</ButtonItem>
					</FocusTarget>
				</PanelSectionRow>
				</PanelSection>
			</Focusable>
		</div>
	)
}
