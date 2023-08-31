<script>
	import { fly } from 'svelte/transition';

	let visible = true;
	function toggleVissible() {
		visible = !visible;
	}

	setTimeout(() => {
		visible = !visible;
	}, 2000);
</script>

<svelte:head>
	<title>Chat with Jason Dittmer</title>
</svelte:head>

<main class="relative h-screen overflow-hidden font-mono bg-white dark:bg-gray-800">
	<div class="relative z-20 flex items-center">
		<div class="container relative flex flex-col items-center justify-between px-6 py-6 mx-auto">
			<div class="flex flex-col">
				<div class="max-w-prose mx-auto md:text-center pt-4">
					<h1
						class="max-w-3xl pb-2 mx-auto text-lg md:text-xl font-bold text-gray-800 dark:text-white"
					>
						Chat with Jason Dittmer
					</h1>
					<p class="text-gray-800 dark:text-white">Live chat app goes here.</p>
				</div>
			</div>
		</div>
	</div>
</main>
