import type { PageServerLoad } from './$types';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const token = params.token;
	let result: {
		ok: boolean;
		kind?: string;
		target_collection?: string;
		target_id?: string;
		account_created?: boolean;
		message?: string;
	};

	try {
		const res = await fetch(
			`${PUBLIC_POCKETBASE_URL}/api/social/verify/${encodeURIComponent(token)}`
		);
		const data = await res.json().catch(() => ({}));
		if (res.ok) {
			result = { ok: true, ...data };
		} else {
			result = { ok: false, message: data.message || `Verification failed (${res.status})` };
		}
	} catch (err) {
		result = { ok: false, message: (err as Error).message };
	}

	let backUrl = '/';
	if (result.ok && result.target_collection && result.target_id) {
		if (result.target_collection === 'posts') backUrl = `/posts/${result.target_id}`;
		else if (result.target_collection === 'stops') backUrl = '/map';
	}

	return { result, backUrl };
};
