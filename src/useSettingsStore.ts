import { useEffect, useSyncExternalStore } from "react"

import { SettingsStore } from "./settingsStore"

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
