<script>
	import Messages from '$lib/components/Messages.svelte';

	let visible = true;
	function toggleVissible() {
		visible = !visible;
	}

	setTimeout(() => {
		visible = !visible;
	}, 2000);
</script>

<svelte:head>
	<title>Dittmer's Chat Room</title>
</svelte:head>

<main class="p-5">
	<a href="/" class="underline dark:text-green-500 0">🔙 Back to Home</a>
	<div class="max-w-prose dark:text-white pb-10">
		<h1 class="pb-2 pt-7 text-lg md:text-xl font-bold text-gray-800 dark:text-white">
			Dittmer's Chat Room
		</h1>
		<p class="pb-2">Thanks for stoping by. This is just a chat room for fun.</p>
		<p>If we've worked together before or you know me, feel free to send a message.</p>
	</div>

	<Messages />
</main>
