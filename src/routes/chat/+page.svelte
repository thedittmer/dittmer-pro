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
	<title>Jason's Chat Room</title>
</svelte:head>

<main class="p-5">
	<h1 class="pb-2 text-lg md:text-xl font-bold text-gray-800 dark:text-white">Jason's Chat Room</h1>
	<Messages />
</main>
