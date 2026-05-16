<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
	import { pb, currentUser } from '$lib/pocketbase';
	import { REACTIONS, type Reaction, type ReactionType, type TargetCollection } from './types';

	type Props = {
		targetCollection: TargetCollection;
		targetId: string;
	};

	let { targetCollection, targetId }: Props = $props();

	let loaded = $state(false);
	let reactions = $state<Reaction[]>([]);

	let prompting = $state<ReactionType | null>(null);
	let promptEmail = $state('');
	let promptName = $state('');
	let promptHoneypot = $state(''); // never bind in template; bots fill the field below
	let busy = $state(false);
	let errorMessage = $state('');
	let pendingMessage = $state('');

	// Map: { type: count }
	const counts = $derived.by(() => {
		const m: Record<string, number> = {};
		for (const r of reactions) m[r.type] = (m[r.type] || 0) + 1;
		return m;
	});

	const myEmail = $derived($currentUser?.email?.toLowerCase() ?? '');
	const myReactions = $derived(new Set(reactions.filter((r) => r.email === myEmail).map((r) => r.type)));

	async function load() {
		try {
			const result = await pb.collection('reactions').getFullList<Reaction>({
				filter: `target_collection = "${targetCollection}" && target_id = "${targetId}"`,
				sort: '-created'
			});
			reactions = result;
		} catch (_) {
			reactions = [];
		} finally {
			loaded = true;
		}
	}

	onMount(load);

	async function react(type: ReactionType) {
		errorMessage = '';
		pendingMessage = '';
		if ($currentUser?.email) {
			await postReaction(type, $currentUser.email, $currentUser.name || '');
			await load();
			return;
		}
		prompting = type;
	}

	async function submitPrompted(e: SubmitEvent) {
		e.preventDefault();
		if (!prompting || !promptEmail.trim()) return;
		busy = true;
		errorMessage = '';
		try {
			const res = await postReaction(prompting, promptEmail.trim(), promptName.trim());
			if (res.needs_verification) {
				pendingMessage = `Check your inbox to confirm — your ${REACTIONS.find((r) => r.type === prompting)?.label.toLowerCase()} reaction lands once you click the link.`;
			}
			prompting = null;
			promptEmail = '';
			promptName = '';
			await load();
		} catch (err) {
			errorMessage = (err as Error).message;
		} finally {
			busy = false;
		}
	}

	async function postReaction(type: ReactionType, email: string, name: string) {
		const headers: Record<string, string> = { 'Content-Type': 'application/json' };
		if (pb.authStore.token) headers.Authorization = pb.authStore.token;
		const res = await fetch(`${PUBLIC_POCKETBASE_URL}/api/social/react`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				target_collection: targetCollection,
				target_id: targetId,
				type,
				email,
				name,
				honeypot: promptHoneypot
			})
		});
		const data = await res.json().catch(() => ({}));
		if (!res.ok) throw new Error(data.message || 'Request failed');
		return data as { id: string; verified: boolean; needs_verification: boolean };
	}
</script>

<div class="reactions">
	<div class="row">
		{#each REACTIONS as r}
			{@const count = counts[r.type] ?? 0}
			{@const mine = myReactions.has(r.type)}
			<button
				type="button"
				class="rxn"
				class:mine
				onclick={() => react(r.type)}
				aria-label={r.label}
				title={r.label}
				disabled={busy}
			>
				<span class="emoji">{r.emoji}</span>
				{#if count > 0}<span class="count">{count}</span>{/if}
			</button>
		{/each}
	</div>

	{#if prompting}
		<form class="prompt" onsubmit={submitPrompted}>
			<p class="lede">
				Tap <strong>{REACTIONS.find((r) => r.type === prompting)?.emoji}</strong> noted —
				just need your email to land it.
			</p>
			<input
				type="text"
				placeholder="Name (optional)"
				bind:value={promptName}
				autocomplete="name"
			/>
			<input
				type="email"
				placeholder="your@email"
				bind:value={promptEmail}
				required
				autocomplete="email"
			/>
			<!-- honeypot — invisible to humans, irresistible to bots -->
			<input
				type="text"
				name="website"
				tabindex="-1"
				autocomplete="off"
				bind:value={promptHoneypot}
				class="hp"
				aria-hidden="true"
			/>
			<div class="actions">
				<button type="button" class="ghost" onclick={() => (prompting = null)}>cancel</button>
				<button type="submit" class="primary" disabled={busy || !promptEmail.trim()}>
					{busy ? 'sending…' : 'send'}
				</button>
			</div>
			{#if errorMessage}<p class="error">{errorMessage}</p>{/if}
		</form>
	{:else if pendingMessage}
		<p class="pending">{pendingMessage}</p>
	{/if}
</div>

<style>
	.reactions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.rxn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.4rem 0.7rem;
		background: var(--color-surface-2);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 999px;
		cursor: pointer;
		font: inherit;
		font-size: 1rem;
		transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
	}
	.rxn:hover {
		border-color: var(--color-accent);
		background: rgba(255, 176, 112, 0.08);
	}
	.rxn:active {
		transform: scale(0.96);
	}
	.rxn.mine {
		border-color: var(--color-accent);
		background: rgba(255, 176, 112, 0.18);
	}
	.rxn:disabled {
		opacity: 0.6;
		cursor: progress;
	}
	.emoji {
		font-size: 1.1rem;
	}
	.count {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--color-muted);
		min-width: 1ch;
	}
	.rxn.mine .count {
		color: var(--color-accent);
	}

	.prompt {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.8rem 0.9rem;
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		border-radius: 4px;
	}
	.lede {
		margin: 0 0 0.3rem;
		font-size: 0.9rem;
		color: var(--color-muted);
	}
	.prompt input[type='email'],
	.prompt input[type='text']:not(.hp) {
		background: var(--color-surface);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 3px;
		padding: 0.55rem 0.7rem;
		font: inherit;
		font-size: 16px;
	}
	.prompt .hp {
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
		gap: 0.5rem;
	}
	.primary {
		background: var(--color-accent);
		color: var(--color-on-accent);
		border: 0;
		padding: 0.55rem 1rem;
		border-radius: 3px;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		cursor: pointer;
	}
	.primary:disabled {
		opacity: 0.5;
	}
	.ghost {
		background: transparent;
		color: var(--color-muted);
		border: 1px solid var(--color-border);
		padding: 0.55rem 1rem;
		border-radius: 3px;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		cursor: pointer;
	}
	.error {
		color: #ff6b6b;
		font-size: 0.85rem;
		margin: 0;
	}
	.pending {
		font-size: 0.85rem;
		color: var(--color-accent);
		font-style: italic;
		margin: 0;
	}
</style>
