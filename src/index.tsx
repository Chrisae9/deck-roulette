import { staticClasses } from "@decky/ui"
import { definePlugin, routerHook } from "@decky/api"
import { GiPerspectiveDiceSixFacesRandom } from "react-icons/gi"

import { CollectionSettings } from "./components/CollectionSettings"
import { QuickAccess } from "./components/QuickAccess"
import { SETTINGS_ROUTE } from "./routes"
import { SettingsStore } from "./settingsStore"

export default definePlugin(() => {
	const settingsStore = new SettingsStore()

	routerHook.addRoute(SETTINGS_ROUTE, () => (
		<CollectionSettings store={settingsStore} />
	))

	return {
		name: "DeckRoulette",
		titleView: <div className={staticClasses.Title}>DeckRoulette</div>,
		content: <QuickAccess store={settingsStore} />,
		icon: <GiPerspectiveDiceSixFacesRandom />,
		onDismount() {
			routerHook.removeRoute(SETTINGS_ROUTE)
		},
	}
})
