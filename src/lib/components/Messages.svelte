<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { onMount, onDestroy } from 'svelte';
	import { currentUser, getAvatarUrl, pb } from '$lib/pocketbase';
	import Login from '$lib/components/Login.svelte';
	import Time from 'svelte-time';

	let newMessage: string;
	let messages = [];
	let unsubscribe: () => void;

	onMount(async () => {
		// Get initial messages
		const resultList = await pb.collection('messages').getList(1, 50, {
			sort: '-created',
			expand: 'user'
		});
		messages = resultList.items;

		// Subscribe to realtime messages
		unsubscribe = await pb.collection('messages').subscribe('*', async ({ action, record }) => {
			if (action === 'create') {
				// Fetch associated user
				const user = await pb.collection('users').getOne(record.user);
				record.expand = { user };
				messages = [record, ...messages];
			}
			if (action === 'delete') {
				messages = messages.filter((m) => m.id !== record.id);
			}
		});
	});

	// Unsubscribe from realtime messages
	onDestroy(() => {
		unsubscribe?.();
	});

	async function sendMessage() {
		const data = {
			text: newMessage,
			user: $currentUser.id
		};
		const createdMessage = await pb.collection('messages').create(data);
		newMessage = '';
	}
</script>

<Login />

<div class="max-w-lg pt-5 pb-6 dark:text-white">
	{#if $currentUser}
		{#if $currentUser.banned !== true}
			<form
				on:submit|preventDefault={sendMessage}
				in:fly={{ x: 200, duration: 300, delay: 400 }}
				out:fade={{ duration: 300 }}
			>
				<input
					placeholder="Message"
					type="text"
					class="appearance-none block w-full border border-blue-500 rounded py-3 px-4 mb-3 leading-tight focus:outline-none text-black dark:text-yellow-500 dark:bg-gray-700 dark:border-gray-600"
					bind:value={newMessage}
				/>
				<button
					class="dark:bg-gray-700 text-gray-700 dark:text-yellow-500 border px-5 md:px-10 py-1 text-center md:whitespace-nowrap md:text-lg"
					type="submit">Send</button
				>
			</form>
		{:else}
			<h2 class="text-red-500">You are banned!</h2>
		{/if}
	{:else}
		<div class="pt-10 pb-3">
			<p class="italic">Login to send messages.</p>
		</div>
	{/if}
</div>

<div class="w-full">
	{#each messages as message (message.id)}
		<div
			class="py-4 flex flex-row"
			in:fly={{ y: -200, duration: 300 }}
			out:fade={{ duration: 300 }}
		>
			<img class="w-10 h-10 rounded-full" src={getAvatarUrl(message.expand?.user)} alt="avatar" />
			<div class="px-5">
				<p class="text-xs dark:text-yellow-400">
					@{message.expand?.user?.username}
					<Time timestamp={message.created} relative />
				</p>
				<p class="msg-text text-accent-content dark:text-white">{message.text}</p>
			</div>
		</div>
	{/each}
</div>
