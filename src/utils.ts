import { Navigation } from "@decky/ui"

export const randomIndex = (max: number) => Math.floor(Math.random() * max)

export const navigateToRandomGame = (appIds: number[]) => {
	if (appIds.length === 0) return

	const randomAppId = appIds[randomIndex(appIds.length)]
	Navigation.Navigate(`/library/app/${randomAppId}`)
	Navigation.CloseSideMenus()
}
