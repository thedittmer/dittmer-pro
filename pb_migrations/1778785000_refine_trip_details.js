/// <reference path="../pb_data/types.d.ts" />
// Update the trip with the real itinerary + end date.
// May 15 (Fri) leave Neosho → Phoenix (pick up Lilly) → San Diego (senior trip)
// → Phoenix Thu May 21 (graduation) → leave Phoenix Fri May 22 → home by May 25.
migrate(
	(app) => {
		try {
			const trip = app.findRecordById('trips', 'b9vpao420fm7kzu');
			trip.set(
				'description',
				"Leaving Neosho Friday morning to pick up Lilly in Phoenix, then west to San Diego for her senior trip together. Back to Phoenix Thursday May 21 for her graduation, then home Friday. Aiming to be back in Neosho by May 25 or sooner. Shooting the D300 + 70-200 + 28mm, plus the F80 with HP5 for keepers."
			);
			trip.set('end_date', '2026-05-25');
			app.save(trip);
		} catch (_) {
			// trip missing — nothing to update
		}
	},
	(_app) => {}
);
