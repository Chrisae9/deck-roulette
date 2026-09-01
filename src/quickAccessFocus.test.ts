import { describe, expect, test } from "vitest"

import {
	BROWSE_FOCUS_ID,
	OTHER_LISTS_BACK_FOCUS_ID,
	resolveMainFocus,
	resolveOtherListsFocus,
	SETTINGS_FOCUS_ID,
} from "./quickAccessFocus"

describe("Quick Access focus fallbacks", () => {
	test("restores a pinned shortcut when it still exists", () => {
		expect(resolveMainFocus(["installed", "favorites"], true, "favorites"))
			.toBe("favorites")
	})

	test("falls back to the first pin when the selected shortcut was removed", () => {
		expect(resolveMainFocus(["installed", "favorites"], true, "deleted"))
			.toBe("installed")
	})

	test("keeps browse and settings actions selected when available", () => {
		expect(resolveMainFocus(["installed"], true, BROWSE_FOCUS_ID))
			.toBe(BROWSE_FOCUS_ID)
		expect(resolveMainFocus([], false, SETTINGS_FOCUS_ID))
			.toBe(SETTINGS_FOCUS_ID)
	})

	test("uses a reachable action when no shortcuts are pinned", () => {
		expect(resolveMainFocus([], true)).toBe(BROWSE_FOCUS_ID)
		expect(resolveMainFocus([], false)).toBe(SETTINGS_FOCUS_ID)
	})

	test("restores the last other list across rename-stable IDs", () => {
		expect(resolveOtherListsFocus(["party", "renamed"], "renamed"))
			.toBe("renamed")
	})

	test("falls forward after a selected collection is deleted", () => {
		expect(resolveOtherListsFocus(["party", "emulation"], "deleted"))
			.toBe("party")
	})

	test("focuses Back when no other lists remain", () => {
		expect(resolveOtherListsFocus([], "deleted"))
			.toBe(OTHER_LISTS_BACK_FOCUS_ID)
	})
})
