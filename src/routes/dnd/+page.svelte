<script>
	import DndTodos from '$lib/components/DndTodos.svelte';
</script>

<svelte:head>
	<title>DND Todos</title>
</svelte:head>

<main class="p-5 max-w-prose">
	<a href="/" class="underline dark:text-green-500 0">🔙 Back to Home</a>
	<div class="dark:text-white pb-10">
		<h1 class="pb-2 pt-7 text-lg md:text-xl font-bold text-gray-800 dark:text-white">
			DND Todos
		</h1>
		<DndTodos />
	</div>
</main>

