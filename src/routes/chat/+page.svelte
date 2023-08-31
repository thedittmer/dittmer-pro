<script>
	import Messages from '$lib/components/Messages.svelte';
</script>

<svelte:head>
	<title>Dittmer's Chat Room</title>
</svelte:head>

<main class="p-5 max-w-prose">
	<a href="/" class="underline dark:text-green-500 0">🔙 Back to Home</a>
	<div class="dark:text-white pb-10">
		<h1 class="pb-2 pt-7 text-lg md:text-xl font-bold text-gray-800 dark:text-white">
			Dittmer's Chat Room
		</h1>
		<p class="pb-2">Thanks for stoping by my chat room. Feel free to leave a message. I will reply as soon as I can.</p>
	</div>

	<Messages />
</main>
