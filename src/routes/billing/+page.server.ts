import type { PageServerLoad } from './$types';
import type { Client, Project, Payment } from '$lib/billing/types';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.pb.authStore.record?.admin) {
		redirect(302, '/');
	}

	let projects: Project[] = [];
	let clients: Client[] = [];
	let payments: Payment[] = [];

	try {
		const [pRes, cRes, payRes] = await Promise.all([
			locals.pb.collection('projects').getFullList<Project>({ sort: 'business_name' }),
			locals.pb.collection('clients').getFullList<Client>({ sort: 'name' }),
			locals.pb.collection('payments').getFullList<Payment>({ sort: '-received_date,-created' })
		]);
		projects = pRes;
		clients = cRes;
		payments = payRes;
	} catch (err) {
		error(500, (err as Error).message);
	}

	return { projects, clients, payments };
};
