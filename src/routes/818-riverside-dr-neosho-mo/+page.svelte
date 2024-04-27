<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { PageData } from './$types';
	import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

	export let data: PageData;
	$: ({ route } = data);
	$: heroImgScr1 = `${PUBLIC_POCKETBASE_URL}/api/files/${route.collectionId}/${route.id}/${route.heroImages[0]}`;
	$: heroImgScr2 = `${PUBLIC_POCKETBASE_URL}/api/files/${route.collectionId}/${route.id}/${route.heroImages[1]}`;

	let visible = true;
	function toggleVissible() {
		visible = !visible;
	}

	setTimeout(() => {
		visible = !visible;
	}, 2000);
</script>

<svelte:head>
	<title>{route.title}</title>
</svelte:head>

<div class="p-5">
	<a href="/" class="underline dark:text-green-500 0">🔙 Back to Home</a>
</div>

<div class="relative w-52 h-52 md:w-96 md:h-96 mx-auto">
	{#if visible}
		<button on:click={toggleVissible}>
			<img
				src={heroImgScr1}
				alt={route.title}
				class="w-52 h-52 md:w-96 md:h-96 absolute rounded-full"
				transition:fly={{ x: -100, duration: 1000 }}
			/>
		</button>
	{:else}
		<button on:click={toggleVissible}>
			<img
				src={heroImgScr2}
				alt={route.title}
				class="w-52 h-52 md:w-96 md:h-96 absolute rounded-full"
				transition:fly={{ x: 100, duration: 1000 }}
			/>
		</button>
	{/if}
</div>

<main class="p-5">
	<div class="max-w-prose mx-auto pt-4">
		<h1 class="flex flex-col md:text-center">
			<span class="mt-3 text-2xl md:text-4xl dark:text-white font-bold">HOUSE FOR SALE</span>
			<span class="max-w-3xl pb-2 text-lg md:text-xl font-bold text-gray-800 dark:text-white pt-4">
				818 Riverside Dr, Neosho, MO 64850<br />3 Bedroom, 1 Bathroom
			</span>
			<span class="text-gray-800 dark:text-white text-xl">$165,0000</span>
		</h1>
		<h2
			class="md:text-center max-w-3xl pb-2 mx-auto text-lg md:text-xl font-bold text-gray-800 dark:text-white pt-4"
		>
			Call or text <a href="tel:+14173121469" class="underline">(417) 312-1469</a> for a tour.
		</h2>
		<div class="flex flex-col md:items-center justify-center mt-6 dark:text-white">
			<article class="space-y-5">
				{@html route.content}
			</article>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-5 py-10">
			{#each route.images as image}
				<a
					href={`${PUBLIC_POCKETBASE_URL}/api/files/${route.collectionId}/${route.id}/${image}?thumb=0x0`}
					target="_blank"
				>
					<img
						src={`${PUBLIC_POCKETBASE_URL}/api/files/${route.collectionId}/${route.id}/${image}?thumb=800x600`}
						alt={route.title}
						class="w-full responsive"
					/>
				</a>
			{/each}
		</div>
		<h2
			class="md:text-center max-w-3xl pb-2 mx-auto text-lg md:text-xl font-bold text-gray-800 dark:text-white pt-4"
		>
			Call or text <a href="tel:+14173121469" class="underline">(417) 312-1469</a>
		</h2>
	</div>
</main>
