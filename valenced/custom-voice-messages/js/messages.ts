import { onFluxEventDispatched } from '@valenced/discord/flux'
import { DURATION_SECS, IS_VOICE_MESSAGE, isAudio, WAVEFORM } from './shared'

interface Attachment {
	content_type?: string
	waveform?: string
	duration_secs?: number
}

interface Message {
	flags?: number
	attachments?: Attachment[]
}

function transform(message: Message | undefined) {
	if (!message || (message.flags ?? 0) & IS_VOICE_MESSAGE) return

	const audio = message.attachments?.filter(a => isAudio(a.content_type))
	if (!audio?.length) return

	message.flags = (message.flags ?? 0) | IS_VOICE_MESSAGE
	for (const a of audio) {
		a.waveform ??= WAVEFORM
		a.duration_secs ??= DURATION_SECS
	}
}

// Marks received audio files as voice messages before MessageStore sees them
export function interceptMessages(enabled: () => boolean) {
	return [
		onFluxEventDispatched<{ messages: Message[] }>(
			'LOAD_MESSAGES_SUCCESS',
			payload => {
				if (enabled()) payload.messages?.forEach(transform)
				return payload
			},
		),
		onFluxEventDispatched<{ message: Message }>('MESSAGE_CREATE', payload => {
			if (enabled()) transform(payload.message)
			return payload
		}),
		onFluxEventDispatched<{ message: Message }>('MESSAGE_UPDATE', payload => {
			if (enabled()) transform(payload.message)
			return payload
		}),
	]
}
