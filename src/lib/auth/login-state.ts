import { writable } from 'svelte/store';

export const loginOpen = writable(false);

export function openLogin() {
	loginOpen.set(true);
}

export function closeLogin() {
	loginOpen.set(false);
}
