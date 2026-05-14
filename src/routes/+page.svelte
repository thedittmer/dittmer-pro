<script lang="ts">
	import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
	import { currentUser, pb } from '$lib/pocketbase';
	import { invalidateAll } from '$app/navigation';
	import { SITE_SETTINGS_ID } from '$lib/site/settings';
	import { untrack } from 'svelte';

	let { data } = $props();

	let tagline = $state(untrack(() => data.tagline));
	let editing = $state(false);
	let draft = $state('');
	let savingTagline = $state(false);
	let taglineError = $state('');
	let textareaEl: HTMLTextAreaElement | null = $state(null);

	function startEdit() {
		draft = tagline;
		taglineError = '';
		editing = true;
		queueMicrotask(() => {
			textareaEl?.focus();
			textareaEl?.select();
		});
	}

	function cancelEdit() {
		editing = false;
		draft = '';
		taglineError = '';
	}

	async function saveTagline() {
		const next = draft.trim();
		if (!next || next === tagline) {
			cancelEdit();
			return;
		}
		savingTagline = true;
		taglineError = '';
		try {
			await pb.collection('meta').update(SITE_SETTINGS_ID, { json: { tagline: next } });
			tagline = next;
			editing = false;
			await invalidateAll();
		} catch (err) {
			taglineError = (err as Error).message;
		} finally {
			savingTagline = false;
		}
	}

	function onEditorKey(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			saveTagline();
		} else if (e.key === 'Escape') {
			cancelEdit();
		}
	}

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
	<meta name="description" content={tagline} />
</svelte:head>

<section class="stream">
	<header class="stream-head">
		<h1>Jason Dittmer</h1>

		{#if editing}
			<div class="tagline-edit">
				<textarea
					bind:this={textareaEl}
					bind:value={draft}
					onkeydown={onEditorKey}
					rows="2"
					maxlength="240"
					disabled={savingTagline}
				></textarea>
				<div class="tagline-actions">
					<button type="button" onclick={saveTagline} disabled={savingTagline} class="primary">
						{savingTagline ? 'saving…' : 'save'}
					</button>
					<button type="button" onclick={cancelEdit} disabled={savingTagline} class="ghost">
						cancel
					</button>
					<span class="hint">⏎ save · esc cancel</span>
				</div>
				{#if taglineError}<p class="error">{taglineError}</p>{/if}
			</div>
		{:else}
			<p class="tagline">
				{tagline}
				{#if $currentUser?.admin}
					<button
						type="button"
						class="tagline-edit-btn"
						onclick={startEdit}
						aria-label="Edit tagline"
					>
						edit
					</button>
				{/if}
			</p>
		{/if}

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
								{#if !post.published}
									<span class="draft"> · draft</span>
								{:else if post.publish_at && new Date(post.publish_at.replace(' ', 'T')).getTime() > Date.now()}
									<span class="scheduled"> · scheduled · {fmtDate(post.publish_at)}</span>
								{/if}
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

	.tagline {
		color: var(--color-muted);
		font-family: var(--font-display);
		font-size: 1.15rem;
		max-width: 36rem;
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.tagline-edit-btn {
		background: transparent;
		border: 0;
		color: var(--color-faint);
		font-family: var(--font-mono);
		font-size: 0.66rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		cursor: pointer;
		padding: 0.15rem 0.4rem;
		border-radius: 2px;
		opacity: 0;
		transition: opacity 0.2s ease, color 0.2s ease, background 0.2s ease;
	}
	.tagline:hover .tagline-edit-btn,
	.tagline-edit-btn:focus-visible {
		opacity: 1;
	}
	.tagline-edit-btn:hover {
		color: var(--color-accent);
		background: rgba(255, 176, 112, 0.08);
	}

	.tagline-edit {
		max-width: 36rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.tagline-edit textarea {
		width: 100%;
		background: var(--color-surface-2);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 3px;
		padding: 0.75rem 0.9rem;
		font-family: var(--font-display);
		font-size: 1.15rem;
		line-height: 1.4;
		resize: vertical;
	}
	.tagline-edit textarea:focus {
		outline: none;
		border-color: var(--color-accent);
	}
	.tagline-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.tagline-actions .primary {
		background: var(--color-accent);
		color: #000;
		border: 0;
		padding: 0.4rem 0.9rem;
		border-radius: 3px;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		cursor: pointer;
	}
	.tagline-actions .primary:disabled {
		opacity: 0.5;
	}
	.tagline-actions .ghost {
		background: transparent;
		color: var(--color-muted);
		border: 1px solid var(--color-border);
		padding: 0.4rem 0.9rem;
		border-radius: 3px;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		cursor: pointer;
	}
	.tagline-actions .hint {
		color: var(--color-faint);
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.06em;
	}
	.tagline-edit .error {
		color: #ff6b6b;
		font-size: 0.85rem;
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

	.draft,
	.scheduled {
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
