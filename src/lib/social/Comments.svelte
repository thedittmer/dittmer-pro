<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
	import { pb, currentUser } from '$lib/pocketbase';
	import type { Comment, TargetCollection } from './types';

	type Props = {
		targetCollection: TargetCollection;
		targetId: string;
	};

	let { targetCollection, targetId }: Props = $props();

	let loaded = $state(false);
	let comments = $state<Comment[]>([]);

	let body = $state('');
	let email = $state('');
	let name = $state('');
	let honeypot = $state('');
	let busy = $state(false);
	let errorMessage = $state('');
	let pendingMessage = $state('');

	const showEmail = $derived(!$currentUser?.email);

	async function load() {
		try {
			const result = await pb.collection('comments').getFullList<Comment>({
				filter: `target_collection = "${targetCollection}" && target_id = "${targetId}"`,
				sort: 'created'
			});
			comments = result;
		} catch (_) {
			comments = [];
		} finally {
			loaded = true;
		}
	}

	onMount(load);

	function fmtTime(iso: string) {
		if (!iso) return '';
		const d = new Date(iso.replace(' ', 'T'));
		if (isNaN(d.getTime())) return iso;
		const min = Math.floor((Date.now() - d.getTime()) / 60_000);
		if (min < 1) return 'just now';
		if (min < 60) return `${min}m`;
		const h = Math.floor(min / 60);
		if (h < 24) return `${h}h`;
		const day = Math.floor(h / 24);
		if (day < 7) return `${day}d`;
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function displayName(c: Comment): string {
		if (c.name) return c.name;
		const local = (c.email || '').split('@')[0];
		return local || 'anon';
	}

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		errorMessage = '';
		pendingMessage = '';
		if (!body.trim()) return;
		const useEmail = $currentUser?.email || email.trim();
		if (!useEmail) {
			errorMessage = 'Please add your email.';
			return;
		}
		busy = true;
		try {
			const headers: Record<string, string> = { 'Content-Type': 'application/json' };
			if (pb.authStore.token) headers.Authorization = pb.authStore.token;
			const res = await fetch(`${PUBLIC_POCKETBASE_URL}/api/social/comment`, {
				method: 'POST',
				headers,
				body: JSON.stringify({
					target_collection: targetCollection,
					target_id: targetId,
					body: body.trim(),
					email: useEmail,
					name: ($currentUser?.name || name).trim(),
					honeypot
				})
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.message || 'Request failed');
			if (data.needs_verification) {
				pendingMessage =
					'Comment received. Check your inbox — once you click the link, it goes live for everyone.';
			} else {
				pendingMessage = 'Posted.';
			}
			body = '';
			email = '';
			name = '';
			await load();
		} catch (err) {
			errorMessage = (err as Error).message;
		} finally {
			busy = false;
		}
	}
</script>

<div class="comments">
	{#if comments.length > 0}
		<ol class="list">
			{#each comments as c}
				<li>
					<header>
						<span class="who">{displayName(c)}</span>
						<span class="when">{fmtTime(c.created)}</span>
					</header>
					<p class="body">{c.body}</p>
				</li>
			{/each}
		</ol>
	{:else if loaded}
		<p class="empty">No comments yet — be the first.</p>
	{/if}

	<form class="form" onsubmit={submit}>
		<textarea
			bind:value={body}
			placeholder="Say something…"
			rows="3"
			maxlength="5000"
			required
		></textarea>
		<div class="row">
			<input
				type="text"
				placeholder="Name (optional)"
				bind:value={name}
				autocomplete="name"
				class="grow"
			/>
			{#if showEmail}
				<input
					type="email"
					placeholder="your@email"
					bind:value={email}
					autocomplete="email"
					required
					class="grow"
				/>
			{/if}
		</div>
		<input
			type="text"
			name="website"
			tabindex="-1"
			autocomplete="off"
			bind:value={honeypot}
			class="hp"
			aria-hidden="true"
		/>
		<div class="actions">
			<button type="submit" class="primary" disabled={busy || !body.trim()}>
				{busy ? 'sending…' : showEmail ? 'send & verify' : 'post'}
			</button>
		</div>
		{#if errorMessage}<p class="error">{errorMessage}</p>{/if}
		{#if pendingMessage}<p class="pending">{pendingMessage}</p>{/if}
		{#if showEmail}
			<p class="hint">
				We'll email a one-click link. Confirm and your comment posts — you'll also be able to sign
				in with a one-time code next time.
			</p>
		{/if}
	</form>
</div>

<style>
	.comments {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.list li {
		padding: 0.7rem 0.9rem;
		background: var(--color-surface-2);
		border-radius: 4px;
	}
	.list header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}
	.who {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-accent);
	}
	.when {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--color-muted);
	}
	.body {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.02rem;
		line-height: 1.5;
		white-space: pre-wrap;
	}
	.empty {
		font-style: italic;
		color: var(--color-muted);
		margin: 0;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	textarea,
	input[type='text']:not(.hp),
	input[type='email'] {
		width: 100%;
		background: var(--color-surface-2);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 3px;
		padding: 0.6rem 0.8rem;
		font: inherit;
		font-size: 16px;
	}
	textarea:focus,
	input:focus {
		outline: none;
		border-color: var(--color-accent);
	}
	.row {
		display: flex;
		gap: 0.5rem;
	}
	.grow {
		flex: 1;
		min-width: 0;
	}
	.hp {
		position: absolute;
		left: -9999px;
		width: 1px;
		height: 1px;
		opacity: 0;
		pointer-events: none;
	}
	.actions {
		display: flex;
		justify-content: flex-end;
	}
	.primary {
		background: var(--color-accent);
		color: var(--color-on-accent);
		border: 0;
		padding: 0.6rem 1.1rem;
		border-radius: 3px;
		font-family: var(--font-mono);
		font-size: 0.74rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		cursor: pointer;
	}
	.primary:disabled {
		opacity: 0.5;
	}
	.error {
		color: #ff6b6b;
		font-size: 0.85rem;
		margin: 0;
	}
	.pending {
		color: var(--color-accent);
		font-style: italic;
		font-size: 0.9rem;
		margin: 0;
	}
	.hint {
		font-size: 0.78rem;
		color: var(--color-muted);
		font-family: var(--font-mono);
		letter-spacing: 0.04em;
		margin: 0;
	}
</style>
