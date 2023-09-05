<script lang="ts">
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';

	const flipDurationMs = 200;
	function handleSort(e: CustomEvent<DndEvent>) {
		items = e.detail.items as { id: number; title: string }[];
	}

	let items = [
		{ id: 1, title: 'I' },
		{ id: 2, title: 'Am' },
		{ id: 3, title: 'Yoda' }
	];
</script>

<section use:dndzone={{ items, flipDurationMs }} on:consider={handleSort} on:finalize={handleSort}>
	{#each items as item (item.id)}
		<div animate:flip={{ duration: flipDurationMs }} class="dark:text-white pb-10">
			{item.title}
		</div>
	{/each}
</section>
