import { getModules } from '@valenced/modules/finders'
import { withProps } from '@valenced/modules/finders/filters'
import { before } from '@valenced/patcher'
import { DURATION_SECS, IS_VOICE_MESSAGE, isAudio, WAVEFORM } from './shared'

interface UploadItem {
	mimeType?: string
	filename?: string
	name?: string
	waveform?: string
	durationSecs?: number
	flags?: number
	items?: UploadItem[]
	files?: UploadItem[]
	uploads?: UploadItem[]
	file?: UploadItem
}

interface RequestAttachment {
	filename?: string
	uploaded_filename?: string
	waveform?: string
	duration_secs?: number
}

interface MessageRequest {
	url?: string
	body?: {
		content?: string
		flags?: number
		attachments?: RequestAttachment[]
	}
}

// biome-ignore lint/suspicious/noExplicitAny: Discord's HTTP and upload APIs are untyped
type AnyFunction = (...args: any[]) => any

interface HTTPModule {
	HTTP: { post: AnyFunction }
	post: AnyFunction
}

type Cleanup = (...fns: (() => void)[]) => void

const AUDIO_EXTENSION = /\.(ogg|opus|oga|mp3|m4a|aac|wav|flac|webm|weba|amr|3gp)$/i
const CREATE_MESSAGE = /\/channels\/\d+\/messages\/?$/

// Audio files picked for upload, so the send request can be matched to them
const pendingAudio = new Set<string>()

function transformUpload(upload: UploadItem | undefined) {
	if (!upload || (upload.flags ?? 0) & IS_VOICE_MESSAGE) return

	const items = upload.items ?? upload.files ?? upload.uploads
	const item = items?.[0] ?? upload
	const file = item.file ?? item
	if (!isAudio(file.mimeType ?? item.mimeType)) return

	// Discord only plays voice messages back as Ogg
	item.mimeType = 'audio/ogg'
	item.waveform = WAVEFORM
	item.durationSecs = DURATION_SECS
	upload.flags = (upload.flags ?? 0) | IS_VOICE_MESSAGE

	const name = file.filename ?? file.name ?? item.filename ?? item.name
	if (name) pendingAudio.add(name)
}

/**
 * The upload patch only changes the local, optimistic message.
 * The server decides what gets stored from the create message request, so it needs the flag,
 * waveform and duration there, like Vencord's VoiceMessages plugin sends them.
 */
function transformRequest(request: MessageRequest | undefined) {
	const body = request?.body
	if (
		!body ||
		typeof request.url !== 'string' ||
		!CREATE_MESSAGE.test(request.url) ||
		(body.flags ?? 0) & IS_VOICE_MESSAGE ||
		// Voice messages can't have text and hold exactly one file
		body.content?.trim() ||
		body.attachments?.length !== 1
	)
		return

	const [attachment] = body.attachments
	const name = attachment.filename ?? ''
	const audio =
		pendingAudio.delete(name) ||
		AUDIO_EXTENSION.test(name) ||
		AUDIO_EXTENSION.test(attachment.uploaded_filename ?? '')
	if (!audio) return

	body.flags = (body.flags ?? 0) | IS_VOICE_MESSAGE
	attachment.waveform ??= WAVEFORM
	attachment.duration_secs ??= DURATION_SECS
}

export function patchUploads(enabled: () => boolean, cleanup: Cleanup) {
	const patch = (method: string) =>
		getModules(withProps<Record<string, AnyFunction>>(method), mod => {
			cleanup(
				before(mod, method, args => {
					if (enabled()) transformUpload(args[0] as UploadItem)
					return args
				}),
			)
		})

	const patchRequests = getModules(
		withProps<HTTPModule>('HTTP', 'post', 'get', 'put', 'patch', 'del'),
		mod => {
			const hook = (args: unknown[]) => {
				if (enabled()) transformRequest(args[0] as MessageRequest)
				return args
			}

			// The client calls both, and they may be different functions
			cleanup(before(mod.HTTP, 'post', hook))
			if (mod.post !== mod.HTTP.post) cleanup(before(mod, 'post', hook))
		},
	)

	return [
		patch('uploadLocalFiles'),
		patch('CloudUpload'),
		patchRequests,
		() => pendingAudio.clear(),
	]
}
