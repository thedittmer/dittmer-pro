<script lang="ts">
	import PostForm from '$lib/posts/PostForm.svelte';
	import { currentUser } from '$lib/pocketbase';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();
	const post = $derived(data.post);

	onMount(() => {
		if (!$currentUser?.admin) goto(`/posts/${post.slug || post.id}`);
	});
</script>

<svelte:head>
	<title>Edit: {post.title}</title>
</svelte:head>

<section class="admin">
	<a class="back" href={`/posts/${post.slug || post.id}`}>← back to post</a>
	<h1>Edit Post</h1>
	{#if $currentUser?.admin}
		<PostForm {post} authorId={$currentUser.id} />
	{:else}
		<p class="muted">Admin only.</p>
	{/if}
</section>

<style>
	.admin {
		max-width: 48rem;
		margin: 0 auto;
		padding: 6rem 1.5rem 4rem;
	}
	h1 {
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 300;
		font-size: 3rem;
		margin: 1rem 0 2rem;
	}
	.back {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-muted);
		text-decoration: none;
	}
	.back:hover {
		color: var(--color-accent);
	}
	.muted {
		color: var(--color-muted);
		font-style: italic;
	}
</style>
