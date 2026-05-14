/// <reference path="../pb_data/types.d.ts" />
// Add publish_at scheduling support.
// - Empty publish_at = goes live as soon as published=true.
// - Future publish_at = scheduled; admin sees it, public doesn't.
// - Past publish_at = live to the public.
migrate(
	(app) => {
		const posts = app.findCollectionByNameOrId('posts');

		if (!posts.fields.find((f) => f.name === 'publish_at')) {
			posts.fields.add(
				new Field({
					name: 'publish_at',
					type: 'date',
					required: false,
					presentable: false
				})
			);
		}

		const visibility =
			'(published = true && (publish_at = "" || publish_at <= @now)) || @request.auth.admin = true';
		posts.listRule = visibility;
		posts.viewRule = visibility;
		posts.createRule = '@request.auth.admin = true';
		posts.updateRule = '@request.auth.admin = true';
		posts.deleteRule = '@request.auth.admin = true';

		app.save(posts);
	},
	(app) => {
		const posts = app.findCollectionByNameOrId('posts');
		const f = posts.fields.find((x) => x.name === 'publish_at');
		if (f) posts.fields.removeById(f.id);
		posts.listRule = 'published = true || @request.auth.admin = true';
		posts.viewRule = 'published = true || @request.auth.admin = true';
		app.save(posts);
	}
);
