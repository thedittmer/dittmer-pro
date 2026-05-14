import type { PageServerLoad } from './$types';
import type { Post } from '$lib/posts/types';
import { ClientResponseError } from 'pocketbase';
import { SITE_SETTINGS_ID, DEFAULT_TAGLINE } from '$lib/site/settings';

export const load: PageServerLoad = async ({ locals }) => {
	// Visibility is enforced by the posts collection listRule:
	// public sees published+past-publish_at; admin sees everything.
	const postsResult = await locals.pb.collection('posts').getList<Post>(1, 100, {
		sort: '-created'
	});

	let tagline = DEFAULT_TAGLINE;
	try {
		const meta = await locals.pb.collection('meta').getOne(SITE_SETTINGS_ID);
		if (typeof meta.json?.tagline === 'string') tagline = meta.json.tagline;
	} catch (err) {
		if (!(err instanceof ClientResponseError) || err.status !== 404) throw err;
	}

	return {
		tagline,
		posts: postsResult.items.map((p) => ({
			id: p.id,
			title: p.title,
			slug: p.slug,
			type: p.type,
			published: p.published,
			publish_at: p.publish_at,
			cover_image: p.cover_image,
			animation_key: p.animation_key,
			autoplay: p.autoplay,
			collectionId: p.collectionId,
			created: p.created
		}))
	};
};
