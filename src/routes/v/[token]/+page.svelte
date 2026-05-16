<script lang="ts">
	import { openLogin } from '$lib/auth/login-state';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.result.ok ? 'Confirmed' : 'Confirm'} — Jason Dittmer</title>
</svelte:head>

<section class="verify">
	{#if data.result.ok}
		<h1>You're in.</h1>
		<p>
			Your {data.result.kind ?? 'comment'} is live. Thanks for showing up.
		</p>
		{#if data.result.account_created}
			<p class="tip">
				You also have an account here now. Next time, sign in with a one-time code — no more email
				detour.
			</p>
			<div class="actions">
				<a class="btn primary" href={data.backUrl}>← back to {data.result.kind === 'reaction' ? 'where you reacted' : 'the conversation'}</a>
				<button type="button" class="btn ghost" onclick={() => openLogin()}>sign in</button>
			</div>
		{:else}
			<div class="actions">
				<a class="btn primary" href={data.backUrl}>← back</a>
			</div>
		{/if}
	{:else}
		<h1>That link's stale.</h1>
		<p>
			{data.result.message ?? 'The token is invalid or already used.'}
		</p>
		<div class="actions">
			<a class="btn primary" href="/">← home</a>
		</div>
	{/if}
</section>

<style>
	.verify {
		max-width: 32rem;
		margin: 0 auto;
		padding: 8rem 1.5rem 4rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		text-align: center;
	}
	h1 {
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 300;
		font-size: clamp(2rem, 5vw, 3rem);
		margin: 0;
	}
	p {
		font-family: var(--font-display);
		font-size: 1.1rem;
		color: var(--color-muted);
		margin: 0;
	}
	.tip {
		font-size: 0.95rem;
	}
	.actions {
		display: flex;
		justify-content: center;
		gap: 0.6rem;
		margin-top: 1rem;
		flex-wrap: wrap;
	}
	.btn {
		padding: 0.7rem 1.2rem;
		border-radius: 3px;
		font-family: var(--font-mono);
		font-size: 0.78rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		text-decoration: none;
		cursor: pointer;
		border: 1px solid transparent;
	}
	.primary {
		background: var(--color-accent);
		color: var(--color-on-accent);
	}
	.ghost {
		background: transparent;
		color: var(--color-muted);
		border-color: var(--color-border);
	}
</style>
