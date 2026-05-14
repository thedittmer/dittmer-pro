import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

const KEY = 'theme';

function initial(): Theme {
	if (!browser) return 'dark';
	const saved = localStorage.getItem(KEY);
	if (saved === 'light' || saved === 'dark') return saved;
	return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export const theme = writable<Theme>(initial());

function syncThemeColor(t: Theme) {
	if (!browser) return;
	const meta = document.head.querySelector('meta[name="theme-color"]');
	if (meta) meta.setAttribute('content', t === 'dark' ? '#000000' : '#f4ecd8');
}

function apply(next: Theme) {
	if (!browser) return;
	localStorage.setItem(KEY, next);
	document.documentElement.setAttribute('data-theme', next);
	syncThemeColor(next);
}

export function setTheme(next: Theme) {
	theme.set(next);
	apply(next);
}

export function toggleTheme() {
	theme.update((t) => {
		const next: Theme = t === 'dark' ? 'light' : 'dark';
		apply(next);
		return next;
	});
}
