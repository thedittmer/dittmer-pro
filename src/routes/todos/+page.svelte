<script>
	import Todos from "$lib/components/Todos.svelte";
</script>
<svelte:head>
	<title>Dittmer's Todos</title>
</svelte:head>

<main class="p-5 max-w-prose">
	<a href="/" class="underline dark:text-green-500 0">🔙 Back to Home</a>
	<div class="dark:text-white pb-10">
		<h1 class="pb-2 pt-7 text-lg md:text-xl font-bold text-gray-800 dark:text-white">
			Dittmer's Todos
		</h1>
		<p class="pb-2">To do list goes here.</p>
		<Todos />
	</div>
</main>
