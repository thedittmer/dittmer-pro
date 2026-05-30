/**
 * Core data shapes for the Skyshark Part 107 study shooter.
 *
 * Design notes for the architect:
 * - Multiple-choice is the CANONICAL answer format because phone leads and
 *   free-text typing on touch is out. On desktop, the typed answer resolves to
 *   one of these `choices` (e.g. match against `choices[i].text`).
 * - Every question carries `correctAnswer`, `explanation`, and `sourceRef` so the
 *   wrong-answer teaching overlay can show the right answer + a one-line "why" +
 *   a citation back to the FAA guide. The overlay is a modal pause: the player
 *   must acknowledge before play resumes.
 * - `prompt` can be plain text OR an image (sectional symbols, airspace markers),
 *   so the shape supports the visual chart-reading questions too.
 * - `domain` matches the five level themes (Sky Shark tradition: 5 levels).
 */

/** The Part 107 knowledge domains (FAA ACS Areas I–V). */
export type Domain =
	| 'airspace'
	| 'weather'
	| 'regulations'
	| 'sectional'
	| 'loading-performance'
	| 'operations';

/** A prompt is either text or a visual (chart symbol / airspace marker / METAR snippet image). */
export type Prompt =
	| { kind: 'text'; text: string }
	| { kind: 'image'; src: string; alt: string };

export interface Choice {
	id: string; // stable id, e.g. 'a' | 'b' | 'c' | 'd'
	text: string;
}

export interface Question {
	id: string;
	domain: Domain;
	prompt: Prompt;
	/** 2–4 choices. On mobile these are the tap buttons; on desktop typing maps onto them. */
	choices: Choice[];
	/** id of the correct Choice. */
	correctAnswer: string;
	/** One-line "why", shown in the teaching overlay on a wrong answer. */
	explanation: string;
	/** Citation back to the source material, shown in the overlay. */
	sourceRef: SourceRef;
	/** Optional difficulty for spawn pacing / level ramp. */
	difficulty?: 1 | 2 | 3;
}

export interface SourceRef {
	/** Which document the fact came from. */
	doc: 'faa-remote-pilot-study-guide' | 'faa-acs-uas';
	/** Human-readable locator, e.g. "Ch. 2, p. 5" (FAA guide page numbering). */
	locator: string;
}
