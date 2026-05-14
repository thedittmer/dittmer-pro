<script lang="ts">
	import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
	import { currentUser } from '$lib/pocketbase';
	import { getAnimation } from '$lib/posts/animations';
	import MarkdownPlayground from '$lib/posts/MarkdownPlayground.svelte';

	let { data } = $props();
	const post = $derived(data.post);
	const bodyHtml = $derived(data.bodyHtml);
	const bodyChunks = $derived(data.bodyChunks);
	const Animation = $derived(getAnimation(post.animation_key));

	const isScheduled = $derived(
		post.publish_at && new Date(post.publish_at.replace(' ', 'T')).getTime() > Date.now()
	);

	function fileUrl(filename: string, thumbSize?: string) {
		const q = thumbSize ? `?thumb=${thumbSize}` : '';
		return `${PUBLIC_POCKETBASE_URL}/api/files/${post.collectionId}/${post.id}/${filename}${q}`;
	}

	function youtubeEmbed(url: string) {
		const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
		return m ? `https://www.youtube.com/embed/${m[1]}` : null;
	}

	function vimeoEmbed(url: string) {
		const m = url.match(/vimeo\.com\/(\d+)/);
		return m ? `https://player.vimeo.com/video/${m[1]}` : null;
	}

	function fmtDate(s: string) {
		return new Date(s).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	const TYPE_LABEL: Record<string, string> = {
		animation: 'animation',
		text: 'essay',
		gallery: 'gallery',
		video: 'video',
		poem: 'poem'
	};
</script>

<svelte:head>
	<title>{post.title} — Jason Dittmer</title>
</svelte:head>

<article class="post">
	<header class="post-header">
		<span class="text-meta">
			{TYPE_LABEL[post.type] ?? post.type} · {fmtDate(post.created)}
			{#if !post.published}
				<span class="draft"> · draft</span>
			{:else if isScheduled}
				<span class="scheduled"> · scheduled · {fmtDate(post.publish_at)}</span>
			{/if}
		</span>
		<h1 class="post-title">{post.title}</h1>
		{#if $currentUser?.admin}
			<a class="edit-link" href={`/posts/${post.slug || post.id}/edit`}>edit →</a>
		{/if}
	</header>

	<div class="post-body">
		{#if post.type === 'animation'}
			{#if Animation}
				<Animation autoplay={post.autoplay} />
			{:else}
				<p class="muted">
					Animation "<code>{post.animation_key}</code>" is not registered in
					<code>src/lib/posts/animations</code>.
				</p>
			{/if}
		{:else if post.type === 'text' || post.type === 'poem'}
			{#each bodyChunks as chunk}
				{#if chunk.type === 'html'}
					<div class="prose" class:poem={post.type === 'poem'}>{@html chunk.html}</div>
				{:else if chunk.type === 'playground'}
					<div class="playground-wrap"><MarkdownPlayground /></div>
				{/if}
			{/each}
		{:else if post.type === 'gallery'}
			{#if post.images.length === 0}
				<p class="muted">No images in this gallery yet.</p>
			{:else}
				<div class="gallery">
					{#each post.images as image}
						<a href={fileUrl(image)} target="_blank" rel="noopener" class="gallery-tile">
							<img src={fileUrl(image, '1200x900')} alt="" />
						</a>
					{/each}
				</div>
			{/if}
			{#if bodyHtml}
				<div class="prose">{@html bodyHtml}</div>
			{/if}
		{:else if post.type === 'video'}
			{#if youtubeEmbed(post.video_url)}
				<div class="video-wrap">
					<iframe
						src={youtubeEmbed(post.video_url)}
						title={post.title}
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen
					></iframe>
				</div>
			{:else if vimeoEmbed(post.video_url)}
				<div class="video-wrap">
					<iframe
						src={vimeoEmbed(post.video_url)}
						title={post.title}
						allow="autoplay; fullscreen; picture-in-picture"
						allowfullscreen
					></iframe>
				</div>
			{:else if post.video_url}
				<video controls class="video-file" src={post.video_url}>
					<track kind="captions" />
				</video>
			{:else}
				<p class="muted">No video URL set.</p>
			{/if}
			{#if bodyHtml}
				<div class="prose">{@html bodyHtml}</div>
			{/if}
		{/if}
	</div>

	<footer class="post-footer">
		<a class="home-link" href="/">← back to all posts</a>
	</footer>
</article>

<style>
	.post {
		max-width: 64rem;
		margin: 0 auto;
		padding: 6rem 1.5rem 6rem;
	}

	.post-header {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		margin-bottom: 3rem;
	}

	.post-title {
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 300;
		font-size: clamp(2.4rem, 6vw, 4.8rem);
		line-height: 1.05;
		letter-spacing: -0.01em;
		max-width: 50rem;
	}

	.edit-link {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-accent);
		text-decoration: none;
		border: 1px solid var(--color-border);
		padding: 0.4rem 0.8rem;
		border-radius: 3px;
	}

	.draft,
	.scheduled {
		color: var(--color-accent);
		font-weight: 600;
	}

	.playground-wrap {
		max-width: 64rem;
		margin: 1.5rem auto;
	}

	.post-body {
		min-height: 30vh;
	}

	.muted {
		color: var(--color-muted);
		text-align: center;
		font-style: italic;
		font-family: var(--font-display);
	}

	.prose {
		font-family: var(--font-display);
		font-size: 1.25rem;
		line-height: 1.7;
		max-width: 38rem;
		margin: 0 auto;
		color: var(--color-text);
	}

	.prose :global(p) {
		margin: 1.2em 0;
	}

	.prose :global(a) {
		color: var(--color-accent);
	}

	.prose :global(strong) {
		font-weight: 500;
	}

	.prose.poem {
		text-align: center;
		font-style: italic;
		white-space: pre-wrap;
		font-size: 1.4rem;
		line-height: 2;
	}

	.gallery {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 0.75rem;
	}

	.gallery-tile {
		display: block;
		overflow: hidden;
		border-radius: 2px;
	}

	.gallery-tile img {
		display: block;
		width: 100%;
		aspect-ratio: 4 / 3;
		object-fit: cover;
		transition: transform 0.4s ease;
	}

	.gallery-tile:hover img {
		transform: scale(1.04);
	}

	.video-wrap {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
	}

	.video-wrap iframe {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
		border-radius: 4px;
	}

	.video-file {
		display: block;
		width: 100%;
		border-radius: 4px;
	}

	.post-footer {
		margin-top: 6rem;
		padding-top: 2rem;
		border-top: 1px solid var(--color-border);
		text-align: center;
	}

	.home-link {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-muted);
		text-decoration: none;
	}

	.home-link:hover {
		color: var(--color-accent);
	}
</style>
