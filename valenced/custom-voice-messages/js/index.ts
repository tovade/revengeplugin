import { patchMessageActionSheet } from './actionsheet'
import { interceptMessages } from './messages'
import SettingsComponent from './settings'
import { DefaultSettings } from './shared'
import { patchUploads } from './upload'
import type { Settings } from './shared'

export default plugin<{ jsonStorage: Settings }>({
	jsonStorage: {
		load: true,
		default: DefaultSettings,
	},
	start({ cleanup, jsonStorage: storage, plugin }) {
		const setting = (key: keyof Settings) => () =>
			storage.cache?.[key] ?? DefaultSettings[key]

		cleanup(
			...patchUploads(setting('sendAsVM'), cleanup),
			...interceptMessages(setting('allAsVM')),
			patchMessageActionSheet(e => plugin.reportError(e)),
		)
	},
	SettingsComponent,
})
