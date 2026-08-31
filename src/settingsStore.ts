import { callable } from "@decky/api"
import { useEffect, useSyncExternalStore } from "react"

import { createDefaultSettings, PluginSettings } from "./collectionSettings"

type SettingsSnapshot = {
	settings: PluginSettings
	loaded: boolean
	saving: boolean
	error?: string
}

const getSettings = callable<[], PluginSettings>("get_settings")
const saveSettings = callable<
	[settings: PluginSettings],
	PluginSettings
>("save_settings")

export class SettingsStore {
	private snapshot: SettingsSnapshot = {
		settings: createDefaultSettings(),
		loaded: false,
		saving: false,
	}
	private listeners = new Set<() => void>()
	private loadStarted = false

	subscribe = (listener: () => void) => {
		this.listeners.add(listener)
		return () => this.listeners.delete(listener)
	}

	getSnapshot = () => this.snapshot

	private setSnapshot(snapshot: SettingsSnapshot) {
		this.snapshot = snapshot
		this.listeners.forEach((listener) => listener())
	}

	async load() {
		if (this.loadStarted) return
		this.loadStarted = true

		try {
			const settings = await getSettings()
			this.setSnapshot({ settings, loaded: true, saving: false })
		} catch {
			this.setSnapshot({
				...this.snapshot,
				loaded: true,
				error: "Could not load DeckRoulette settings.",
			})
		}
	}

	async update(
		updateSettings: (settings: PluginSettings) => PluginSettings
	) {
		if (this.snapshot.saving) return

		const previousSettings = this.snapshot.settings
		const nextSettings = updateSettings(previousSettings)
		this.setSnapshot({
			settings: nextSettings,
			loaded: true,
			saving: true,
		})

		try {
			const settings = await saveSettings(nextSettings)
			this.setSnapshot({ settings, loaded: true, saving: false })
		} catch {
			this.setSnapshot({
				settings: previousSettings,
				loaded: true,
				saving: false,
				error: "Could not save DeckRoulette settings.",
			})
		}
	}
}

export const useSettingsStore = (store: SettingsStore) => {
	const snapshot = useSyncExternalStore(
		store.subscribe,
		store.getSnapshot,
		store.getSnapshot
	)

	useEffect(() => {
		void store.load()
	}, [store])

	return snapshot
}
