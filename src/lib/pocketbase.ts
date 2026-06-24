import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import { browser } from '$app/environment';
import PocketBase, { type AuthRecord } from 'pocketbase';
import { writable } from 'svelte/store';

export const pb = new PocketBase(PUBLIC_POCKETBASE_URL);

// Hydrate the client auth from the server-refreshed cookie. The server
// (hooks.server.ts) keeps the session token fresh on every request, so the
// cookie is more reliable than localStorage, which can silently expire and
// leave client-side writes unauthenticated. Only load when the cookie is
// actually present, so we never clobber a valid localStorage token.
if (browser && document.cookie.includes('pb_auth=')) {
	pb.authStore.loadFromCookie(document.cookie);
}

export const currentUser = writable<AuthRecord>(pb.authStore.record);

function syncCookie() {
	if (!browser) return;
	// Browsers silently drop httpOnly cookies set from JS, so explicitly disable it.
	document.cookie = pb.authStore.exportToCookie({
		secure: location.protocol === 'https:',
		sameSite: 'Lax',
		httpOnly: false,
		path: '/'
	});
}

if (browser && pb.authStore.isValid) syncCookie();

pb.authStore.onChange(() => {
	currentUser.set(pb.authStore.record);
	syncCookie();
});
