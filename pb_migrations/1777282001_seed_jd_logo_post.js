/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const posts = app.findCollectionByNameOrId('posts');

		// Skip if a post with this slug already exists
		try {
			const existing = app.findFirstRecordByFilter('posts', 'slug = "jd-logo"');
			if (existing) return;
		} catch (_) {
			// not found — fall through and create
		}

		const record = new Record(posts);
		record.set('title', "Hi, I'm Jason Dittmer ✌️");
		record.set('slug', 'jd-logo');
		record.set('type', 'animation');
		record.set('animation_key', 'jd-logo');
		record.set('autoplay', true);
		record.set('published', true);
		record.set('author', 'si1wm1cfsdc5dap');
		record.set('body', '');

		app.save(record);
	},
	(app) => {
		try {
			const r = app.findFirstRecordByFilter('posts', 'slug = "jd-logo"');
			if (r) app.delete(r);
		} catch (_) {}
	}
);
