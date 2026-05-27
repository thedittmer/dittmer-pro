import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'satellite';

const KEY = 'theme';
const CYCLE: Theme[] = ['satellite', 'dark', 'light'];

function initial(): Theme {
	if (!browser) return 'satellite';
	const saved = localStorage.getItem(KEY);
	if (saved === 'light' || saved === 'dark' || saved === 'satellite') return saved;
	return 'satellite';
}

export const theme = writable<Theme>(initial());

function syncThemeColor(t: Theme) {
	if (!browser) return;
	const meta = document.head.querySelector('meta[name="theme-color"]');
	if (meta) meta.setAttribute('content', t === 'light' ? '#f4ecd8' : '#000000');
}

function apply(next: Theme) {
	if (!browser) return;
	localStorage.setItem(KEY, next);
	// satellite uses dark UI chrome
	document.documentElement.setAttribute('data-theme', next === 'light' ? 'light' : 'dark');
	syncThemeColor(next);
}

export function setTheme(next: Theme) {
	theme.set(next);
	apply(next);
}

export function toggleTheme(includeSatellite = true) {
	theme.update((t) => {
		const pool = includeSatellite ? CYCLE : CYCLE.filter((v) => v !== 'satellite');
		const i = pool.indexOf(t);
		const next = pool[(i + 1) % pool.length];
		apply(next);
		return next;
	});
}
