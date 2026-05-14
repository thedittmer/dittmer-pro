/// <reference path="../pb_data/types.d.ts" />
// Trip-tracking schema. Three collections:
//   vehicles — fully private to admin
//   trips    — public can read where published=true; admin manages
//   stops    — public can read when their parent trip is published; admin manages
//
// PocketBase has no native geo-point type, so coords are stored as flat
// lat/lng number pairs. Easy to filter/sort and easy to use with Mapbox.
migrate(
	(app) => {
		// vehicles -----------------------------------------------------------
		const vehicles = new Collection({
			type: 'base',
			name: 'vehicles',
			listRule: '@request.auth.admin = true',
			viewRule: '@request.auth.admin = true',
			createRule: '@request.auth.admin = true',
			updateRule: '@request.auth.admin = true',
			deleteRule: '@request.auth.admin = true',
			fields: [
				{ name: 'name', type: 'text', required: true, min: 1, max: 120 },
				{ name: 'make', type: 'text', max: 80 },
				{ name: 'model', type: 'text', max: 80 },
				{ name: 'year', type: 'number' },
				{ name: 'nickname', type: 'text', max: 80 },
				{ name: 'starting_odometer', type: 'number' },
				{ name: 'notes', type: 'text' },
				{ name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
				{ name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
			]
		});
		app.save(vehicles);

		// trips --------------------------------------------------------------
		const trips = new Collection({
			type: 'base',
			name: 'trips',
			listRule: 'published = true || @request.auth.admin = true',
			viewRule: 'published = true || @request.auth.admin = true',
			createRule: '@request.auth.admin = true',
			updateRule: '@request.auth.admin = true',
			deleteRule: '@request.auth.admin = true',
			fields: [
				{ name: 'name', type: 'text', required: true, min: 1, max: 200 },
				{ name: 'slug', type: 'text', max: 120, pattern: '^[a-z0-9-]*$' },
				{ name: 'description', type: 'text', max: 5000 },
				{ name: 'origin', type: 'text', max: 200 },
				{ name: 'destination', type: 'text', max: 200 },
				{ name: 'origin_lat', type: 'number' },
				{ name: 'origin_lng', type: 'number' },
				{ name: 'destination_lat', type: 'number' },
				{ name: 'destination_lng', type: 'number' },
				{ name: 'start_date', type: 'date' },
				{ name: 'end_date', type: 'date' },
				{
					name: 'featured_image',
					type: 'file',
					maxSelect: 1,
					maxSize: 10 * 1024 * 1024,
					mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
					thumbs: ['400x300', '1200x900']
				},
				{
					name: 'vehicle',
					type: 'relation',
					collectionId: vehicles.id,
					maxSelect: 1,
					cascadeDelete: false
				},
				{ name: 'published', type: 'bool' },
				{ name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
				{ name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
			],
			indexes: [
				'CREATE UNIQUE INDEX `idx_trips_slug` ON `trips` (`slug`) WHERE `slug` != \'\''
			]
		});
		app.save(trips);

		// stops --------------------------------------------------------------
		const stops = new Collection({
			type: 'base',
			name: 'stops',
			listRule: 'trip.published = true || @request.auth.admin = true',
			viewRule: 'trip.published = true || @request.auth.admin = true',
			createRule: '@request.auth.admin = true',
			updateRule: '@request.auth.admin = true',
			deleteRule: '@request.auth.admin = true',
			fields: [
				{
					name: 'trip',
					type: 'relation',
					collectionId: trips.id,
					maxSelect: 1,
					required: true,
					cascadeDelete: true
				},
				{
					name: 'type',
					type: 'select',
					maxSelect: 1,
					required: true,
					values: ['gas', 'sightseeing', 'hotel', 'food', 'rest', 'other']
				},
				{ name: 'name', type: 'text', max: 200 },
				{ name: 'lat', type: 'number' },
				{ name: 'lng', type: 'number' },
				{ name: 'address', type: 'text', max: 300 },
				{ name: 'timestamp', type: 'date' },
				{
					name: 'photos',
					type: 'file',
					maxSelect: 30,
					maxSize: 10 * 1024 * 1024,
					mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
					thumbs: ['400x300', '1200x900']
				},
				{ name: 'notes', type: 'text', max: 5000 },
				// Gas-specific fields — only used when type = gas:
				{ name: 'odometer', type: 'number' },
				{ name: 'gallons', type: 'number' },
				{ name: 'price_per_gallon', type: 'number' },
				{ name: 'total_cost', type: 'number' },
				{ name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
				{ name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
			],
			indexes: [
				'CREATE INDEX `idx_stops_trip_timestamp` ON `stops` (`trip`, `timestamp`)'
			]
		});
		app.save(stops);
	},
	(app) => {
		// Drop in reverse dependency order
		for (const name of ['stops', 'trips', 'vehicles']) {
			try {
				app.delete(app.findCollectionByNameOrId(name));
			} catch (_) {}
		}
	}
);
