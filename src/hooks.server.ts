import PocketBase from 'pocketbase';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.pb = new PocketBase(PUBLIC_POCKETBASE_URL);
	event.locals.pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');

	try {
		if (event.locals.pb.authStore.isValid) {
			await event.locals.pb.collection('users').authRefresh();
		}
	} catch {
		event.locals.pb.authStore.clear();
	}

	const response = await resolve(event);
	// Write the (refreshed) token as a NON-httpOnly cookie so the client-side
	// `pb` can hydrate from the same always-fresh session — otherwise the
	// browser's localStorage token silently expires while the server keeps
	// refreshing its own, and client-side writes fail with empty auth.
	response.headers.append(
		'set-cookie',
		event.locals.pb.authStore.exportToCookie({
			httpOnly: false,
			secure: event.url.protocol === 'https:',
			sameSite: 'Lax',
			path: '/'
		})
	);
	return response;
};
