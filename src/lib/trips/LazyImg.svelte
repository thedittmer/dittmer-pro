<script lang="ts">
	type Props = {
		src: string;
		alt?: string;
		class?: string;
	};

	let { src, alt = '', class: cls = '' }: Props = $props();

	let loaded = $state(false);
	let errored = $state(false);

	// Reset when src changes.
	$effect(() => {
		void src;
		loaded = false;
		errored = false;
	});
</script>

<span class="lazy-img {cls}">
	{#if !loaded && !errored}
		<span class="shimmer"></span>
	{/if}
	{#if errored}
		<span class="err">!</span>
	{/if}
	<img
		{src}
		{alt}
		loading="lazy"
		class:loaded
		onload={() => { loaded = true; errored = false; }}
		onerror={() => { errored = true; }}
	/>
</span>

<style>
	.lazy-img {
		display: block;
		position: relative;
		overflow: hidden;
		background: var(--color-surface-2);
		min-height: 4rem;
		border-radius: 4px;
	}

	img {
		display: block;
		width: 100%;
		height: auto;
		opacity: 0;
		transition: opacity 0.25s ease;
	}

	/* Collapse min-height once loaded so it fits the actual image */
	.lazy-img:has(img.loaded) {
		min-height: 0;
	}

	img.loaded {
		opacity: 1;
	}

	.shimmer {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			var(--color-surface-2) 25%,
			rgba(255, 255, 255, 0.06) 50%,
			var(--color-surface-2) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.4s ease-in-out infinite;
	}

	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	.err {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-muted);
		font-family: var(--font-mono);
		font-size: 0.8rem;
	}
</style>
