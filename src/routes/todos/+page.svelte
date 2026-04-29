<script>
	import DndTodos from '$lib/components/DndTodos.svelte';
</script>

<svelte:head>
	<title>Todos — Jason Dittmer</title>
</svelte:head>

<section class="todos">
	<a class="back" href="/">← back</a>
	<h1>Todos</h1>
	<p class="lede">
		A
		<a href="https://pocketbase.io" target="_blank" rel="noopener">PocketBase</a>
		+
		<a href="https://kit.svelte.dev" target="_blank" rel="noopener">SvelteKit</a> sandbox. Private to me.
	</p>
	<DndTodos />
</section>

<style>
	.todos {
		max-width: 42rem;
		margin: 0 auto;
		padding: 6rem 1.5rem 4rem;
	}
	h1 {
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 300;
		font-size: 3rem;
		margin: 1rem 0 1rem;
	}
	.back {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-muted);
		text-decoration: none;
	}
	.back:hover {
		color: var(--color-accent);
	}
	.lede {
		color: var(--color-muted);
		margin-bottom: 2rem;
	}
	.lede a {
		color: var(--color-accent);
	}
</style>
