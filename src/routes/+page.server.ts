import type { PageServerLoad } from './$types';
import type { Post } from '$lib/posts/types';

export const load: PageServerLoad = async ({ locals }) => {
	const isAdmin = !!locals.pb.authStore.record?.admin;
	const filter = isAdmin ? '' : 'published = true';
	const result = await locals.pb.collection('posts').getList<Post>(1, 100, {
		sort: '-created',
		filter
	});

	return {
		posts: result.items.map((p) => ({
			id: p.id,
			title: p.title,
			slug: p.slug,
			type: p.type,
			published: p.published,
			cover_image: p.cover_image,
			animation_key: p.animation_key,
			autoplay: p.autoplay,
			collectionId: p.collectionId,
			created: p.created
		}))
	};
};
