/// <reference path="../pb_data/types.d.ts" />
// Backfill the seeded trip with real details from the planning chat.
// Idempotent: running again with the same values is a no-op write.
migrate(
	(app) => {
		try {
			const trip = app.findRecordById('trips', 'b9vpao420fm7kzu');
			trip.set('name', "Lilly's Graduation - Phoenix & San Diego 2026");
			trip.set('slug', 'lillys-graduation-2026');
			trip.set(
				'description',
				'Solo road trip from Neosho to Phoenix to pick up Lilly for her high school graduation, then west to San Diego/La Jolla for a beach trip together. Stopping at the Grand Canyon (South Rim) along the way. Shooting the D300 + 70-200 + 28mm, plus the F80 with HP5 for keepers.'
			);
			trip.set('origin', 'Neosho, MO');
			trip.set('origin_lat', 36.8689);
			trip.set('origin_lng', -94.3677);
			trip.set('destination', 'La Jolla, San Diego, CA');
			trip.set('destination_lat', 32.8328);
			trip.set('destination_lng', -117.2713);
			trip.set('start_date', '2026-05-15');
			app.save(trip);
		} catch (_) {
			// trip with that id no longer exists — nothing to update
		}
	},
	(_app) => {
		// no-op; we didn't snapshot prior values
	}
);
