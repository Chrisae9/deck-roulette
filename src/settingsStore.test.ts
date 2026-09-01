import { beforeEach, describe, expect, test, vi } from "vitest"

import {
	createDefaultSettings,
	setCollectionExcluded,
	setSourcePinned,
} from "./collectionSettings"

const { getSettingsMock, saveSettingsMock } = vi.hoisted(() => ({
	getSettingsMock: vi.fn(),
	saveSettingsMock: vi.fn(),
}))

vi.mock("@decky/api", () => ({
	callable: (route: string) =>
		route === "get_settings" ? getSettingsMock : saveSettingsMock,
}))

import { SettingsStore } from "./settingsStore"

describe("SettingsStore", () => {
	beforeEach(() => {
		getSettingsMock.mockReset()
		saveSettingsMock.mockReset()
	})

	test("serializes rapid changes without discarding later input", async () => {
		const defaults = createDefaultSettings()
		getSettingsMock.mockResolvedValue(defaults)

		let finishFirstSave: (settings: typeof defaults) => void = () => undefined
		saveSettingsMock
			.mockImplementationOnce(
				() =>
					new Promise<typeof defaults>((resolve) => {
						finishFirstSave = resolve
					})
			)
			.mockImplementationOnce(async (settings) => settings)

		const store = new SettingsStore()
		await store.load()

		const firstUpdate = store.update((settings) =>
			setSourcePinned(settings, "collection:party", true)
		)
		const secondUpdate = store.update((settings) =>
			setCollectionExcluded(settings, "emulation", true)
		)

		expect(store.getSnapshot()).toMatchObject({
			settings: {
				pinnedSourceIds: [
					"builtin:installed",
					"builtin:my-games",
					"collection:party",
				],
				excludedCollectionIds: ["emulation"],
			},
			saving: true,
		})

		await vi.waitFor(() => expect(saveSettingsMock).toHaveBeenCalledTimes(1))
		finishFirstSave(saveSettingsMock.mock.calls[0][0])
		await Promise.all([firstUpdate, secondUpdate])

		expect(saveSettingsMock).toHaveBeenCalledTimes(2)
		expect(saveSettingsMock.mock.calls[1][0]).toEqual(
			store.getSnapshot().settings
		)
		expect(store.getSnapshot().saving).toBe(false)
	})

	test("rolls back to the persisted settings when a save fails", async () => {
		const defaults = createDefaultSettings()
		getSettingsMock.mockResolvedValue(defaults)
		saveSettingsMock.mockRejectedValue(new Error("save failed"))

		const store = new SettingsStore()
		await store.load()
		await store.update((settings) =>
			setSourcePinned(settings, "collection:party", true)
		)

		expect(store.getSnapshot()).toEqual({
			settings: defaults,
			loaded: true,
			saving: false,
			error: "Could not save DeckRoulette settings.",
		})
	})
})
