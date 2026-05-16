/// <reference path="../pb_data/types.d.ts" />
// Social: reactions + comments on stops and posts. Polymorphic targets via
// (target_collection, target_id) so a single collection works for both.
// Unverified rows live in PB but the public listRule hides them; once the
// reader clicks the verification link in the email, verified flips true.
migrate(
	(app) => {
		// reactions -------------------------------------------------------
		const reactions = new Collection({
			type: 'base',
			name: 'reactions',
			listRule: 'verified = true || @request.auth.admin = true',
			viewRule: 'verified = true || @request.auth.admin = true',
			createRule: '', // anyone (anon allowed); hook validates + sends verification
			updateRule: '@request.auth.admin = true',
			deleteRule: '@request.auth.admin = true || @request.auth.email = email',
			fields: [
				{
					name: 'target_collection',
					type: 'text',
					required: true,
					max: 60,
					help: '"stops" or "posts"'
				},
				{ name: 'target_id', type: 'text', required: true, max: 60 },
				{
					name: 'type',
					type: 'select',
					maxSelect: 1,
					required: true,
					values: ['heart', 'fire', 'thumbs', 'laugh', 'wow', 'pray']
				},
				{ name: 'email', type: 'email', required: true },
				{ name: 'name', type: 'text', max: 80 },
				{ name: 'verified', type: 'bool' },
				{ name: 'verify_token', type: 'text', hidden: true, max: 80 },
				{ name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
				{ name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
			],
			indexes: [
				// One reaction per email+type+target — keeps counts honest
				'CREATE UNIQUE INDEX `idx_reactions_unique` ON `reactions` (target_collection, target_id, email, type)',
				'CREATE INDEX `idx_reactions_verify_token` ON `reactions` (verify_token) WHERE verify_token != \'\'',
				'CREATE INDEX `idx_reactions_target` ON `reactions` (target_collection, target_id, verified)'
			]
		});
		app.save(reactions);

		// comments --------------------------------------------------------
		const comments = new Collection({
			type: 'base',
			name: 'comments',
			listRule: 'verified = true || @request.auth.admin = true',
			viewRule: 'verified = true || @request.auth.admin = true',
			createRule: '',
			updateRule: '@request.auth.admin = true || @request.auth.email = email',
			deleteRule: '@request.auth.admin = true || @request.auth.email = email',
			fields: [
				{ name: 'target_collection', type: 'text', required: true, max: 60 },
				{ name: 'target_id', type: 'text', required: true, max: 60 },
				{ name: 'email', type: 'email', required: true },
				{ name: 'name', type: 'text', max: 80 },
				{ name: 'body', type: 'text', required: true, min: 1, max: 5000 },
				{ name: 'verified', type: 'bool' },
				{ name: 'verify_token', type: 'text', hidden: true, max: 80 },
				{ name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
				{ name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
			],
			indexes: [
				'CREATE INDEX `idx_comments_verify_token` ON `comments` (verify_token) WHERE verify_token != \'\'',
				'CREATE INDEX `idx_comments_target` ON `comments` (target_collection, target_id, verified, created)'
			]
		});
		app.save(comments);
	},
	(app) => {
		for (const name of ['comments', 'reactions']) {
			try {
				app.delete(app.findCollectionByNameOrId(name));
			} catch (_) {}
		}
	}
);
