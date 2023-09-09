<script lang="ts">
	import {
		dndzone,
		overrideItemIdKeyNameBeforeInitialisingDndZones,
		type DndEvent
	} from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { currentUser, getAvatarUrl, pb } from '$lib/pocketbase';
	import { onMount, onDestroy } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	overrideItemIdKeyNameBeforeInitialisingDndZones('index');

	let newItem: string;
	let unsubscribe: () => void;

	const flipDurationMs = 200;
	let items: any[] = [];

	onMount(async () => {
		// Get initial todos
		const resultList = await pb.collection('todos').getList(1, 50, {
			sort: '-created',
			expand: 'user'
		});
		items = resultList.items;

		// Subscribe to realtime todos
		unsubscribe = await pb.collection('todos').subscribe('*', async ({ action, record }) => {
			if (action === 'create') {
				console.log('action', action, 'record', record);

				// Fetch associated user
				const author = await pb.collection('users').getOne(record.author);
				record.expand = { author };
				items = [record, ...items];
			}
			if (action === 'delete') {
				items = items.filter((m) => m.id !== record.id);
			}
		});
	});

	async function handleSort(e: CustomEvent<DndEvent>) {
		items = e.detail.items as { index: number; title: string }[];
        
	}
	async function toggleDone(todo: any) {
		todo.done;
		try {
			const data = {
				done: todo.done
			};
			await pb.collection('todos').update(todo.id, data);
		} catch (err) {
			console.log('todo', todo);
			console.log('ERR', err);
		}
	}
	async function deleteTodo(todo: any) {
		try {
			await pb.collection('todos').delete(todo.id);
		} catch (err) {
			console.log('todo', todo.id);
			console.log('ERR', err);
		}
	}
	async function sendTodo() {
		let itemsLenght = items.length + 1;
		const data = {
			title: newItem,
			author: $currentUser.id,
			index: itemsLenght
		};
		const todoCreated = await pb.collection('todos').create(data);
		newItem = '';
	}

	onDestroy(() => {
		unsubscribe?.();
	});
</script>

{#if $currentUser}
	<div class="max-w-lg pt-5 pb-6 dark:text-white">
		{#if $currentUser.banned !== true}
			<form
				on:submit|preventDefault={sendTodo}
				in:fly={{ y: -200, duration: 300 }}
				out:fade={{ duration: 300 }}
			>
				<input
					placeholder="Todo Title"
					type="text"
					class="appearance-none block w-full border border-blue-500 rounded py-3 px-4 mb-3 leading-tight focus:outline-none text-black dark:text-yellow-500 dark:bg-gray-700 dark:border-gray-600"
					bind:value={newItem}
				/>
				<button
					class="dark:bg-gray-700 text-gray-700 dark:text-yellow-500 border px-5 md:px-10 py-1 text-center md:whitespace-nowrap md:text-lg"
					type="submit">Send Item</button
				>
			</form>
		{:else}
			<h2 class="text-red-500">You are banned!</h2>
		{/if}
	</div>
	{#if items.length > 0}
		<section
			use:dndzone={{ items, flipDurationMs }}
			on:consider={handleSort}
			on:finalize={handleSort}
			class="flex flex-col"
		>
			{#each items as item (item.index)}
				<div
					animate:flip={{ duration: flipDurationMs }}
					class="dark:text-white flex justify-between mt-10"
				>
					<label for={item.id}>
						<input
							bind:checked={item.done}
							on:change={toggleDone(item)}
							type="checkbox"
							id={item.id}
						/>
						<strong>{item.title}</strong>
					</label>
					<button on:click={deleteTodo(item)}>🚫</button>
				</div>
			{/each}
		</section>
	{/if}
{/if}
