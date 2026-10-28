export interface Settings {
	/** Turn outgoing audio files into voice messages */
	sendAsVM: boolean
	/** Render every received audio file as a voice message */
	allAsVM: boolean
}

export const DefaultSettings: Settings = {
	sendAsVM: true,
	allAsVM: false,
}

// https://docs.discord.food/resources/message#message-flags
export const IS_VOICE_MESSAGE = 1 << 13

// Placeholder waveform and duration, since we can't decode the audio here
export const WAVEFORM = 'AEtWPyUaGA4OEAcA'
export const DURATION_SECS = 60

export const isAudio = (mimeType: unknown) =>
	typeof mimeType === 'string' && mimeType.startsWith('audio')
