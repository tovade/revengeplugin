import Page from '@valenced/components/Page'
import { Design } from '@valenced/discord/design'
import { ScrollView } from 'react-native'
import { DefaultSettings } from './shared'
import type { PluginSettingsComponent } from '@valenced/plugins/types'
import type { ComponentProps } from 'react'
import type { Settings } from './shared'

const { TableRowGroup, TableSwitchRow } = Design

type Props = ComponentProps<PluginSettingsComponent<{ jsonStorage: Settings }>>

export default function SettingsComponent({
	api: { jsonStorage: storage },
}: Props) {
	const settings = { ...DefaultSettings, ...storage.use() }

	return (
		<ScrollView>
			<Page>
				<TableRowGroup>
					<TableSwitchRow
						label="Send audio files as voice messages"
						subLabel="Audio you upload is sent as a voice message"
						value={settings.sendAsVM}
						onValueChange={(sendAsVM: boolean) => storage.set({ sendAsVM })}
					/>
					<TableSwitchRow
						label="Show every audio file as a voice message"
						subLabel="Received audio files play inline like voice messages"
						value={settings.allAsVM}
						onValueChange={(allAsVM: boolean) => storage.set({ allAsVM })}
					/>
				</TableRowGroup>
			</Page>
		</ScrollView>
	)
}
