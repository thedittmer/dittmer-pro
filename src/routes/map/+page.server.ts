import type { PageServerLoad } from './$types';
import type { Trip, Stop } from '$lib/trips/types';
import { ClientResponseError } from 'pocketbase';

export const load: PageServerLoad = async ({ locals }) => {
	const isAdmin = !!locals.pb.authStore.record?.admin;

	let currentTrip: Trip | null = null;
	let stops: Stop[] = [];

	try {
		currentTrip = await locals.pb
			.collection('trips')
			.getFirstListItem<Trip>('published = true', { sort: '-created' });

		const result = await locals.pb.collection('stops').getList<Stop>(1, 500, {
			filter: `trip = "${currentTrip.id}" && lat != null && lng != null`,
			sort: 'timestamp,created'
		});

		stops = result.items.filter(
			(s) => typeof s.lat === 'number' && typeof s.lng === 'number'
		);
	} catch (err) {
		if (!(err instanceof ClientResponseError) || err.status !== 404) throw err;
	}

	const lastStop = stops.length > 0 ? stops[stops.length - 1] : null;
	return { isAdmin, currentTrip, stops, lastStop };
};
