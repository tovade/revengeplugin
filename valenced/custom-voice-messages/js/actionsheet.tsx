import {
	ActionSheetActionCreators,
	ToastActionCreators,
} from '@valenced/discord/actions'
import { Design } from '@valenced/discord/design'
import { Clipboard } from '@valenced/externals/react-native-clipboard'
import { getModules } from '@valenced/modules/finders'
import { withName, withProps } from '@valenced/modules/finders/filters'
import { instead } from '@valenced/patcher'
import { lookupGeneratedIconComponent } from '@valenced/utils/discord'
import { IS_VOICE_MESSAGE } from './shared'
import type { FC, ReactElement, ReactNode } from 'react'

const { ActionSheet, ActionSheetRow } = Design

interface MessageRecord {
	flags?: number
	attachments?: { url: string }[]
}

type LongPressMessageActionSheet = FC<{ message: MessageRecord }>

type Element = ReactElement<{ children?: ReactNode }>

interface MediaDownloader {
	downloadMediaAsset(url: string, type: number): Promise<unknown>
}

let MediaDownloader: MediaDownloader | undefined

export function patchMessageActionSheet(onError: (e: unknown) => void) {
	let unpatch: (() => void) | undefined

	const unsubscribeDownloader = getModules(
		withProps<MediaDownloader>('downloadMediaAsset'),
		exports => {
			MediaDownloader = exports
		},
	)

	const unsubscribe = getModules(
		// modules/messages/native/long_press/LongPressMessageActionSheet.tsx
		withName<LongPressMessageActionSheet>('LongPressMessageActionSheet'),
		mod => {
			const module = mod as { default: LongPressMessageActionSheet }
			unpatch = instead(module, 'default', (args, Sheet) => {
				const tree = Reflect.apply(Sheet, undefined, args) as Element

				try {
					const [{ message }] = args
					const url = message?.attachments?.[0]?.url
					if (url && (message.flags ?? 0) & IS_VOICE_MESSAGE)
						addToActionSheet(tree, <VoiceMessageActions url={url} />)
				} catch (e) {
					onError(e)
				}

				return tree
			})
		},
		{ returnNamespace: true },
	)

	return () => {
		unsubscribeDownloader()
		unsubscribe()
		unpatch?.()
		MediaDownloader = undefined
	}
}

function addToActionSheet(tree: unknown, group: ReactNode) {
	const sheet = findActionSheet(tree)
	if (!sheet) return

	const children = [sheet.props.children].flat().filter(Boolean)
	children.push(group)
	sheet.props.children = children
}

function findActionSheet(element: unknown): Element | undefined {
	if (!element || typeof element !== 'object') return
	if (Array.isArray(element)) {
		for (const child of element) {
			const found = findActionSheet(child)
			if (found) return found
		}
		return
	}

	const { type, props } = element as Element
	if (type === ActionSheet) return element as Element
	return findActionSheet(props?.children)
}

function RowIcon({ name }: { name: string }) {
	const IconComponent = lookupGeneratedIconComponent(name)
	return IconComponent ? <ActionSheetRow.Icon IconComponent={IconComponent} /> : null
}

const closeAndRun = (action: () => unknown) => () => {
	ActionSheetActionCreators.hideActionSheet()
	action()
}

function VoiceMessageActions({ url }: { url: string }) {
	return (
		<ActionSheetRow.Group>
			{MediaDownloader && (
				<ActionSheetRow
					label="Download Voice Message"
					icon={<RowIcon name="DownloadIcon" />}
					onPress={closeAndRun(() => MediaDownloader!.downloadMediaAsset(url, 0))}
				/>
			)}
			<ActionSheetRow
				label="Copy Voice Message URL"
				icon={<RowIcon name="LinkIcon" />}
				onPress={closeAndRun(() => {
					Clipboard.setString(url)
					ToastActionCreators.open('custom-voice-messages-copied', {
						text: 'Copied voice message URL',
						variant: 'success',
					})
				})}
			/>
		</ActionSheetRow.Group>
	)
}
