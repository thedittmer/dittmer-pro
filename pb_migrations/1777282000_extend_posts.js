/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const posts = app.findCollectionByNameOrId('posts');

		// Add fields if missing (idempotent — checks by name first)
		const ensureField = (def) => {
			if (!posts.fields.find((f) => f.name === def.name)) {
				posts.fields.add(new Field(def));
			}
		};

		ensureField({
			name: 'slug',
			type: 'text',
			required: false,
			presentable: false,
			min: 0,
			max: 120,
			pattern: '^[a-z0-9-]*$'
		});

		ensureField({
			name: 'type',
			type: 'select',
			required: true,
			presentable: false,
			maxSelect: 1,
			values: ['animation', 'text', 'gallery', 'video', 'poem']
		});

		ensureField({
			name: 'published',
			type: 'bool',
			required: false,
			presentable: false
		});

		ensureField({
			name: 'animation_key',
			type: 'text',
			required: false,
			presentable: false,
			min: 0,
			max: 120
		});

		ensureField({
			name: 'autoplay',
			type: 'bool',
			required: false,
			presentable: false
		});

		ensureField({
			name: 'cover_image',
			type: 'file',
			required: false,
			presentable: false,
			maxSelect: 1,
			maxSize: 10485760,
			mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
			thumbs: ['400x300', '800x600']
		});

		ensureField({
			name: 'images',
			type: 'file',
			required: false,
			presentable: false,
			maxSelect: 99,
			maxSize: 10485760,
			mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
			thumbs: ['400x300', '1200x900']
		});

		ensureField({
			name: 'video_url',
			type: 'text',
			required: false,
			presentable: false,
			min: 0,
			max: 500
		});

		// Unique index on slug (only when present)
		posts.indexes = [
			'CREATE UNIQUE INDEX `idx_posts_slug` ON `posts` (`slug`) WHERE `slug` != \'\''
		];

		// Access rules: public can read published; admin manages
		posts.listRule = "published = true || @request.auth.admin = true";
		posts.viewRule = "published = true || @request.auth.admin = true";
		posts.createRule = '@request.auth.admin = true';
		posts.updateRule = '@request.auth.admin = true';
		posts.deleteRule = '@request.auth.admin = true';

		app.save(posts);

		// Open up tags collection for public read
		const tags = app.findCollectionByNameOrId('tags');
		tags.listRule = '';
		tags.viewRule = '';
		tags.createRule = '@request.auth.admin = true';
		tags.updateRule = '@request.auth.admin = true';
		tags.deleteRule = '@request.auth.admin = true';
		app.save(tags);
	},
	(app) => {
		// Down: best-effort revert (only fields we added)
		const posts = app.findCollectionByNameOrId('posts');
		[
			'slug',
			'type',
			'published',
			'animation_key',
			'autoplay',
			'cover_image',
			'images',
			'video_url'
		].forEach((name) => {
			const f = posts.fields.find((x) => x.name === name);
			if (f) posts.fields.removeById(f.id);
		});
		posts.indexes = [];
		posts.listRule = null;
		posts.viewRule = null;
		posts.createRule = null;
		posts.updateRule = null;
		posts.deleteRule = null;
		app.save(posts);

		const tags = app.findCollectionByNameOrId('tags');
		tags.listRule = null;
		tags.viewRule = null;
		tags.createRule = null;
		tags.updateRule = null;
		tags.deleteRule = null;
		app.save(tags);
	}
);
