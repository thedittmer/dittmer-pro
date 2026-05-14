// One-shot service worker whose only job is to remove itself.
// Visitors who previously registered a SW on this origin will pick this up,
// it unregisters, clears any caches, and then there's nothing more to fetch.
self.addEventListener('install', (event) => {
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			try {
				const keys = await caches.keys();
				await Promise.all(keys.map((k) => caches.delete(k)));
			} catch {}
			try {
				await self.registration.unregister();
			} catch {}
			const clients = await self.clients.matchAll({ type: 'window' });
			for (const c of clients) c.navigate(c.url);
		})()
	);
});
