/// <reference path="../pb_data/types.d.ts" />
// Seed a default vehicle and an active trip so /map has something to render
// for the public view. Names are placeholders — edit via the PB dashboard.
const AUTHOR_ID = 'si1wm1cfsdc5dap';

migrate(
	(app) => {
		const vehicles = app.findCollectionByNameOrId('vehicles');
		const trips = app.findCollectionByNameOrId('trips');

		// --- vehicle ---
		let vehicle;
		try {
			vehicle = app.findFirstRecordByFilter('vehicles', 'name = "2007 Honda CR-V"');
		} catch (_) {
			vehicle = new Record(vehicles);
			vehicle.set('name', '2007 Honda CR-V');
			vehicle.set('make', 'Honda');
			vehicle.set('model', 'CR-V');
			vehicle.set('year', 2007);
			vehicle.set('nickname', '');
			vehicle.set('notes', '');
			app.save(vehicle);
		}

		// --- trip ---
		try {
			const existing = app.findFirstRecordByFilter('trips', 'slug = "current-trip"');
			if (existing) return;
		} catch (_) {}

		const trip = new Record(trips);
		trip.set('name', 'Current Trip');
		trip.set('slug', 'current-trip');
		trip.set('description', '');
		trip.set('origin', 'Neosho, MO');
		trip.set('origin_lat', 36.8689);
		trip.set('origin_lng', -94.3677);
		trip.set('destination', '');
		trip.set('vehicle', vehicle.id);
		trip.set('published', true);
		app.save(trip);
	},
	(app) => {
		try {
			const trip = app.findFirstRecordByFilter('trips', 'slug = "current-trip"');
			if (trip) app.delete(trip);
		} catch (_) {}
		try {
			const vehicle = app.findFirstRecordByFilter('vehicles', 'name = "2007 Honda CR-V"');
			if (vehicle) app.delete(vehicle);
		} catch (_) {}
	}
);
