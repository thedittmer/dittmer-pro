<script lang="ts">
	import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
	import { currentUser } from '$lib/pocketbase';

	let { data } = $props();

	const TYPE_LABEL: Record<string, string> = {
		animation: 'animation',
		text: 'essay',
		gallery: 'gallery',
		video: 'video',
		poem: 'poem'
	};

	function thumbUrl(post: { collectionId: string; id: string; cover_image: string }, size = '800x600') {
		if (!post.cover_image) return '';
		return `${PUBLIC_POCKETBASE_URL}/api/files/${post.collectionId}/${post.id}/${post.cover_image}?thumb=${size}`;
	}

	function fmtDate(s: string) {
		return new Date(s).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Jason Dittmer</title>
	<meta
		name="description"
		content="I build for the web and take pictures. Neosho, Missouri."
	/>
</svelte:head>

<section class="stream">
	<header class="stream-head">
		<h1>Jason Dittmer</h1>
		<p>I build for the web and take pictures. Neosho, Missouri.</p>
		{#if $currentUser?.admin}
			<a class="new-link" href="/posts/new">+ new post</a>
		{/if}
	</header>

	{#if data.posts.length === 0}
		<p class="empty">Nothing here yet.</p>
	{:else}
		<ol class="post-list">
			{#each data.posts as post, i}
				<li>
					<a class="post-row" href={`/posts/${post.slug || post.id}`}>
						<span class="num">{String(i + 1).padStart(2, '0')}</span>
						<div class="post-row-body">
							<span class="text-meta">
								{TYPE_LABEL[post.type] ?? post.type} · {fmtDate(post.created)}
								{#if !post.published}<span class="draft"> · draft</span>{/if}
							</span>
							<span class="post-row-title">{post.title}</span>
						</div>
						{#if post.cover_image}
							<img class="thumb" src={thumbUrl(post, '400x300')} alt="" />
						{:else}
							<span class="arrow" aria-hidden="true">→</span>
						{/if}
					</a>
				</li>
			{/each}
		</ol>
	{/if}
</section>

<style>
	.stream {
		max-width: 56rem;
		margin: 0 auto;
		padding: 9rem 1.5rem 8rem;
	}

	.stream-head {
		padding-bottom: 4rem;
		margin-bottom: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.stream-head h1 {
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 300;
		font-size: clamp(2.6rem, 6vw, 4rem);
		line-height: 1;
		letter-spacing: -0.01em;
	}

	.stream-head p {
		color: var(--color-muted);
		font-family: var(--font-display);
		font-size: 1.15rem;
		max-width: 36rem;
	}

	.new-link {
		align-self: flex-start;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-accent);
		text-decoration: none;
		border: 1px solid var(--color-border);
		padding: 0.4rem 0.8rem;
		border-radius: 3px;
		margin-top: 0.5rem;
		transition: border-color 0.2s ease, background 0.2s ease;
	}
	.new-link:hover {
		border-color: var(--color-accent);
		background: rgba(255, 176, 112, 0.08);
	}

	.empty {
		color: var(--color-muted);
		font-style: italic;
		font-family: var(--font-display);
	}

	.post-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		border-top: 1px solid var(--color-border);
	}

	.post-list li {
		border-bottom: 1px solid var(--color-border);
	}

	.post-row {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 1.5rem;
		padding: 2rem 0;
		text-decoration: none;
		color: var(--color-text);
		transition: padding 0.25s ease;
	}

	.post-row:hover {
		padding-left: 0.75rem;
	}

	.post-row:hover .arrow {
		opacity: 1;
		transform: translateX(0);
		color: var(--color-accent);
	}

	.post-row:hover .post-row-title {
		color: var(--color-accent);
	}

	.post-row:hover .thumb {
		border-color: var(--color-accent);
	}

	.num {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--color-faint);
	}

	.post-row-body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.post-row-title {
		font-family: var(--font-display);
		font-size: clamp(1.6rem, 3.5vw, 2.2rem);
		line-height: 1.15;
		font-weight: 400;
		transition: color 0.25s ease;
	}

	.draft {
		color: var(--color-accent);
		font-weight: 600;
	}

	.thumb {
		width: 96px;
		height: 64px;
		object-fit: cover;
		border-radius: 2px;
		border: 1px solid transparent;
		transition: border-color 0.25s ease;
	}

	.arrow {
		font-family: var(--font-mono);
		opacity: 0;
		transform: translateX(-6px);
		transition: opacity 0.25s ease, transform 0.25s ease, color 0.25s ease;
		color: var(--color-muted);
	}

	@media (max-width: 640px) {
		.stream {
			padding: 6rem 1rem 4rem;
		}
		.post-row {
			gap: 1rem;
		}
		.thumb {
			width: 64px;
			height: 48px;
		}
	}
</style>
