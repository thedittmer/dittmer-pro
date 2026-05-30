import { pb } from '$lib/pocketbase';
import type { StudySection } from './types';
import { studySections } from './content';

/**
 * Loads training sections from PocketBase `study_sections` if available, else
 * falls back to the static content bundled in the app (always works offline).
 *
 * Expected PocketBase collection `study_sections` (public read):
 *   order (number), domain (text), title (text), slug (text), summary (text),
 *   scene (text), ready (bool), lines (json: NarrationLine[]).
 * Per-line `audio` URLs (uploaded Kokoro clips) live inside the `lines` json.
 */
export async function loadSections(): Promise<StudySection[]> {
	try {
		const records = await pb.collection('study_sections').getFullList({ sort: 'order' });
		if (!records.length) return studySections;
		return records.map((r) => ({
			id: String(r.id),
			order: Number(r.order ?? 0),
			domain: r.domain,
			title: String(r.title ?? ''),
			slug: String(r.slug ?? ''),
			summary: String(r.summary ?? ''),
			scene: r.scene === 'airspace' ? 'airspace' : 'generic',
			ready: Boolean(r.ready),
			lessons: Array.isArray(r.lessons) ? r.lessons : undefined,
			lines: Array.isArray(r.lines) ? r.lines : []
		}));
	} catch {
		return studySections;
	}
}
