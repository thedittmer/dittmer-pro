<script lang="ts">
	import {
		dndzone,
		overrideItemIdKeyNameBeforeInitialisingDndZones,
		type DndEvent
	} from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { currentUser, pb } from '$lib/pocketbase';
	import { onMount, onDestroy } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { openLogin } from '$lib/auth/login-state';

	overrideItemIdKeyNameBeforeInitialisingDndZones('index');

	type TodoItem = {
		id: string;
		index: number;
		title: string;
		done: boolean;
		author?: string;
		expand?: { author?: unknown };
	};

	let newItem = $state('');
	let items = $state<TodoItem[]>([]);
	let enableUpdate = $state(false);
	let unsubscribe: (() => void) | undefined;

	const flipDurationMs = 200;

	onMount(async () => {
		const resultList = await pb.collection('todos').getList<TodoItem>(1, 50, {
			sort: '-created',
			expand: 'user'
		});
		items = resultList.items;

		unsubscribe = await pb.collection('todos').subscribe('*', async ({ action, record }) => {
			if (action === 'create') {
				const author = await pb.collection('users').getOne(record.author);
				const next = { ...record, expand: { author } } as unknown as TodoItem;
				items = [next, ...items];
			}
			if (action === 'delete') {
				items = items.filter((m) => m.id !== record.id);
			}
		});
	});

	onDestroy(() => {
		unsubscribe?.();
	});

	function handleSort(e: CustomEvent<DndEvent<TodoItem>>) {
		items = e.detail.items;
		enableUpdate = true;
	}

	async function toggleDone(todo: TodoItem) {
		try {
			await pb.collection('todos').update(todo.id, { done: todo.done });
		} catch (err) {
			console.log('todo', todo);
			console.log('ERR', err);
		}
	}

	async function deleteTodo(todo: TodoItem) {
		try {
			await pb.collection('todos').delete(todo.id);
		} catch (err) {
			console.log('todo', todo.id);
			console.log('ERR', err);
		}
	}

	async function sendTodo() {
		if (!$currentUser) return;
		const data = {
			title: newItem,
			author: $currentUser.id,
			index: items.length + 1
		};
		await pb.collection('todos').create(data);
		newItem = '';
	}

	function sendTodoDisplayIndex() {
		console.log('items', items);
	}
</script>

{#if !$currentUser}
	<div class="dark:text-white pt-4">
		<button class="underline" onclick={() => openLogin()}>🔒 Sign in to manage your todos</button>
	</div>
{:else}
	<div class="max-w-lg pt-5 pb-6 dark:text-white">
		{#if $currentUser.banned !== true}
			<form
				onsubmit={(e) => {
					e.preventDefault();
					sendTodo();
				}}
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
					type="submit"
					class="dark:bg-gray-700 text-gray-700 dark:text-yellow-500 border px-5 md:px-10 py-1 text-center md:whitespace-nowrap md:text-lg"
					>Send Item</button
				>
			</form>
		{:else}
			<h2 class="text-red-500">You are banned!</h2>
		{/if}
	</div>
	{#if items.length > 0}
		{#if enableUpdate}
			<button onclick={sendTodoDisplayIndex}>Update Order</button>
		{/if}
		<section
			use:dndzone={{ items, flipDurationMs }}
			onconsider={handleSort}
			onfinalize={handleSort}
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
							onchange={() => toggleDone(item)}
							type="checkbox"
							id={item.id}
						/>
						<strong>{item.title}</strong>
					</label>
					<button onclick={() => deleteTodo(item)}>🚫</button>
				</div>
			{/each}
		</section>
	{/if}
{/if}
