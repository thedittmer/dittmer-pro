<script lang="ts">
	import Login from '$lib/components/Login.svelte';
	import { currentUser, getAvatarUrl, pb } from '$lib/pocketbase';
	import { onMount, onDestroy } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	let newTodo: string;
	let todos: any[] = [];
	let unsubscribe: () => void;

	onMount(async () => {
		// Get initial todos
		const resultList = await pb.collection('todos').getList(1, 50, {
			sort: '-created',
			expand: 'user'
		});
		todos = resultList.items;

		// Subscribe to realtime todos
		unsubscribe = await pb.collection('todos').subscribe('*', async ({ action, record }) => {
			if (action === 'create') {
				

				// Fetch associated user
				const author = await pb.collection('users').getOne(record.author);
				record.expand = { author };
				todos = [record, ...todos];
			}
			if (action === 'delete') {
				todos = todos.filter((m) => m.id !== record.id);
			}
		});
	});

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
		const data = {
			title: newTodo,
			author: $currentUser.id
		};
		const todoCreated = await pb.collection('todos').create(data);
		newTodo = '';
	}

	onDestroy(() => {
		unsubscribe?.();
	});
</script>

<Login />

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
					bind:value={newTodo}
				/>
				<button
					class="dark:bg-gray-700 text-gray-700 dark:text-yellow-500 border px-5 md:px-10 py-1 text-center md:whitespace-nowrap md:text-lg"
					type="submit">Send</button
				>
			</form>
		{:else}
			<h2 class="text-red-500">You are banned!</h2>
		{/if}
	</div>
	{#if todos.length > 0}
		<div class="flex flex-col">
			{#each todos as todo}
				<div class="flex justify-between mt-10">
					<label for={todo.id}>
						<input
							bind:checked={todo.done}
							on:change={toggleDone(todo)}
							type="checkbox"
							id={todo.id}
						/>
						<strong>{todo.title}</strong>
					</label>
					<button on:click={deleteTodo(todo)}>🚫</button>
				</div>
			{/each}
		</div>
	{:else}
		No todos
	{/if}
{/if}
