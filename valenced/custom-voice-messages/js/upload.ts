import { getModules } from '@valenced/modules/finders'
import { withProps } from '@valenced/modules/finders/filters'
import { before } from '@valenced/patcher'
import { DURATION_SECS, IS_VOICE_MESSAGE, isAudio, WAVEFORM } from './shared'

interface UploadItem {
	mimeType?: string
	waveform?: string
	durationSecs?: number
	flags?: number
	items?: UploadItem[]
}

function transform(upload: UploadItem | undefined) {
	if (!upload || (upload.flags ?? 0) & IS_VOICE_MESSAGE) return

	const item = upload.items?.[0] ?? upload
	if (!isAudio(item.mimeType)) return

	// Discord only plays voice messages back as Ogg
	item.mimeType = 'audio/ogg'
	item.waveform = WAVEFORM
	item.durationSecs = DURATION_SECS
	upload.flags = (upload.flags ?? 0) | IS_VOICE_MESSAGE
}

export function patchUploads(
	enabled: () => boolean,
	cleanup: (...fns: (() => void)[]) => void,
) {
	const patch = (method: string) =>
		// biome-ignore lint/suspicious/noExplicitAny: Discord's upload APIs are untyped
		getModules(withProps<Record<string, (...args: any[]) => any>>(method), mod => {
			cleanup(
				before(mod, method, args => {
					if (enabled()) transform(args[0] as UploadItem)
					return args
				}),
			)
		})

	return [patch('uploadLocalFiles'), patch('CloudUpload')]
}
