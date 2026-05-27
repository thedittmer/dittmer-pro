/// <reference path="../pb_data/types.d.ts" />
// Add a videos file field to the stops collection for streaming video.
migrate(
	(app) => {
		const stops = app.findCollectionByNameOrId('stops');
		stops.fields.add(
			new Field({
				name: 'videos',
				type: 'file',
				maxSelect: 10,
				maxSize: 200 * 1024 * 1024, // 200 MB
				mimeTypes: [
					'video/mp4',
					'video/quicktime',
					'video/webm',
					'video/x-m4v'
				]
			})
		);
		app.save(stops);
	},
	(app) => {
		const stops = app.findCollectionByNameOrId('stops');
		stops.fields.removeByName('videos');
		app.save(stops);
	}
);
