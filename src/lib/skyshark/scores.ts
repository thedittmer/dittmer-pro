import { browser } from '$app/environment';
import { pb } from '$lib/pocketbase';

/**
 * High-score persistence for Skyshark.
 *
 * Offline-first: localStorage is the source of truth and always works (no auth).
 * PocketBase sync is best-effort — if the collection doesn't exist or the network
 * is down, we swallow the error and keep the local board. Anonymous (typed name).
 *
 * To enable the remote board, create a PocketBase collection `skyshark_scores`
 * with fields: name (text), score (number). Allow public create + list.
 */

const KEY = 'skyshark.scores';
const COLLECTION = 'skyshark_scores';
const MAX = 10;

export interface ScoreEntry {
	name: string;
	score: number;
	date: string;
}

export function localScores(): ScoreEntry[] {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(KEY);
		const arr = raw ? (JSON.parse(raw) as ScoreEntry[]) : [];
		return Array.isArray(arr) ? arr : [];
	} catch {
		return [];
	}
}

export function bestScore(): number {
	return localScores().reduce((m, e) => Math.max(m, e.score), 0);
}

function saveLocal(name: string, score: number): ScoreEntry[] {
	const entry: ScoreEntry = { name: name.slice(0, 16) || 'PILOT', score, date: new Date().toISOString() };
	const next = [...localScores(), entry].sort((a, b) => b.score - a.score).slice(0, MAX);
	try {
		localStorage.setItem(KEY, JSON.stringify(next));
	} catch {
		/* storage full / disabled — ignore */
	}
	return next;
}

async function syncRemote(name: string, score: number): Promise<void> {
	try {
		await pb.collection(COLLECTION).create({ name: name.slice(0, 16) || 'PILOT', score });
	} catch {
		/* collection missing or offline — local board still stands */
	}
}

/** Save a run. Writes locally (always) and syncs remotely (best-effort). Returns new best. */
export async function saveScore(name: string, score: number): Promise<number> {
	const next = saveLocal(name, score);
	void syncRemote(name, score);
	return next.reduce((m, e) => Math.max(m, e.score), 0);
}

/** Top remote scores, or [] if unavailable. */
export async function fetchRemoteTop(limit = MAX): Promise<ScoreEntry[]> {
	try {
		const list = await pb.collection(COLLECTION).getList(1, limit, { sort: '-score' });
		return list.items.map((i) => ({
			name: String(i.name ?? 'PILOT'),
			score: Number(i.score ?? 0),
			date: String(i.created ?? '')
		}));
	} catch {
		return [];
	}
}
