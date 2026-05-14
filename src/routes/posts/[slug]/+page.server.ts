import type { PageServerLoad } from './$types';
import type { Post } from '$lib/posts/types';
import { error } from '@sveltejs/kit';
import { ClientResponseError } from 'pocketbase';
import { marked } from 'marked';

marked.use({
	gfm: true,
	breaks: false,
	renderer: {
		link(token) {
			const text = this.parser.parseInline(token.tokens ?? []);
			const isExternal = /^https?:\/\//.test(token.href);
			const attrs = isExternal ? ' target="_blank" rel="noopener"' : '';
			const titleAttr = token.title ? ` title="${token.title}"` : '';
			return `<a href="${token.href}"${titleAttr}${attrs}>${text}</a>`;
		}
	}
});

export type BodyChunk =
	| { type: 'html'; html: string }
	| { type: 'playground' };

const PLAYGROUND_RE = /<p>\s*\{\{\s*playground\s*\}\}\s*<\/p>/g;

function chunkBody(html: string): BodyChunk[] {
	const parts = html.split(PLAYGROUND_RE);
	const chunks: BodyChunk[] = [];
	parts.forEach((part, i) => {
		if (part.trim()) chunks.push({ type: 'html', html: part });
		if (i < parts.length - 1) chunks.push({ type: 'playground' });
	});
	return chunks;
}

export const load: PageServerLoad = async ({ params, locals }) => {
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

	const bodyHtml = post.body ? (marked.parse(post.body, { async: false }) as string) : '';
	const bodyChunks = bodyHtml ? chunkBody(bodyHtml) : [];

	return { post, bodyHtml, bodyChunks };
};
