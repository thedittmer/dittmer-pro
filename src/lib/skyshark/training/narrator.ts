import type { NarrationLine } from './types';

/**
 * Plays narration line-by-line and reports which line is active, so the page can
 * highlight captions and the 3D scene can focus the matching element — perfectly
 * synced without timestamps.
 *
 * Source of audio per line, in priority order:
 *   1. line.audio  → an uploaded clip (e.g. Kokoro) played via <audio>.
 *   2. browser speech synthesis (Web Speech API) as a stopgap.
 * Swapping in uploaded audio later requires no page changes — just populate
 * `audio` on the lines (in PocketBase) and this picks it up automatically.
 */

export interface Narrator {
	play(from?: number): void;
	pause(): void;
	resume(): void;
	stop(): void;
	dispose(): void;
}

interface NarratorCallbacks {
	onLine: (index: number, line: NarrationLine) => void;
	onState: (playing: boolean) => void;
	onEnd: () => void;
}

function pickVoice(): SpeechSynthesisVoice | null {
	const voices = window.speechSynthesis.getVoices();
	if (!voices.length) return null;
	// Prefer natural-sounding en-US system voices (mac/Chrome), else any en, else first.
	const prefer = ['Samantha', 'Ava', 'Allison', 'Google US English', 'Microsoft Aria'];
	for (const name of prefer) {
		const v = voices.find((v) => v.name.includes(name));
		if (v) return v;
	}
	return voices.find((v) => v.lang.startsWith('en')) ?? voices[0];
}

export function createNarrator(lines: NarrationLine[], cb: NarratorCallbacks): Narrator {
	const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;
	let i = 0;
	let stopped = true;
	let audioEl: HTMLAudioElement | null = null;

	function emitState(p: boolean) {
		cb.onState(p);
	}

	function speakLine() {
		if (stopped || i >= lines.length) {
			if (!stopped) {
				stopped = true;
				emitState(false);
				cb.onEnd();
			}
			return;
		}
		const line = lines[i];
		cb.onLine(i, line);

		if (line.audio) {
			audioEl = new Audio(line.audio);
			audioEl.onended = () => {
				i += 1;
				speakLine();
			};
			audioEl.onerror = () => {
				i += 1;
				speakLine();
			};
			void audioEl.play().catch(() => {
				i += 1;
				speakLine();
			});
			return;
		}

		if (!hasSpeech) {
			// No TTS available: advance on a reading-time estimate so captions still flow.
			const ms = Math.max(1800, line.text.length * 55);
			window.setTimeout(() => {
				if (stopped) return;
				i += 1;
				speakLine();
			}, ms);
			return;
		}

		const u = new SpeechSynthesisUtterance(line.text);
		const v = pickVoice();
		if (v) u.voice = v;
		u.rate = 0.98;
		u.pitch = 1;
		u.onend = () => {
			if (stopped) return;
			i += 1;
			speakLine();
		};
		window.speechSynthesis.speak(u);
	}

	return {
		play(from = 0) {
			this.stop();
			stopped = false;
			i = Math.max(0, Math.min(from, lines.length - 1));
			emitState(true);
			// Voices can load lazily; nudge if empty.
			if (hasSpeech && !window.speechSynthesis.getVoices().length) {
				window.speechSynthesis.onvoiceschanged = () => speakLine();
				// Fallback in case the event never fires.
				window.setTimeout(() => speakLine(), 250);
			} else {
				speakLine();
			}
		},
		pause() {
			if (audioEl) audioEl.pause();
			else if (hasSpeech) window.speechSynthesis.pause();
			emitState(false);
		},
		resume() {
			if (audioEl) void audioEl.play().catch(() => {});
			else if (hasSpeech) window.speechSynthesis.resume();
			emitState(true);
		},
		stop() {
			stopped = true;
			if (audioEl) {
				audioEl.pause();
				audioEl = null;
			}
			if (hasSpeech) window.speechSynthesis.cancel();
			emitState(false);
		},
		dispose() {
			this.stop();
			if (hasSpeech) window.speechSynthesis.onvoiceschanged = null;
		}
	};
}
