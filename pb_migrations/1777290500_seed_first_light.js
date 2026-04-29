/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const posts = app.findCollectionByNameOrId('posts');

		try {
			const existing = app.findFirstRecordByFilter('posts', 'slug = "first-light"');
			if (existing) return;
		} catch (_) {
			// not found — fall through and create
		}

		const record = new Record(posts);
		record.set('title', 'First Light');
		record.set('slug', 'first-light');
		record.set('type', 'animation');
		record.set('animation_key', 'first-light');
		record.set('autoplay', false);
		record.set('published', true);
		record.set('author', 'si1wm1cfsdc5dap');
		record.set('body', '');

		app.save(record);
	},
	(app) => {
		try {
			const r = app.findFirstRecordByFilter('posts', 'slug = "first-light"');
			if (r) app.delete(r);
		} catch (_) {}
	}
);
