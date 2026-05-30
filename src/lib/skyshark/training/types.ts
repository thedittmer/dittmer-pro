import type { Domain } from '../types';

/**
 * Data shapes for the Skyshark Training guide (the interactive 3D "ground school").
 *
 * Narration is modeled as an ordered list of LINES. The narrator plays them in
 * sequence; each line can focus a 3D element as it's read, which gives perfect
 * audio↔visual sync WITHOUT needing pre-computed timestamps. Today the narrator
 * falls back to the browser's speech synthesis; later, `audio` per line (or one
 * file + captions) points at an uploaded Kokoro clip in PocketBase and nothing
 * else changes.
 */

export type SceneKey =
	| 'airspace'
	| 'weather'
	| 'regulations'
	| 'sectional'
	| 'loading'
	| 'generic';

/** Common lifecycle for an interactive 3D lesson scene (mirrors first-light). */
export interface TrainingScene {
	resize: () => void;
	focus: (key: string | null) => void;
	dispose: () => void;
}

/** A labeled button that focuses a scene element (e.g. an airspace class). */
export interface FocusButton {
	key: string;
	label: string;
}

export interface NarrationLine {
	text: string;
	/** Scene element to highlight while this line is read (scene-specific key). */
	focus?: string | null;
	/** Optional pre-rendered narration clip (PocketBase file URL). Falls back to TTS. */
	audio?: string;
}

/**
 * A bite-sized lesson within a section. Chunking the material into short lessons
 * (each ~3–8 lines) lowers cognitive load and gives natural stopping points,
 * which aids retention. The optional `check` is an active-recall self-test shown
 * at the end of the lesson (the testing effect is the strongest retention tool).
 */
export interface Lesson {
	id: string;
	title: string;
	lines: NarrationLine[];
	check?: { q: string; a: string };
}

export interface StudySection {
	id: string;
	order: number;
	domain: Domain;
	title: string;
	slug: string;
	/** One-line teaser shown in the section nav. */
	summary: string;
	/** Which 3D scene to mount. 'generic' = no bespoke scene yet (coming soon). */
	scene: SceneKey;
	/** Chunked lessons (preferred). If present, the UI shows lesson sub-navigation. */
	lessons?: Lesson[];
	/** Flat narration lines — used for simple sections that aren't chunked yet. */
	lines?: NarrationLine[];
	/** Whether the rich content is built yet (false → shown as "coming soon"). */
	ready: boolean;
}
