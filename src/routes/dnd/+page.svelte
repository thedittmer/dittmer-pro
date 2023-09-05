<script lang="ts">
	import { dndzone, overrideItemIdKeyNameBeforeInitialisingDndZones } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { currentUser, getAvatarUrl, pb } from '$lib/pocketbase';
	import { onMount, onDestroy } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	overrideItemIdKeyNameBeforeInitialisingDndZones("order");

	const flipDurationMs = 200;
	function handleSort(e: CustomEvent<DndEvent>) {
		items = e.detail.items as { order: number; title: string }[];
	}

	let items: any[] = [];

	onMount(async () => {
		// Get initial todos
		const resultList = await pb.collection('todos').getList(1, 50, {
			sort: '-created',
			expand: 'user'
		});
		items = resultList.items;
	});
</script>

<section use:dndzone={{ items, flipDurationMs }} on:consider={handleSort} on:finalize={handleSort}>
	{#each items as item (item.order)}
		<div animate:flip={{ duration: flipDurationMs }} class="dark:text-white pb-10">
			{item.title} - {item.id}
		</div>
	{/each}
</section>
