import { redirect, error } from '@sveltejs/kit';

export async function load({ locals }) {

	let route;
	try {
		route = await locals.pb.collection('pages').getFirstListItem(`slug="818-riverside-dr-neosho-mo"`);
		
	} catch (err) {
		throw error(404);
	}

	return {
		route,
	};
}

export const trailingSlash = 'always';
export const prerender = true;
