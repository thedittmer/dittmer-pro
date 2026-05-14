/// <reference path="../pb_data/types.d.ts" />
// Add a separate, admin-only file field for gas receipts and odometer photos.
// `protected: true` means files require a file-access token to download —
// only authenticated users (admin here) can mint one via pb.files.getToken().
migrate(
	(app) => {
		const stops = app.findCollectionByNameOrId('stops');

		if (!stops.fields.find((f) => f.name === 'receipts')) {
			stops.fields.add(
				new Field({
					name: 'receipts',
					type: 'file',
					maxSelect: 30,
					maxSize: 10 * 1024 * 1024,
					mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
					thumbs: ['400x300', '1200x900'],
					protected: true
				})
			);
		}

		app.save(stops);
	},
	(app) => {
		const stops = app.findCollectionByNameOrId('stops');
		const f = stops.fields.find((x) => x.name === 'receipts');
		if (f) stops.fields.removeById(f.id);
		app.save(stops);
	}
);
