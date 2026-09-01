import { callable } from "@decky/api"

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
	private persistedSettings = this.snapshot.settings
	private listeners = new Set<() => void>()
	private loadStarted = false
	private pendingSaveCount = 0
	private saveQueue: Promise<void> = Promise.resolve()

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
			this.persistedSettings = settings
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
		const nextSettings = updateSettings(this.snapshot.settings)
		this.pendingSaveCount += 1
		this.setSnapshot({
			settings: nextSettings,
			loaded: true,
			saving: true,
		})

		const saveOperation = this.saveQueue.then(async () => {
			try {
				const settings = await saveSettings(nextSettings)
				this.persistedSettings = settings
				this.pendingSaveCount -= 1

				if (this.pendingSaveCount === 0) {
					this.setSnapshot({ settings, loaded: true, saving: false })
				}
			} catch {
				this.pendingSaveCount -= 1
				this.setSnapshot({
					settings:
						this.pendingSaveCount === 0
							? this.persistedSettings
							: this.snapshot.settings,
					loaded: true,
					saving: this.pendingSaveCount > 0,
					error: "Could not save DeckRoulette settings.",
				})
			}
		})

		this.saveQueue = saveOperation
		await saveOperation
	}
}
