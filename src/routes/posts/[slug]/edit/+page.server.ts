import type { PageServerLoad } from './$types';
import type { Post } from '$lib/posts/types';
import { error, redirect } from '@sveltejs/kit';
import { ClientResponseError } from 'pocketbase';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.pb.authStore.record?.admin) redirect(302, `/posts/${params.slug}`);

	const { slug } = params;
	let post: Post | null = null;
	try {
		post = await locals.pb
			.collection('posts')
			.getFirstListItem<Post>(`slug = "${slug.replace(/"/g, '')}"`);
	} catch (err) {
		if (!(err instanceof ClientResponseError) || err.status !== 404) throw err;
		try {
			post = await locals.pb.collection('posts').getOne<Post>(slug);
		} catch (err2) {
			if (err2 instanceof ClientResponseError && err2.status === 404) error(404, 'Not found');
			throw err2;
		}
	}

	if (!post) error(404, 'Not found');
	return { post };
};
