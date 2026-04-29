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

<header class="site-header">
	<a class="brand" href="/" data-secret-login aria-label="Home">
		<span class="mark">JD</span>
	</a>
	<nav class="site-nav">
		<a href="/">posts</a>
	</nav>
</header>

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

	.site-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		z-index: 40;
		mix-blend-mode: difference;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		text-decoration: none;
		color: var(--color-text);
		cursor: pointer;
	}

	.mark {
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 400;
		font-size: 1.4rem;
		letter-spacing: 0.02em;
		line-height: 1;
		color: #fff;
	}

	.site-nav {
		display: flex;
		gap: 1.25rem;
	}

	.site-nav a {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #fff;
		text-decoration: none;
		opacity: 0.85;
	}

	.site-nav a:hover {
		opacity: 1;
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
