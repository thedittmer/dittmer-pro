<script lang="ts">
	import { goto } from '$app/navigation';
	import { pb } from '$lib/pocketbase';
	import type { Post, PostType } from '$lib/posts/types';
	import { POST_TYPES } from '$lib/posts/types';
	import { ClientResponseError } from 'pocketbase';
	import { untrack } from 'svelte';

	let { post, authorId }: { post?: Post; authorId: string } = $props();

	const initial = untrack(() => post);
	const isEdit = !!initial;

	let title = $state(initial?.title ?? '');
	let slug = $state(initial?.slug ?? '');
	let type = $state<PostType>(initial?.type ?? 'text');
	let published = $state(initial?.published ?? false);
	let body = $state(initial?.body ?? '');
	let animationKey = $state(initial?.animation_key ?? '');
	let autoplay = $state(initial?.autoplay ?? true);
	let videoUrl = $state(initial?.video_url ?? '');
	let publishAt = $state(toLocalInput(initial?.publish_at));
	let coverImageFile = $state<FileList | null>(null);
	let imagesFiles = $state<FileList | null>(null);
	let removeCoverImage = $state(false);
	let busy = $state(false);
	let errorMessage = $state('');

	function toLocalInput(iso: string | undefined): string {
		if (!iso) return '';
		// PB stores "2026-05-01 13:00:00.000Z"; convert to local "yyyy-MM-ddTHH:mm" for datetime-local input
		const d = new Date(iso.replace(' ', 'T'));
		if (isNaN(d.getTime())) return '';
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	function fromLocalInput(local: string): string {
		if (!local) return '';
		const d = new Date(local);
		return isNaN(d.getTime()) ? '' : d.toISOString();
	}

	function autoSlug(t: string) {
		return t
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.slice(0, 120);
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		errorMessage = '';
		busy = true;

		const data = new FormData();
		data.set('title', title);
		data.set('slug', slug || autoSlug(title));
		data.set('type', type);
		data.set('published', published ? 'true' : 'false');
		data.set('author', authorId);
		data.set('body', type === 'text' || type === 'poem' || type === 'gallery' || type === 'video' ? body : '');
		data.set('animation_key', type === 'animation' ? animationKey : '');
		data.set('autoplay', type === 'animation' && autoplay ? 'true' : 'false');
		data.set('video_url', type === 'video' ? videoUrl : '');
		data.set('publish_at', fromLocalInput(publishAt));

		if (coverImageFile && coverImageFile.length > 0) {
			data.set('cover_image', coverImageFile[0]);
		} else if (removeCoverImage) {
			data.set('cover_image', '');
		}

		if (type === 'gallery' && imagesFiles && imagesFiles.length > 0) {
			for (const f of Array.from(imagesFiles)) data.append('images+', f);
		}

		try {
			const saved = isEdit
				? await pb.collection('posts').update<Post>(post!.id, data)
				: await pb.collection('posts').create<Post>(data);
			await goto(`/posts/${saved.slug || saved.id}`);
		} catch (err) {
			if (err instanceof ClientResponseError) {
				errorMessage = err.response?.message || err.message;
				const data = err.response?.data as Record<string, { message?: string }> | undefined;
				if (data) {
					const fieldErrs = Object.entries(data)
						.map(([k, v]) => `${k}: ${v.message ?? ''}`)
						.join('; ');
					if (fieldErrs) errorMessage += ` — ${fieldErrs}`;
				}
			} else {
				errorMessage = (err as Error).message;
			}
		} finally {
			busy = false;
		}
	}

	async function handleDelete() {
		if (!post) return;
		if (!confirm(`Delete "${post.title}"?`)) return;
		busy = true;
		try {
			await pb.collection('posts').delete(post.id);
			await goto('/posts');
		} catch (err) {
			errorMessage = (err as Error).message;
			busy = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="form">
	{#if errorMessage}
		<div class="error">{errorMessage}</div>
	{/if}

	<label>
		<span>Title</span>
		<input type="text" bind:value={title} required />
	</label>

	<label>
		<span>Slug <em>(auto from title if blank)</em></span>
		<input type="text" bind:value={slug} placeholder={autoSlug(title)} pattern="[a-z0-9-]*" />
	</label>

	<div class="row">
		<label class="grow">
			<span>Type</span>
			<select bind:value={type}>
				{#each POST_TYPES as t}
					<option value={t}>{t}</option>
				{/each}
			</select>
		</label>

		<label class="check">
			<input type="checkbox" bind:checked={published} />
			<span>Published</span>
		</label>
	</div>

	<label>
		<span>Publish at <em>(blank = now; future = scheduled, hidden from public until then)</em></span>
		<input type="datetime-local" bind:value={publishAt} />
	</label>

	{#if type === 'animation'}
		<label>
			<span>Animation key <em>(matches src/lib/posts/animations key)</em></span>
			<input type="text" bind:value={animationKey} placeholder="jd-logo" />
		</label>
		<label class="check">
			<input type="checkbox" bind:checked={autoplay} />
			<span>Autoplay (otherwise show a Play button)</span>
		</label>
	{:else if type === 'video'}
		<label>
			<span>Video URL <em>(YouTube, Vimeo, or direct file URL)</em></span>
			<input type="url" bind:value={videoUrl} />
		</label>
	{:else if type === 'gallery'}
		<label>
			<span>Add images</span>
			<input type="file" accept="image/*" multiple bind:files={imagesFiles} />
		</label>
	{/if}

	{#if type !== 'animation'}
		<label>
			<span>Body (Markdown)</span>
			<textarea bind:value={body} rows="16" class="mono"></textarea>
		</label>
	{/if}

	<div>
		<label>
			<span>Cover image (optional)</span>
			<input type="file" accept="image/*" bind:files={coverImageFile} />
		</label>
		{#if isEdit && post?.cover_image}
			<label class="check">
				<input type="checkbox" bind:checked={removeCoverImage} />
				<span>Remove existing cover image</span>
			</label>
		{/if}
	</div>

	<div class="actions">
		<button type="submit" disabled={busy} class="primary">
			{busy ? 'Saving…' : isEdit ? 'Save' : 'Create Post'}
		</button>
		{#if isEdit}
			<button type="button" disabled={busy} onclick={handleDelete} class="danger">Delete</button>
		{/if}
	</div>
</form>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		font-family: var(--font-sans);
	}
	.form label {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.form label > span {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-muted);
	}
	.form em {
		font-style: italic;
		opacity: 0.7;
		text-transform: none;
		letter-spacing: 0;
	}
	.form input[type='text'],
	.form input[type='url'],
	.form input[type='datetime-local'],
	.form select,
	.form textarea {
		background: var(--color-surface-2);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 3px;
		padding: 0.7rem 0.9rem;
		font: inherit;
	}
	.form textarea.mono {
		font-family: var(--font-mono);
		font-size: 0.85rem;
	}
	.form input[type='file'] {
		color: var(--color-muted);
		font-family: var(--font-mono);
		font-size: 0.85rem;
	}
	.form input:focus,
	.form select:focus,
	.form textarea:focus {
		outline: none;
		border-color: var(--color-accent);
	}
	.row {
		display: flex;
		align-items: flex-end;
		gap: 1.25rem;
	}
	.grow {
		flex: 1;
	}
	.check {
		flex-direction: row !important;
		align-items: center;
		gap: 0.5rem;
	}
	.check span {
		font-family: var(--font-sans) !important;
		text-transform: none !important;
		letter-spacing: 0 !important;
		font-size: 0.95rem !important;
		color: var(--color-text) !important;
	}
	.actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
	}
	.primary {
		background: var(--color-accent);
		color: #000;
		border: 0;
		padding: 0.7rem 1.4rem;
		font-family: var(--font-mono);
		font-size: 0.78rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		cursor: pointer;
		border-radius: 3px;
	}
	.primary:hover:not(:disabled) {
		filter: brightness(1.08);
	}
	.primary:disabled {
		opacity: 0.5;
	}
	.danger {
		background: transparent;
		border: 0;
		color: #ff6b6b;
		font-family: var(--font-mono);
		font-size: 0.78rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		cursor: pointer;
		text-decoration: underline;
	}
	.error {
		border: 1px solid #ff6b6b;
		color: #ff6b6b;
		padding: 0.75rem 1rem;
		border-radius: 3px;
		font-size: 0.9rem;
	}
</style>
