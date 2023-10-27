<script>
	import DndTodos from '$lib/components/DndTodos.svelte';
	import Todos from '$lib/components/Todos.svelte';
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
		<p class="pb-2">
			I'm developing this todos app with <a
				href="https://pocketbase.io"
				class="underline"
				target="_blank">PocketBase</a
			>
			and <a href="https://kit.svelte.dev" class="underline" target="_blank">Sveltekit</a>. It's a
			work in progress.
		</p>
		<p class="pb-2">
			My ambitions are to create more apps using this so-called Spock stack (Svelte + PocketBase).
			Developing a todo app is a good way to work through most of the problems I will need to solve
			when developing the type of software that I want to build.
		</p>
		<p class="pb-2">
			Create some todos and let me know what you think in <a href="/chat" class="underline"
				>my chatroom</a
			>.
		</p>
		<p class="pb-2">
			By the way, unlike the public messages in the chatroom, your todos are private. Of course, I
			can see them, but no one else can.
		</p>
		<DndTodos />
	</div>
</main>
