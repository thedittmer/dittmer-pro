/// <reference path="../pb_data/types.d.ts" />
// Capture the rest of what the browser's Geolocation API hands back:
// horizontal accuracy, elevation (+ its accuracy), heading, and speed.
// All optional — they're often null on desktop and sometimes null on
// mobile too (heading/speed are only populated when actually moving).
migrate(
	(app) => {
		const stops = app.findCollectionByNameOrId('stops');

		const fields = [
			{ name: 'accuracy', help: 'Horizontal accuracy in meters (pos.coords.accuracy)' },
			{ name: 'altitude', help: 'Elevation in meters above WGS84 (pos.coords.altitude)' },
			{ name: 'altitude_accuracy', help: 'Vertical accuracy in meters (pos.coords.altitudeAccuracy)' },
			{ name: 'heading', help: 'Direction of travel in degrees from true north (pos.coords.heading)' },
			{ name: 'speed', help: 'Speed in meters per second (pos.coords.speed)' }
		];

		for (const f of fields) {
			if (!stops.fields.find((x) => x.name === f.name)) {
				stops.fields.add(
					new Field({
						name: f.name,
						type: 'number',
						required: false,
						presentable: false,
						help: f.help
					})
				);
			}
		}

		app.save(stops);
	},
	(app) => {
		const stops = app.findCollectionByNameOrId('stops');
		for (const name of ['accuracy', 'altitude', 'altitude_accuracy', 'heading', 'speed']) {
			const f = stops.fields.find((x) => x.name === name);
			if (f) stops.fields.removeById(f.id);
		}
		app.save(stops);
	}
);
