import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import { browser } from '$app/environment';
import PocketBase, { type AuthRecord } from 'pocketbase';
import { writable } from 'svelte/store';

export const pb = new PocketBase(PUBLIC_POCKETBASE_URL);

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
