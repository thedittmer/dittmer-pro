<script>
	import '../app.css';
	import { PUBLIC_FATHOM_ID, PUBLIC_FATHOM_URL } from '$env/static/public';
	import * as Fathom from 'fathom-client';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import LoginModal from '$lib/auth/LoginModal.svelte';
	import HiddenLoginTrigger from '$lib/auth/HiddenLoginTrigger.svelte';

	let { children } = $props();

	if (PUBLIC_FATHOM_ID !== 'DEV') {
		onMount(() => {
			Fathom.load(PUBLIC_FATHOM_ID, { url: PUBLIC_FATHOM_URL });
		});
	}

	$effect(() => {
		page.url.pathname;
		if (browser) Fathom.trackPageview();
	});
</script>

<HiddenLoginTrigger />
<LoginModal />

<main class="site-main">
	{@render children()}
</main>

<footer class="site-footer">
	<span>© Jason Dittmer · Neosho, Missouri</span>
	<a href="https://www.linkedin.com/in/jason-dittmer-04773223/" target="_blank" rel="noopener"
		>LinkedIn</a
	>
</footer>

<style>
	:global(html, body) {
		min-height: 100%;
	}

	.site-main {
		min-height: 100vh;
	}

	.site-footer {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1.5rem;
		justify-content: space-between;
		padding: 2rem 1.5rem;
		border-top: 1px solid var(--color-border);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-muted);
	}

	.site-footer a {
		color: var(--color-text);
		text-decoration: none;
	}

	.site-footer a:hover {
		color: var(--color-accent);
	}
</style>
